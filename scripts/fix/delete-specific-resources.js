const admin = require('firebase-admin');
const path = require('path');

// Provide IDs to delete here
const RESOURCE_IDS = [
  '8DTaCFEKCfVlBZvVuE3e'
];

function loadServiceAccount() {
  try { return require(path.join(__dirname, 'serviceAccountKey.json')); } catch (_) {}
  try { return require(path.join(__dirname, '..', '..', 'serviceAccountKey.json')); } catch (_) {}
  return null;
}

function init() {
  const sa = loadServiceAccount();
  if (sa) { admin.initializeApp({ credential: admin.credential.cert(sa) }); return; }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) { admin.initializeApp({ credential: admin.credential.applicationDefault() }); return; }
  console.error('Missing credentials: add serviceAccountKey.json or set GOOGLE_APPLICATION_CREDENTIALS');
  process.exit(1);
}

async function run() {
  init();
  const db = admin.firestore();
  let deleted = 0;
  for (const id of RESOURCE_IDS) {
    try {
      const ref = db.collection('resources').doc(id);
      const snap = await ref.get();
      if (!snap.exists) {
        console.log(`Not found: ${id}`);
        continue;
      }
      await ref.delete();
      console.log(`Deleted: ${id}`);
      deleted++;
    } catch (e) {
      console.error(`Error deleting ${id}:`, e.message);
    }
  }
  console.log(`Done. Deleted ${deleted}/${RESOURCE_IDS.length}`);
}

run().then(() => process.exit(0)).catch(err => { console.error('Fatal:', err); process.exit(1); });
















