const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// User ID whose activities we want to delete
const TARGET_USER_ID = 'z1RjlZyE5rdCfA3D0cMqEq57wcn1';

async function deleteActivitiesByUser() {
  try {
    console.log(`Searching for activities created by user: ${TARGET_USER_ID}`);
    
    // Get all activities to check both 'author' and 'createdBy' fields
    const snapshot = await db.collection('activities').get();
    
    if (snapshot.empty) {
      console.log(`No activities found in the database`);
      return;
    }
    
    const activitiesToDelete = [];
    
    // Check each activity for the target user ID in either 'author' or 'createdBy' field
    snapshot.forEach(doc => {
      const activityData = doc.data();
      const authorId = activityData.author || activityData.createdBy;
      
      if (authorId === TARGET_USER_ID) {
        activitiesToDelete.push({
          id: doc.id,
          title: activityData.title || 'Untitled',
          authorField: activityData.author ? 'author' : 'createdBy'
        });
      }
    });
    
    if (activitiesToDelete.length === 0) {
      console.log(`No activities found for user ${TARGET_USER_ID}`);
      return;
    }
    
    console.log(`Found ${activitiesToDelete.length} activities to delete:`);
    activitiesToDelete.forEach(activity => {
      console.log(`  - ${activity.id}: "${activity.title}" (${activity.authorField} field)`);
    });
    
    // Delete each activity
    const deletePromises = activitiesToDelete.map(async (activity) => {
      console.log(`Deleting activity: ${activity.id} - "${activity.title}"`);
      return db.collection('activities').doc(activity.id).delete();
    });
    
    await Promise.all(deletePromises);
    
    console.log(`✅ Successfully deleted ${activitiesToDelete.length} activities created by user ${TARGET_USER_ID}`);
    
  } catch (error) {
    console.error('❌ Error deleting activities:', error);
  } finally {
    process.exit(0);
  }
}

deleteActivitiesByUser();

