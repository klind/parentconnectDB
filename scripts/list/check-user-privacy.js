const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// User ID to check
const TARGET_USER_ID = 'z1RjlZyE5rdCfA3D0cMqEq57wcn1';

async function checkUserPrivacy() {
  try {
    console.log(`🔍 Checking privacy preferences for user: ${TARGET_USER_ID}`);
    
    const userDoc = await db.collection('users').doc(TARGET_USER_ID).get();
    
    if (!userDoc.exists) {
      console.log('❌ User not found');
      return;
    }
    
    const userData = userDoc.data();
    
    console.log('\n📊 User Data:');
    console.log(`   Display Name: ${userData.displayName}`);
    console.log(`   Email: ${userData.email}`);
    
    if (userData.preferences && userData.preferences.privacy) {
      console.log('\n🔒 Privacy Preferences:');
      const privacy = userData.preferences.privacy;
      
      Object.keys(privacy).forEach(key => {
        console.log(`   ${key}: ${privacy[key]}`);
      });
      
      // Check for removed fields
      const removedFields = ['allowPlaydateInvitations', 'profileVisibility', 'shareActivityData', 'showLocation'];
      const stillPresent = removedFields.filter(field => privacy.hasOwnProperty(field));
      
      if (stillPresent.length === 0) {
        console.log('\n✅ All specified fields have been successfully removed!');
      } else {
        console.log(`\n⚠️  Some fields are still present: ${stillPresent.join(', ')}`);
      }
    } else {
      console.log('\n⚠️  User has no privacy preferences');
    }
    
  } catch (error) {
    console.error('❌ Error checking user privacy:', error);
  } finally {
    process.exit(0);
  }
}

checkUserPrivacy();
