const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function removeChildrenArrayFromPublicCollection() {
  try {
    console.log('🗑️ Removing children array field from users_public_data documents...');
    console.log('');
    
    // Get all documents from users_public_data
    const publicSnapshot = await db.collection('users_public_data').get();
    
    if (publicSnapshot.empty) {
      console.log('❌ No documents found in users_public_data collection.');
      return;
    }
    
    console.log(`📊 Found ${publicSnapshot.size} documents in users_public_data`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each document
    for (const publicDoc of publicSnapshot.docs) {
      const docId = publicDoc.id;
      const docData = publicDoc.data();
      
      try {
        // Check if document has children array field
        if (!docData.hasOwnProperty('children')) {
          console.log(`ℹ️  Document ${docId} does not have children array field - skipping`);
          skippedCount++;
          continue;
        }
        
        const childrenValue = docData.children;
        console.log(`👤 User ${docId}: Found children array with ${Array.isArray(childrenValue) ? childrenValue.length : 'unknown'} items`);
        
        // Remove the children array field
        await db.collection('users_public_data').doc(docId).update({
          children: admin.firestore.FieldValue.delete()
        });
        
        console.log(`✅ User ${docId}: Removed children array field`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Error processing document ${docId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('');
    console.log('📊 Summary:');
    console.log(`   📝 Total documents processed: ${publicSnapshot.size}`);
    console.log(`   ✅ Successfully removed children array: ${updatedCount} documents`);
    console.log(`   ⚠️  Skipped: ${skippedCount} documents`);
    console.log(`   ❌ Errors: ${errorCount} documents`);
    
    if (updatedCount === 0) {
      console.log('\nℹ️  No documents had children array field to remove');
    } else {
      console.log(`\n✅ Successfully removed children array field from ${updatedCount} documents in public collection`);
    }
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

removeChildrenArrayFromPublicCollection();
