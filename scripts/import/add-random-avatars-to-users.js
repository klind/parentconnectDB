const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// Load service account from project root
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://parentconnect2025.firebaseio.com', // Update with your actual project ID
  storageBucket: 'parentconnect2025.firebasestorage.app' // Update with your actual storage bucket
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Multiple avatar services for variety - more profile picture-like options
// Prioritized by reliability and SSL certificate status
const avatarServices = [
  {
    name: 'dicebear-avataaars',
    url: 'https://api.dicebear.com/7.x/avataaars/png?size=200&seed=',
    type: 'png',
    description: 'Cartoon human faces',
    reliable: true
  },
  {
    name: 'dicebear-bottts',
    url: 'https://api.dicebear.com/7.x/bottts/png?size=200&seed=',
    type: 'png',
    description: 'Robot faces',
    reliable: true
  },
  {
    name: 'dicebear-identicon',
    url: 'https://api.dicebear.com/7.x/identicon/png?size=200&seed=',
    type: 'png',
    description: 'Geometric patterns',
    reliable: true
  },
  {
    name: 'dicebear-pixel-art',
    url: 'https://api.dicebear.com/7.x/pixel-art/png?size=200&seed=',
    type: 'png',
    description: 'Pixel art faces',
    reliable: true
  },
  {
    name: 'robohash',
    url: 'https://robohash.org/',
    type: 'png',
    description: 'Robot-style faces',
    reliable: true
  },
  {
    name: 'ui-faces',
    url: 'https://i.pravatar.cc/300?img=',
    type: 'jpg',
    description: 'Realistic human faces',
    reliable: false
  },
  {
    name: 'boring-avatars',
    url: 'https://source.boringavatars.com/beam/120/',
    type: 'svg',
    description: 'Modern geometric avatars',
    reliable: false
  }
];

async function downloadAvatar(url, userId) {
  try {
    // Use node-fetch with better SSL handling or fallback to https module
    const https = require('https');
    const http = require('http');
    
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      
      const request = protocol.get(url, {
        timeout: 10000, // 10 second timeout
        rejectUnauthorized: false, // Allow self-signed or expired certificates
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AvatarDownloader/1.0)'
        }
      }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
        response.on('error', (error) => reject(error));
      });
      
      request.on('error', (error) => {
        reject(new Error(`Network error: ${error.message}`));
      });
      
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
    
  } catch (error) {
    console.error(`Error downloading avatar for user ${userId}:`, error);
    throw error;
  }
}

async function uploadAvatarToStorage(userId, avatarBuffer, avatarServiceName, fileType) {
  try {
    const fileName = `avatar-${avatarServiceName}-${Date.now()}.${fileType}`;
    const filePath = `profile-images/${userId}/${fileName}`;
    
    const file = bucket.file(filePath);
    
    // Set appropriate content type based on file type
    let contentType;
    switch (fileType) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
      default:
        contentType = 'image/png';
    }
    
    await file.save(avatarBuffer, {
      metadata: {
        contentType: contentType,
        cacheControl: 'public, max-age=31536000'
      }
    });
    
    // Make the file publicly readable
    await file.makePublic();
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    return publicUrl;
    
  } catch (error) {
    console.error(`Error uploading avatar to storage for user ${userId}:`, error);
    throw error;
  }
}

