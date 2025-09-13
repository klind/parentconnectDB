const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com'
});

const db = admin.firestore();

// Helper function to clean Firestore data
function cleanFirestoreData(data) {
  const cleanData = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value && typeof value === 'object') {
      // Handle Firestore Timestamps
      if (value.toDate && typeof value.toDate === 'function') {
        cleanData[key] = value.toDate().toISOString();
      }
      // Handle Firestore Timestamp objects with _seconds
      else if (value._seconds) {
        cleanData[key] = new Date(value._seconds * 1000).toISOString();
      }
      // Handle regular Date objects
      else if (value instanceof Date) {
        cleanData[key] = value.toISOString();
      }
      // Handle nested objects
      else {
        cleanData[key] = value;
      }
    } else {
      cleanData[key] = value;
    }
  });
  
  return cleanData;
}

// Function to reorganize location data
async function reorganizeLocationData() {
  try {
    console.log('Starting location data reorganization...');
    console.log('Moving state and city to public collection');
    console.log('Moving zipCodeGeo and zipCode to private collection');
    
    // Get all users from both collections
    const publicUsersSnapshot = await db.collection('users_public_data').get();
    const privateUsersSnapshot = await db.collection('users_private_data').get();
    
    console.log(`Found ${publicUsersSnapshot.size} public users and ${privateUsersSnapshot.size} private users`);
    
    // Create maps for quick lookup
    const publicUsers = new Map();
    const privateUsers = new Map();
    
    publicUsersSnapshot.forEach(doc => {
      publicUsers.set(doc.id, doc);
    });
    
    privateUsersSnapshot.forEach(doc => {
      privateUsers.set(doc.id, doc);
    });
    
    const allUserIds = new Set([...publicUsers.keys(), ...privateUsers.keys()]);
    console.log(`Processing ${allUserIds.size} unique users...`);
    
    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    const results = [];
    
    // Process each user
    for (const userId of allUserIds) {
      const publicUserDoc = publicUsers.get(userId);
      const privateUserDoc = privateUsers.get(userId);
      
      if (!publicUserDoc || !privateUserDoc) {
        console.log(`Skipping user ${userId}: Missing public or private data`);
        continue;
      }
      
      console.log(`\nProcessing user ${userId}...`);
      
      try {
        const publicData = publicUserDoc.data();
        const privateData = privateUserDoc.data();
        
        let publicLocation = publicData.location || {};
        let privateLocation = privateData.location || {};
        
        console.log(`  Current public location:`, JSON.stringify(publicLocation, null, 2));
        console.log(`  Current private location:`, JSON.stringify(privateLocation, null, 2));
        
        // Prepare new location objects
        const newPublicLocation = {};
        const newPrivateLocation = {};
        
        // Move state and city to public collection
        if (publicLocation.state) {
          newPublicLocation.state = publicLocation.state;
        }
        if (publicLocation.city) {
          newPublicLocation.city = publicLocation.city;
        }
        if (privateLocation.state) {
          newPublicLocation.state = privateLocation.state;
        }
        if (privateLocation.city) {
          newPublicLocation.city = privateLocation.city;
        }
        
        // Move zipCodeGeo and zipCode to private collection
        if (publicLocation.zipCodeGeo) {
          newPrivateLocation.zipCodeGeo = publicLocation.zipCodeGeo;
        }
        if (publicLocation.zipCode) {
          newPrivateLocation.zipCode = publicLocation.zipCode;
        }
        if (privateLocation.zipCodeGeo) {
          newPrivateLocation.zipCodeGeo = privateLocation.zipCodeGeo;
        }
        if (privateLocation.zipCode) {
          newPrivateLocation.zipCode = privateLocation.zipCode;
        }
        
        // Keep any other fields in their original locations
        Object.keys(publicLocation).forEach(key => {
          if (!['state', 'city', 'zipCodeGeo', 'zipCode'].includes(key)) {
            newPublicLocation[key] = publicLocation[key];
          }
        });
        
        Object.keys(privateLocation).forEach(key => {
          if (!['state', 'city', 'zipCodeGeo', 'zipCode'].includes(key)) {
            newPrivateLocation[key] = privateLocation[key];
          }
        });
        
        console.log(`  New public location:`, JSON.stringify(newPublicLocation, null, 2));
        console.log(`  New private location:`, JSON.stringify(newPrivateLocation, null, 2));
        
        // Update public collection
        await publicUserDoc.ref.update({
          location: newPublicLocation,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update private collection
        await privateUserDoc.ref.update({
          location: newPrivateLocation,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`  ✅ Successfully reorganized location data`);
        totalUpdated++;
        
        results.push({
          userId: userId,
          displayName: publicData.displayName || 'Unknown',
          status: 'updated',
          publicFields: Object.keys(newPublicLocation),
          privateFields: Object.keys(newPrivateLocation)
        });
        
        totalProcessed++;
        
      } catch (error) {
        console.error(`  ❌ Error processing user ${userId}: ${error.message}`);
        totalErrors++;
        results.push({
          userId: userId,
          status: 'error',
          error: error.message
        });
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('REORGANIZATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total users processed: ${totalProcessed}`);
    console.log(`Total users updated: ${totalUpdated}`);
    console.log(`Total errors: ${totalErrors}`);
    
    // Show detailed results
    if (results.length > 0) {
      console.log('\nDetailed Results:');
      results.forEach(result => {
        if (result.status === 'updated') {
          console.log(`  User: ${result.displayName} (${result.userId})`);
          console.log(`    Public fields: ${result.publicFields.join(', ')}`);
          console.log(`    Private fields: ${result.privateFields.join(', ')}`);
        } else if (result.status === 'error') {
          console.log(`  User: ${result.userId}, Error: ${result.error}`);
        }
      });
    }
    
    return {
      success: true,
      totalProcessed,
      totalUpdated,
      totalErrors,
      results
    };
    
  } catch (error) {
    console.error('Error reorganizing location data:', error);
    throw error;
  }
}

// Function to verify the reorganization
async function verifyReorganization() {
  try {
    console.log('Verifying location data reorganization...');
    
    const publicUsersSnapshot = await db.collection('users_public_data').get();
    const privateUsersSnapshot = await db.collection('users_private_data').get();
    
    const publicUsers = new Map();
    const privateUsers = new Map();
    
    publicUsersSnapshot.forEach(doc => {
      publicUsers.set(doc.id, doc.data());
    });
    
    privateUsersSnapshot.forEach(doc => {
      privateUsers.set(doc.id, doc.data());
    });
    
    const allUserIds = new Set([...publicUsers.keys(), ...privateUsers.keys()]);
    
    let correctPublicFields = 0;
    let correctPrivateFields = 0;
    let incorrectPublicFields = 0;
    let incorrectPrivateFields = 0;
    
    console.log('\nVerification Results:');
    console.log('='.repeat(80));
    
    for (const userId of allUserIds) {
      const publicData = publicUsers.get(userId);
      const privateData = privateUsers.get(userId);
      
      if (!publicData || !privateData) continue;
      
      const publicLocation = publicData.location || {};
      const privateLocation = privateData.location || {};
      
      console.log(`\nUser: ${publicData.displayName || 'Unknown'} (${userId})`);
      
      // Check public collection (should have state and city)
      const publicHasState = !!publicLocation.state;
      const publicHasCity = !!publicLocation.city;
      const publicHasZipCode = !!publicLocation.zipCode;
      const publicHasZipCodeGeo = !!publicLocation.zipCodeGeo;
      
      console.log(`  Public: state=${publicHasState}, city=${publicHasCity}, zipCode=${publicHasZipCode}, zipCodeGeo=${publicHasZipCodeGeo}`);
      
      if (publicHasState || publicHasCity) {
        correctPublicFields++;
      }
      if (publicHasZipCode || publicHasZipCodeGeo) {
        incorrectPublicFields++;
      }
      
      // Check private collection (should have zipCode and zipCodeGeo)
      const privateHasState = !!privateLocation.state;
      const privateHasCity = !!privateLocation.city;
      const privateHasZipCode = !!privateLocation.zipCode;
      const privateHasZipCodeGeo = !!privateLocation.zipCodeGeo;
      
      console.log(`  Private: state=${privateHasState}, city=${privateHasCity}, zipCode=${privateHasZipCode}, zipCodeGeo=${privateHasZipCodeGeo}`);
      
      if (privateHasZipCode || privateHasZipCodeGeo) {
        correctPrivateFields++;
      }
      if (privateHasState || privateHasCity) {
        incorrectPrivateFields++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Users with correct public fields (state/city): ${correctPublicFields}`);
    console.log(`Users with correct private fields (zipCode/zipCodeGeo): ${correctPrivateFields}`);
    console.log(`Users with incorrect public fields (zipCode/zipCodeGeo): ${incorrectPublicFields}`);
    console.log(`Users with incorrect private fields (state/city): ${incorrectPrivateFields}`);
    
    const successRate = ((correctPublicFields + correctPrivateFields) / (allUserIds.size * 2) * 100).toFixed(1);
    console.log(`Overall success rate: ${successRate}%`);
    
    return {
      correctPublicFields,
      correctPrivateFields,
      incorrectPublicFields,
      incorrectPrivateFields,
      successRate: parseFloat(successRate)
    };
    
  } catch (error) {
    console.error('Error during verification:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Choose which function to run:
    
    // Option 1: Reorganize location data
    // await reorganizeLocationData();
    
    // Option 2: Verify the reorganization
    await verifyReorganization();
    
    console.log('\nLocation data reorganization completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('Location data reorganization failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  reorganizeLocationData,
  verifyReorganization
};
