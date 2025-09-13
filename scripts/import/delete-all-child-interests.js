const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteAllChildInterests() {
  try {
    console.log('🔄 Starting to delete all interests from the child_interests collection...');
    
    const interestsSnapshot = await db.collection('child_interests').get();
    
    if (interestsSnapshot.empty) {
      console.log('✅ Child interests collection is already empty.');
      return;
    }
    
    console.log(`📋 Found ${interestsSnapshot.docs.length} interests to delete...`);
    
    const deletePromises = interestsSnapshot.docs.map(async (doc) => {
      try {
        await doc.ref.delete();
        console.log(`   ✅ Deleted: ${doc.data().name || doc.id}`);
        return { success: true, name: doc.data().name || doc.id };
      } catch (error) {
        console.error(`   ❌ Error deleting ${doc.id}:`, error.message);
        return { success: false, name: doc.data().name || doc.id, error: error.message };
      }
    });
    
    const results = await Promise.all(deletePromises);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\n📊 Summary:`);
    console.log(`   📋 Total interests: ${interestsSnapshot.docs.length}`);
    console.log(`   ✅ Successfully deleted: ${successful}`);
    console.log(`   ❌ Failed to delete: ${failed}`);
    
    if (failed > 0) {
      console.log('\n⚠️  Some interests failed to delete. Check the errors above.');
    } else {
      console.log('\n✅ All child interests deleted successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

deleteAllChildInterests();






