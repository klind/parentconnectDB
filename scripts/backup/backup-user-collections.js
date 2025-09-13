const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function backupUserCollections() {
  try {
    console.log('💾 Creating backup of user collections...');
    console.log('');
    
    const collections = [
      { source: 'users_private_data', backup: 'users_private_data_backup' },
      { source: 'users_public_data', backup: 'users_public_data_backup' }
    ];
    
    let totalDocumentsBackedUp = 0;
    let totalChildrenBackedUp = 0;
    let totalErrors = 0;
    
    for (const { source, backup } of collections) {
      console.log(`📊 Backing up ${source} to ${backup}...`);
      
      try {
        // Get all documents from source collection
        const sourceSnapshot = await db.collection(source).get();
        
        if (sourceSnapshot.empty) {
          console.log(`   ℹ️  No documents found in ${source} - skipping`);
          continue;
        }
        
        console.log(`   📝 Found ${sourceSnapshot.size} documents to backup`);
        
        let collectionDocumentsBackedUp = 0;
        let collectionChildrenBackedUp = 0;
        let collectionErrors = 0;
        
        // Process each document
        for (const doc of sourceSnapshot.docs) {
          const docId = doc.id;
          const docData = doc.data();
          
          try {
            // Backup the main document
            await db.collection(backup).doc(docId).set(docData);
            collectionDocumentsBackedUp++;
            
            // Check for children subcollection
            const childrenSnapshot = await doc.ref.collection('children').get();
            
            if (!childrenSnapshot.empty) {
              console.log(`   👤 User ${docId}: Found ${childrenSnapshot.size} children to backup`);
              
              // Backup each child document
              for (const childDoc of childrenSnapshot.docs) {
                const childId = childDoc.id;
                const childData = childDoc.data();
                
                await db.collection(backup).doc(docId).collection('children').doc(childId).set(childData);
                collectionChildrenBackedUp++;
              }
              
              console.log(`   ✅ User ${docId}: Backed up ${childrenSnapshot.size} children`);
            }
            
          } catch (error) {
            console.error(`   ❌ Error backing up document ${docId}:`, error.message);
            collectionErrors++;
          }
        }
        
        console.log(`   📊 ${source} backup summary:`);
        console.log(`      📄 Documents backed up: ${collectionDocumentsBackedUp}`);
        console.log(`      👶 Children backed up: ${collectionChildrenBackedUp}`);
        console.log(`      ❌ Errors: ${collectionErrors}`);
        console.log('');
        
        totalDocumentsBackedUp += collectionDocumentsBackedUp;
        totalChildrenBackedUp += collectionChildrenBackedUp;
        totalErrors += collectionErrors;
        
      } catch (error) {
        console.error(`❌ Error backing up collection ${source}:`, error.message);
        totalErrors++;
      }
    }
    
    console.log('📊 OVERALL BACKUP SUMMARY:');
    console.log('='.repeat(50));
    console.log(`   📝 Collections backed up: ${collections.length}`);
    console.log(`   📄 Total documents backed up: ${totalDocumentsBackedUp}`);
    console.log(`   👶 Total children backed up: ${totalChildrenBackedUp}`);
    console.log(`   ❌ Total errors: ${totalErrors}`);
    
    if (totalErrors === 0) {
      console.log('\n✅ Backup completed successfully!');
      console.log('📋 Backup collections created:');
      collections.forEach(({ source, backup }) => {
        console.log(`   • ${source} → ${backup}`);
      });
    } else {
      console.log(`\n⚠️  Backup completed with ${totalErrors} errors`);
    }
    
  } catch (error) {
    console.error('❌ Error in main backup process:', error);
  } finally {
    process.exit(0);
  }
}

backupUserCollections();
