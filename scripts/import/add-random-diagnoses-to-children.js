const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addRandomDiagnosesToChildren() {
  try {
    console.log('🔄 Starting to add random diagnoses to children...');
    
    // Step 1: Get all available diagnoses from child_diagnoses collection
    console.log('📋 Step 1: Fetching available diagnoses...');
    const categoriesSnapshot = await db.collection('child_diagnoses').get();
    
    if (categoriesSnapshot.empty) {
      console.log('❌ No diagnosis categories found in the database.');
      return;
    }
    
    const allDiagnoses = [];
    
    // Collect all diagnoses from all categories
    for (const categoryDoc of categoriesSnapshot.docs) {
      const diagnosesSnapshot = await categoryDoc.ref.collection('diagnoses').get();
      
      diagnosesSnapshot.forEach(doc => {
        allDiagnoses.push({
          key: doc.id,
          name: doc.data().name,
          category: doc.data().category
        });
      });
    }
    
    console.log(`✅ Found ${allDiagnoses.length} available diagnoses`);
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
              // Randomly select 1-3 diagnoses for this child (ensuring all children have at least 1)
              const numDiagnoses = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
              const randomDiagnoses = [];
              
              // Shuffle diagnoses and pick random ones
              const shuffledDiagnoses = [...allDiagnoses].sort(() => Math.random() - 0.5);
              const selectedDiagnoses = shuffledDiagnoses.slice(0, numDiagnoses);
              
              // Add the diagnosis objects (key and name) to the child
              const diagnosisObjects = selectedDiagnoses.map(d => ({
                key: d.key,
                name: d.name
              }));
              randomDiagnoses.push(...diagnosisObjects);
              
              // Update child with random diagnoses (now containing key and name)
              await childDoc.ref.update({
                diagnoses: randomDiagnoses
              });
              
              const diagnosisNames = diagnosisObjects.map(d => d.name);
              console.log(`   ✅ Child ${childData.name || childDoc.id}: ${diagnosisNames.join(', ')}`);
              
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
    console.log(`   📋 Available diagnoses: ${allDiagnoses.length}`);
    console.log(`   👶 Total children: ${totalChildren}`);
    console.log(`   ✅ Updated: ${updatedChildren} children`);
    console.log(`   ❌ Errors: ${errorCount} children`);
    console.log(`   🔑 Using Firebase-generated diagnosis keys`);
    
    console.log('\n✅ Random diagnoses assignment completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

addRandomDiagnosesToChildren();
