const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addRandomAllergiesToChildren() {
  try {
    console.log('🔄 Starting to add random allergies to children...');
    
    // Step 1: Get all available allergies from allergies collection
    console.log('📋 Step 1: Fetching available allergies...');
    const allergiesSnapshot = await db.collection('allergies').get();
    
    if (allergiesSnapshot.empty) {
      console.log('❌ No allergies found in the database.');
      return;
    }
    
    const allAllergies = [];
    
    // Collect all allergies with their keys and names
    allergiesSnapshot.forEach(doc => {
      const allergyData = doc.data();
      allAllergies.push({
        key: doc.id,
        name: allergyData.name,
        category: allergyData.category,
        severity: allergyData.severity
      });
    });
    
    console.log(`✅ Found ${allAllergies.length} available allergies`);
    console.log('');
    
    // Step 2: Get all users and their children
    console.log('👶 Step 2: Processing children...');
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in the database.');
      return;
    }
    
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
              // Randomly select 0-3 allergies for this child
              const numAllergies = Math.floor(Math.random() * 4); // 0, 1, 2, or 3
              const randomAllergies = [];
              
              if (numAllergies > 0) {
                // Shuffle allergies and pick random ones
                const shuffledAllergies = [...allAllergies].sort(() => Math.random() - 0.5);
                const selectedAllergies = shuffledAllergies.slice(0, numAllergies);
                
                // Add the allergy objects (key and name) to the child
                const allergyObjects = selectedAllergies.map(a => ({
                  key: a.key,
                  name: a.name
                }));
                randomAllergies.push(...allergyObjects);
              }
              
              // Update child with random allergies (now containing key and name)
              await childDoc.ref.update({
                allergies: randomAllergies
              });
              
              if (randomAllergies.length > 0) {
                const allergyNames = randomAllergies.map(a => a.name);
                console.log(`   ✅ Child ${childData.name || childDoc.id}: ${allergyNames.join(', ')}`);
              } else {
                console.log(`   ✅ Child ${childData.name || childDoc.id}: No allergies`);
              }
              
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
    console.log(`   📋 Available allergies: ${allAllergies.length}`);
    console.log(`   👶 Total children: ${totalChildren}`);
    console.log(`   ✅ Updated: ${updatedChildren} children`);
    console.log(`   ❌ Errors: ${errorCount} children`);
    console.log(`   🔑 Using Firebase-generated allergy keys`);
    console.log(`   📝 Storing key and name for fast retrieval`);
    
    console.log('\n✅ Random allergies assignment completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

addRandomAllergiesToChildren();
