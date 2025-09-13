const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..');
const LOCAL_IMAGES_DIR = path.join(WORKSPACE_ROOT, 'images');
// Storage settings per user request
const STORAGE_BUCKET = 'parentconnect2025.firebasestorage.app';
const BASE_FOLDER = 'resource-images'; // results in gs://parentconnect2025.firebasestorage.app/resource-images/<resourceId>/

const LOCAL_IMAGES = [
  { filename: 'images1.jpeg', contentType: 'image/jpeg' },
  { filename: 'images2.jpeg', contentType: 'image/jpeg' }
];

function loadServiceAccount() {
  try {
    const keyPathSibling = path.join(__dirname, 'serviceAccountKey.json');
    return require(keyPathSibling);
  } catch (e1) {
    try {
      const keyPathRoot = path.join(WORKSPACE_ROOT, 'serviceAccountKey.json');
      return require(keyPathRoot);
    } catch (e2) {
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
    return STORAGE_BUCKET;
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: STORAGE_BUCKET
    });
    return STORAGE_BUCKET;
  }

  console.error('Failed to initialize Firebase Admin: provide serviceAccountKey.json or set GOOGLE_APPLICATION_CREDENTIALS.');
  process.exit(1);
}

async function ensureLocalImagesExist() {
  for (const img of LOCAL_IMAGES) {
    const fullPath = path.join(LOCAL_IMAGES_DIR, img.filename);
    if (!fs.existsSync(fullPath)) {
      console.error(`Missing local image: ${fullPath}`);
      process.exit(1);
    }
  }
}

function readLocalImageBuffer(filename) {
  const fullPath = path.join(LOCAL_IMAGES_DIR, filename);
  return fs.readFileSync(fullPath);
}

async function uploadImagesForResource(bucket, resourceId) {
  const folder = `${BASE_FOLDER}/${resourceId}/`;
  const uploaded = [];

  for (const img of LOCAL_IMAGES) {
    const filePath = `${folder}${img.filename}`;
    const file = bucket.file(filePath);

    try {
      const [exists] = await file.exists();
      if (exists) {
        uploaded.push({ path: filePath, name: img.filename });
        continue;
      }
    } catch (_) {
      // proceed to upload
    }

    const buffer = readLocalImageBuffer(img.filename);
    await file.save(buffer, {
      resumable: false,
      metadata: {
        contentType: img.contentType,
        cacheControl: 'public, max-age=86400'
      }
    });
    uploaded.push({ path: filePath, name: img.filename });
  }

  return { folder, uploaded };
}

async function run() {
  const bucketName = initializeFirebase();
  const db = admin.firestore();
  const bucket = admin.storage().bucket();

  console.log(`Using bucket: ${bucketName}`);
  await ensureLocalImagesExist();

  console.log('Fetching resources from Firestore...');
  const snapshot = await db.collection('resources').get();
  if (snapshot.empty) {
    console.log('No resources found.');
    process.exit(0);
  }
  console.log(`Found ${snapshot.size} resources.`);

  let processed = 0;
  let updatedDocs = 0;
  let skippedDocs = 0;

  let batch = db.batch();
  let opsInBatch = 0;

  for (const doc of snapshot.docs) {
    processed++;
    const resourceId = doc.id;
    const { folder, uploaded } = await uploadImagesForResource(bucket, resourceId);

    const currentData = doc.data() || {};
    const existingImages = Array.isArray(currentData.images) ? currentData.images : [];
    const newImages = uploaded
      .filter(u => !existingImages.some(e => e && (e.path === u.path || e.name === u.name)))
      .map(u => ({ name: u.name, path: u.path }));

    const updateData = { imageFolder: folder };
    if (newImages.length > 0) {
      updateData.images = (existingImages || []).concat(newImages);
    }

    if (Object.keys(updateData).length > 0) {
      batch.update(doc.ref, updateData);
      opsInBatch++;
      updatedDocs++;
    } else {
      skippedDocs++;
    }

    if (opsInBatch >= 450) {
      await batch.commit();
      console.log(`Committed batch. Progress: ${processed}/${snapshot.size} resources.`);
      batch = db.batch();
      opsInBatch = 0;
    }
  }

  if (opsInBatch > 0) {
    await batch.commit();
  }

  console.log('Done.');
  console.log(`Processed: ${processed}`);
  console.log(`Updated docs: ${updatedDocs}`);
  console.log(`Skipped docs: ${skippedDocs}`);
}

run().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});


