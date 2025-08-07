const admin = require("firebase-admin");
const fs = require("fs");

// Load service account
const serviceAccount = require("./serviceAccountKey.json");

console.log("📋 Importing Activity Categories to Firestore:");
console.log("=============================================");
console.log("");

// Initialize Firebase Admin
admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount)
});

// Connect to Firestore
const db = admin.firestore();

async function importActivityCategories() {
  try {
    console.log("📖 Reading activity categories from JSON file...");
    
    // Read the activity categories JSON file
    const categoriesData = JSON.parse(fs.readFileSync('./activity-categories.json', 'utf8'));
    
    console.log(`📊 Found ${categoriesData.total} categories to import`);
    console.log("");
    
    const collectionRef = db.collection('activity_categories');
    let importedCount = 0;
    let errorCount = 0;
    
    // Import each category
    for (const categoryData of categoriesData.data) {
      try {
        console.log(`🏷️  Processing: ${categoryData.name}`);
        
        // Create new category with auto-generated ID and timestamps
        const docRef = await collectionRef.add({
          name: categoryData.name,
          description: categoryData.description,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`   ✅ Created category: ${categoryData.name}`);
        console.log(`   🆔 Document ID: ${docRef.id}`);
        console.log(`   📝 Description: ${categoryData.description}`);
        console.log(`   📅 Timestamps: createdAt & updatedAt added`);
        console.log("");
        
        importedCount++;
        
      } catch (error) {
        console.error(`   ❌ Error processing ${categoryData.name}:`, error.message);
        errorCount++;
      }
    }
    
    // Summary
    console.log("📊 Import Summary:");
    console.log(`✅ Categories imported: ${importedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${importedCount + errorCount}`);
    console.log("");
    
    if (errorCount === 0) {
      console.log("🎉 All activity categories imported successfully!");
      console.log("");
      console.log("💡 Each category now has:");
      console.log("   • name: Category name");
      console.log("   • description: Category description");
      console.log("   • createdAt: Firebase server timestamp");
      console.log("   • updatedAt: Firebase server timestamp");
      console.log("   • id: Auto-generated Firebase document ID");
    } else {
      console.log("⚠️  Some categories had errors. Check the logs above.");
    }
    
  } catch (error) {
    console.error("❌ Error importing activity categories:", error.message);
    console.log("");
    console.log("💡 Make sure:");
    console.log("   - activity-categories.json exists in the current directory");
    console.log("   - Your Firestore security rules allow write access");
    console.log("   - Your service account has Firestore Admin permissions");
  }
}

// Run the import
async function run() {
  try {
    await importActivityCategories();
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
  } finally {
    process.exit(0);
  }
}

run(); 