const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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

// Configuration
const IMAGES_FOLDER = path.join(__dirname, '..', '..', 'images');
const STORAGE_PREFIX = 'profile-images';

/**
 * Get all users from Firestore
 */
async function getAllUsers() {
  try {
    console.log('📋 Fetching all users from Firestore...');
    
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in the database');
      return [];
    }
    
    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    console.log(`✅ Found ${users.length} users`);
    return users;
    
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    throw error;
  }
}

/**
 * Get all image files from the images folder
 */
function getImageFiles() {
  try {
    console.log('📁 Reading images from folder...');
    
    if (!fs.existsSync(IMAGES_FOLDER)) {
      console.log('❌ Images folder does not exist:', IMAGES_FOLDER);
      return [];
    }
    
    const files = fs.readdirSync(IMAGES_FOLDER);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    
    console.log(`✅ Found ${imageFiles.length} image files`);
    return imageFiles;
    
  } catch (error) {
    console.error('❌ Error reading image files:', error);
    throw error;
  }
}

/**
 * Upload a single image to Firebase Storage
 */
async function uploadImageToStorage(userId, fileName, localFilePath) {
  try {
    const storagePath = `${STORAGE_PREFIX}/${userId}/${fileName}`;
    
    console.log(`📤 Uploading ${fileName} for user ${userId}...`);
    
    const [file] = await bucket.upload(localFilePath, {
      destination: storagePath,
      metadata: {
        metadata: {
          uploadedBy: 'admin-script',
          uploadedAt: new Date().toISOString(),
          userId: userId
        }
      }
    });
    
    // Make the file publicly accessible
    await file.makePublic();
    
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    
    console.log(`✅ Uploaded: ${publicUrl}`);
    return publicUrl;
    
  } catch (error) {
    console.error(`❌ Error uploading ${fileName} for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Update user document with profile image URL
 */
async function updateUserProfileImage(userId, imageUrl) {
  try {
    console.log(`🔄 Updating profile image for user ${userId}...`);
    
    await db.collection('users').doc(userId).update({
      profileImageUrl: imageUrl,
      profileImageUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Updated profile image URL for user ${userId}`);
    
  } catch (error) {
    console.error(`❌ Error updating user ${userId}:`, error);
    throw error;
  }
}

/**
 * Main function to upload profile images
 */
async function uploadProfileImages() {
  try {
    console.log('🚀 Starting profile image upload process...\n');
    
    // Get all users and image files
    const [users, imageFiles] = await Promise.all([
      getAllUsers(),
      getImageFiles()
    ]);
    
    if (users.length === 0) {
      console.log('❌ No users found. Exiting...');
      return;
    }
    
    if (imageFiles.length === 0) {
      console.log('❌ No image files found. Exiting...');
      return;
    }
    
    console.log(`\n📊 Processing ${users.length} users with ${imageFiles.length} images...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const userId = user.id;
      const userEmail = user.data.email || 'unknown';
      
      try {
        // Select an image for this user (cycle through available images)
        const imageIndex = i % imageFiles.length;
        const imageFile = imageFiles[imageIndex];
        const localFilePath = path.join(IMAGES_FOLDER, imageFile);
        
        console.log(`\n👤 Processing user ${i + 1}/${users.length}: ${userEmail}`);
        
        // Upload image to storage
        const imageUrl = await uploadImageToStorage(userId, imageFile, localFilePath);
        
        // Update user document
        await updateUserProfileImage(userId, imageUrl);
        
        successCount++;
        
        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to process user ${userId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Profile image upload process completed!');
    console.log('='.repeat(60));
    console.log(`✅ Successfully processed: ${successCount} users`);
    console.log(`❌ Failed: ${errorCount} users`);
    console.log(`📁 Images uploaded to: ${STORAGE_PREFIX}/`);
    console.log(`🔗 Storage bucket: ${bucket.name}`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    throw error;
  }
}

/**
 * Function to upload images for specific users only
 */
async function uploadProfileImagesForUsers(userEmails) {
  try {
    console.log('🚀 Starting profile image upload for specific users...\n');
    
    const imageFiles = getImageFiles();
    
    if (imageFiles.length === 0) {
      console.log('❌ No image files found. Exiting...');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < userEmails.length; i++) {
      const email = userEmails[i];
      
      try {
        // Find user by email
        const usersSnapshot = await db.collection('users')
          .where('email', '==', email)
          .get();
        
        if (usersSnapshot.empty) {
          console.log(`⚠️  User not found: ${email}`);
          errorCount++;
          continue;
        }
        
        const userDoc = usersSnapshot.docs[0];
        const userId = userDoc.id;
        
        // Select an image for this user
        const imageIndex = i % imageFiles.length;
        const imageFile = imageFiles[imageIndex];
        const localFilePath = path.join(IMAGES_FOLDER, imageFile);
        
        console.log(`\n👤 Processing user: ${email}`);
        
        // Upload image to storage
        const imageUrl = await uploadImageToStorage(userId, imageFile, localFilePath);
        
        // Update user document
        await updateUserProfileImage(userId, imageUrl);
        
        successCount++;
        
        // Add a small delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to process user ${email}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Profile image upload completed!');
    console.log('='.repeat(60));
    console.log(`✅ Successfully processed: ${successCount} users`);
    console.log(`❌ Failed: ${errorCount} users`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Check if specific emails are provided as command line arguments
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
      // Upload images for specific users
      console.log(`🎯 Uploading images for specific users: ${args.join(', ')}`);
      await uploadProfileImagesForUsers(args);
    } else {
      // Upload images for all users
      console.log('🎯 Uploading images for all users');
      await uploadProfileImages();
    }
    
    console.log('\n🎉 Process completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Process failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  uploadProfileImages,
  uploadProfileImagesForUsers,
  getAllUsers,
  getImageFiles,
  uploadImageToStorage,
  updateUserProfileImage
};


