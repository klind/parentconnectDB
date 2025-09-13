const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// User ID whose resources_for_review we want to delete
const TARGET_USER_ID = 'z1RjlZyE5rdCfA3D0cMqEq57wcn1';

async function deleteResourcesForReviewByUser() {
  try {
    console.log(`Searching for resources_for_review created by user: ${TARGET_USER_ID}`);
    
    // Query for resources where submittedBy matches the target user ID
    const snapshot = await db.collection('resource_for_review')
      .where('submittedBy', '==', TARGET_USER_ID)
      .get();
    
    if (snapshot.empty) {
      console.log(`No resources_for_review found for user ${TARGET_USER_ID}`);
      return;
    }
    
    console.log(`Found ${snapshot.size} resources_for_review to delete`);
    
    // Delete each resource
    const deletePromises = snapshot.docs.map(async (doc) => {
      const resourceData = doc.data();
      console.log(`Deleting resource: ${doc.id} - "${resourceData.name}" (${resourceData.category})`);
      return doc.ref.delete();
    });
    
    await Promise.all(deletePromises);
    
    console.log(`✅ Successfully deleted ${snapshot.size} resources_for_review created by user ${TARGET_USER_ID}`);
    
  } catch (error) {
    console.error('❌ Error deleting resources_for_review:', error);
  } finally {
    process.exit(0);
  }
}

deleteResourcesForReviewByUser();

