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
const SOURCE_USER_ID = 'z1RjlZyE5rdCfA3D0cMqEq57wcn1';

async function getUserById(userId) {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error(`User ${userId} does not exist`);
    }
    
    return {
      id: userDoc.id,
      data: userDoc.data()
    };
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    throw error;
  }
}

async function updateUserPreferences() {
  try {
    console.log(`🔄 Starting preferences update for user ${TARGET_USER_ID}...`);
    console.log('=' .repeat(60));
    
    // Step 1: Get both users
    console.log('📋 Step 1: Fetching user data...');
    const targetUser = await getUserById(TARGET_USER_ID);
    const sourceUser = await getUserById(SOURCE_USER_ID);
    
    console.log(`Target user: ${targetUser.data.displayName} (${targetUser.data.email})`);
    console.log(`Source user: ${sourceUser.data.displayName} (${sourceUser.data.email})`);
    
    // Step 2: Identify missing preferences
    console.log('\n🔍 Step 2: Analyzing missing preferences...');
    
    const targetPrefs = targetUser.data.preferences || {};
    const sourcePrefs = sourceUser.data.preferences || {};
    
    const missingPreferences = {};
    
    // Check for missing privacy settings
    if (!targetPrefs.privacy && sourcePrefs.privacy) {
      missingPreferences.privacy = sourcePrefs.privacy;
      console.log('   + Adding privacy settings');
    }
    
    // Check for missing notification settings
    if (!targetPrefs.notifications && sourcePrefs.notifications) {
      missingPreferences.notifications = sourcePrefs.notifications;
      console.log('   + Adding notification settings');
    }
    
    // Check for missing childAgeRanges
    if (!targetUser.data.childAgeRanges && sourceUser.data.childAgeRanges) {
      console.log('   + Adding childAgeRanges');
    }
    
    // Check for missing lastActiveAt
    if (!targetUser.data.lastActiveAt) {
      console.log('   + Adding lastActiveAt');
    }
    
    // Check for missing friendsCount (if not already present)
    if (targetUser.data.friendsCount === undefined) {
      console.log('   + Adding friendsCount');
    }
    
    // Check for missing fcmTokens
    if (!targetUser.data.fcmTokens) {
      console.log('   + Adding fcmTokens array');
    }
    
    // Check for missing expoPushToken
    if (!targetUser.data.expoPushToken) {
      console.log('   + Adding expoPushToken field');
    }
    
    // Check for missing lastTokenUpdate
    if (!targetUser.data.lastTokenUpdate) {
      console.log('   + Adding lastTokenUpdate');
    }
    
    // Check for missing lastFcmTokenUpdate
    if (!targetUser.data.lastFcmTokenUpdate) {
      console.log('   + Adding lastFcmTokenUpdate');
    }
    
    // Check for missing childAgeRangesUpdatedAt
    if (!targetUser.data.childAgeRangesUpdatedAt) {
      console.log('   + Adding childAgeRangesUpdatedAt');
    }
    
    if (Object.keys(missingPreferences).length === 0 && 
        !sourceUser.data.childAgeRanges && 
        !sourceUser.data.lastActiveAt && 
        targetUser.data.friendsCount !== undefined && 
        targetUser.data.fcmTokens && 
        targetUser.data.expoPushToken !== undefined && 
        targetUser.data.lastTokenUpdate && 
        targetUser.data.lastFcmTokenUpdate && 
        targetUser.data.childAgeRangesUpdatedAt) {
      console.log('   ✅ All preferences are already up to date!');
      return;
    }
    
    // Step 3: Prepare update data
    console.log('\n📝 Step 3: Preparing update data...');
    
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add missing preferences
    if (Object.keys(missingPreferences).length > 0) {
      updateData.preferences = {
        ...targetPrefs,
        ...missingPreferences
      };
    }
    
    // Add missing fields
    if (sourceUser.data.childAgeRanges) {
      updateData.childAgeRanges = sourceUser.data.childAgeRanges;
    }
    
    if (sourceUser.data.lastActiveAt) {
      updateData.lastActiveAt = sourceUser.data.lastActiveAt;
    }
    
    if (targetUser.data.friendsCount === undefined) {
      updateData.friendsCount = 0;
    }
    
    if (!targetUser.data.fcmTokens) {
      updateData.fcmTokens = [];
    }
    
    if (targetUser.data.expoPushToken === undefined) {
      updateData.expoPushToken = null;
    }
    
    if (!targetUser.data.lastTokenUpdate) {
      updateData.lastTokenUpdate = admin.firestore.FieldValue.serverTimestamp();
    }
    
    if (!targetUser.data.lastFcmTokenUpdate) {
      updateData.lastFcmTokenUpdate = admin.firestore.FieldValue.serverTimestamp();
    }
    
    if (!targetUser.data.childAgeRangesUpdatedAt) {
      updateData.childAgeRangesUpdatedAt = admin.firestore.FieldValue.serverTimestamp();
    }
    
    // Step 4: Update the user
    console.log('\n💾 Step 4: Updating user in database...');
    
    const userRef = db.collection('users').doc(TARGET_USER_ID);
    await userRef.update(updateData);
    
    console.log('✅ Successfully updated user preferences!');
    
    // Step 5: Show summary of changes
    console.log('\n📊 Update Summary:');
    console.log('   - Updated timestamp: updatedAt');
    
    if (Object.keys(missingPreferences).length > 0) {
      console.log('   - Added preferences:', Object.keys(missingPreferences).join(', '));
    }
    
    if (sourceUser.data.childAgeRanges) {
      console.log(`   - Added childAgeRanges: [${sourceUser.data.childAgeRanges.join(', ')}]`);
    }
    
    if (sourceUser.data.lastActiveAt) {
      console.log(`   - Added lastActiveAt: ${sourceUser.data.lastActiveAt}`);
    }
    
    if (targetUser.data.friendsCount === undefined) {
      console.log('   - Added friendsCount: 0');
    }
    
    if (!targetUser.data.fcmTokens) {
      console.log('   - Added fcmTokens: []');
    }
    
    if (targetUser.data.expoPushToken === undefined) {
      console.log('   - Added expoPushToken: null');
    }
    
    if (!targetUser.data.lastTokenUpdate) {
      console.log('   - Added lastTokenUpdate: current timestamp');
    }
    
    if (!targetUser.data.lastFcmTokenUpdate) {
      console.log('   - Added lastFcmTokenUpdate: current timestamp');
    }
    
    if (!targetUser.data.childAgeRangesUpdatedAt) {
      console.log('   - Added childAgeRangesUpdatedAt: current timestamp');
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log(`✅ SUCCESS: User ${targetUser.data.displayName} has been updated!`);
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERROR: User preferences update failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await updateUserPreferences();
    console.log('\n🎉 User preferences update completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 User preferences update failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  updateUserPreferences,
  getUserById
};








