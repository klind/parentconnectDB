const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Fields to remove from private children subcollections
const FIELDS_TO_REMOVE = ['age', 'diagnoses', 'allergies', 'gender', 'interests'];

async function removeChildrenFieldsFromPrivate() {
  try {
    console.log('🗑️ Removing children fields from users_private_data subcollections...');
    console.log(`📋 Fields to remove: ${FIELDS_TO_REMOVE.join(', ')}`);
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
        
        // Process each child
        for (const privateChildDoc of privateChildrenSnapshot.docs) {
          const childId = privateChildDoc.id;
          const privateChildData = privateChildDoc.data();
          
          // Check which fields exist and need to be removed
          const fieldsToRemove = {};
          FIELDS_TO_REMOVE.forEach(field => {
            if (privateChildData.hasOwnProperty(field)) {
              fieldsToRemove[field] = admin.firestore.FieldValue.delete();
            }
          });
          
          if (Object.keys(fieldsToRemove).length === 0) {
            console.log(`   ℹ️  Child ${childId} has none of the specified fields - skipping`);
            continue;
          }
          
          // Remove the fields from the child in the private collection
          await privateChildDoc.ref.update(fieldsToRemove);
          
          console.log(`   👶 Child ${childId}: Removed fields ${Object.keys(fieldsToRemove).join(', ')}`);
          totalChildrenUpdated++;
        }
        
        console.log(`✅ User ${userId}: Successfully removed fields from children in private collection`);
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
    console.log(`   📋 Fields removed: ${FIELDS_TO_REMOVE.join(', ')}`);
    
    if (updatedUsers === 0) {
      console.log('\nℹ️  No users had children with the specified fields to remove');
    } else {
      console.log(`\n✅ Successfully removed children fields from private collection for ${updatedUsers} users`);
    }
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

removeChildrenFieldsFromPrivate();
