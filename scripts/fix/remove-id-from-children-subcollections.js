const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function removeIdFromChildrenSubcollections() {
  try {
    console.log('🗑️ Removing id field from children subcollections in both private and public collections...');
    console.log('');
    
    const collections = ['users_private_data', 'users_public_data'];
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let totalChildrenUpdated = 0;
    
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
        let collectionChildrenUpdated = 0;
        
        // Process each document
        for (const doc of snapshot.docs) {
          const docId = doc.id;
          
          try {
            // Check if user has children subcollection
            const childrenSnapshot = await doc.ref.collection('children').get();
            
            if (childrenSnapshot.empty) {
              console.log(`   ℹ️  Document ${docId} has no children subcollection - skipping`);
              collectionSkipped++;
              continue;
            }
            
            console.log(`   👤 User ${docId}: Found ${childrenSnapshot.size} children`);
            
            // Process each child
            for (const childDoc of childrenSnapshot.docs) {
              const childId = childDoc.id;
              const childData = childDoc.data();
              
              // Check if child has id field
              if (!childData.hasOwnProperty('id')) {
                console.log(`     ℹ️  Child ${childId} does not have id field - skipping`);
                continue;
              }
              
              const idValue = childData.id;
              
              // Remove the id field
              await childDoc.ref.update({
                id: admin.firestore.FieldValue.delete()
              });
              
              console.log(`     👶 Child ${childId}: Removed id field (was: ${idValue})`);
              collectionChildrenUpdated++;
            }
            
            console.log(`   ✅ User ${docId}: Successfully processed children`);
            collectionUpdated++;
            
          } catch (error) {
            console.error(`   ❌ Error processing document ${docId}:`, error.message);
            collectionErrors++;
          }
        }
        
        console.log(`   📊 ${collectionName} Summary:`);
        console.log(`      ✅ Updated: ${collectionUpdated} documents`);
        console.log(`      👶 Children updated: ${collectionChildrenUpdated} children`);
        console.log(`      ⚠️  Skipped: ${collectionSkipped} documents`);
        console.log(`      ❌ Errors: ${collectionErrors} documents`);
        console.log('');
        
        totalUpdated += collectionUpdated;
        totalSkipped += collectionSkipped;
        totalErrors += collectionErrors;
        totalChildrenUpdated += collectionChildrenUpdated;
        
      } catch (error) {
        console.error(`❌ Error processing collection ${collectionName}:`, error.message);
        totalErrors++;
      }
    }
    
    console.log('📊 OVERALL SUMMARY:');
    console.log('='.repeat(50));
    console.log(`   📝 Collections processed: ${collections.length}`);
    console.log(`   ✅ Total documents updated: ${totalUpdated}`);
    console.log(`   👶 Total children updated: ${totalChildrenUpdated}`);
    console.log(`   ⚠️  Total documents skipped: ${totalSkipped}`);
    console.log(`   ❌ Total errors: ${totalErrors}`);
    
    if (totalChildrenUpdated === 0) {
      console.log('\n✅ No children had id field - nothing to remove!');
    } else {
      console.log(`\n✅ Successfully removed id field from ${totalChildrenUpdated} children across both collections`);
    }
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

removeIdFromChildrenSubcollections();
