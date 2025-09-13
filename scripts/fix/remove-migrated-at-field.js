const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function removeMigratedAtField() {
  try {
    console.log('🗑️ Removing migratedAt field from both user collections...');
    console.log('');
    
    const collections = ['users_private_data', 'users_public_data'];
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    for (const collectionName of collections) {
      console.log(`📊 Processing collection: ${collectionName}`);
      
      try {
        // Get all documents in the collection
        const snapshot = await db.collection(collectionName).get();
        
        if (snapshot.empty) {
          console.log(`   ❌ No documents found in ${collectionName}`);
          continue;
        }
        
        console.log(`   📝 Found ${snapshot.size} documents to process`);
        
        let collectionUpdated = 0;
        let collectionSkipped = 0;
        let collectionErrors = 0;
        
        // Process each document
        for (const doc of snapshot.docs) {
          const docId = doc.id;
          const docData = doc.data();
          
          try {
            // Check if document has migratedAt field
            if (!docData.hasOwnProperty('migratedAt')) {
              console.log(`   ℹ️  Document ${docId} does not have migratedAt field - skipping`);
              collectionSkipped++;
              continue;
            }
            
            const migratedAtValue = docData.migratedAt;
            
            // Remove the migratedAt field
            await db.collection(collectionName).doc(docId).update({
              migratedAt: admin.firestore.FieldValue.delete()
            });
            
            console.log(`   ✅ Document ${docId}: Removed migratedAt field (was: ${migratedAtValue})`);
            collectionUpdated++;
            
          } catch (error) {
            console.error(`   ❌ Error processing document ${docId}:`, error.message);
            collectionErrors++;
          }
        }
        
        console.log(`   📊 ${collectionName} Summary:`);
        console.log(`      ✅ Updated: ${collectionUpdated} documents`);
        console.log(`      ⚠️  Skipped: ${collectionSkipped} documents`);
        console.log(`      ❌ Errors: ${collectionErrors} documents`);
        console.log('');
        
        totalUpdated += collectionUpdated;
        totalSkipped += collectionSkipped;
        totalErrors += collectionErrors;
        
      } catch (error) {
        console.error(`❌ Error processing collection ${collectionName}:`, error.message);
        totalErrors++;
      }
    }
    
    console.log('📊 OVERALL SUMMARY:');
    console.log('='.repeat(50));
    console.log(`   📝 Collections processed: ${collections.length}`);
    console.log(`   ✅ Total documents updated: ${totalUpdated}`);
    console.log(`   ⚠️  Total documents skipped: ${totalSkipped}`);
    console.log(`   ❌ Total errors: ${totalErrors}`);
    
    if (totalUpdated === 0) {
      console.log('\n✅ No documents had migratedAt field - nothing to remove!');
    } else {
      console.log(`\n✅ Successfully removed migratedAt field from ${totalUpdated} documents across both collections`);
    }
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

removeMigratedAtField();
