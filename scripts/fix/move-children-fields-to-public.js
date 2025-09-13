const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Fields to move from private to public children subcollections
const FIELDS_TO_MOVE = ['age', 'diagnoses', 'allergies', 'gender', 'interests'];

async function moveChildrenFieldsToPublic() {
  try {
    console.log('👶 Moving children fields from users_private_data to users_public_data subcollections...');
    console.log(`📋 Fields to move: ${FIELDS_TO_MOVE.join(', ')}`);
    console.log('');
    
    // Get all documents from users_private_data
    const privateSnapshot = await db.collection('users_private_data').get();
    
    if (privateSnapshot.empty) {
      console.log('❌ No documents found in users_private_data collection.');
      return;
    }
    
    console.log(`📊 Found ${privateSnapshot.size} documents in users_private_data`);
    
    let updatedUsers = 0;
    let skippedUsers = 0;
    let errorUsers = 0;
    let totalChildrenUpdated = 0;
    
    // Process each user document
    for (const privateDoc of privateSnapshot.docs) {
      const userId = privateDoc.id;
      
      try {
        // Get children subcollection from private data
        const privateChildrenSnapshot = await privateDoc.ref.collection('children').get();
        
        if (privateChildrenSnapshot.empty) {
          console.log(`ℹ️  User ${userId} has no children in private collection - skipping`);
          skippedUsers++;
          continue;
        }
        
        console.log(`👤 User ${userId}: Found ${privateChildrenSnapshot.size} children in private collection`);
        
        // Get the corresponding document from users_public_data
        const publicDocRef = db.collection('users_public_data').doc(userId);
        const publicDoc = await publicDocRef.get();
        
        if (!publicDoc.exists) {
          console.log(`⚠️  No corresponding document in users_public_data for ${userId} - skipping`);
          skippedUsers++;
          continue;
        }
        
        // Process each child
        for (const privateChildDoc of privateChildrenSnapshot.docs) {
          const childId = privateChildDoc.id;
          const privateChildData = privateChildDoc.data();
          
          // Extract only the fields we want to move
          const fieldsToMove = {};
          FIELDS_TO_MOVE.forEach(field => {
            if (privateChildData.hasOwnProperty(field)) {
              fieldsToMove[field] = privateChildData[field];
            }
          });
          
          if (Object.keys(fieldsToMove).length === 0) {
            console.log(`   ℹ️  Child ${childId} has none of the specified fields - skipping`);
            continue;
          }
          
          // Create or update the child in the public collection
          await publicDocRef.collection('children').doc(childId).set(fieldsToMove, { merge: true });
          
          console.log(`   👶 Child ${childId}: Moved fields ${Object.keys(fieldsToMove).join(', ')}`);
          totalChildrenUpdated++;
        }
        
        console.log(`✅ User ${userId}: Successfully updated children in public collection`);
        updatedUsers++;
        
      } catch (error) {
        console.error(`❌ Error processing user ${userId}:`, error.message);
        errorUsers++;
      }
    }
    
    console.log('');
    console.log('📊 Summary:');
    console.log(`   📝 Total users processed: ${privateSnapshot.size}`);
    console.log(`   ✅ Users with children updated: ${updatedUsers}`);
    console.log(`   👶 Total children updated: ${totalChildrenUpdated}`);
    console.log(`   ⚠️  Skipped users: ${skippedUsers}`);
    console.log(`   ❌ Error users: ${errorUsers}`);
    console.log(`   📋 Fields moved: ${FIELDS_TO_MOVE.join(', ')}`);
    
    if (updatedUsers === 0) {
      console.log('\nℹ️  No users had children with the specified fields to move');
    } else {
      console.log(`\n✅ Successfully moved children fields to public collection for ${updatedUsers} users`);
    }
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

moveChildrenFieldsToPublic();
