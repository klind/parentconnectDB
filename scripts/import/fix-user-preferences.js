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

async function fixUserPreferences() {
  try {
    console.log(`🔧 Starting preferences fix for user ${TARGET_USER_ID}...`);
    console.log('=' .repeat(60));
    
    // Step 1: Get both users
    console.log('📋 Step 1: Fetching user data...');
    const targetUser = await getUserById(TARGET_USER_ID);
    const sourceUser = await getUserById(SOURCE_USER_ID);
    
    console.log(`Target user: ${targetUser.data.displayName} (${targetUser.data.email})`);
    console.log(`Source user: ${sourceUser.data.displayName} (${sourceUser.data.email})`);
    
    // Step 2: Identify specific fixes needed
    console.log('\n🔍 Step 2: Analyzing preferences for fixes...');
    
    const targetPrefs = targetUser.data.preferences || {};
    const sourcePrefs = sourceUser.data.preferences || {};
    
    const fixesNeeded = [];
    
    // Check distanceUnit
    if (targetPrefs.distanceUnit !== sourcePrefs.distanceUnit) {
      fixesNeeded.push(`distanceUnit: "${targetPrefs.distanceUnit}" → "${sourcePrefs.distanceUnit}"`);
    }
    
    // Check locationTrackingEnabled
    if (targetPrefs.locationTrackingEnabled !== sourcePrefs.locationTrackingEnabled) {
      fixesNeeded.push(`locationTrackingEnabled: ${targetPrefs.locationTrackingEnabled} → ${sourcePrefs.locationTrackingEnabled}`);
    }
    
    // Check if any other preferences need alignment
    const targetInterests = targetPrefs.interests || [];
    const sourceInterests = sourcePrefs.interests || [];
    
    if (JSON.stringify(targetInterests.sort()) !== JSON.stringify(sourceInterests.sort())) {
      fixesNeeded.push(`interests: [${targetInterests.join(', ')}] → [${sourceInterests.join(', ')}]`);
    }
    
    if (fixesNeeded.length === 0) {
      console.log('   ✅ All preferences are already properly aligned!');
      return;
    }
    
    console.log('   Fixes needed:');
    fixesNeeded.forEach(fix => console.log(`   + ${fix}`));
    
    // Step 3: Prepare update data
    console.log('\n📝 Step 3: Preparing fix data...');
    
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      preferences: {
        ...targetPrefs,
        distanceUnit: sourcePrefs.distanceUnit,
        locationTrackingEnabled: sourcePrefs.locationTrackingEnabled,
        interests: sourcePrefs.interests
      }
    };
    
    // Step 4: Update the user
    console.log('\n💾 Step 4: Applying fixes to database...');
    
    const userRef = db.collection('users').doc(TARGET_USER_ID);
    await userRef.update(updateData);
    
    console.log('✅ Successfully fixed user preferences!');
    
    // Step 5: Show summary of fixes
    console.log('\n📊 Fix Summary:');
    console.log('   - Updated timestamp: updatedAt');
    fixesNeeded.forEach(fix => console.log(`   - Fixed: ${fix}`));
    
    console.log('\n' + '=' .repeat(60));
    console.log(`✅ SUCCESS: User ${targetUser.data.displayName} preferences have been fixed!`);
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERROR: User preferences fix failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await fixUserPreferences();
    console.log('\n🎉 User preferences fix completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 User preferences fix failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  fixUserPreferences,
  getUserById
};








