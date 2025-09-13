const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com' // Update with your project ID
});

const db = admin.firestore();

// Function to clean up extra age range fields
async function cleanupAgeRangeFields() {
  try {
    console.log('Cleaning up extra age range fields from children...');
    
    const publicUsersSnapshot = await db.collection('users_public_data').get();
    console.log(`Found ${publicUsersSnapshot.size} public users`);
    
    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    // Process each user
    for (const userDoc of publicUsersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`\nProcessing user ${userId}...`);
      
      try {
        // Get children from public subcollection
        const childrenSnapshot = await userDoc.ref.collection('children').get();
        console.log(`  Found ${childrenSnapshot.size} children`);
        
        if (childrenSnapshot.empty) {
          console.log(`  No children found for user ${userId}`);
          continue;
        }
        
        // Process each child
        for (const childDoc of childrenSnapshot.docs) {
          const childId = childDoc.id;
          const childData = childDoc.data();
          
          // Check if extra fields exist
          const hasExtraFields = childData.ageRangeLabel || childData.ageRangeString;
          
          if (!hasExtraFields) {
            console.log(`    Child ${childId}: No extra fields to clean up, skipping`);
            totalSkipped++;
            continue;
          }
          
          try {
            // Remove the extra fields, keep only ageRangeId
            const updateData = {
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            
            // Remove ageRangeLabel if it exists
            if (childData.ageRangeLabel) {
              updateData.ageRangeLabel = admin.firestore.FieldValue.delete();
            }
            
            // Remove ageRangeString if it exists
            if (childData.ageRangeString) {
              updateData.ageRangeString = admin.firestore.FieldValue.delete();
            }
            
            // Update child document
            await childDoc.ref.update(updateData);
            
            console.log(`    Child ${childId}: Cleaned up extra fields, kept ageRangeId: ${childData.ageRangeId}`);
            totalUpdated++;
            
          } catch (error) {
            console.error(`    Child ${childId}: Error cleaning up fields - ${error.message}`);
            totalErrors++;
          }
        }
        
        totalProcessed++;
        
      } catch (error) {
        console.error(`  Error processing user ${userId}: ${error.message}`);
        totalErrors++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('CLEANUP SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total users processed: ${totalProcessed}`);
    console.log(`Total children updated: ${totalUpdated}`);
    console.log(`Total children skipped: ${totalSkipped}`);
    console.log(`Total errors: ${totalErrors}`);
    
    return {
      success: true,
      totalProcessed,
      totalUpdated,
      totalSkipped,
      totalErrors
    };
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
}

// Function to verify cleanup
async function verifyCleanup() {
  try {
    console.log('Verifying cleanup results...');
    
    const publicUsersSnapshot = await db.collection('users_public_data').get();
    
    let totalChildren = 0;
    let childrenWithOnlyAgeRangeId = 0;
    let childrenWithExtraFields = 0;
    let childrenWithoutAgeRange = 0;
    
    for (const userDoc of publicUsersSnapshot.docs) {
      const childrenSnapshot = await userDoc.ref.collection('children').get();
      
      childrenSnapshot.forEach(childDoc => {
        const childData = childDoc.data();
        totalChildren++;
        
        if (childData.ageRangeId) {
          // Check if it has only ageRangeId and no extra fields
          const hasExtraFields = childData.ageRangeLabel || childData.ageRangeString;
          if (hasExtraFields) {
            childrenWithExtraFields++;
            console.log(`  Child ${childDoc.id} still has extra fields: ageRangeLabel=${!!childData.ageRangeLabel}, ageRangeString=${!!childData.ageRangeString}`);
          } else {
            childrenWithOnlyAgeRangeId++;
          }
        } else {
          childrenWithoutAgeRange++;
        }
      });
    }
    
    console.log('\nVERIFICATION RESULTS:');
    console.log('='.repeat(40));
    console.log(`Total children: ${totalChildren}`);
    console.log(`Children with only ageRangeId: ${childrenWithOnlyAgeRangeId}`);
    console.log(`Children with extra fields: ${childrenWithExtraFields}`);
    console.log(`Children without age range: ${childrenWithoutAgeRange}`);
    
    if (childrenWithExtraFields === 0) {
      console.log('✅ Cleanup successful: All extra fields removed');
    } else {
      console.log('⚠️  Some children still have extra fields');
    }
    
    return {
      totalChildren,
      childrenWithOnlyAgeRangeId,
      childrenWithExtraFields,
      childrenWithoutAgeRange,
      cleanupSuccessful: childrenWithExtraFields === 0
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
    
    // Option 1: Clean up extra fields
    await cleanupAgeRangeFields();
    
    // Option 2: Verify cleanup
    // await verifyCleanup();
    
    console.log('\nCleanup completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  cleanupAgeRangeFields,
  verifyCleanup
};
