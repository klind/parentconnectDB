const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Make sure you have your service account key file or use environment variables
const serviceAccount = require('./serviceAccountKey.json'); // Update path to your service account key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com' // Update with your project ID
});

const db = admin.firestore();

async function deleteUsersStartingWithUser0() {
  try {
    console.log('Starting deletion of users with IDs starting with "user0"...');
    
    // Get all users from the users collection
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No users found in the database.');
      return;
    }
    
    let deletedCount = 0;
    const batch = db.batch();
    
    usersSnapshot.forEach(doc => {
      const userId = doc.id;
      
      // Check if the user ID starts with "user0"
      if (userId.startsWith('user0')) {
        console.log(`Marking user ${userId} for deletion...`);
        batch.delete(doc.ref);
        deletedCount++;
      }
    });
    
    if (deletedCount === 0) {
      console.log('No users found with IDs starting with "user0".');
      return;
    }
    
    // Execute the batch deletion
    await batch.commit();
    
    console.log(`Successfully deleted ${deletedCount} users with IDs starting with "user0".`);
    
  } catch (error) {
    console.error('Error deleting users:', error);
    throw error;
  }
}

// Alternative function using individual deletions (if batch size is too large)
async function deleteUsersStartingWithUser0Individual() {
  try {
    console.log('Starting individual deletion of users with IDs starting with "user0"...');
    
    // Get all users from the users collection
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No users found in the database.');
      return;
    }
    
    let deletedCount = 0;
    
    for (const doc of usersSnapshot.docs) {
      const userId = doc.id;
      
      // Check if the user ID starts with "user0"
      if (userId.startsWith('user0')) {
        console.log(`Deleting user ${userId}...`);
        await doc.ref.delete();
        deletedCount++;
      }
    }
    
    if (deletedCount === 0) {
      console.log('No users found with IDs starting with "user0".');
      return;
    }
    
    console.log(`Successfully deleted ${deletedCount} users with IDs starting with "user0".`);
    
  } catch (error) {
    console.error('Error deleting users:', error);
    throw error;
  }
}

