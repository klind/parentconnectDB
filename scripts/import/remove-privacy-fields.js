const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Fields to remove from preferences.privacy
const FIELDS_TO_REMOVE = [
  'allowPlaydateInvitations',
  'profileVisibility', 
  'shareActivityData',
  'showLocation'
];

async function removePrivacyFields() {
  try {
    console.log('🔍 Searching for users to remove privacy fields...');
    console.log(`📝 Fields to remove: ${FIELDS_TO_REMOVE.join(', ')}`);
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in the database.');
      return;
    }
    
    console.log(`📊 Found ${usersSnapshot.size} users to process`);
    console.log('');
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      try {
        // Check if user has preferences.privacy
        if (!userData.preferences || !userData.preferences.privacy) {
          console.log(`⚠️  User ${userId} has no preferences.privacy - skipping`);
          skippedCount++;
          continue;
        }
        
        const privacy = userData.preferences.privacy;
        const fieldsToRemove = [];
        
        // Check which fields exist and need to be removed
        FIELDS_TO_REMOVE.forEach(field => {
          if (privacy.hasOwnProperty(field)) {
            fieldsToRemove.push(field);
          }
        });
        
        if (fieldsToRemove.length === 0) {
          console.log(`ℹ️  User ${userId} has none of the specified fields - skipping`);
          skippedCount++;
          continue;
        }
        
        // Remove the fields
        const updateData = {};
        fieldsToRemove.forEach(field => {
          updateData[`preferences.privacy.${field}`] = admin.firestore.FieldValue.delete();
        });
        
        // Update the user document
        await db.collection('users').doc(userId).update(updateData);
        
        console.log(`✅ User ${userId}: Removed fields: ${fieldsToRemove.join(', ')}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Error processing user ${userId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('');
    console.log('📊 Summary:');
    console.log(`   ✅ Updated: ${updatedCount} users`);
    console.log(`   ⚠️  Skipped: ${skippedCount} users`);
    console.log(`   ❌ Errors: ${errorCount} users`);
    console.log(`   📝 Fields removed: ${FIELDS_TO_REMOVE.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

removePrivacyFields();
