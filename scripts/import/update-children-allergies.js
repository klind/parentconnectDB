const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// The 9 new allergies to use
const NEW_ALLERGIES = [
  "milk",
  "eggs", 
  "peanuts",
  "tree_nuts",
  "soybeans",
  "wheat",
  "fish",
  "shellfish",
  "sesame"
];

async function updateChildrenAllergies() {
  try {
    console.log('🔄 Starting children allergies update...');
    console.log(`📝 Using allergies: ${NEW_ALLERGIES.join(', ')}`);
    console.log('');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in the database.');
      return;
    }
    
    console.log(`📊 Found ${usersSnapshot.size} users to process`);
    console.log('');
    
    let totalChildren = 0;
    let updatedChildren = 0;
    let errorCount = 0;
    
    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      try {
        // Check if user has children subcollection
        const childrenSnapshot = await userDoc.ref.collection('children').get();
        
        if (!childrenSnapshot.empty) {
          console.log(`👨‍👩‍👧‍👦 User ${userId} (${userData.displayName || 'Unknown'}): ${childrenSnapshot.size} children`);
          
          // Process each child
          for (const childDoc of childrenSnapshot.docs) {
            totalChildren++;
            const childData = childDoc.data();
            
            try {
              // Remove all existing allergies
              await childDoc.ref.update({
                allergies: []
              });
              
              // Add random allergies (0-3 allergies per child)
              const numAllergies = Math.floor(Math.random() * 4); // 0, 1, 2, or 3
              const randomAllergies = [];
              
              if (numAllergies > 0) {
                const shuffledAllergies = [...NEW_ALLERGIES].sort(() => Math.random() - 0.5);
                randomAllergies.push(...shuffledAllergies.slice(0, numAllergies));
              }
              
              // Update child with new allergies
              await childDoc.ref.update({
                allergies: randomAllergies
              });
              
              console.log(`   ✅ Child ${childData.name || childDoc.id}: ${randomAllergies.length > 0 ? randomAllergies.join(', ') : 'No allergies'}`);
              updatedChildren++;
              
            } catch (error) {
              console.error(`   ❌ Error updating child ${childDoc.id}:`, error.message);
              errorCount++;
            }
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing user ${userId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   👶 Total children: ${totalChildren}`);
    console.log(`   ✅ Updated: ${updatedChildren} children`);
    console.log(`   ❌ Errors: ${errorCount} children`);
    console.log(`   🔒 New allergies: ${NEW_ALLERGIES.join(', ')}`);
    
    console.log('\n✅ Children allergies update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

updateChildrenAllergies();
