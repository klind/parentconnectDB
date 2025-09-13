const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function readCommunityPosts() {
  try {
    console.log('Reading community_posts collection...');
    
    const snapshot = await db.collection('community_posts').get();
    
    if (snapshot.empty) {
      console.log('No community posts found in the database.');
      return;
    }
    
    console.log(`Found ${snapshot.size} community posts:`);
    console.log('=' .repeat(50));
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\nPost ID: ${doc.id}`);
      console.log('Data:', JSON.stringify(data, null, 2));
      console.log('-'.repeat(30));
    });
    
  } catch (error) {
    console.error('Error reading community posts:', error);
  } finally {
    process.exit(0);
  }
}

readCommunityPosts(); 