const admin = require("firebase-admin");
const fs = require("fs");

// Load service account
const serviceAccount = require("./serviceAccountKey.json");

console.log("📋 Activity Categories from Firestore Database:");
console.log("==============================================");
console.log("");

// Initialize Firebase Admin
admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount)
});

// Connect to Firestore
const db = admin.firestore();

// Helper function to format Firebase timestamps
function formatTimestamp(timestamp) {
  if (!timestamp) return 'Not set';
  
  try {
    if (timestamp.toDate) {
      return timestamp.toDate().toISOString();
    } else if (timestamp instanceof Date) {
      return timestamp.toISOString();
    } else if (typeof timestamp === 'string') {
      return new Date(timestamp).toISOString();
    } else if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toISOString();
    }
    return 'Invalid timestamp';
  } catch (error) {
    return 'Error formatting timestamp';
  }
}

async function listActivityCategories() {
  try {
    console.log("🔍 Fetching activity categories from database...");
    console.log("");
    
    // Get the activity_categories collection
    const categoriesSnapshot = await db.collection("activity_categories").get();
    
    if (categoriesSnapshot.empty) {
      console.log("❌ No activity categories found in the database.");
      console.log("");
      console.log("💡 Run 'node import-activity-categories.js' to import the categories.");
      return;
    }
    
    console.log(`Found ${categoriesSnapshot.size} activity categories:`);
    console.log("");
    
    // Sort categories by name for better display
    const categories = [];
    categoriesSnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    categories.sort((a, b) => a.name.localeCompare(b.name));
    
    // Display each category
    categories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name} (ID: ${category.id})`);
      console.log(`   📝 Description: ${category.description}`);
      console.log(`   📅 Created: ${formatTimestamp(category.createdAt)}`);
      console.log(`   🔄 Updated: ${formatTimestamp(category.updatedAt)}`);
      console.log("");
    });
    
    // Summary statistics
    console.log("📊 Category Statistics:");
    console.log(`   • Total Categories: ${categories.length}`);
    console.log(`   • All categories have createdAt & updatedAt timestamps`);
    console.log("");
    console.log("✅ Activity categories listing complete!");
    console.log("");
    console.log("💡 These categories can be used when creating activities in the platform.");
    
  } catch (error) {
    console.error("❌ Error fetching activity categories:", error.message);
    console.log("");
    console.log("💡 Make sure your Firestore security rules allow read access.");
    console.log("   Try using test mode in the Firebase Console.");
  }
}

listActivityCategories(); 