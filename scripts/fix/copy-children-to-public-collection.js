const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function copyChildrenToPublicCollection() {
  try {
    console.log('👶 Copying children subcollections from users_private_data to users_public_data...');
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
    let totalChildrenCopied = 0;
    
    // Process each document
    for (const privateDoc of privateSnapshot.docs) {
      const docId = privateDoc.id;
      
      try {
        // Check if user has children subcollection
        const childrenSnapshot = await privateDoc.ref.collection('children').get();
        
        if (childrenSnapshot.empty) {
          console.log(`ℹ️  User ${docId} has no children - skipping`);
          skippedCount++;
          continue;
        }
        
        console.log(`👤 User ${docId}: Found ${childrenSnapshot.size} children`);
        
        // Get the corresponding document from users_public_data
        const publicDocRef = db.collection('users_public_data').doc(docId);
        const publicDoc = await publicDocRef.get();
        
        if (!publicDoc.exists) {
          console.log(`⚠️  No corresponding document in users_public_data for ${docId} - skipping`);
          skippedCount++;
          continue;
        }
        
        // Copy each child document to the public collection
        for (const childDoc of childrenSnapshot.docs) {
          const childData = childDoc.data();
          
          // Copy child to public collection
          await publicDocRef.collection('children').doc(childDoc.id).set(childData);
          
          console.log(`   👶 Copied child ${childDoc.id}: ${childData.name} (age ${childData.age})`);
          totalChildrenCopied++;
        }
        
        console.log(`✅ User ${docId}: Successfully copied ${childrenSnapshot.size} children to public collection`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Error processing user ${docId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('');
    console.log('📊 Summary:');
    console.log(`   📝 Total users processed: ${privateSnapshot.size}`);
    console.log(`   ✅ Users with children copied: ${updatedCount}`);
    console.log(`   👶 Total children copied: ${totalChildrenCopied}`);
    console.log(`   ⚠️  Skipped: ${skippedCount} users`);
    console.log(`   ❌ Errors: ${errorCount} users`);
    
    if (updatedCount === 0) {
      console.log('\nℹ️  No users had children to copy');
    } else {
      console.log(`\n✅ Successfully copied children subcollections to public collection for ${updatedCount} users`);
    }
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

copyChildrenToPublicCollection();
