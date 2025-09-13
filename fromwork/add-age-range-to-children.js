const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com' // Update with your project ID
});

const db = admin.firestore();

// Helper function to determine age range based on age
function getAgeRangeForAge(age, ageRanges) {
  if (age === null || age === undefined) {
    return null;
  }
  
  // Find the age range that contains this age
  for (const ageRange of ageRanges) {
    if (age >= ageRange.minAge && age <= ageRange.maxAge) {
      return ageRange;
    }
  }
  
  return null;
}

// Function to add age range to children
async function addAgeRangeToChildren() {
  try {
    console.log('Starting: Adding age range to children in users_public_data...');
    
    // First, get all age ranges
    console.log('Fetching age ranges...');
    const ageRangesSnapshot = await db.collection('age_ranges').get();
    
    if (ageRangesSnapshot.empty) {
      console.log('No age ranges found. Please create age ranges first.');
      return;
    }
    
    const ageRanges = [];
    ageRangesSnapshot.forEach(doc => {
      ageRanges.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Found ${ageRanges.length} age ranges`);
    
    // Get all users from users_public_data
    const publicUsersSnapshot = await db.collection('users_public_data').get();
    console.log(`Found ${publicUsersSnapshot.size} public users`);
    
    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const results = [];
    
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
          
          // Check if age range already exists
          if (childData.ageRangeId) {
            console.log(`    Child ${childId}: Already has age range (${childData.ageRangeId}), skipping`);
            totalSkipped++;
            continue;
          }
          
          // Get age from private data (since we moved it there)
          let childAge = null;
          try {
            const privateUserDoc = await db.collection('users_private_data').doc(userId).get();
            if (privateUserDoc.exists) {
              const privateChildrenSnapshot = await privateUserDoc.ref.collection('children').doc(childId).get();
              if (privateChildrenSnapshot.exists) {
                const privateChildData = privateChildrenSnapshot.data();
                childAge = privateChildData.age;
              }
            }
          } catch (error) {
            console.log(`    Child ${childId}: Could not fetch age from private data - ${error.message}`);
          }
          
          if (childAge === null || childAge === undefined) {
            console.log(`    Child ${childId}: No age found, skipping`);
            totalSkipped++;
            continue;
          }
          
          // Determine age range
          const ageRange = getAgeRangeForAge(childAge, ageRanges);
          
          if (!ageRange) {
            console.log(`    Child ${childId}: No age range found for age ${childAge}, skipping`);
            totalSkipped++;
            continue;
          }
          
          try {
            // Update child document with age range
            await childDoc.ref.update({
              ageRangeId: ageRange.id,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`    Child ${childId}: Added age range ${ageRange.label} (${ageRange.minAge}-${ageRange.maxAge}) for age ${childAge}`);
            totalUpdated++;
            
            results.push({
              userId: userId,
              childId: childId,
              childAge: childAge,
              ageRangeId: ageRange.id,
              status: 'updated'
            });
            
          } catch (error) {
            console.error(`    Child ${childId}: Error updating age range - ${error.message}`);
            totalErrors++;
            results.push({
              userId: userId,
              childId: childId,
              childAge: childAge,
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
    console.log('AGE RANGE ADDITION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total users processed: ${totalProcessed}`);
    console.log(`Total children updated: ${totalUpdated}`);
    console.log(`Total children skipped: ${totalSkipped}`);
    console.log(`Total errors: ${totalErrors}`);
    
    // Show detailed results
    if (results.length > 0) {
      console.log('\nDetailed Results:');
      results.forEach(result => {
      if (result.status === 'updated') {
        console.log(`  User: ${result.userId}, Child: ${result.childId}, Age: ${result.childAge}, Age Range ID: ${result.ageRangeId}`);
      } else if (result.status === 'error') {
        console.log(`  User: ${result.userId}, Child: ${result.childId}, Age: ${result.childAge}, Error: ${result.error}`);
      }
      });
    }
    
    return {
      success: true,
      totalProcessed,
      totalUpdated,
      totalSkipped,
      totalErrors,
      results
    };
    
  } catch (error) {
    console.error('Error adding age ranges to children:', error);
    throw error;
  }
}

// Function to verify age range additions
async function verifyAgeRangeAdditions() {
  try {
    console.log('Verifying age range additions...');
    
    const publicUsersSnapshot = await db.collection('users_public_data').get();
    const ageRangesSnapshot = await db.collection('age_ranges').get();
    
    // Create age ranges map
    const ageRangesMap = new Map();
    ageRangesSnapshot.forEach(doc => {
      ageRangesMap.set(doc.id, doc.data());
    });
    
    let totalChildren = 0;
    let childrenWithAgeRange = 0;
    let childrenWithoutAgeRange = 0;
    let childrenWithoutAge = 0;
    const ageRangeStats = {};
    
    for (const userDoc of publicUsersSnapshot.docs) {
      const childrenSnapshot = await userDoc.ref.collection('children').get();
      
      childrenSnapshot.forEach(childDoc => {
        const childData = childDoc.data();
        totalChildren++;
        
        if (childData.ageRangeId) {
          childrenWithAgeRange++;
          const ageRange = ageRangesMap.get(childData.ageRangeId);
          if (ageRange) {
            ageRangeStats[ageRange.label] = (ageRangeStats[ageRange.label] || 0) + 1;
          }
        } else {
          childrenWithoutAgeRange++;
          if (!childData.age) {
            childrenWithoutAge++;
          }
        }
      });
    }
    
    console.log('\nVERIFICATION RESULTS:');
    console.log('='.repeat(40));
    console.log(`Total children: ${totalChildren}`);
    console.log(`Children with age range: ${childrenWithAgeRange}`);
    console.log(`Children without age range: ${childrenWithoutAgeRange}`);
    console.log(`Children without age: ${childrenWithoutAge}`);
    
    console.log('\nAge Range Distribution:');
    Object.entries(ageRangeStats).forEach(([label, count]) => {
      console.log(`  ${label}: ${count} children`);
    });
    
    const successRate = totalChildren > 0 ? ((childrenWithAgeRange / totalChildren) * 100).toFixed(1) : 0;
    console.log(`\nSuccess rate: ${successRate}%`);
    
    return {
      totalChildren,
      childrenWithAgeRange,
      childrenWithoutAgeRange,
      childrenWithoutAge,
      ageRangeStats,
      successRate: parseFloat(successRate)
    };
    
  } catch (error) {
    console.error('Error during verification:', error);
    throw error;
  }
}

// Function to list children with their age ranges
async function listChildrenWithAgeRanges() {
  try {
    console.log('Listing children with their age ranges...');
    
    const publicUsersSnapshot = await db.collection('users_public_data').get();
    const allChildren = [];
    
    for (const userDoc of publicUsersSnapshot.docs) {
      const childrenSnapshot = await userDoc.ref.collection('children').get();
      
      childrenSnapshot.forEach(childDoc => {
        const childData = childDoc.data();
        allChildren.push({
          userId: userDoc.id,
          childId: childDoc.id,
          name: childData.name || 'Unknown',
          ageRangeId: childData.ageRangeId || null,
          hasAgeRange: !!childData.ageRangeId
        });
      });
    }
    
    // Sort by age range ID
    allChildren.sort((a, b) => {
      if (!a.ageRangeId && !b.ageRangeId) return 0;
      if (!a.ageRangeId) return 1;
      if (!b.ageRangeId) return -1;
      return a.ageRangeId.localeCompare(b.ageRangeId);
    });
    
    console.log(`\nFound ${allChildren.length} children:`);
    console.log('='.repeat(80));
    
    allChildren.forEach((child, index) => {
      console.log(`${index + 1}. ${child.name} (User: ${child.userId}, Child: ${child.childId})`);
      if (child.hasAgeRange) {
        console.log(`   Age Range ID: ${child.ageRangeId}`);
      } else {
        console.log(`   Age Range: Not assigned`);
      }
      console.log('');
    });
    
    return {
      total: allChildren.length,
      children: allChildren
    };
    
  } catch (error) {
    console.error('Error listing children with age ranges:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Choose which function to run:
    
    // Option 1: Add age ranges to children
    // await addAgeRangeToChildren();
    
    // Option 2: Verify age range additions
    await verifyAgeRangeAdditions();
    
    // Option 3: List children with age ranges
    // await listChildrenWithAgeRanges();
    
    console.log('\nAge range addition completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('Age range addition failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  addAgeRangeToChildren,
  verifyAgeRangeAdditions,
  listChildrenWithAgeRanges
};
