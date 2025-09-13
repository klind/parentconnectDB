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

// Function to move age field from public to private children
async function moveAgeFieldFromPublicToPrivate() {
  try {
    console.log('Starting migration: Moving age field from public to private children...');
    
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
          
          if (!publicChildData.age) {
            console.log(`    Child ${childId}: No age field in public data`);
            continue;
          }
          
          const privateChildDoc = privateChildrenMap.get(childId);
          if (!privateChildDoc) {
            console.log(`    Child ${childId}: No corresponding private child document`);
            continue;
          }
          
          const privateChildData = privateChildDoc.data();
          
          // Check if age already exists in private data
          if (privateChildData.age !== undefined) {
            console.log(`    Child ${childId}: Age already exists in private data (${privateChildData.age}), skipping`);
            continue;
          }
          
          try {
            // Add age to private child document
            await privateChildDoc.ref.update({
              age: publicChildData.age,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`    Child ${childId}: Moved age ${publicChildData.age} to private data`);
            totalMoved++;
            
            // Remove age from public child document
            await publicChildDoc.ref.update({
              age: admin.firestore.FieldValue.delete(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`    Child ${childId}: Removed age from public data`);
            
            results.push({
              userId: userId,
              childId: childId,
              age: publicChildData.age,
              status: 'moved'
            });
            
          } catch (error) {
            console.error(`    Child ${childId}: Error moving age - ${error.message}`);
            totalErrors++;
            results.push({
              userId: userId,
              childId: childId,
              age: publicChildData.age,
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
    
    console.log('\n' + '='.repeat(50));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total users processed: ${totalProcessed}`);
    console.log(`Total ages moved: ${totalMoved}`);
    console.log(`Total errors: ${totalErrors}`);
    
    // Show detailed results
    if (results.length > 0) {
      console.log('\nDetailed Results:');
      results.forEach(result => {
        console.log(`  User: ${result.userId}, Child: ${result.childId}, Age: ${result.age}, Status: ${result.status}`);
        if (result.error) {
          console.log(`    Error: ${result.error}`);
        }
      });
    }
    
    return {
      success: true,
      totalProcessed,
      totalMoved,
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
    
    let publicChildrenWithAge = 0;
    let privateChildrenWithAge = 0;
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
          if (data.age !== undefined) {
            publicChildrenWithAge++;
          }
        });
        
        // Check private children
        const privateChildrenSnapshot = await privateUserDoc.ref.collection('children').get();
        privateChildrenSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.age !== undefined) {
            privateChildrenWithAge++;
          }
        });
        
      } catch (error) {
        console.log(`Error checking user ${userId}: ${error.message}`);
      }
    }
    
    console.log('\nVERIFICATION RESULTS:');
    console.log('='.repeat(30));
    console.log(`Total children: ${totalChildren}`);
    console.log(`Public children with age: ${publicChildrenWithAge}`);
    console.log(`Private children with age: ${privateChildrenWithAge}`);
    
    if (publicChildrenWithAge === 0 && privateChildrenWithAge > 0) {
      console.log('✅ Migration successful: All ages moved to private data');
    } else if (publicChildrenWithAge > 0) {
      console.log('⚠️  Some ages still remain in public data');
    } else {
      console.log('ℹ️  No ages found in either collection');
    }
    
    return {
      totalChildren,
      publicChildrenWithAge,
      privateChildrenWithAge,
      migrationSuccessful: publicChildrenWithAge === 0 && privateChildrenWithAge > 0
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
    
    // Option 1: Move age field from public to private
    // await moveAgeFieldFromPublicToPrivate();
    
    // Option 2: Verify the migration
    await verifyMigration();
    
    console.log('\nAge field migration completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('Age field migration failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  moveAgeFieldFromPublicToPrivate,
  verifyMigration
};
