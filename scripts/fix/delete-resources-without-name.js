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

function isNameMissingOrBlank(value) {
  if (value === undefined || value === null) return true;
  if (typeof value !== 'string') return true;
  return value.trim().length === 0;
}

async function deleteResourcesWithoutName() {
  init();
  const db = admin.firestore();

  console.log('Scanning resources for missing/blank names...');
  const snapshot = await db.collection('resources').get();
  if (snapshot.empty) {
    console.log('No resources found.');
    return { processed: 0, deleted: 0, skipped: 0 };
  }

  let processed = 0;
  let deleted = 0;
  let skipped = 0;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snapshot.docs) {
    processed++;
    const data = doc.data() || {};
    const name = data.name;

    if (isNameMissingOrBlank(name)) {
      batch.delete(doc.ref);
      ops++;
      deleted++;
    } else {
      skipped++;
    }

    if (ops >= 450) {
      await batch.commit();
      console.log(`Committed batch. Deleted so far: ${deleted}/${processed}`);
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  return { processed, deleted, skipped };
}

(async () => {
  try {
    const res = await deleteResourcesWithoutName();
    console.log('Done.', res);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
















