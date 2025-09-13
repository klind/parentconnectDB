const path = require("path");
const admin = require("firebase-admin");

// Hardcoded bucket to match your environment
const DEFAULT_BUCKET = "parentconnect2025.firebasestorage.app";
const IMAGES_PREFIX = "resource-images/";

// Load service account without require() to appease strict linters
const serviceAccount = JSON.parse(require("fs").readFileSync(path.join(__dirname, "serviceAccountKey.json"), "utf8"));

// Initialize Firebase Admin for Storage
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: DEFAULT_BUCKET
});

const bucket = admin.storage().bucket(DEFAULT_BUCKET);

function isImageObject(objectName) {
  // Only delete known image types; keep any non-image placeholders
  const lower = objectName.toLowerCase();
  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".bmp")
  );
}

async function deleteAllResourceImages() {
  console.log(`Using bucket: ${bucket.name}`);

  const [exists] = await bucket.exists();
  if (!exists) {
    throw new Error(`Bucket not found: ${bucket.name}`);
  }

  console.log(`Listing files with prefix '${IMAGES_PREFIX}' ...`);

  const [files] = await bucket.getFiles({ prefix: IMAGES_PREFIX });
  if (!files || files.length === 0) {
    console.log("No files found under resource-images/.");
    return;
  }

  // Filter to only image files and avoid directory-like placeholders (names ending with "/")
  const imageFiles = files.filter((f) => {
    const name = f.name || "";
    if (!name || name.endsWith("/")) return false;
    return isImageObject(name);
  });

  if (imageFiles.length === 0) {
    console.log("No image files found to delete.");
    return;
  }

  console.log(`Found ${imageFiles.length} image files to delete.`);

  // Delete in parallel with a moderate concurrency
  let deleted = 0;
  const results = await Promise.allSettled(
    imageFiles.map(async (file) => {
      await file.delete();
      deleted += 1;
      if (deleted % 50 === 0) {
        console.log(`  Deleted ${deleted} images...`);
      }
    })
  );

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    console.warn(`Completed with ${failures.length} failures out of ${results.length} deletions.`);
  }

  console.log(`Done. Deleted ${deleted} image files under '${IMAGES_PREFIX}'.`);
}

(async function main() {
  try {
    await deleteAllResourceImages();
  } catch (err) {
    console.error("Error:", err && err.message ? err.message : err);
    process.exit(1);
  }
})();



