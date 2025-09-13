const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testDeleteRecommendations() {
  try {
    console.log('🧪 Testing delete recommendations script...');
    console.log('');
    
    // Test 1: Check if posts with recommendations tag exist
    console.log('1️⃣ Testing posts with "recommendations" tag...');
    try {
      const postsSnapshot = await db.collection('posts')
        .where('tags', 'array-contains', 'recommendations')
        .limit(5)
        .get();
      
      console.log(`   📋 Found ${postsSnapshot.docs.length} posts with "recommendations" tag`);
      if (postsSnapshot.docs.length > 0) {
        console.log('   Sample posts:');
        postsSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`      ${index + 1}. ${data.title || 'No title'} (ID: ${doc.id})`);
        });
      }
    } catch (error) {
      console.error('   ❌ Error querying posts:', error.message);
    }
    
    console.log('');
    
    // Test 2: Check if recommendations collection exists
    console.log('2️⃣ Testing recommendations collection...');
    try {
      const recommendationsSnapshot = await db.collection('recommendations').limit(5).get();
      console.log(`   📋 Found ${recommendationsSnapshot.docs.length} items in recommendations collection`);
      if (recommendationsSnapshot.docs.length > 0) {
        console.log('   Sample recommendations:');
        recommendationsSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`      ${index + 1}. ${data.name || data.title || 'No name'} (ID: ${doc.id})`);
        });
      }
    } catch (error) {
      console.error('   ❌ Error querying recommendations collection:', error.message);
    }
    
    console.log('');
    
    // Test 3: Check user preferences
    console.log('3️⃣ Testing user recommendation preferences...');
    try {
      const usersSnapshot = await db.collection('users').limit(10).get();
      let usersWithRecommendations = 0;
      
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        if (userData.preferences && userData.preferences.activityRecommendations !== undefined) {
          usersWithRecommendations++;
          console.log(`   👤 User ${userData.displayName || doc.id} has activityRecommendations: ${userData.preferences.activityRecommendations}`);
        }
      });
      
      console.log(`   📊 Found ${usersWithRecommendations} users with recommendation preferences`);
    } catch (error) {
      console.error('   ❌ Error checking user preferences:', error.message);
    }
    
    console.log('');
    console.log('✅ Test completed! The script is ready to run.');
    console.log('💡 Run: node scripts/import/delete-all-recommendations.js');
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  } finally {
    process.exit(0);
  }
}

testDeleteRecommendations();



