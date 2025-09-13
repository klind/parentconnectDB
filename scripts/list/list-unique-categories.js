const admin = require("firebase-admin");

// Load service account without require() to appease strict linters
const serviceAccount = JSON.parse(require("fs").readFileSync(require("path").join(__dirname, "serviceAccountKey.json"), "utf8"));

// Initialize Firebase Admin for Firestore
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listUniqueCategories() {
  try {
    console.log("🔍 Fetching all resources to extract unique categories...");

    const snapshot = await db.collection("resources").get();

    if (snapshot.empty) {
      console.log("❌ No resources found in the database.");
      return;
    }

    const categories = new Set();
    let totalResources = 0;

    snapshot.forEach((doc) => {
      const resource = doc.data();
      totalResources++;

      if (resource.category && String(resource.category).trim()) {
        categories.add(String(resource.category).trim());
      }
    });

    console.log(`\n📊 Found ${totalResources} total resources`);
    console.log(`🏷️  Found ${categories.size} unique categories:\n`);

    // Sort categories alphabetically and display
    const sortedCategories = Array.from(categories).sort((a, b) => a.localeCompare(b));
    sortedCategories.forEach((category, index) => {
      console.log(`${index + 1}. ${category}`);
    });

    console.log(`\n✨ Categories listing complete!`);
  } catch (error) {
    console.error("❌ Error fetching resources:", error.message);
    process.exit(1);
  }
}

// Run the listing
(async function main() {
  try {
    await listUniqueCategories();
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  }
})();



