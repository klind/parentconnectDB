const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteUserFieldVisibility() {
  try {
    console.log('🔍 Checking for user_field_visibility document in app_config...');
    
    // Check if the document exists
    const docRef = db.collection('app_config').doc('user_field_visibility');
    const docSnapshot = await docRef.get();
    
    if (!docSnapshot.exists) {
      console.log('❌ user_field_visibility document does not exist in app_config collection.');
      console.log('   Nothing to delete.');
      return;
    }
    
    console.log('✅ Found user_field_visibility document');
    
    // Show what we're about to delete
    const docData = docSnapshot.data();
    console.log('📋 Document content:');
    console.log(JSON.stringify(docData, null, 2));
    
    // Delete the document
    await docRef.delete();
    
    console.log('✅ Successfully deleted user_field_visibility document from app_config collection');
    console.log('📊 Summary:');
    console.log('   Collection: app_config');
    console.log('   Document ID: user_field_visibility');
    console.log('   Status: DELETED');
    
  } catch (error) {
    console.error('❌ Error deleting user_field_visibility document:', error);
  } finally {
    process.exit(0);
  }
}

deleteUserFieldVisibility();
