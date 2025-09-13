const admin = require("firebase-admin");
const fs = require("fs");

// Load service account from project root
const serviceAccount = require("../../serviceAccountKey.json");

console.log("📋 Categories from Firestore Database:");
console.log("======================================");
console.log("");

// Initialize Firebase Admin
admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount)
});

// Connect to Firestore
const db = admin.firestore();

async function listCategories() {
  try {
    console.log("🔍 Fetching categories from database...");
    console.log("");
    
    // Get the categories collection
    const categoriesSnapshot = await db.collection("categories").get();
    
    if (categoriesSnapshot.empty) {
      console.log("❌ No categories found in the database.");
      return;
    }
    
    console.log(`Found ${categoriesSnapshot.size} categories:`);
    console.log("");
    
    // Display each category
    categoriesSnapshot.forEach((doc) => {
      const categoryData = doc.data();
      console.log(`🏷️  ${doc.id}:`);
      if (categoryData.name) {
        console.log(`   • Name: ${categoryData.name}`);
      }
      if (categoryData.description) {
        console.log(`   • Description: ${categoryData.description}`);
      }
      if (categoryData.items) {
        console.log(`   • Items: ${categoryData.items.length || 0}`);
        categoryData.items.forEach(item => {
          console.log(`     - ${item}`);
        });
      }
      console.log("");
    });
    
    console.log("✅ Categories listing complete!");
    
  } catch (error) {
    console.error("❌ Error fetching categories:", error.message);
    console.log("");
    console.log("💡 Make sure your Firestore security rules allow read access.");
    console.log("   Try using test mode in the Firebase Console.");
  }
}

listCategories(); 