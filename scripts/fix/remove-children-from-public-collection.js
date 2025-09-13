const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function removeChildrenFromPublicCollection() {
  try {
    console.log('🗑️ Removing children subcollections from users_public_data...');
    console.log('');
    
    // Get all documents from users_public_data
    const publicSnapshot = await db.collection('users_public_data').get();
    
    if (publicSnapshot.empty) {
      console.log('❌ No documents found in users_public_data collection.');
      return;
    }
    
    console.log(`📊 Found ${publicSnapshot.size} documents in users_public_data`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let totalChildrenRemoved = 0;
    
    // Process each document
    for (const publicDoc of publicSnapshot.docs) {
      const docId = publicDoc.id;
      
      try {
        // Check if user has children subcollection
        const childrenSnapshot = await publicDoc.ref.collection('children').get();
        
        if (childrenSnapshot.empty) {
          console.log(`ℹ️  User ${docId} has no children subcollection - skipping`);
          skippedCount++;
          continue;
        }
        
        console.log(`👤 User ${docId}: Found ${childrenSnapshot.size} children to remove`);
        
        // Delete each child document
        for (const childDoc of childrenSnapshot.docs) {
          const childData = childDoc.data();
          await childDoc.ref.delete();
          console.log(`   👶 Removed child ${childDoc.id}: ${childData.name} (age ${childData.age})`);
          totalChildrenRemoved++;
        }
        
        console.log(`✅ User ${docId}: Successfully removed ${childrenSnapshot.size} children from public collection`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Error processing user ${docId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('');
    console.log('📊 Summary:');
    console.log(`   📝 Total users processed: ${publicSnapshot.size}`);
    console.log(`   ✅ Users with children removed: ${updatedCount}`);
    console.log(`   👶 Total children removed: ${totalChildrenRemoved}`);
    console.log(`   ⚠️  Skipped: ${skippedCount} users`);
    console.log(`   ❌ Errors: ${errorCount} users`);
    
    if (updatedCount === 0) {
      console.log('\nℹ️  No users had children subcollections to remove');
    } else {
      console.log(`\n✅ Successfully removed children subcollections from public collection for ${updatedCount} users`);
    }
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

removeChildrenFromPublicCollection();
