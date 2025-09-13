const admin = require('firebase-admin');
const path = require('path');

const STORAGE_BUCKET = 'parentconnect2025.firebasestorage.app';
const BASE_FOLDER = 'resource-images';

function loadServiceAccount() {
  try {
    return require(path.join(__dirname, 'serviceAccountKey.json'));
  } catch (_) {
    try {
      return require(path.join(__dirname, '..', '..', 'serviceAccountKey.json'));
    } catch (_) {
      return null;
    }
  }
}

function initializeFirebase() {
  const serviceAccount = loadServiceAccount();
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: STORAGE_BUCKET
    });
    return;
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: STORAGE_BUCKET
    });
    return;
  }
  console.error('Missing credentials: add serviceAccountKey.json or set GOOGLE_APPLICATION_CREDENTIALS');
  process.exit(1);
}

initializeFirebase();
const db = admin.firestore();

async function setFolderOnlyForResources() {
  const snapshot = await db.collection('resources').get();
  if (snapshot.empty) {
    console.log('No resources found.');
    return { processed: 0, updated: 0 };
  }

  let processed = 0;
  let updated = 0;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snapshot.docs) {
    processed++;
    const resourceId = doc.id;
    const folder = `${BASE_FOLDER}/${resourceId}/`;
    const gsUri = `gs://${STORAGE_BUCKET}/${folder}`;

    batch.update(doc.ref, {
      imageFolder: folder,
      imageFolderGSUri: gsUri,
      images: admin.firestore.FieldValue.delete()
    });
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

  return { processed, updated };
}

(async () => {
  try {
    const res = await setFolderOnlyForResources();
    console.log('Done.', res);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
















