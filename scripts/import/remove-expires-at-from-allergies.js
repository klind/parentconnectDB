const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function removeExpiresAtFromAllergies() {
  try {
    console.log('🔄 Starting removal of expiresAt field from allergies...');
    
    // Get all allergies
    const allergiesSnapshot = await db.collection('allergies').get();
    
    if (allergiesSnapshot.empty) {
      console.log('❌ No allergies found in the database.');
      return;
    }
    
    console.log(`📊 Found ${allergiesSnapshot.size} allergies to process`);
    console.log('');
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process each allergy
    for (const allergyDoc of allergiesSnapshot.docs) {
      const allergyId = allergyDoc.id;
      const allergyData = allergyDoc.data();
      
      try {
        // Remove the expiresAt field
        await allergyDoc.ref.update({
          expiresAt: admin.firestore.FieldValue.delete()
        });
        
        console.log(`✅ Removed expiresAt from: ${allergyId} (${allergyData.name})`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Error updating allergy ${allergyId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updatedCount} allergies`);
    console.log(`   ❌ Errors: ${errorCount} allergies`);
    console.log(`   🗑️  Field removed: expiresAt`);
    
    console.log('\n✅ expiresAt field removal completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

removeExpiresAtFromAllergies();
