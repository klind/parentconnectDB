const admin = require('firebase-admin');
const path = require('path');

// IDs to clean (ghost docs that show in console but don't exist)
const RESOURCE_IDS = [
  '8DTaCFEKCfVlBZvVuE3e',
  '0rIoUaHv4rj23PcH5yPu'
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

async function deleteDocumentRecursively(docRef) {
  // Delete nested subcollections first
  const subcollections = await docRef.listCollections();
  for (const subcol of subcollections) {
    await deleteCollectionRecursively(subcol);
  }
  // Delete the document itself (no-op if already missing)
  await docRef.delete();
}

async function deleteCollectionRecursively(collectionRef) {
  const pageSize = 200;
  let lastDoc = null;
  while (true) {
    let query = collectionRef.limit(pageSize);
    if (lastDoc) query = query.startAfter(lastDoc);
    const snap = await query.get();
    if (snap.empty) break;

    // Delete each document with its nested subcollections
    for (const doc of snap.docs) {
      await deleteDocumentRecursively(doc.ref);
      lastDoc = doc;
    }
  }
}

async function run() {
  init();
  const db = admin.firestore();
  let cleaned = 0;
  for (const id of RESOURCE_IDS) {
    const docRef = db.collection('resources').doc(id);
    try {
      const subcollections = await docRef.listCollections();
      if (subcollections.length === 0) {
        // Ensure doc itself is deleted
        await docRef.delete();
        console.log(`No subcollections for ${id}. Ensured deletion of doc.`);
        continue;
      }
      for (const sub of subcollections) {
        await deleteCollectionRecursively(sub);
      }
      await docRef.delete();
      console.log(`Cleaned and deleted: ${id}`);
      cleaned++;
    } catch (e) {
      console.error(`Error cleaning ${id}:`, e.message);
    }
  }
  console.log(`Done. Cleaned ${cleaned}/${RESOURCE_IDS.length}`);
}

run().then(() => process.exit(0)).catch(err => { console.error('Fatal:', err); process.exit(1); });


