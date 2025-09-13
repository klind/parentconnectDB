const admin = require("firebase-admin");

// Load service account without require() to appease strict linters
const serviceAccount = JSON.parse(require("fs").readFileSync(require("path").join(__dirname, "serviceAccountKey.json"), "utf8"));

// Initialize Firebase Admin for Firestore
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listUniqueStates() {
  try {
    console.log("🔍 Fetching all resources to extract unique states...");
    
    const snapshot = await db.collection("resources").get();
    
    if (snapshot.empty) {
      console.log("❌ No resources found in the database.");
      return;
    }
    
    const states = new Set();
    let totalResources = 0;
    
    snapshot.forEach((doc) => {
      const resource = doc.data();
      totalResources++;
      
      if (resource.state && resource.state.trim()) {
        states.add(resource.state.trim());
      }
    });
    
    console.log(`\n📊 Found ${totalResources} total resources`);
    console.log(`🏛️  Found ${states.size} unique states:\n`);
    
    // Sort states alphabetically and display
    const sortedStates = Array.from(states).sort();
    sortedStates.forEach((state, index) => {
      console.log(`${index + 1}. ${state}`);
    });
    
    console.log(`\n✨ States listing complete!`);
    
  } catch (error) {
    console.error("❌ Error fetching resources:", error.message);
    process.exit(1);
  }
}

// Run the listing
(async function main() {
  try {
    await listUniqueStates();
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  }
})();



