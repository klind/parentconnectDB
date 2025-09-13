const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com' // Update with your project ID
});

const db = admin.firestore();

// Helper function to clean Firestore data for copying
function cleanFirestoreDataForCopy(data) {
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

// Function to copy children between users
async function copyChildrenBetweenUsers(sourceUserId, targetUserId) {
  try {
    console.log(`Starting: Copying children from user ${sourceUserId} to user ${targetUserId}...`);
    
    // Check if both users exist
    const sourcePublicDoc = await db.collection('users_public_data').doc(sourceUserId).get();
    const sourcePrivateDoc = await db.collection('users_private_data').doc(sourceUserId).get();
    const targetPublicDoc = await db.collection('users_public_data').doc(targetUserId).get();
    const targetPrivateDoc = await db.collection('users_private_data').doc(targetUserId).get();
    
    if (!sourcePublicDoc.exists || !sourcePrivateDoc.exists) {
      throw new Error(`Source user ${sourceUserId} does not exist in one or both collections`);
    }
    
    if (!targetPublicDoc.exists || !targetPrivateDoc.exists) {
      throw new Error(`Target user ${targetUserId} does not exist in one or both collections`);
    }
    
    console.log('✅ Both users exist in both collections');
    
    // Get children from source user (both collections)
    const sourcePublicChildrenSnapshot = await sourcePublicDoc.ref.collection('children').get();
    const sourcePrivateChildrenSnapshot = await sourcePrivateDoc.ref.collection('children').get();
    
    console.log(`Found ${sourcePublicChildrenSnapshot.size} public children and ${sourcePrivateChildrenSnapshot.size} private children`);
    
    if (sourcePublicChildrenSnapshot.empty && sourcePrivateChildrenSnapshot.empty) {
      console.log('No children found to copy');
      return { success: true, copied: 0 };
    }
    
    // Create maps for matching children by original ID
    const publicChildrenMap = new Map();
    const privateChildrenMap = new Map();
    
    sourcePublicChildrenSnapshot.forEach(doc => {
      publicChildrenMap.set(doc.id, doc.data());
    });
    
    sourcePrivateChildrenSnapshot.forEach(doc => {
      privateChildrenMap.set(doc.id, doc.data());
    });
    
    // Get all unique child IDs
    const allChildIds = new Set([...publicChildrenMap.keys(), ...privateChildrenMap.keys()]);
    console.log(`Found ${allChildIds.size} unique children to copy`);
    
    let totalCopied = 0;
    let totalErrors = 0;
    const results = [];
    
    // Copy each child
    for (const originalChildId of allChildIds) {
      console.log(`\nCopying child ${originalChildId}...`);
      
      try {
        // Copy public child data
        const publicChildData = publicChildrenMap.get(originalChildId);
        if (publicChildData) {
          const cleanPublicData = cleanFirestoreDataForCopy(publicChildData);
          // Remove any fields that shouldn't be copied
          delete cleanPublicData.createdAt;
          delete cleanPublicData.updatedAt;
          
          const newPublicChildRef = targetPublicDoc.ref.collection('children').doc();
          await newPublicChildRef.set({
            ...cleanPublicData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`  ✅ Copied public data to new child ID: ${newPublicChildRef.id}`);
        }
        
        // Copy private child data
        const privateChildData = privateChildrenMap.get(originalChildId);
        if (privateChildData) {
          const cleanPrivateData = cleanFirestoreDataForCopy(privateChildData);
          // Remove any fields that shouldn't be copied
          delete cleanPrivateData.createdAt;
          delete cleanPrivateData.updatedAt;
          
          const newPrivateChildRef = targetPrivateDoc.ref.collection('children').doc();
          await newPrivateChildRef.set({
            ...cleanPrivateData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`  ✅ Copied private data to new child ID: ${newPrivateChildRef.id}`);
        }
        
        totalCopied++;
        results.push({
          originalChildId: originalChildId,
          status: 'copied',
          hasPublicData: !!publicChildData,
          hasPrivateData: !!privateChildData
        });
        
      } catch (error) {
        console.error(`  ❌ Error copying child ${originalChildId}: ${error.message}`);
        totalErrors++;
        results.push({
          originalChildId: originalChildId,
          status: 'error',
          error: error.message
        });
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('COPY SUMMARY');
    console.log('='.repeat(60));
    console.log(`Source user: ${sourceUserId}`);
    console.log(`Target user: ${targetUserId}`);
    console.log(`Total children copied: ${totalCopied}`);
    console.log(`Total errors: ${totalErrors}`);
    
    // Show detailed results
    if (results.length > 0) {
      console.log('\nDetailed Results:');
      results.forEach(result => {
        if (result.status === 'copied') {
          console.log(`  Child ${result.originalChildId}: Copied (Public: ${result.hasPublicData}, Private: ${result.hasPrivateData})`);
        } else if (result.status === 'error') {
          console.log(`  Child ${result.originalChildId}: Error - ${result.error}`);
        }
      });
    }
    
    return {
      success: true,
      sourceUserId,
      targetUserId,
      totalCopied,
      totalErrors,
      results
    };
    
  } catch (error) {
    console.error('Error copying children:', error);
    throw error;
  }
}

// Function to verify the copy
async function verifyCopy(sourceUserId, targetUserId) {
  try {
    console.log(`Verifying copy from ${sourceUserId} to ${targetUserId}...`);
    
    // Get children from both users
    const sourcePublicChildrenSnapshot = await db.collection('users_public_data').doc(sourceUserId).collection('children').get();
    const sourcePrivateChildrenSnapshot = await db.collection('users_private_data').doc(sourceUserId).collection('children').get();
    const targetPublicChildrenSnapshot = await db.collection('users_public_data').doc(targetUserId).collection('children').get();
    const targetPrivateChildrenSnapshot = await db.collection('users_private_data').doc(targetUserId).collection('children').get();
    
    console.log(`\nSource user ${sourceUserId}:`);
    console.log(`  Public children: ${sourcePublicChildrenSnapshot.size}`);
    console.log(`  Private children: ${sourcePrivateChildrenSnapshot.size}`);
    
    console.log(`\nTarget user ${targetUserId}:`);
    console.log(`  Public children: ${targetPublicChildrenSnapshot.size}`);
    console.log(`  Private children: ${targetPrivateChildrenSnapshot.size}`);
    
    // Show target children details
    console.log(`\nTarget user children details:`);
    console.log('='.repeat(50));
    
    const targetPublicChildren = [];
    const targetPrivateChildren = [];
    
    targetPublicChildrenSnapshot.forEach(doc => {
      const data = doc.data();
      targetPublicChildren.push({
        id: doc.id,
        name: data.name || 'Unknown',
        ageRangeId: data.ageRangeId || 'Not set'
      });
    });
    
    targetPrivateChildrenSnapshot.forEach(doc => {
      const data = doc.data();
      targetPrivateChildren.push({
        id: doc.id,
        name: data.name || 'Unknown',
        age: data.age || 'Not set'
      });
    });
    
    console.log('\nPublic Children:');
    targetPublicChildren.forEach((child, index) => {
      console.log(`  ${index + 1}. ${child.name} (ID: ${child.id}, Age Range: ${child.ageRangeId})`);
    });
    
    console.log('\nPrivate Children:');
    targetPrivateChildren.forEach((child, index) => {
      console.log(`  ${index + 1}. ${child.name} (ID: ${child.id}, Age: ${child.age})`);
    });
    
    return {
      sourcePublicCount: sourcePublicChildrenSnapshot.size,
      sourcePrivateCount: sourcePrivateChildrenSnapshot.size,
      targetPublicCount: targetPublicChildrenSnapshot.size,
      targetPrivateCount: targetPrivateChildrenSnapshot.size,
      targetPublicChildren,
      targetPrivateChildren
    };
    
  } catch (error) {
    console.error('Error during verification:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    const sourceUserId = 'z1RjlZyE5rdCfA3D0cMqEq57wcn1';
    const targetUserId = 'user004';
    
    // Choose which function to run:
    
    // Option 1: Copy children
    // await copyChildrenBetweenUsers(sourceUserId, targetUserId);
    
    // Option 2: Verify the copy
    await verifyCopy(sourceUserId, targetUserId);
    
    console.log('\nChildren copy completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('Children copy failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  copyChildrenBetweenUsers,
  verifyCopy
};
