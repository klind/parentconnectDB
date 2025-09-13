const admin = require('firebase-admin');
const path = require('path');

function loadServiceAccount() {
  try { return require(path.join(__dirname, 'serviceAccountKey.json')); } catch (_) {}
  try { return require(path.join(__dirname, '..', '..', 'serviceAccountKey.json')); } catch (_) {}
  return null;
}

function init() {
  const sa = loadServiceAccount();
  if (sa) {
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    return;
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
    return;
  }
  console.error('Missing credentials: add serviceAccountKey.json or set GOOGLE_APPLICATION_CREDENTIALS');
  process.exit(1);
}

init();
const db = admin.firestore();

function cleanName(name) {
  if (typeof name !== 'string') return name;
  // Remove asterisk variants and invisible characters, normalize spaces
  const STAR_CHARS = /[\*\uFF0A\uFE61\u2217\u2731\u204E\u2051]/g; // *, ＊, ﹡, ∗, ✱, ⁎, ⁑
  const INVISIBLE = /[\u200B\u200C\u200D\u2060\uFEFF]/g; // zero-width
  const NBSP = /\u00A0/g; // non-breaking space

  let result = name
    .replace(STAR_CHARS, '')
    .replace(INVISIBLE, '')
    .replace(NBSP, ' ')
    .replace(/^['"`]+|['"`]+$/g, '');

  result = result.replace(/\s+/g, ' ').trim();
  return result;
}

async function removeAsterisksFromResourceNames() {
  const snapshot = await db.collection('resources').get();
  if (snapshot.empty) {
    console.log('No resources found.');
    return { processed: 0, updated: 0, skipped: 0 };
  }

  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snapshot.docs) {
    processed++;
    const data = doc.data() || {};
    const currentName = data.name;

    if (typeof currentName !== 'string') {
      skipped++;
      continue;
    }

    const newName = cleanName(currentName);
    if (newName === currentName) {
      skipped++;
      continue;
    }

    batch.update(doc.ref, { name: newName });
    ops++;
    updated++;

    if (ops >= 450) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
      console.log(`Committed batch. Updated so far: ${updated}/${processed}`);
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  return { processed, updated, skipped };
}

(async () => {
  try {
    const result = await removeAsterisksFromResourceNames();
    console.log('Done.', result);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();


