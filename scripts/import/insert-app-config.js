const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function insertAppConfig() {
  try {
    console.log('Inserting app_config collection...');
    
    const appConfig = {
      support_email: "help@parentconnect.us",
      company_name: "ParentConnect",
      support_response_time: "48 hours",
      urgent_response_time: "much sooner",
      app_version: "1.0.0",
      urgent_keywords: [
        "urgent",
        "emergency",
        "safety",
        "abuse",
        "harassment",
        "threat",
        "danger"
      ],
      features_location_filtering: false,
      features_push_notifications: true,
      features_community_moderation: false
    };

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

    // Insert the main app_config document
    await db.collection('app_config').doc('main').set(appConfig);
    
    // Insert the user_field_visibility configuration
    await db.collection('app_config').doc('user_field_visibility').set(userFieldVisibilityConfig);
    
    console.log('✅ app_config collection inserted successfully!');
    console.log('Document ID: main');
    console.log('Collection: app_config');
    console.log('✅ user_field_visibility configuration inserted successfully!');
    console.log('Document ID: user_field_visibility');
    console.log('Public fields:', userFieldVisibilityConfig.publicFields);
    
  } catch (error) {
    console.error('❌ Error inserting app_config:', error);
  } finally {
    process.exit(0);
  }
}

insertAppConfig(); 