const admin = require("firebase-admin");
const fs = require("fs");

// Load service account from project root (use path string for credential)
const path = require("path");
const serviceAccountPath = path.join(__dirname, "../../serviceAccountKey.json");

console.log("📋 Resources with imageFolder attribute:");
console.log("========================================");
console.log("");

// Initialize Firebase Admin
admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccountPath)
});

// Connect to Firestore
const db = admin.firestore();

async function listResourcesWithImageFolder() {
  try {
    console.log("🔍 Fetching resources from database...");
    console.log("");
    
    // Get the resources collection
    const resourcesSnapshot = await db.collection("resources").get();
    
    if (resourcesSnapshot.empty) {
      console.log("❌ No resources found in the database.");
      return;
    }
    
    console.log(`📊 Found ${resourcesSnapshot.size} total resources`);
    console.log("");
    
    // Filter resources that have imageFolder attribute
    const resourcesWithImageFolder = [];
    
    resourcesSnapshot.forEach((doc) => {
      const resourceData = doc.data();
      if (resourceData.imageFolder) {
        resourcesWithImageFolder.push({
          id: doc.id,
          ...resourceData
        });
      }
    });
    
    if (resourcesWithImageFolder.length === 0) {
      console.log("❌ No resources found with 'imageFolder' attribute.");
      return;
    }
    
    console.log(`🖼️  Found ${resourcesWithImageFolder.length} resources with imageFolder attribute:`);
    console.log("");
    
    // Display each resource with imageFolder
    resourcesWithImageFolder.forEach((resource, index) => {
      console.log(`${index + 1}. ${resource.name || 'Unnamed Resource'}`);
      console.log(`   🆔 Document ID: ${resource.id}`);
      console.log(`   📁 Image Folder: ${resource.imageFolder}`);
      
      if (resource.category) {
        console.log(`   🏷️  Category: ${resource.category}`);
      }
      
      if (resource.address) {
        console.log(`   📍 Address: ${resource.address}`);
      }
      
      if (resource.description) {
        const desc = resource.description.length > 100 
          ? resource.description.substring(0, 100) + '...' 
          : resource.description;
        console.log(`   📝 Description: ${desc}`);
      }
      
      if (resource.location) {
        console.log(`   🗺️  Location: ${resource.location.latitude}, ${resource.location.longitude}`);
      }
      
      if (resource.createdAt) {
        const date = resource.createdAt.toDate ? resource.createdAt.toDate() : new Date(resource.createdAt);
        console.log(`   📅 Created: ${date.toLocaleDateString()}`);
      }
      
      console.log("");
    });
    
    // Summary statistics
    console.log("📊 Summary:");
    console.log(`- Total resources in database: ${resourcesSnapshot.size}`);
    console.log(`- Resources with imageFolder: ${resourcesWithImageFolder.length}`);
    console.log(`- Percentage with imageFolder: ${((resourcesWithImageFolder.length / resourcesSnapshot.size) * 100).toFixed(1)}%`);
    console.log("");
    
    // Group by imageFolder value
    const folderGroups = {};
    resourcesWithImageFolder.forEach(resource => {
      const folder = resource.imageFolder;
      if (!folderGroups[folder]) {
        folderGroups[folder] = [];
      }
      folderGroups[folder].push(resource);
    });
    
    console.log("📁 Grouped by imageFolder value:");
    console.log("================================");
    console.log("");
    
    Object.entries(folderGroups).sort().forEach(([folder, resources]) => {
      console.log(`📂 ${folder} (${resources.length} resources):`);
      resources.forEach(resource => {
        console.log(`   • ${resource.name || 'Unnamed Resource'} (ID: ${resource.id})`);
      });
      console.log("");
    });
    
    console.log("✅ Resource listing complete!");
    
  } catch (error) {
    console.error("❌ Error fetching resources:", error.message);
    console.log("");
    console.log("💡 Make sure your Firestore security rules allow read access.");
    console.log("   Try using test mode in the Firebase Console.");
  }
}

listResourcesWithImageFolder();
