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

async function diagnoseMissingAvatars() {
  try {
    console.log('🔍 Diagnosing missing avatars...\n');
    
    // Get all users from the users collection
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in the database.');
      return;
    }
    
    console.log(`Found ${usersSnapshot.size} total users\n`);
    
    let usersWithAvatars = 0;
    let usersWithoutAvatars = 0;
    let usersWithStorageAvatars = 0;
    let usersWithExternalAvatars = 0;
    let usersWithEmptyUrls = 0;
    
    const missingUsers = [];
    const externalAvatarUsers = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      if (userData.profileImageUrl && userData.profileImageUrl !== '') {
        usersWithAvatars++;
        
        if (userData.profileImageUrl.includes('storage.googleapis.com')) {
          usersWithStorageAvatars++;
        } else {
          usersWithExternalAvatars++;
          externalAvatarUsers.push({
            id: userId,
            url: userData.profileImageUrl
          });
        }
      } else {
        usersWithoutAvatars++;
        missingUsers.push(userId);
      }
    }
    
    // Check storage for actual files
    const [storageFiles] = await bucket.getFiles({
      prefix: 'profile-images/'
    });
    
    console.log('📊 Avatar Status Summary:');
    console.log(`   - Total users: ${usersSnapshot.size}`);
    console.log(`   - Users with avatars: ${usersWithAvatars}`);
    console.log(`   - Users without avatars: ${usersWithoutAvatars}`);
    console.log(`   - Storage avatars: ${usersWithStorageAvatars}`);
    console.log(`   - External avatars: ${usersWithExternalAvatars}`);
    console.log(`   - Storage files found: ${storageFiles.length}`);
    
    if (missingUsers.length > 0) {
      console.log(`\n❌ Users missing avatars (${missingUsers.length}):`);
      missingUsers.forEach(userId => {
        console.log(`   - ${userId}`);
      });
    }
    
    if (externalAvatarUsers.length > 0) {
      console.log(`\nℹ️  Users with external avatars (${externalAvatarUsers.length}):`);
      externalAvatarUsers.forEach(user => {
        console.log(`   - ${user.id}: ${user.url}`);
      });
    }
    
    // Check if storage files match user count
    if (storageFiles.length !== usersWithStorageAvatars) {
      console.log(`\n⚠️  Storage mismatch detected:`);
      console.log(`   - Users with storage URLs: ${usersWithStorageAvatars}`);
      console.log(`   - Actual storage files: ${storageFiles.length}`);
      console.log(`   - Difference: ${Math.abs(storageFiles.length - usersWithStorageAvatars)}`);
      
      // Show storage file details
      console.log(`\n📁 Storage files:`);
      storageFiles.forEach(file => {
        console.log(`   - ${file.name}`);
      });
    }
    
    // Check for orphaned storage files
    const orphanedFiles = [];
    for (const file of storageFiles) {
      const userId = file.name.split('/')[1]; // profile-images/{userId}/filename
      const userExists = usersSnapshot.docs.some(doc => doc.id === userId);
      if (!userExists) {
        orphanedFiles.push(file.name);
      }
    }
    
    if (orphanedFiles.length > 0) {
      console.log(`\n🗑️  Orphaned storage files (${orphanedFiles.length}):`);
      orphanedFiles.forEach(fileName => {
        console.log(`   - ${fileName}`);
      });
    }
    
    return {
      totalUsers: usersSnapshot.size,
      usersWithAvatars,
      usersWithoutAvatars,
      usersWithStorageAvatars,
      usersWithExternalAvatars,
      storageFilesCount: storageFiles.length,
      missingUsers,
      orphanedFiles
    };
    
  } catch (error) {
    console.error('❌ Error diagnosing missing avatars:', error);
    throw error;
  }
}

async function checkSpecificUser(userId) {
  try {
    console.log(`\n🔍 Checking specific user: ${userId}`);
    
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log(`❌ User ${userId} not found in database`);
      return;
    }
    
    const userData = userDoc.data();
    console.log(`User data:`);
    console.log(`   - profileImageUrl: ${userData.profileImageUrl || 'NOT SET'}`);
    console.log(`   - updatedAt: ${userData.updatedAt || 'NOT SET'}`);
    
    // Check if storage file exists
    const [files] = await bucket.getFiles({
      prefix: `profile-images/${userId}/`
    });
    
    if (files.length > 0) {
      console.log(`Storage files found:`);
      files.forEach(file => {
        console.log(`   - ${file.name}`);
      });
    } else {
      console.log(`❌ No storage files found for user ${userId}`);
    }
    
  } catch (error) {
    console.error(`Error checking user ${userId}:`, error);
  }
}

// Main execution
async function main() {
  try {
    const diagnosis = await diagnoseMissingAvatars();
    
    if (diagnosis.missingUsers.length > 0) {
      console.log(`\n💡 To fix missing avatars, run:`);
      console.log(`   node scripts/import/add-random-avatars-to-users.js`);
      
      // Check first few missing users in detail
      const usersToCheck = diagnosis.missingUsers.slice(0, 3);
      console.log(`\n🔍 Detailed check of first ${usersToCheck.length} missing users:`);
      
      for (const userId of usersToCheck) {
        await checkSpecificUser(userId);
      }
    }
    
    console.log('\n✅ Diagnosis completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Diagnosis failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  diagnoseMissingAvatars,
  checkSpecificUser
};




