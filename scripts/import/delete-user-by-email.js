const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Load service account from project root
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com' // Update with your project ID
});

const db = admin.firestore();

// Get email from command line arguments
const TARGET_EMAIL = process.argv[2];

// Validate that email argument is provided
if (!TARGET_EMAIL) {
  console.error('❌ Error: Please provide an email address as an argument');
  console.log('Usage: node delete-user-by-email.js <email>');
  console.log('Example: node delete-user-by-email.js user@example.com');
  process.exit(1);
}

// Basic email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(TARGET_EMAIL)) {
  console.error('❌ Error: Please provide a valid email address');
  console.log('Example: node delete-user-by-email.js user@example.com');
  process.exit(1);
}

async function findUserByEmail(email) {
  try {
    console.log(`Searching for user with email: ${email}...`);
    
    // Search for user in Firestore by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    if (usersSnapshot.empty) {
      console.log(`No user found with email: ${email}`);
      return null;
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log(`Found user: ${userData.displayName} (ID: ${userDoc.id})`);
    
    return {
      id: userDoc.id,
      data: userData
    };
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
}

async function deleteUserFromAuthentication(uid) {
  try {
    console.log(`Deleting user ${uid} from Firebase Authentication...`);
    
    await admin.auth().deleteUser(uid);
    console.log(`✅ Successfully deleted user ${uid} from Authentication`);
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`⚠️  User ${uid} not found in Authentication (may have been deleted already)`);
    } else {
      console.error('Error deleting user from Authentication:', error);
      throw error;
    }
  }
}

async function deleteUserRelatedData(userId) {
  try {
    console.log(`Deleting all data related to user ${userId}...`);
    
    let totalDeleted = 0;
    
    // Delete activities created by this user
    const activitiesSnapshot = await db.collection('activities')
      .where('createdBy', '==', userId)
      .get();
    
    let activitiesDeleted = 0;
    for (const doc of activitiesSnapshot.docs) {
      console.log(`Deleting activity ${doc.id}...`);
      await doc.ref.delete();
      activitiesDeleted++;
    }
    
    // Delete resources submitted by this user
    const resourcesSnapshot = await db.collection('resources')
      .where('submittedBy', '==', userId)
      .get();
    
    let resourcesDeleted = 0;
    for (const doc of resourcesSnapshot.docs) {
      console.log(`Deleting resource ${doc.id}...`);
      await doc.ref.delete();
      resourcesDeleted++;
    }
    
    // Delete help requests by this user
    const helpRequestsSnapshot = await db.collection('help_requests')
      .where('userId', '==', userId)
      .get();
    
    let helpRequestsDeleted = 0;
    for (const doc of helpRequestsSnapshot.docs) {
      console.log(`Deleting help request ${doc.id}...`);
      await doc.ref.delete();
      helpRequestsDeleted++;
    }
    
    // Delete alerts created by this user
    const alertsSnapshot = await db.collection('alerts')
      .where('createdBy', '==', userId)
      .get();
    
    let alertsDeleted = 0;
    for (const doc of alertsSnapshot.docs) {
      console.log(`Deleting alert ${doc.id}...`);
      await doc.ref.delete();
      alertsDeleted++;
    }
    
    // Delete matches involving this user
    const matchesSnapshot = await db.collection('matches')
      .where('user1Id', '==', userId)
      .get();
    
    let matchesDeleted = 0;
    for (const doc of matchesSnapshot.docs) {
      console.log(`Deleting match ${doc.id}...`);
      await doc.ref.delete();
      matchesDeleted++;
    }
    
    // Also check for matches where user is user2Id
    const matchesSnapshot2 = await db.collection('matches')
      .where('user2Id', '==', userId)
      .get();
    
    for (const doc of matchesSnapshot2.docs) {
      console.log(`Deleting match ${doc.id}...`);
      await doc.ref.delete();
      matchesDeleted++;
    }
    
    // Delete conversations involving this user
    const conversationsSnapshot = await db.collection('conversations')
      .where('user1Id', '==', userId)
      .get();
    
    let conversationsDeleted = 0;
    for (const doc of conversationsSnapshot.docs) {
      console.log(`Deleting conversation ${doc.id}...`);
      await doc.ref.delete();
      conversationsDeleted++;
    }
    
    // Also check for conversations where user is user2Id
    const conversationsSnapshot2 = await db.collection('conversations')
      .where('user2Id', '==', userId)
      .get();
    
    for (const doc of conversationsSnapshot2.docs) {
      console.log(`Deleting conversation ${doc.id}...`);
      await doc.ref.delete();
      conversationsDeleted++;
    }
    
    // Delete reports by this user
    const reportsSnapshot = await db.collection('reports')
      .where('reportedBy', '==', userId)
      .get();
    
    let reportsDeleted = 0;
    for (const doc of reportsSnapshot.docs) {
      console.log(`Deleting report ${doc.id}...`);
      await doc.ref.delete();
      reportsDeleted++;
    }
    
    // Delete feedback by this user
    const feedbackSnapshot = await db.collection('feedback')
      .where('userId', '==', userId)
      .get();
    
    let feedbackDeleted = 0;
    for (const doc of feedbackSnapshot.docs) {
      console.log(`Deleting feedback ${doc.id}...`);
      await doc.ref.delete();
      feedbackDeleted++;
    }
    
    // Delete friend connections involving this user
    const friendConnectionsSnapshot = await db.collection('friend_connections')
      .where('user1Id', '==', userId)
      .get();
    
    let friendConnectionsDeleted = 0;
    for (const doc of friendConnectionsSnapshot.docs) {
      console.log(`Deleting friend connection ${doc.id}...`);
      await doc.ref.delete();
      friendConnectionsDeleted++;
    }
    
    // Also check for friend connections where user is user2Id
    const friendConnectionsSnapshot2 = await db.collection('friend_connections')
      .where('user2Id', '==', userId)
      .get();
    
    for (const doc of friendConnectionsSnapshot2.docs) {
      console.log(`Deleting friend connection ${doc.id}...`);
      await doc.ref.delete();
      friendConnectionsDeleted++;
    }
    
    // Delete posts by this user
    const postsSnapshot = await db.collection('posts')
      .where('authorId', '==', userId)
      .get();
    
    let postsDeleted = 0;
    for (const doc of postsSnapshot.docs) {
      console.log(`Deleting post ${doc.id}...`);
      await doc.ref.delete();
      postsDeleted++;
    }
    
    // Delete user's children subcollection
    const userRef = db.collection('users').doc(userId);
    const childrenSnapshot = await userRef.collection('children').get();
    
    let childrenDeleted = 0;
    for (const doc of childrenSnapshot.docs) {
      console.log(`Deleting child ${doc.id}...`);
      await doc.ref.delete();
      childrenDeleted++;
    }
    
    totalDeleted = activitiesDeleted + resourcesDeleted + helpRequestsDeleted + 
                   alertsDeleted + matchesDeleted + conversationsDeleted + 
                   reportsDeleted + feedbackDeleted + friendConnectionsDeleted + 
                   postsDeleted + childrenDeleted;
    
    console.log(`\n📊 Related data deletion summary:`);
    console.log(`   - Activities: ${activitiesDeleted}`);
    console.log(`   - Resources: ${resourcesDeleted}`);
    console.log(`   - Help requests: ${helpRequestsDeleted}`);
    console.log(`   - Alerts: ${alertsDeleted}`);
    console.log(`   - Matches: ${matchesDeleted}`);
    console.log(`   - Conversations: ${conversationsDeleted}`);
    console.log(`   - Reports: ${reportsDeleted}`);
    console.log(`   - Feedback: ${feedbackDeleted}`);
    console.log(`   - Friend connections: ${friendConnectionsDeleted}`);
    console.log(`   - Posts: ${postsDeleted}`);
    console.log(`   - Children: ${childrenDeleted}`);
    console.log(`   - Total items deleted: ${totalDeleted}`);
    
    return totalDeleted;
    
  } catch (error) {
    console.error('Error deleting user related data:', error);
    throw error;
  }
}

