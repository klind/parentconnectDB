const admin = require("firebase-admin");
const fs = require("fs");

// Load service account
const serviceAccount = require("./serviceAccountKey.json");

console.log("🔍 Resource Field Validation:");
console.log("=============================");
console.log("");

// Initialize Firebase Admin
admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount)
});

// Connect to Firestore
const db = admin.firestore();

// Required fields for resources
const requiredFields = [
  'address',
  'category', 
  'city',
  'createdAt',
  'description',
  'name',
  'state',
  'street'
];

// Optional fields that should be present when possible
const optionalFields = [
  'location',
  'zip'
];

async function validateResourceFields() {
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
    
    // Validate each resource
    const validResources = [];
    const invalidResources = [];
    
    resourcesSnapshot.forEach((doc) => {
      const resourceData = doc.data();
      const resourceId = doc.id;
      
      // Check for missing required fields
      const missingRequiredFields = [];
      
      requiredFields.forEach(field => {
        if (!resourceData.hasOwnProperty(field)) {
          missingRequiredFields.push(field);
        } else if (resourceData[field] === null || resourceData[field] === undefined) {
          missingRequiredFields.push(field);
        } else if (typeof resourceData[field] === 'string' && resourceData[field].trim() === '') {
          missingRequiredFields.push(field);
        }
      });
      
      // Check optional fields
      const missingOptionalFields = [];
      
      optionalFields.forEach(field => {
        if (!resourceData.hasOwnProperty(field)) {
          missingOptionalFields.push(field);
        } else if (resourceData[field] === null || resourceData[field] === undefined) {
          missingOptionalFields.push(field);
        } else if (typeof resourceData[field] === 'string' && resourceData[field].trim() === '') {
          missingOptionalFields.push(field);
        }
      });
      
      const resourceInfo = {
        id: resourceId,
        name: resourceData.name || 'Unnamed Resource',
        missingRequiredFields: missingRequiredFields,
        missingOptionalFields: missingOptionalFields,
        data: resourceData
      };
      
      if (missingRequiredFields.length === 0) {
        validResources.push(resourceInfo);
      } else {
        invalidResources.push(resourceInfo);
      }
    });
    
    // Display results
    console.log("📋 Validation Results:");
    console.log("======================");
    console.log("");
    
    console.log(`✅ Valid resources (all required fields): ${validResources.length}`);
    console.log(`❌ Invalid resources (missing required fields): ${invalidResources.length}`);
    console.log(`📊 Total resources: ${resourcesSnapshot.size}`);
    console.log("");
    
    if (invalidResources.length > 0) {
      console.log("❌ Resources with missing REQUIRED fields:");
      console.log("==========================================");
      console.log("");
      
      invalidResources.forEach((resource, index) => {
        console.log(`${index + 1}. ${resource.name} (ID: ${resource.id})`);
        console.log(`   Missing required fields: ${resource.missingRequiredFields.join(', ')}`);
        
        // Show current values for missing required fields
        resource.missingRequiredFields.forEach(field => {
          const currentValue = resource.data[field];
          console.log(`   • ${field}: ${currentValue === undefined ? 'undefined' : currentValue === null ? 'null' : `"${currentValue}"`}`);
        });
        console.log("");
      });
    }
    
    // Show resources with missing optional fields
    const resourcesWithMissingOptional = validResources.filter(r => r.missingOptionalFields.length > 0);
    
    if (resourcesWithMissingOptional.length > 0) {
      console.log("⚠️  Resources with missing OPTIONAL fields:");
      console.log("===========================================");
      console.log("");
      
      resourcesWithMissingOptional.forEach((resource, index) => {
        console.log(`${index + 1}. ${resource.name} (ID: ${resource.id})`);
        console.log(`   Missing optional fields: ${resource.missingOptionalFields.join(', ')}`);
        
        // Show current values for missing optional fields
        resource.missingOptionalFields.forEach(field => {
          const currentValue = resource.data[field];
          console.log(`   • ${field}: ${currentValue === undefined ? 'undefined' : currentValue === null ? 'null' : `"${currentValue}"`}`);
        });
        console.log("");
      });
    }
    
    // Summary by missing field
    if (invalidResources.length > 0) {
      console.log("📊 Missing Required Field Summary:");
      console.log("==================================");
      console.log("");
      
      const fieldMissingCount = {};
      requiredFields.forEach(field => {
        fieldMissingCount[field] = 0;
      });
      
      invalidResources.forEach(resource => {
        resource.missingRequiredFields.forEach(field => {
          fieldMissingCount[field]++;
        });
      });
      
      Object.entries(fieldMissingCount)
        .filter(([field, count]) => count > 0)
        .sort(([,a], [,b]) => b - a)
        .forEach(([field, count]) => {
          console.log(`   • ${field}: ${count} resources missing`);
        });
      
      console.log("");
    }
    
    // Optional field statistics
    if (resourcesWithMissingOptional.length > 0) {
      console.log("📊 Missing Optional Field Summary:");
      console.log("==================================");
      console.log("");
      
      const optionalFieldMissingCount = {};
      optionalFields.forEach(field => {
        optionalFieldMissingCount[field] = 0;
      });
      
      resourcesWithMissingOptional.forEach(resource => {
        resource.missingOptionalFields.forEach(field => {
          optionalFieldMissingCount[field]++;
        });
      });
      
      Object.entries(optionalFieldMissingCount)
        .filter(([field, count]) => count > 0)
        .sort(([,a], [,b]) => b - a)
        .forEach(([field, count]) => {
          console.log(`   • ${field}: ${count} resources missing`);
        });
      
      console.log("");
    }
    
    // Show field statistics
    console.log("📈 Field Statistics:");
    console.log("===================");
    console.log("");
    
    const fieldStats = {};
    [...requiredFields, ...optionalFields].forEach(field => {
      fieldStats[field] = {
        present: 0,
        missing: 0,
        empty: 0
      };
    });
    
    resourcesSnapshot.forEach((doc) => {
      const resourceData = doc.data();
      
      [...requiredFields, ...optionalFields].forEach(field => {
        if (!resourceData.hasOwnProperty(field)) {
          fieldStats[field].missing++;
        } else if (resourceData[field] === null || resourceData[field] === undefined) {
          fieldStats[field].missing++;
        } else if (typeof resourceData[field] === 'string' && resourceData[field].trim() === '') {
          fieldStats[field].empty++;
        } else {
          fieldStats[field].present++;
        }
      });
    });
    
    // Show required fields first
    console.log("🔴 Required Fields:");
    requiredFields.forEach(field => {
      const stats = fieldStats[field];
      const total = stats.present + stats.missing + stats.empty;
      const percentage = ((stats.present / total) * 100).toFixed(1);
      
      console.log(`   • ${field}: ${stats.present}/${total} (${percentage}%)`);
      if (stats.missing > 0) {
        console.log(`     - Missing: ${stats.missing}`);
      }
      if (stats.empty > 0) {
        console.log(`     - Empty: ${stats.empty}`);
      }
    });
    
    console.log("");
    console.log("🟡 Optional Fields:");
    optionalFields.forEach(field => {
      const stats = fieldStats[field];
      const total = stats.present + stats.missing + stats.empty;
      const percentage = ((stats.present / total) * 100).toFixed(1);
      
      console.log(`   • ${field}: ${stats.present}/${total} (${percentage}%)`);
      if (stats.missing > 0) {
        console.log(`     - Missing: ${stats.missing}`);
      }
      if (stats.empty > 0) {
        console.log(`     - Empty: ${stats.empty}`);
      }
    });
    
    console.log("");
    console.log("✅ Validation complete!");
    
    if (invalidResources.length === 0) {
      console.log("🎉 All resources have all required fields!");
    } else {
      console.log("⚠️  Some resources are missing required fields and need attention.");
    }
    
  } catch (error) {
    console.error("❌ Error validating resources:", error.message);
    console.log("");
    console.log("💡 Make sure your Firestore security rules allow read access.");
    console.log("   Try using test mode in the Firebase Console.");
  }
}

validateResourceFields();