async function addRandomAvatarsToUsers() {
  try {
    console.log('Starting to add random avatars to users without profile images...');
    
    // Get all users from the users collection
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in the database.');
      return;
    }
    
    console.log(`Found ${usersSnapshot.size} users to process...`);
    
    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process users in batches
    const batchSize = 50; // Smaller batch size for storage operations
    const users = usersSnapshot.docs;
    
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = db.batch();
      const batchUsers = users.slice(i, i + batchSize);
      
      for (const userDoc of batchUsers) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        // Check if user needs a profile image
        const needsProfileImage = !userData.profileImageUrl || 
                                userData.profileImageUrl === '' || 
                                userData.profileImageUrl === null;
        
        if (needsProfileImage) {
          try {
            // Try reliable services first, then fall back to others if needed
            const reliableServices = avatarServices.filter(service => service.reliable);
            const fallbackServices = avatarServices.filter(service => !service.reliable);
            
            // Start with reliable services
            let avatarService = reliableServices[Math.floor(Math.random() * reliableServices.length)];
            let avatarUrl;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (attempts < maxAttempts) {
              try {
                const uniqueId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                if (avatarService.name === 'ui-faces') {
                  // UI Faces uses numbers 1-70 for variety
                  const faceNumber = Math.floor(Math.random() * 70) + 1;
                  avatarUrl = `${avatarService.url}${faceNumber}`;
                } else if (avatarService.name === 'boring-avatars') {
                  // Boring Avatars uses the unique ID directly
                  avatarUrl = `${avatarService.url}${uniqueId}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`;
                } else if (avatarService.name === 'robohash') {
                  // RoboHash uses the unique ID
                  avatarUrl = `${avatarService.url}${uniqueId}?size=200x200`;
                } else {
                  // DiceBear services use seed parameter
                  avatarUrl = `${avatarService.url}${uniqueId}`;
                }
                
                console.log(`Processing user ${userId}: downloading ${avatarService.description} (attempt ${attempts + 1})...`);
                
                // Download the avatar
                const avatarBuffer = await downloadAvatar(avatarUrl, userId);
                
                // Upload to Firebase Storage
                console.log(`Uploading avatar for user ${userId} to storage...`);
                const storageUrl = await uploadAvatarToStorage(userId, avatarBuffer, avatarService.name, avatarService.type);
                
                // Update the user document
                batch.update(userDoc.ref, {
                  profileImageUrl: storageUrl,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                
                updatedCount++;
                console.log(`✅ Successfully added avatar for user ${userId}`);
                break; // Success, exit the retry loop
                
              } catch (error) {
                attempts++;
                console.log(`⚠️  Attempt ${attempts} failed for user ${userId}: ${error.message}`);
                
                if (attempts >= maxAttempts) {
                  throw error; // Give up after max attempts
                }
                
                // Try a different service for the next attempt
                if (attempts === 1) {
                  // Second attempt: try another reliable service
                  avatarService = reliableServices[Math.floor(Math.random() * reliableServices.length)];
                } else {
                  // Third attempt: try fallback services
                  avatarService = fallbackServices[Math.floor(Math.random() * fallbackServices.length)];
                }
              }
            }
            
          } catch (error) {
            console.error(`❌ Error processing user ${userId} after ${maxAttempts} attempts:`, error);
            errorCount++;
          }
        }
        
        processedCount++;
      }
      
      // Commit the batch
      await batch.commit();
      
      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)} (${Math.min(i + batchSize, users.length)} users)`);
    }
    
    console.log(`✅ Successfully processed users collection!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total users processed: ${processedCount}`);
    console.log(`   - Users updated with avatars: ${updatedCount}`);
    console.log(`   - Users unchanged: ${processedCount - updatedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Error adding random avatars to users:', error);
    throw error;
  }
}

async function verifyAvatars() {
  try {
    console.log('\n🔍 Verifying avatar assignments...');
    
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in the database.');
      return;
    }
    
    let usersWithAvatars = 0;
    let usersWithoutAvatars = 0;
    let totalUsers = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      totalUsers++;
      
      if (userData.profileImageUrl && userData.profileImageUrl !== '') {
        usersWithAvatars++;
        if (userData.profileImageUrl.includes('storage.googleapis.com')) {
          console.log(`   ✅ User ${userDoc.id}: Has storage avatar`);
        } else {
          console.log(`   ℹ️  User ${userDoc.id}: Has external avatar`);
        }
      } else {
        usersWithoutAvatars++;
        console.log(`   ❌ User ${userDoc.id}: No profile image`);
      }
    }
    
    console.log(`\n📊 Avatar Summary:`);
    console.log(`   - Total users: ${totalUsers}`);
    console.log(`   - Users with avatars: ${usersWithAvatars}`);
    console.log(`   - Users without avatars: ${usersWithoutAvatars}`);
    
  } catch (error) {
    console.error('❌ Error verifying avatars:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Add random avatars to users
    await addRandomAvatarsToUsers();
    
    // Verify the avatar assignments
    await verifyAvatars();
    
    console.log('\n🎉 Random avatar assignment completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Random avatar assignment failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  addRandomAvatarsToUsers,
  verifyAvatars
};
