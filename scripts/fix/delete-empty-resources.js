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

function isEmptyObject(obj) {
  if (!obj || typeof obj !== 'object') return false;
  return Object.keys(obj).length === 0;
}

async function deleteEmptyResourceDocs() {
  init();
  const db = admin.firestore();

  console.log('Scanning for empty resource documents...');
  const snap = await db.collection('resources').get();
  if (snap.empty) {
    console.log('No resources found.');
    return { processed: 0, deleted: 0 };
  }

  let processed = 0;
  let deleted = 0;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snap.docs) {
    processed++;
    const data = doc.data();
    if (isEmptyObject(data)) {
      console.log(`Deleting empty resource: ${doc.id}`);
      batch.delete(doc.ref);
      ops++;
      deleted++;
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

  return { processed, deleted };
}

(async () => {
  try {
    const res = await deleteEmptyResourceDocs();
    console.log('Done.', res);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
















