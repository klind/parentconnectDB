const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function removeUserIdField() {
  try {
    console.log('🔍 Searching for users with userId field...');
    
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
    let usersWithUserId = 0;
    
    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      try {
        // Check if user has userId field
        if (!userData.hasOwnProperty('userId')) {
          console.log(`ℹ️  User ${userId} does not have userId field - skipping`);
          skippedCount++;
          continue;
        }
        
        usersWithUserId++;
        const userIdValue = userData.userId;
        
        // Remove the userId field
        await db.collection('users').doc(userId).update({
          userId: admin.firestore.FieldValue.delete()
        });
        
        console.log(`✅ User ${userId}: Removed userId field (was: ${userIdValue})`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Error processing user ${userId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('');
    console.log('📊 Summary:');
    console.log(`   📝 Total users processed: ${usersSnapshot.size}`);
    console.log(`   🔍 Users with userId field: ${usersWithUserId}`);
    console.log(`   ✅ Successfully updated: ${updatedCount} users`);
    console.log(`   ⚠️  Skipped (no userId field): ${skippedCount} users`);
    console.log(`   ❌ Errors: ${errorCount} users`);
    
    if (usersWithUserId === 0) {
      console.log('\n✅ No users had userId field - nothing to remove!');
    } else {
      console.log(`\n✅ Successfully removed userId field from ${updatedCount} users`);
    }
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

removeUserIdField();
