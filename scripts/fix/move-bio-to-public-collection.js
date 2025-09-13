const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function moveBioToPublicCollection() {
  try {
    console.log('🔄 Moving bio field from users_private_data to users_public_data...');
    console.log('');
    
    // Get all documents from users_private_data
    const privateSnapshot = await db.collection('users_private_data').get();
    
    if (privateSnapshot.empty) {
      console.log('❌ No documents found in users_private_data collection.');
      return;
    }
    
    console.log(`📊 Found ${privateSnapshot.size} documents in users_private_data`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each document
    for (const privateDoc of privateSnapshot.docs) {
      const docId = privateDoc.id;
      const privateData = privateDoc.data();
      
      try {
        // Check if document has bio field
        if (!privateData.hasOwnProperty('bio')) {
          console.log(`ℹ️  Document ${docId} does not have bio field - skipping`);
          skippedCount++;
          continue;
        }
        
        const bioValue = privateData.bio;
        
        // Get the corresponding document from users_public_data
        const publicDocRef = db.collection('users_public_data').doc(docId);
        const publicDoc = await publicDocRef.get();
        
        if (!publicDoc.exists) {
          console.log(`⚠️  No corresponding document in users_public_data for ${docId} - skipping`);
          skippedCount++;
          continue;
        }
        
        // Add bio field to users_public_data
        await publicDocRef.update({
          bio: bioValue
        });
        
        // Remove bio field from users_private_data
        await db.collection('users_private_data').doc(docId).update({
          bio: admin.firestore.FieldValue.delete()
        });
        
        console.log(`✅ Document ${docId}: Moved bio field (value: "${bioValue}")`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Error processing document ${docId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('');
    console.log('📊 Summary:');
    console.log(`   📝 Total documents processed: ${privateSnapshot.size}`);
    console.log(`   ✅ Successfully moved bio field: ${updatedCount} documents`);
    console.log(`   ⚠️  Skipped: ${skippedCount} documents`);
    console.log(`   ❌ Errors: ${errorCount} documents`);
    
    if (updatedCount === 0) {
      console.log('\nℹ️  No documents had bio field to move');
    } else {
      console.log(`\n✅ Successfully moved bio field from private to public collection for ${updatedCount} users`);
    }
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

moveBioToPublicCollection();
