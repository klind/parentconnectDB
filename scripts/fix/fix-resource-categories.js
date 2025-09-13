const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Load service account without require() to appease strict linters
const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, "serviceAccountKey.json"), "utf8"));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Mapping of incorrect -> correct category names
const CATEGORY_FIXES = {
  "Familiyrestaurants": "Family Restaurants",
  "Familyfuncetners": "Family Fun Centers",
  "Swimmingpools": "Swimming Pools"
};

async function updateCategoryDocs(incorrectCategory, correctCategory) {
  const snapshot = await db.collection("resources").where("category", "==", incorrectCategory).get();

  if (snapshot.empty) {
    return { scanned: 0, updated: 0 };
  }

  // Firestore batch limit is 500 writes per batch
  let updated = 0;
  let batch = db.batch();
  let opsInBatch = 0;

  for (const doc of snapshot.docs) {
    batch.update(doc.ref, { category: correctCategory });
    updated += 1;
    opsInBatch += 1;

    if (opsInBatch === 450) { // keep some headroom
      await batch.commit();
      batch = db.batch();
      opsInBatch = 0;
    }
  }

  if (opsInBatch > 0) {
    await batch.commit();
  }

  return { scanned: snapshot.size, updated };
}

async function fixCategories() {
  console.log("🔧 Fixing misspelled resource categories...");

  let totalScanned = 0;
  let totalUpdated = 0;

  for (const [bad, good] of Object.entries(CATEGORY_FIXES)) {
    console.log(`\n➡️  ${bad} → ${good}`);
    const { scanned, updated } = await updateCategoryDocs(bad, good);
    totalScanned += scanned;
    totalUpdated += updated;
    console.log(`   📄 Scanned: ${scanned} | ✏️  Updated: ${updated}`);
  }

  console.log("\n✅ Done");
  console.log(`Summary: Scanned ${totalScanned} docs, Updated ${totalUpdated} docs.`);
}

(async function main() {
  try {
    await fixCategories();
  } catch (err) {
    console.error("❌ Error while fixing categories:", err && err.message ? err.message : err);
    process.exit(1);
  }
})();



