const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function removeAllChildrenInterests() {
  try {
    console.log('🔄 Starting to remove all interests from children...');
    
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in the database.');
      return;
    }
    
    let totalChildren = 0;
    let updatedChildren = 0;
    let errorCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      try {
        const childrenSnapshot = await userDoc.ref.collection('children').get();
        
        if (!childrenSnapshot.empty) {
          console.log(`👨‍👩‍👧‍👦 User ${userId} (${userData.displayName || 'Unknown'}): ${childrenSnapshot.size} children`);
          
          for (const childDoc of childrenSnapshot.docs) {
            totalChildren++;
            const childData = childDoc.data();
            
            try {
              await childDoc.ref.update({ interests: [] });
              console.log(`   ✅ Child ${childData.name || childDoc.id}: Interests cleared`);
              updatedChildren++;
            } catch (error) {
              console.error(`   ❌ Error updating child ${childDoc.id}:`, error.message);
              errorCount++;
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error processing user ${userId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   👶 Total children: ${totalChildren}`);
    console.log(`   ✅ Updated: ${updatedChildren} children`);
    console.log(`   ❌ Errors: ${errorCount} children`);
    
    console.log('\n✅ All children interests removed successfully!');
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

removeAllChildrenInterests();






