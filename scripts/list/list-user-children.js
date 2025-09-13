const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Load service account from project root
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com' // Update with your project ID
});

const db = admin.firestore();

// Configuration - Update these values as needed
const TARGET_USER_ID = 'WYfbpe7bVgPrWi6d8dCRpj8NvYj1';

// Helper function to clean Firestore data for JSON serialization
function cleanFirestoreData(data) {
  const cleanData = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value && typeof value === 'object') {
      // Handle Firestore Timestamps
      if (value.toDate && typeof value.toDate === 'function') {
        cleanData[key] = value.toDate().toISOString();
      }
      // Handle Firestore Timestamp objects with _seconds
      else if (value._seconds) {
        cleanData[key] = new Date(value._seconds * 1000).toISOString();
      }
      // Handle regular Date objects
      else if (value instanceof Date) {
        cleanData[key] = value.toISOString();
      }
      // Handle nested objects (like location, preferences, etc.)
      else {
        cleanData[key] = value;
      }
    } else {
      cleanData[key] = value;
    }
  });
  
  return cleanData;
}

async function listUserChildren() {
  try {
    console.log(`Fetching children for user ${TARGET_USER_ID}...`);
    
    // Check if user exists
    const userRef = db.collection('users').doc(TARGET_USER_ID);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.error(`User ${TARGET_USER_ID} does not exist.`);
      return;
    }
    
    const userData = userDoc.data();
    console.log(`Found user: ${userData.displayName} (${userData.email})`);
    
    // Get all children from the user's children subcollection
    const childrenSnapshot = await userRef.collection('children').get();
    
    if (childrenSnapshot.empty) {
      console.log('No children found for this user.');
      return;
    }
    
    const children = {};
    childrenSnapshot.forEach((doc) => {
      const childData = doc.data();
      children[doc.id] = cleanFirestoreData(childData);
    });
    
    const result = {
      userId: TARGET_USER_ID,
      userName: userData.displayName,
      userEmail: userData.email,
      collection: 'children',
      total: Object.keys(children).length,
      data: children
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error fetching user children:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await listUserChildren();
    console.log('\nUser children listing completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('User children listing failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  listUserChildren
};









