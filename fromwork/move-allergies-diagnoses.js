const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com' // Update with your project ID
});

const db = admin.firestore();

// Helper function to clean Firestore data for JSON serialization
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

// Function to move allergies and diagnoses from public to private children
async function moveAllergiesAndDiagnoses() {
  try {
    console.log('Starting migration: Moving allergies and diagnoses from public to private children...');
    
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
    let totalMoved = 0;
    let totalSkipped = 0;
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
        // Get children from public subcollection
        const publicChildrenSnapshot = await publicUserDoc.ref.collection('children').get();
        console.log(`  Found ${publicChildrenSnapshot.size} public children`);
        
        if (publicChildrenSnapshot.empty) {
          console.log(`  No public children found for user ${userId}`);
          continue;
        }
        
        // Get children from private subcollection
        const privateChildrenSnapshot = await privateUserDoc.ref.collection('children').get();
        console.log(`  Found ${privateChildrenSnapshot.size} private children`);
        
        if (privateChildrenSnapshot.empty) {
          console.log(`  No private children found for user ${userId}`);
          continue;
        }
        
        // Create maps for matching children by ID
        const publicChildrenMap = new Map();
        const privateChildrenMap = new Map();
        
        publicChildrenSnapshot.forEach(doc => {
          publicChildrenMap.set(doc.id, doc);
        });
        
        privateChildrenSnapshot.forEach(doc => {
          privateChildrenMap.set(doc.id, doc);
        });
        
        // Process each public child
        for (const [childId, publicChildDoc] of publicChildrenMap) {
          const publicChildData = publicChildDoc.data();
          
          // Check if allergies or diagnoses exist in public data
          const hasAllergies = publicChildData.allergies && Array.isArray(publicChildData.allergies) && publicChildData.allergies.length > 0;
          const hasDiagnoses = publicChildData.diagnoses && Array.isArray(publicChildData.diagnoses) && publicChildData.diagnoses.length > 0;
          
          if (!hasAllergies && !hasDiagnoses) {
            console.log(`    Child ${childId}: No allergies or diagnoses in public data, skipping`);
            totalSkipped++;
            continue;
          }
          
          const privateChildDoc = privateChildrenMap.get(childId);
          if (!privateChildDoc) {
            console.log(`    Child ${childId}: No corresponding private child document`);
            totalSkipped++;
            continue;
          }
          
          const privateChildData = privateChildDoc.data();
          
          try {
            const updateData = {
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            
            // Move allergies if they exist
            if (hasAllergies) {
              updateData.allergies = publicChildData.allergies;
              console.log(`    Child ${childId}: Moving ${publicChildData.allergies.length} allergies to private data`);
            }
            
            // Move diagnoses if they exist
            if (hasDiagnoses) {
              updateData.diagnoses = publicChildData.diagnoses;
              console.log(`    Child ${childId}: Moving ${publicChildData.diagnoses.length} diagnoses to private data`);
            }
            
            // Update private child document
            await privateChildDoc.ref.update(updateData);
            
            // Remove allergies and diagnoses from public child document
            const removeData = {
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            
            if (hasAllergies) {
              removeData.allergies = admin.firestore.FieldValue.delete();
            }
            
            if (hasDiagnoses) {
              removeData.diagnoses = admin.firestore.FieldValue.delete();
            }
            
            await publicChildDoc.ref.update(removeData);
            
            console.log(`    Child ${childId}: Successfully moved data and removed from public`);
            totalMoved++;
            
            results.push({
              userId: userId,
              childId: childId,
              allergiesCount: hasAllergies ? publicChildData.allergies.length : 0,
              diagnosesCount: hasDiagnoses ? publicChildData.diagnoses.length : 0,
              status: 'moved'
            });
            
          } catch (error) {
            console.error(`    Child ${childId}: Error moving data - ${error.message}`);
            totalErrors++;
            results.push({
              userId: userId,
              childId: childId,
              status: 'error',
              error: error.message
            });
          }
        }
        
        totalProcessed++;
        
      } catch (error) {
        console.error(`  Error processing user ${userId}: ${error.message}`);
        totalErrors++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total users processed: ${totalProcessed}`);
    console.log(`Total children moved: ${totalMoved}`);
    console.log(`Total children skipped: ${totalSkipped}`);
    console.log(`Total errors: ${totalErrors}`);
    
    // Show detailed results
    if (results.length > 0) {
      console.log('\nDetailed Results:');
      results.forEach(result => {
        if (result.status === 'moved') {
          console.log(`  User: ${result.userId}, Child: ${result.childId}, Allergies: ${result.allergiesCount}, Diagnoses: ${result.diagnosesCount}`);
        } else if (result.status === 'error') {
          console.log(`  User: ${result.userId}, Child: ${result.childId}, Error: ${result.error}`);
        }
      });
    }
    
    return {
      success: true,
      totalProcessed,
      totalMoved,
      totalSkipped,
      totalErrors,
      results
    };
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

// Function to verify the migration
async function verifyMigration() {
  try {
    console.log('Verifying migration results...');
    
    // Get all users
    const publicUsersSnapshot = await db.collection('users_public_data').get();
    const privateUsersSnapshot = await db.collection('users_private_data').get();
    
    const publicUsers = new Map();
    const privateUsers = new Map();
    
    publicUsersSnapshot.forEach(doc => {
      publicUsers.set(doc.id, doc);
    });
    
    privateUsersSnapshot.forEach(doc => {
      privateUsers.set(doc.id, doc);
    });
    
    const allUserIds = new Set([...publicUsers.keys(), ...privateUsers.keys()]);
    
    let publicChildrenWithAllergies = 0;
    let publicChildrenWithDiagnoses = 0;
    let privateChildrenWithAllergies = 0;
    let privateChildrenWithDiagnoses = 0;
    let totalChildren = 0;
    
    for (const userId of allUserIds) {
      const publicUserDoc = publicUsers.get(userId);
      const privateUserDoc = privateUsers.get(userId);
      
      if (!publicUserDoc || !privateUserDoc) continue;
      
      try {
        // Check public children
        const publicChildrenSnapshot = await publicUserDoc.ref.collection('children').get();
        publicChildrenSnapshot.forEach(doc => {
          const data = doc.data();
          totalChildren++;
          if (data.allergies && Array.isArray(data.allergies) && data.allergies.length > 0) {
            publicChildrenWithAllergies++;
          }
          if (data.diagnoses && Array.isArray(data.diagnoses) && data.diagnoses.length > 0) {
            publicChildrenWithDiagnoses++;
          }
        });
        
        // Check private children
        const privateChildrenSnapshot = await privateUserDoc.ref.collection('children').get();
        privateChildrenSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.allergies && Array.isArray(data.allergies) && data.allergies.length > 0) {
            privateChildrenWithAllergies++;
          }
          if (data.diagnoses && Array.isArray(data.diagnoses) && data.diagnoses.length > 0) {
            privateChildrenWithDiagnoses++;
          }
        });
        
      } catch (error) {
        console.log(`Error checking user ${userId}: ${error.message}`);
      }
    }
    
    console.log('\nVERIFICATION RESULTS:');
    console.log('='.repeat(50));
    console.log(`Total children: ${totalChildren}`);
    console.log(`Public children with allergies: ${publicChildrenWithAllergies}`);
    console.log(`Public children with diagnoses: ${publicChildrenWithDiagnoses}`);
    console.log(`Private children with allergies: ${privateChildrenWithAllergies}`);
    console.log(`Private children with diagnoses: ${privateChildrenWithDiagnoses}`);
    
    if (publicChildrenWithAllergies === 0 && publicChildrenWithDiagnoses === 0 && 
        (privateChildrenWithAllergies > 0 || privateChildrenWithDiagnoses > 0)) {
      console.log('✅ Migration successful: All allergies and diagnoses moved to private data');
    } else if (publicChildrenWithAllergies > 0 || publicChildrenWithDiagnoses > 0) {
      console.log('⚠️  Some allergies or diagnoses still remain in public data');
    } else {
      console.log('ℹ️  No allergies or diagnoses found in either collection');
    }
    
    return {
      totalChildren,
      publicChildrenWithAllergies,
      publicChildrenWithDiagnoses,
      privateChildrenWithAllergies,
      privateChildrenWithDiagnoses,
      migrationSuccessful: publicChildrenWithAllergies === 0 && publicChildrenWithDiagnoses === 0 && 
                          (privateChildrenWithAllergies > 0 || privateChildrenWithDiagnoses > 0)
    };
    
  } catch (error) {
    console.error('Error during verification:', error);
    throw error;
  }
}

// Function to show sample data before migration
async function showSampleData() {
  try {
    console.log('Showing sample data before migration...');
    
    const publicUsersSnapshot = await db.collection('users_public_data').limit(3).get();
    
    for (const userDoc of publicUsersSnapshot.docs) {
      console.log(`\nUser: ${userDoc.id}`);
      const childrenSnapshot = await userDoc.ref.collection('children').get();
      
      childrenSnapshot.forEach(childDoc => {
        const data = childDoc.data();
        console.log(`  Child: ${childDoc.id}`);
        console.log(`    Allergies: ${data.allergies ? data.allergies.length : 0} items`);
        console.log(`    Diagnoses: ${data.diagnoses ? data.diagnoses.length : 0} items`);
        if (data.allergies && data.allergies.length > 0) {
          console.log(`    Sample allergies:`, data.allergies.slice(0, 2).map(a => a.name || a));
        }
        if (data.diagnoses && data.diagnoses.length > 0) {
          console.log(`    Sample diagnoses:`, data.diagnoses.slice(0, 2).map(d => d.name || d));
        }
      });
    }
    
  } catch (error) {
    console.error('Error showing sample data:', error);
  }
}

// Main execution
async function main() {
  try {
    // Choose which function to run:
    
    // Option 1: Show sample data before migration
    // await showSampleData();
    
    // Option 2: Move allergies and diagnoses
    // await moveAllergiesAndDiagnoses();
    
    // Option 3: Verify the migration
    await verifyMigration();
    
    console.log('\nAllergies and diagnoses migration completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('Allergies and diagnoses migration failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  moveAllergiesAndDiagnoses,
  verifyMigration,
  showSampleData
};
