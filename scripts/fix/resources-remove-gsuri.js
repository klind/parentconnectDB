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

async function removeGsUriFromResources() {
  const snap = await db.collection('resources').get();
  if (snap.empty) {
    console.log('No resources found.');
    return { processed: 0, updated: 0 };
  }

  let processed = 0;
  let updated = 0;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snap.docs) {
    processed++;
    batch.update(doc.ref, { imageFolderGSUri: admin.firestore.FieldValue.delete() });
    ops++; updated++;
    if (ops >= 450) { await batch.commit(); batch = db.batch(); ops = 0; }
  }
  if (ops > 0) { await batch.commit(); }
  return { processed, updated };
}

(async () => {
  try {
    const res = await removeGsUriFromResources();
    console.log('Done.', res);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
















