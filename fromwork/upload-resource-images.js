const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const admin = require("firebase-admin");
const { Storage } = require("@google-cloud/storage");

// Load service account without require() to appease strict linters
const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, "serviceAccountKey.json"), "utf8"));

// Use the explicitly requested Firebase Storage bucket
const DEFAULT_BUCKET = "parentconnect2025.firebasestorage.app";

// Initialize Firebase Admin for Firestore/Storage
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: DEFAULT_BUCKET
});

const storage = admin.storage();
let bucket = storage.bucket(DEFAULT_BUCKET);

// Client for discovering buckets if needed
const storageClient = new Storage({
  credentials: serviceAccount,
  projectId: serviceAccount.project_id
});

function printUsageAndExit(message) {
  if (message) {
    console.error(message);
  }
  console.log("\nUsage:");
  console.log("  node upload-resource-images.js /absolute/path/to/images\n");
  console.log("Folder layout:");
  console.log("  images/");
  console.log("    ├── <ImageFolderName>/");
  console.log("    │   ├── <ResourceKey>              # a file or folder named with the Firestore doc id");
  console.log("    │   ├── <ImageFolderName>_1.jpg");
  console.log("    │   ├── <ImageFolderName>_2.jpg");
  console.log("    │   └── ...\n");
  process.exit(1);
}

function isLikelyKeyName(name) {
  // Firestore auto IDs are 20 chars (mixed-case alphanumeric). Allow 16-32 for flexibility.
  return /^[A-Za-z0-9_-]{16,32}$/.test(name);
}

function findResourceKeyInFolder(folderAbsolutePath) {
  const entries = fs.readdirSync(folderAbsolutePath, { withFileTypes: true });

  // Prefer exact entry whose name looks like a key
  for (const entry of entries) {
    if (isLikelyKeyName(entry.name)) {
      return entry.name;
    }
  }

  // If no obvious key entry, check for a small text file containing the key
  for (const entry of entries) {
    if (entry.isFile()) {
      const fullPath = path.join(folderAbsolutePath, entry.name);
      try {
        const content = fs.readFileSync(fullPath, "utf8").trim();
        if (isLikelyKeyName(content)) {
          return content;
        }
      } catch (_) {}
    }
  }

  return null;
}

function listImageFiles(folderAbsolutePath) {
  const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]);
  const entries = fs.readdirSync(folderAbsolutePath, { withFileTypes: true });
  const imageFiles = [];

  for (const entry of entries) {
    if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (supportedExtensions.has(ext)) {
        imageFiles.push(path.join(folderAbsolutePath, entry.name));
      }
    }
  }

  return imageFiles;
}

async function uploadFileToDestination(localFilePath, destinationPath) {
  const contentType = mime.lookup(localFilePath) || "application/octet-stream";

  await bucket.upload(localFilePath, {
    destination: destinationPath,
    metadata: {
      contentType,
      cacheControl: "public, max-age=31536000"
    }
  });
}

async function uploadImagesFolder(rootImagesPath) {
  console.log(`Using bucket: ${bucket.name}`);
  try {
    const [exists] = await bucket.exists();
    if (!exists) {
      throw new Error(`Bucket not found: ${bucket.name}`);
    }
  } catch (err) {
    console.warn("Failed to access default bucket:", err && err.message ? err.message : err);
    console.log("Attempting to auto-detect a valid bucket in the project...");

    try {
      const [buckets] = await storageClient.getBuckets({ project: serviceAccount.project_id });
      if (!buckets || buckets.length === 0) {
        throw new Error("No buckets found in this project.");
      }

      // Prefer an appspot bucket; otherwise take the first one
      const appspot = buckets.find(b => b.name.endsWith(".appspot.com"));
      const chosen = appspot || buckets[0];

      console.log("Discovered buckets:");
      buckets.forEach(b => console.log(`  - ${b.name}`));
      console.log(`Using discovered bucket: ${chosen.name}`);

      bucket = storage.bucket(chosen.name);
      const [ok] = await bucket.exists();
      if (!ok) {
        throw new Error(`Chosen bucket does not exist or is inaccessible: ${chosen.name}`);
      }
    } catch (discoverErr) {
      console.error("Auto-detection failed:", discoverErr && discoverErr.message ? discoverErr.message : discoverErr);
      console.error("Tip: verify Storage is enabled and the service account has storage permissions.");
      process.exit(1);
    }
  }

  const absoluteRoot = path.resolve(rootImagesPath);
  if (!fs.existsSync(absoluteRoot)) {
    printUsageAndExit(`Path does not exist: ${absoluteRoot}`);
  }
  const stats = fs.statSync(absoluteRoot);
  if (!stats.isDirectory()) {
    printUsageAndExit("Provided path must be a directory containing image subfolders.");
  }

  const subfolders = fs.readdirSync(absoluteRoot, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => path.join(absoluteRoot, dirent.name));

  if (subfolders.length === 0) {
    console.log("No subfolders found to process.");
    return;
  }

  console.log(`Found ${subfolders.length} resource folders to process.`);

  let totalUploaded = 0;
  for (const folder of subfolders) {
    const folderName = path.basename(folder);
    const key = findResourceKeyInFolder(folder);
    if (!key) {
      console.warn(`Skipping '${folderName}': Could not determine resource key.`);
      continue;
    }

    const imageFiles = listImageFiles(folder);
    if (imageFiles.length === 0) {
      console.warn(`Skipping '${folderName}': No image files found.`);
      continue;
    }

    console.log(`\nUploading ${imageFiles.length} images for '${folderName}' to 'resource-images/${key}/' ...`);

    for (const filePathAbs of imageFiles) {
      const fileName = path.basename(filePathAbs);
      const destination = `resource-images/${key}/${fileName}`;
      try {
        await uploadFileToDestination(filePathAbs, destination);
        console.log(`  ✅ Uploaded: ${fileName}`);
        totalUploaded += 1;
      } catch (err) {
        console.error(`  ❌ Failed: ${fileName} -> ${destination}:`, err && err.message ? err.message : err);
      }
    }
  }

  console.log(`\nDone. Total images uploaded: ${totalUploaded}`);
}

// Entry
(async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    printUsageAndExit("Missing path to images folder.");
  }
  await uploadImagesFolder(inputPath);
})();


