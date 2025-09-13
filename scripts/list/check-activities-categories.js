const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://parentconnect2025.firebaseio.com',
  storageBucket: 'parentconnect2025.firebasestorage.app'
});

const db = admin.firestore();

async function checkActivitiesCategories() {
  try {
    const activitiesSnapshot = await db.collection('activities').get();
    
    if (activitiesSnapshot.empty) {
      console.log('No activities found');
      return;
    }

    let withCategory = 0;
    let withoutCategory = 0;
    const activitiesWithoutCategory = [];

    activitiesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.category && data.category.trim() !== '') {
        withCategory++;
      } else {
        withoutCategory++;
        activitiesWithoutCategory.push({
          id: doc.id,
          name: data.name || 'Unnamed Activity'
        });
      }
    });

    console.log(`📊 Activities Category Check:`);
    console.log(`Total activities: ${activitiesSnapshot.size}`);
    console.log(`With category: ${withCategory}`);
    console.log(`Without category: ${withoutCategory}`);

    if (withoutCategory > 0) {
      console.log(`\n❌ Activities without category:`);
      activitiesWithoutCategory.forEach((activity, i) => {
        console.log(`${i + 1}. ${activity.name} (ID: ${activity.id})`);
      });
    } else {
      console.log(`\n✅ All activities have a category set!`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the script
if (require.main === module) {
  checkActivitiesCategories();
}

module.exports = { checkActivitiesCategories };


