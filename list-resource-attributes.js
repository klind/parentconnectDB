const admin = require("firebase-admin");
const fs = require("fs");

// Load service account
const serviceAccount = require("./serviceAccountKey.json");

console.log("📋 Resource Attributes Analysis:");
console.log("===============================");
console.log("");

// Initialize Firebase Admin
admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount)
});

// Connect to Firestore
const db = admin.firestore();

async function analyzeResourceAttributes() {
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
    
    // Analyze first few resources to see their structure
    const sampleSize = Math.min(5, resourcesSnapshot.size);
    const allAttributes = new Set();
    
    console.log(`🔍 Analyzing first ${sampleSize} resources for attributes:`);
    console.log("");
    
    let count = 0;
    resourcesSnapshot.forEach((doc) => {
      if (count >= sampleSize) return;
      
      const resourceData = doc.data();
      console.log(`📄 Resource ${count + 1} (ID: ${doc.id}):`);
      console.log(`   Name: ${resourceData.name || 'N/A'}`);
      
      // Collect all attributes
      Object.keys(resourceData).forEach(key => allAttributes.add(key));
      
      // Show all attributes for this resource
      console.log("   Attributes:");
      Object.entries(resourceData).forEach(([key, value]) => {
        const valueType = typeof value;
        const valuePreview = valueType === 'string' && value.length > 50 
          ? value.substring(0, 50) + '...' 
          : String(value);
        console.log(`     • ${key}: ${valueType} = ${valuePreview}`);
      });
      console.log("");
      count++;
    });
    
    // Show summary of all unique attributes found
    console.log("📊 All unique attributes found across resources:");
    console.log("===============================================");
    console.log("");
    
    const sortedAttributes = Array.from(allAttributes).sort();
    sortedAttributes.forEach(attr => {
      console.log(`   • ${attr}`);
    });
    
    console.log("");
    console.log(`📈 Total unique attributes: ${sortedAttributes.length}`);
    console.log("");
    
    // Check for image-related attributes
    console.log("🖼️  Image-related attributes:");
    console.log("=============================");
    console.log("");
    
    const imageAttributes = sortedAttributes.filter(attr => 
      attr.toLowerCase().includes('image') || 
      attr.toLowerCase().includes('photo') || 
      attr.toLowerCase().includes('picture') ||
      attr.toLowerCase().includes('folder') ||
      attr.toLowerCase().includes('url')
    );
    
    if (imageAttributes.length > 0) {
      imageAttributes.forEach(attr => {
        console.log(`   • ${attr}`);
      });
    } else {
      console.log("   ❌ No image-related attributes found");
    }
    
    console.log("");
    console.log("✅ Resource analysis complete!");
    
  } catch (error) {
    console.error("❌ Error analyzing resources:", error.message);
    console.log("");
    console.log("💡 Make sure your Firestore security rules allow read access.");
    console.log("   Try using test mode in the Firebase Console.");
  }
}

analyzeResourceAttributes();
