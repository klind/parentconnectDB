const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updatePostsAuthorLocation() {
  try {
    console.log('🔍 Fetching all community posts to update with author location...');
    
    // Get all community posts
    const postsSnapshot = await db.collection('community_posts').get();
    
    if (postsSnapshot.empty) {
      console.log('❌ No community posts found in the database.');
      return;
    }
    
    console.log(`📝 Found ${postsSnapshot.size} community posts to update`);
    console.log('');
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each post
    for (const postDoc of postsSnapshot.docs) {
      const postData = postDoc.data();
      const postId = postDoc.id;
      
      try {
        // Get author ID
        const authorId = postData.author?.id;
        if (!authorId) {
          console.log(`⚠️  Post ${postId} has no author ID - skipping`);
          skippedCount++;
          continue;
        }
        
        // Get author's location data
        const userDoc = await db.collection('users').doc(authorId).get();
        if (!userDoc.exists) {
          console.log(`⚠️  User ${authorId} not found for post ${postId} - skipping`);
          skippedCount++;
          continue;
        }
        
        const userData = userDoc.data();
        const authorLocation = userData.location?.zipCodeGeo;
        
        if (!authorLocation) {
          console.log(`⚠️  User ${authorId} has no location.zipCodeGeo for post ${postId} - skipping`);
          skippedCount++;
          continue;
        }
        
        // Check if post already has the correct authorZipCodeGeo
        const currentPostLocation = postData.location?.authorZipCodeGeo;
        if (currentPostLocation && 
            currentPostLocation._latitude === authorLocation._latitude && 
            currentPostLocation._longitude === authorLocation._longitude) {
          console.log(`⏭️  Post ${postId} already has correct author location - skipping`);
          skippedCount++;
          continue;
        }
        
        // Update the post with author's location
        const updateData = {
          location: {
            authorZipCodeGeo: authorLocation
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('community_posts').doc(postId).update(updateData);
        
        console.log(`✅ Updated post ${postId} with author location: ${authorLocation._latitude}, ${authorLocation._longitude}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Error updating post ${postId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('');
    console.log('📊 Update Summary:');
    console.log(`   ✅ Successfully updated: ${updatedCount} posts`);
    console.log(`   ⏭️  Skipped (already correct or missing data): ${skippedCount} posts`);
    console.log(`   ❌ Errors: ${errorCount} posts`);
    console.log(`   📝 Total processed: ${postsSnapshot.size} posts`);
    
    if (updatedCount > 0) {
      console.log('');
      console.log('🎉 Successfully updated community posts with author location data!');
      console.log('📍 All posts now have location.authorZipCodeGeo matching their author\'s location');
    }
    
  } catch (error) {
    console.error('❌ Error updating posts with author location:', error);
  } finally {
    process.exit(0);
  }
}

updatePostsAuthorLocation(); 