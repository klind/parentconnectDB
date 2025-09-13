const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function moveLocationToPublicCollection() {
  try {
    console.log('🔄 Moving location object from users_private_data to users_public_data...');
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
        // Check if document has location field
        if (!privateData.hasOwnProperty('location')) {
          console.log(`ℹ️  Document ${docId} does not have location field - skipping`);
          skippedCount++;
          continue;
        }
        
        const locationValue = privateData.location;
        
        // Get the corresponding document from users_public_data
        const publicDocRef = db.collection('users_public_data').doc(docId);
        const publicDoc = await publicDocRef.get();
        
        if (!publicDoc.exists) {
          console.log(`⚠️  No corresponding document in users_public_data for ${docId} - skipping`);
          skippedCount++;
          continue;
        }
        
        // Add location object to users_public_data
        await publicDocRef.update({
          location: locationValue
        });
        
        // Remove location object from users_private_data
        await db.collection('users_private_data').doc(docId).update({
          location: admin.firestore.FieldValue.delete()
        });
        
        console.log(`✅ Document ${docId}: Moved location object`);
        console.log(`   📍 Location: ${locationValue.city || 'N/A'}, ${locationValue.state || 'N/A'} ${locationValue.zipCode || ''}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Error processing document ${docId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('');
    console.log('📊 Summary:');
    console.log(`   📝 Total documents processed: ${privateSnapshot.size}`);
    console.log(`   ✅ Successfully moved location: ${updatedCount} documents`);
    console.log(`   ⚠️  Skipped: ${skippedCount} documents`);
    console.log(`   ❌ Errors: ${errorCount} documents`);
    
    if (updatedCount === 0) {
      console.log('\nℹ️  No documents had location field to move');
    } else {
      console.log(`\n✅ Successfully moved location object from private to public collection for ${updatedCount} users`);
    }
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

moveLocationToPublicCollection();