async function deleteUserFromFirestore(userId) {
  try {
    console.log(`Deleting user ${userId} from Firestore...`);
    
    await db.collection('users').doc(userId).delete();
    console.log(`✅ Successfully deleted user ${userId} from Firestore`);
    
  } catch (error) {
    console.error('Error deleting user from Firestore:', error);
    throw error;
  }
}

async function deleteUserByEmail() {
  try {
    console.log(`🚨 Starting deletion of user with email: ${TARGET_EMAIL}`);
    console.log('=' .repeat(60));
    
    // Step 1: Find the user by email
    const user = await findUserByEmail(TARGET_EMAIL);
    if (!user) {
      console.log('❌ User not found. Deletion process stopped.');
      return;
    }
    
    const userId = user.id;
    const userData = user.data;
    
    console.log(`\n📋 User details:`);
    console.log(`   - ID: ${userId}`);
    console.log(`   - Name: ${userData.displayName || 'N/A'}`);
    console.log(`   - Email: ${userData.email}`);
    console.log(`   - Created: ${userData.createdAt || 'N/A'}`);
    
    // Step 2: Delete all related data
    console.log('\n🗑️  Step 1: Deleting related data...');
    await deleteUserRelatedData(userId);
    
    // Step 3: Delete user from Firestore
    console.log('\n🗑️  Step 2: Deleting user from Firestore...');
    await deleteUserFromFirestore(userId);
    
    // Step 4: Delete user from Authentication
    console.log('\n🗑️  Step 3: Deleting user from Authentication...');
    await deleteUserFromAuthentication(userId);
    
    console.log('\n' + '=' .repeat(60));
    console.log(`✅ SUCCESS: User ${userData.displayName} (${TARGET_EMAIL}) has been completely deleted!`);
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERROR: User deletion failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    console.log(`🎯 Target email: ${TARGET_EMAIL}`);
    console.log('⚠️  WARNING: This will permanently delete the user and ALL their data!');
    console.log('=' .repeat(60));
    
    await deleteUserByEmail();
    console.log('\n🎉 User deletion process completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 User deletion process failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  deleteUserByEmail,
  findUserByEmail,
  deleteUserRelatedData,
  deleteUserFromFirestore,
  deleteUserFromAuthentication
};






