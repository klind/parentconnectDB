const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// User ID whose posts we want to delete
const TARGET_USER_ID = 'z1RjlZyE5rdCfA3D0cMqEq57wcn1';

async function deletePostsByUser() {
  try {
    console.log(`Searching for community posts created by user: ${TARGET_USER_ID}`);
    
    // Query for posts where author.id matches the target user ID
    const snapshot = await db.collection('community_posts')
      .where('author.id', '==', TARGET_USER_ID)
      .get();
    
    if (snapshot.empty) {
      console.log(`No community posts found for user ${TARGET_USER_ID}`);
      return;
    }
    
    console.log(`Found ${snapshot.size} posts to delete`);
    
    // Delete each post
    const deletePromises = snapshot.docs.map(async (doc) => {
      const postData = doc.data();
      console.log(`Deleting post: ${doc.id} - "${postData.title}"`);
      return doc.ref.delete();
    });
    
    await Promise.all(deletePromises);
    
    console.log(`✅ Successfully deleted ${snapshot.size} community posts created by user ${TARGET_USER_ID}`);
    
  } catch (error) {
    console.error('❌ Error deleting posts:', error);
  } finally {
    process.exit(0);
  }
}

deletePostsByUser();

