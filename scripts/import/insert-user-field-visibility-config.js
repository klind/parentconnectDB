const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function insertUserFieldVisibilityConfig() {
  try {
    console.log('Inserting user_field_visibility configuration...');
    
    const userFieldVisibilityConfig = {
      publicFields: [
        "displayName",
        "profileImageUrl",
        "location.city",
        "location.state",
        "interests",
        "friendsCount",
        "childAgeRanges",
        "bio"
      ]
    };

    // Insert the user_field_visibility document in app_config collection
    await db.collection('app_config').doc('user_field_visibility').set(userFieldVisibilityConfig);
    
    console.log('✅ user_field_visibility configuration inserted successfully!');
    console.log('Document ID: user_field_visibility');
    console.log('Collection: app_config');
    console.log('Public fields:', userFieldVisibilityConfig.publicFields);
    
  } catch (error) {
    console.error('❌ Error inserting user_field_visibility configuration:', error);
  } finally {
    process.exit(0);
  }
}

insertUserFieldVisibilityConfig();
