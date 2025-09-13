const admin = require("firebase-admin");
const fs = require("fs");

// Load service account from project root
const serviceAccount = require("../../serviceAccountKey.json");

console.log("🔧 Fixing Resource Addresses:");
console.log("=============================");
console.log("");

// Initialize Firebase Admin
admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount)
});

// Connect to Firestore
const db = admin.firestore();

// Improved address parsing function
function parseAddress(addressString) {
  if (!addressString) return { street: '', city: '', state: '', zip: '' };
  
  // Remove extra spaces and normalize
  let cleanAddress = addressString.trim().replace(/\s+/g, ' ');
  
  // Remove parenthetical notes
  cleanAddress = cleanAddress.replace(/\s*\([^)]*\)/g, '');
  
  // Split by commas
  const parts = cleanAddress.split(',').map(part => part.trim());
  
  if (parts.length >= 3) {
    const street = parts[0];
    const city = parts[1];
    const stateZip = parts[2];
    
    // Parse state and zip - handle various formats
    const stateZipMatch = stateZip.match(/^([A-Z]{2})\s+(\d{5})$/);
    if (stateZipMatch) {
      return {
        street: street,
        city: city,
        state: stateZipMatch[1],
        zip: stateZipMatch[2]
      };
    }
    
    // Handle case where there's no zip code
    const stateMatch = stateZip.match(/^([A-Z]{2})$/);
    if (stateMatch) {
      return {
        street: street,
        city: city,
        state: stateMatch[1],
        zip: ''
      };
    }
  } else if (parts.length === 2) {
    // Handle "City, State" format (no street address)
    const city = parts[0];
    const stateZip = parts[1];
    
    const stateZipMatch = stateZip.match(/^([A-Z]{2})\s+(\d{5})$/);
    if (stateZipMatch) {
      return {
        street: '',
        city: city,
        state: stateZipMatch[1],
        zip: stateZipMatch[2]
      };
    }
    
    const stateMatch = stateZip.match(/^([A-Z]{2})$/);
    if (stateMatch) {
      return {
        street: '',
        city: city,
        state: stateMatch[1],
        zip: ''
      };
    }
  }
  
  // Fallback: return original address as street
  return {
    street: cleanAddress,
    city: '',
    state: '',
    zip: ''
  };
}

// Manual fixes for specific resources
const manualFixes = {
  'C8imVf3am2z0UcVmbk7s': { // Montessori School of Salt Lake
    address: '980 E 300 S, Salt Lake City, UT 84102',
    city: 'Salt Lake City',
    state: 'UT',
    zip: '84102',
    location: { latitude: 40.7682, longitude: -111.8786 }
  },
  'DtEHUW0FqqTZ4fUf5Po1': { // Waterford School
    address: 'Sandy, UT',
    city: 'Sandy',
    state: 'UT',
    zip: '',
    location: { latitude: 40.5800, longitude: -111.8667 }
  },
  'HhrAEPY66AJsCprJZoPp': { // Child Time Inc – Preschool & Daycare
    address: 'Salt Lake City, UT',
    city: 'Salt Lake City',
    state: 'UT',
    zip: '',
    location: null
  },
  'TtLY2q7T3cFPB0ZDIIMX': { // MiniCare LLC
    address: 'Salt Lake City, UT',
    city: 'Salt Lake City',
    state: 'UT',
    zip: '',
    location: { latitude: 40.760, longitude: -111.900 }
  },
  'XgqUzVOpwdNPfIsUOxE3': { // Neighborhood House
    address: 'Multiple locations Salt Lake City, UT',
    city: 'Salt Lake City',
    state: 'UT',
    zip: '',
    location: null
  },
  'a3PeWQZtHs4v8VQ4zf4l': { // Boo Boo's Child Care
    address: 'Salt Lake City, UT',
    city: 'Salt Lake City',
    state: 'UT',
    zip: '',
    location: { latitude: 40.740, longitude: -111.900 }
  },
  'cDSzXXm7ByXcDtKOtjvi': { // Rowland Hall
    address: 'Salt Lake City, UT',
    city: 'Salt Lake City',
    state: 'UT',
    zip: '',
    location: { latitude: 40.7765, longitude: -111.9589 }
  },
  'dzBnFiiDe1VrlX1grgcn': { // Chase Home Museum of Utah Folk Arts
    address: '1150 S 600 E, Salt Lake City, UT 84105',
    city: 'Salt Lake City',
    state: 'UT',
    zip: '84105',
    location: { latitude: 40.7472, longitude: -111.8727 }
  },
  'e6G1R3XITDmYAKNJIOu2': { // The Shops at South Town
    address: '10450 State St #2320, Sandy, UT 84070',
    city: 'Sandy',
    state: 'UT',
    zip: '84070',
    location: { latitude: 40.5692, longitude: -111.8804 }
  },
  'qJNrLeJiRytBsxq1rvcU': { // Crestview School
    address: 'Salt Lake City, UT area',
    city: 'Salt Lake City',
    state: 'UT',
    zip: '',
    location: null,
    description: 'Public Elementary School with engaged faculty and strong community.'
  },
  'ySkgesSdZfdY80wZ2DLq': { // La Petite Academy of Salt Lake City
    address: 'Various locations in Salt Lake City',
    city: 'Salt Lake City',
    state: 'UT',
    zip: '',
    location: { latitude: 40.745, longitude: -111.890 }
  }
};

async function fixResourceAddresses() {
  try {
    console.log("🔍 Fetching resources that need fixing...");
    console.log("");
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const [resourceId, fixData] of Object.entries(manualFixes)) {
      try {
        console.log(`🔧 Fixing resource: ${resourceId}`);
        
        // Get the current resource
        const resourceRef = db.collection('resources').doc(resourceId);
        const resourceDoc = await resourceRef.get();
        
        if (!resourceDoc.exists) {
          console.log(`   ❌ Resource ${resourceId} not found`);
          errorCount++;
          continue;
        }
        
        const currentData = resourceDoc.data();
        console.log(`   📄 Current name: ${currentData.name}`);
        
        // Prepare update data
        const updateData = {
          address: fixData.address,
          city: fixData.city,
          state: fixData.state,
          zip: fixData.zip,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Add location if provided
        if (fixData.location) {
          updateData.location = new admin.firestore.GeoPoint(
            fixData.location.latitude, 
            fixData.location.longitude
          );
        }
        
        // Add description if provided
        if (fixData.description) {
          updateData.description = fixData.description;
        }
        
        // Update the resource
        await resourceRef.update(updateData);
        
        console.log(`   ✅ Fixed: ${currentData.name}`);
        console.log(`      Address: ${fixData.address}`);
        console.log(`      City: ${fixData.city}, State: ${fixData.state}, Zip: ${fixData.zip || 'N/A'}`);
        if (fixData.location) {
          console.log(`      Location: ${fixData.location.latitude}, ${fixData.location.longitude}`);
        }
        console.log("");
        
        fixedCount++;
        
      } catch (error) {
        console.error(`   ❌ Error fixing resource ${resourceId}:`, error.message);
        errorCount++;
      }
    }
    
    // Summary
    console.log("📊 Fix Summary:");
    console.log(`✅ Successfully fixed: ${fixedCount} resources`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log("");
    
    if (errorCount === 0) {
      console.log("🎉 All resource addresses have been fixed!");
      console.log("");
      console.log("💡 You can now run the validation script again to confirm all fields are present.");
    } else {
      console.log("⚠️  Some resources had errors. Check the logs above.");
    }
    
  } catch (error) {
    console.error("❌ Error fixing resource addresses:", error.message);
  }
}

fixResourceAddresses();