// Function to also delete related data (activities, resources, etc. created by these users)
async function deleteUsersAndRelatedData() {
  try {
    console.log('Starting deletion of users and their related data...');
    
    // Get all users from the users collection
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No users found in the database.');
      return;
    }
    
    const usersToDelete = [];
    
    // Identify users to delete
    usersSnapshot.forEach(doc => {
      const userId = doc.id;
      if (userId.startsWith('user0')) {
        usersToDelete.push(userId);
      }
    });
    
    if (usersToDelete.length === 0) {
      console.log('No users found with IDs starting with "user0".');
      return;
    }
    
    console.log(`Found ${usersToDelete.length} users to delete:`, usersToDelete);
    
    // Delete activities created by these users
    const activitiesSnapshot = await db.collection('activities').get();
    let activitiesDeleted = 0;
    
    for (const doc of activitiesSnapshot.docs) {
      const activityData = doc.data();
      if (usersToDelete.includes(activityData.createdBy)) {
        console.log(`Deleting activity ${doc.id} created by ${activityData.createdBy}...`);
        await doc.ref.delete();
        activitiesDeleted++;
      }
    }
    
    // Delete resources submitted by these users
    const resourcesSnapshot = await db.collection('resources').get();
    let resourcesDeleted = 0;
    
    for (const doc of resourcesSnapshot.docs) {
      const resourceData = doc.data();
      if (usersToDelete.includes(resourceData.submittedBy)) {
        console.log(`Deleting resource ${doc.id} submitted by ${resourceData.submittedBy}...`);
        await doc.ref.delete();
        resourcesDeleted++;
      }
    }
    
    // Delete help requests by these users
    const helpRequestsSnapshot = await db.collection('help_requests').get();
    let helpRequestsDeleted = 0;
    
    for (const doc of helpRequestsSnapshot.docs) {
      const requestData = doc.data();
      if (usersToDelete.includes(requestData.userId)) {
        console.log(`Deleting help request ${doc.id} by ${requestData.userId}...`);
        await doc.ref.delete();
        helpRequestsDeleted++;
      }
    }
    
    // Delete alerts created by these users
    const alertsSnapshot = await db.collection('alerts').get();
    let alertsDeleted = 0;
    
    for (const doc of alertsSnapshot.docs) {
      const alertData = doc.data();
      if (usersToDelete.includes(alertData.createdBy)) {
        console.log(`Deleting alert ${doc.id} created by ${alertData.createdBy}...`);
        await doc.ref.delete();
        alertsDeleted++;
      }
    }
    
    // Delete matches involving these users
    const matchesSnapshot = await db.collection('matches').get();
    let matchesDeleted = 0;
    
    for (const doc of matchesSnapshot.docs) {
      const matchData = doc.data();
      if (usersToDelete.includes(matchData.userId1) || usersToDelete.includes(matchData.userId2)) {
        console.log(`Deleting match ${doc.id} involving ${matchData.userId1} and ${matchData.userId2}...`);
        await doc.ref.delete();
        matchesDeleted++;
      }
    }
    
    // Delete conversations involving these users
    const conversationsSnapshot = await db.collection('conversations').get();
    let conversationsDeleted = 0;
    
    for (const doc of conversationsSnapshot.docs) {
      const conversationData = doc.data();
      const hasUserToDelete = conversationData.participantIds.some(id => usersToDelete.includes(id));
      if (hasUserToDelete) {
        console.log(`Deleting conversation ${doc.id} involving users: ${conversationData.participantIds.join(', ')}...`);
        await doc.ref.delete();
        conversationsDeleted++;
      }
    }
    
    // Delete reports by these users
    const reportsSnapshot = await db.collection('reports').get();
    let reportsDeleted = 0;
    
    for (const doc of reportsSnapshot.docs) {
      const reportData = doc.data();
      if (usersToDelete.includes(reportData.reportedBy)) {
        console.log(`Deleting report ${doc.id} by ${reportData.reportedBy}...`);
        await doc.ref.delete();
        reportsDeleted++;
      }
    }
    
    // Delete feedback by these users
    const feedbackSnapshot = await db.collection('feedback').get();
    let feedbackDeleted = 0;
    
    for (const doc of feedbackSnapshot.docs) {
      const feedbackData = doc.data();
      if (usersToDelete.includes(feedbackData.submittedBy)) {
        console.log(`Deleting feedback ${doc.id} by ${feedbackData.submittedBy}...`);
        await doc.ref.delete();
        feedbackDeleted++;
      }
    }
    
    // Finally, delete the users themselves
    let usersDeleted = 0;
    for (const userId of usersToDelete) {
      console.log(`Deleting user ${userId}...`);
      await db.collection('users').doc(userId).delete();
      usersDeleted++;
    }
    
    console.log('\n=== Deletion Summary ===');
    console.log(`Users deleted: ${usersDeleted}`);
    console.log(`Activities deleted: ${activitiesDeleted}`);
    console.log(`Resources deleted: ${resourcesDeleted}`);
    console.log(`Help requests deleted: ${helpRequestsDeleted}`);
    console.log(`Alerts deleted: ${alertsDeleted}`);
    console.log(`Matches deleted: ${matchesDeleted}`);
    console.log(`Conversations deleted: ${conversationsDeleted}`);
    console.log(`Reports deleted: ${reportsDeleted}`);
    console.log(`Feedback deleted: ${feedbackDeleted}`);
    console.log('========================');
    
  } catch (error) {
    console.error('Error deleting users and related data:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Choose which function to run:
    
    // Option 1: Delete only users (faster, but leaves orphaned data)
    // await deleteUsersStartingWithUser0();
    
    // Option 2: Delete users individually (if batch size is too large)
    // await deleteUsersStartingWithUser0Individual();
    
    // Option 3: Delete users and all their related data (recommended)
    await deleteUsersAndRelatedData();
    
    console.log('Deletion process completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Deletion process failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  deleteUsersStartingWithUser0,
  deleteUsersStartingWithUser0Individual,
  deleteUsersAndRelatedData
}; 