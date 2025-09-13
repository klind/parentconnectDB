const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

// Hardcoded bucket to match your environment
const DEFAULT_BUCKET = "parentconnect2025.firebasestorage.app";
const STORAGE_PREFIX = "resource-images/";

// Load service account without require() to appease strict linters
const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, "serviceAccountKey.json"), "utf8"));

// Initialize Firebase Admin for Firestore and Storage
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: DEFAULT_BUCKET
});

const db = admin.firestore();
const bucket = admin.storage().bucket(DEFAULT_BUCKET);

// Parse address string to extract components
function parseAddress(addressString) {
  if (!addressString) return { street: "", city: "", state: "", zip: "" };
  
  // Expected format: "1120 E Sahara Ave, Las Vegas, NV 89104"
  const parts = addressString.split(",").map(part => part.trim());
  
  if (parts.length >= 3) {
    const street = parts[0];
    const city = parts[1];
    const stateZip = parts[2];
    
    // Extract state and zip from "NV 89104"
    const stateZipMatch = stateZip.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
    if (stateZipMatch) {
      return {
        street,
        city,
        state: stateZipMatch[1],
        zip: stateZipMatch[2]
      };
    }
  }
  
  // Fallback: return as-is
  return { street: addressString, city: "", state: "", zip: "" };
}

// Create storage folder for a resource
async function createStorageFolder(resourceId) {
  try {
    // Create a placeholder file to establish the folder structure
    const placeholderPath = `${STORAGE_PREFIX}${resourceId}/.placeholder`;
    await bucket.file(placeholderPath).save("", {
      metadata: {
        contentType: "text/plain",
        cacheControl: "no-cache"
      }
    });
    
    // Delete the placeholder immediately
    await bucket.file(placeholderPath).delete();
    
    console.log(`  📁 Created storage folder: ${STORAGE_PREFIX}${resourceId}/`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to create storage folder: ${error.message}`);
    return false;
  }
}

// Insert a single resource into Firestore
async function insertResource(resourceData, category) {
  try {
    const address = parseAddress(resourceData.address);
    
    const resourceDoc = {
      name: resourceData.name || "",
      category: category,
      description: resourceData.description || "",
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip,
      location: new admin.firestore.GeoPoint(
        resourceData.latitude || 0,
        resourceData.longitude || 0
      ),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      submittedBy: "system",
      approved: true,
      averageRating: 0,
      totalRatings: 0
    };
    
    // Insert the resource and get the generated ID
    const docRef = await db.collection("resources").add(resourceDoc);
    const resourceId = docRef.id;
    
    // Update the document with the imageFolder path
    const imageFolder = `${STORAGE_PREFIX}${resourceId}/`;
    await docRef.update({ imageFolder });
    
    console.log(`  ✅ Inserted resource: ${resourceData.name} (ID: ${resourceId})`);
    
    // Create the corresponding storage folder
    await createStorageFolder(resourceId);
    
    return { success: true, resourceId };
  } catch (error) {
    console.error(`  ❌ Failed to insert resource ${resourceData.name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Process all resources from a category file
async function processCategoryFile(filePath, category) {
  try {
    console.log(`\n📁 Processing category: ${category}`);
    console.log(`   File: ${path.basename(filePath)}`);
    
    const fileContent = fs.readFileSync(filePath, "utf8");
    const resources = JSON.parse(fileContent);
    
    if (!Array.isArray(resources)) {
      console.log(`   ⚠️  File does not contain an array of resources`);
      return { processed: 0, success: 0, failed: 0 };
    }
    
    console.log(`   📊 Found ${resources.length} resources to process`);
    
    let success = 0;
    let failed = 0;
    
    for (const resource of resources) {
      const result = await insertResource(resource, category);
      if (result.success) {
        success++;
      } else {
        failed++;
      }
    }
    
    return { processed: resources.length, success, failed };
  } catch (error) {
    console.error(`   ❌ Error processing file ${filePath}: ${error.message}`);
    return { processed: 0, success: 0, failed: 0 };
  }
}

// Main function to process all LasVegasResources
async function importLasVegasResources() {
  const resourcesDir = path.join(__dirname, "LasVegasResources");
  
  if (!fs.existsSync(resourcesDir)) {
    console.error("❌ LasVegasResources directory not found");
    process.exit(1);
  }
  
  console.log("🚀 Starting Las Vegas Resources Import");
  console.log("=====================================");
  console.log(`📂 Resources directory: ${resourcesDir}`);
  console.log(`🗄️  Storage bucket: ${DEFAULT_BUCKET}`);
  console.log(`📊 Firestore collection: resources`);
  
  // Get all JSON files in the directory
  const files = fs.readdirSync(resourcesDir)
    .filter(file => file.endsWith(".json"))
    .map(file => path.join(resourcesDir, file));
  
  if (files.length === 0) {
    console.log("❌ No JSON files found in LasVegasResources directory");
    return;
  }
  
  console.log(`\n📋 Found ${files.length} category files to process`);
  
  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (const filePath of files) {
    const category = path.basename(filePath, ".json")
      .replace(/([A-Z])/g, " $1") // Add space before capitals
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
    
    const result = await processCategoryFile(filePath, category);
    
    totalProcessed += result.processed;
    totalSuccess += result.success;
    totalFailed += result.failed;
  }
  
  console.log("\n🎯 Import Summary");
  console.log("==================");
  console.log(`📊 Total resources processed: ${totalProcessed}`);
  console.log(`✅ Successfully imported: ${totalSuccess}`);
  console.log(`❌ Failed to import: ${totalFailed}`);
  console.log(`📁 Storage folders created: ${totalSuccess}`);
  
  if (totalFailed > 0) {
    console.log("\n⚠️  Some resources failed to import. Check the logs above for details.");
  }
  
  console.log("\n✨ Import process completed!");
}

// Run the import
(async function main() {
  try {
    await importLasVegasResources();
  } catch (error) {
    console.error("❌ Fatal error during import:", error.message);
    process.exit(1);
  }
})();

