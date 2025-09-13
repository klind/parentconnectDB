const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Load service account from project root
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://parentconnect2025.firebaseio.com',
  storageBucket: 'parentconnect2025.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function removeProfileImagesFromStorage() {
  try {
    console.log('Starting removal of profile images from Firebase Storage...');
    
    // List all files in the profile-images folder
    const [files] = await bucket.getFiles({
      prefix: 'profile-images/'
    });
    
    if (files.length === 0) {
      console.log('✅ No profile images found in storage.');
      return 0;
    }
    
    console.log(`Found ${files.length} profile image files to delete...`);
    
    let deletedCount = 0;
    let errorCount = 0;
    
    // Delete files in batches to avoid overwhelming the API
    const batchSize = 100;
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      try {
        await Promise.all(batch.map(file => file.delete()));
        deletedCount += batch.length;
        
        console.log(`Deleted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)} (${batch.length} files)`);
        
      } catch (error) {
        console.error(`Error deleting batch ${Math.floor(i / batchSize) + 1}:`, error);
        errorCount += batch.length;
      }
    }
    
    console.log(`✅ Storage cleanup completed!`);
    console.log(`   - Files deleted: ${deletedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    
    return deletedCount;
    
  } catch (error) {
    console.error('❌ Error removing profile images from storage:', error);
    throw error;
  }
}

async function removeProfileImageUrlsFromUsers() {
  try {
    console.log('\nStarting removal of profileImageUrl from users collection...');
    
    // Get all users from the users collection
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in the database.');
      return 0;
    }
    
    console.log(`Found ${usersSnapshot.size} users to process...`);
    
    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process users in batches
    const batchSize = 500;
    const users = usersSnapshot.docs;
    
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = db.batch();
      const batchUsers = users.slice(i, i + batchSize);
      
      for (const userDoc of batchUsers) {
        const userData = userDoc.data();
        
        // Check if the user has a profileImageUrl field
        if (userData.profileImageUrl && userData.profileImageUrl !== '') {
          // Remove the profileImageUrl field using FieldValue.delete()
          batch.update(userDoc.ref, {
            profileImageUrl: admin.firestore.FieldValue.delete(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          updatedCount++;
        }
        
        processedCount++;
      }
      
      // Commit the batch
      await batch.commit();
      
      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)} (${Math.min(i + batchSize, users.length)} users)`);
    }
    
    console.log(`✅ Database cleanup completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total users processed: ${processedCount}`);
    console.log(`   - Users updated (profileImageUrl removed): ${updatedCount}`);
    console.log(`   - Users unchanged: ${processedCount - updatedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    
    return updatedCount;
    
  } catch (error) {
    console.error('❌ Error removing profileImageUrl from users:', error);
    throw error;
  }
}

async function verifyCleanup() {
  try {
    console.log('\n🔍 Verifying cleanup...');
    
    // Check storage
    const [files] = await bucket.getFiles({
      prefix: 'profile-images/'
    });
    
    if (files.length === 0) {
      console.log('✅ Storage: No profile images remain in storage.');
    } else {
      console.log(`⚠️  Storage: ${files.length} profile images still exist in storage.`);
    }
    
    // Check database
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in the database.');
      return;
    }
    
    let usersWithProfileImages = 0;
    let totalUsers = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      totalUsers++;
      
      if (userData.profileImageUrl && userData.profileImageUrl !== '') {
        usersWithProfileImages++;
        console.log(`   ❌ User ${userDoc.id} still has profileImageUrl: ${userData.profileImageUrl}`);
      }
    }
    
    if (usersWithProfileImages === 0) {
      console.log(`✅ Database: All ${totalUsers} users have had profileImageUrl removed.`);
    } else {
      console.log(`⚠️  Database: ${usersWithProfileImages} out of ${totalUsers} users still have profileImageUrl.`);
    }
    
  } catch (error) {
    console.error('❌ Error verifying cleanup:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    console.log('🧹 Starting complete profile image cleanup...\n');
    
    // Remove profile images from storage
    const storageDeleted = await removeProfileImagesFromStorage();
    
    // Remove profileImageUrl from users
    const usersUpdated = await removeProfileImageUrlsFromUsers();
    
    // Verify the cleanup
    await verifyCleanup();
    
    console.log('\n🎉 Profile image cleanup completed successfully!');
    console.log(`📊 Final Summary:`);
    console.log(`   - Storage files deleted: ${storageDeleted}`);
    console.log(`   - Users updated: ${usersUpdated}`);
    console.log(`   - Ready for new avatar assignment`);
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Profile image cleanup failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  removeProfileImagesFromStorage,
  removeProfileImageUrlsFromUsers,
  verifyCleanup
};




