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

    // Insert the app_config document
    await db.collection('app_config').doc('main').set(appConfig);
    
    console.log('✅ app_config collection inserted successfully!');
    console.log('Document ID: main');
    console.log('Collection: app_config');
    
  } catch (error) {
    console.error('❌ Error inserting app_config:', error);
  } finally {
    process.exit(0);
  }
}

insertAppConfig(); 