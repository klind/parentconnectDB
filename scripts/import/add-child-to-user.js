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

// Child data to add
const childData = {
  name: "Emma",
  age: 7,
  gender: "female",
  interests: [
    "art",
    "dancing",
    "reading",
    "swimming"
  ],
  allergies: [
    "dairy"
  ],
  diagnoses: []
};

async function addChildToUser() {
  try {
    console.log(`Adding child to user ${TARGET_USER_ID}...`);
    
    // Check if user exists
    const userRef = db.collection('users').doc(TARGET_USER_ID);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.error(`User ${TARGET_USER_ID} does not exist.`);
      return;
    }
    
    console.log(`Found user: ${userDoc.data().displayName}`);
    
    // Generate a unique child ID
    const childId = db.collection('users').doc().id;
    
    // Add child to the user's children subcollection
    const childRef = userRef.collection('children').doc(childId);
    
    const childDocument = {
      ...childData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await childRef.set(childDocument);
    
    console.log(`✅ Successfully added child "${childData.name}" to user ${TARGET_USER_ID}`);
    console.log(`📋 Child details:`);
    console.log(`   - Name: ${childData.name}`);
    console.log(`   - Age: ${childData.age}`);
    console.log(`   - Gender: ${childData.gender}`);
    console.log(`   - Interests: ${childData.interests.join(', ')}`);
    console.log(`   - Allergies: ${childData.allergies.length > 0 ? childData.allergies.join(', ') : 'None'}`);
    console.log(`   - Diagnoses: ${childData.diagnoses.length > 0 ? childData.diagnoses.join(', ') : 'None'}`);
    console.log(`   - Child ID: ${childId}`);
    
  } catch (error) {
    console.error('Error adding child to user:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await addChildToUser();
    console.log('\nChild addition completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Child addition failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  addChildToUser
};









