const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// The 9 new allergies to keep
const NEW_ALLERGIES = [
  {
    name: "milk",
    category: "dairy",
    severity: "moderate",
    description: "Milk allergy (different from lactose intolerance)"
  },
  {
    name: "eggs",
    category: "protein",
    severity: "moderate",
    description: "Egg allergy"
  },
  {
    name: "peanuts",
    category: "nuts",
    severity: "high",
    description: "Peanut allergy - common and potentially severe"
  },
  {
    name: "tree_nuts",
    category: "nuts",
    severity: "high",
    description: "Tree nuts allergy (almonds, walnuts, cashews, pistachios, etc.)"
  },
  {
    name: "soybeans",
    category: "legumes",
    severity: "moderate",
    description: "Soybean allergy"
  },
  {
    name: "wheat",
    category: "grains",
    severity: "moderate",
    description: "Wheat allergy (different from celiac disease)"
  },
  {
    name: "fish",
    category: "seafood",
    severity: "moderate",
    description: "Fish allergy (bass, cod, flounder, etc.)"
  },
  {
    name: "shellfish",
    category: "seafood",
    severity: "high",
    description: "Shellfish allergy (shrimp, crab, lobster, etc.)"
  },
  {
    name: "sesame",
    category: "seeds",
    severity: "moderate",
    description: "Sesame allergy"
  }
];

async function updateAllergiesCollection() {
  try {
    console.log('🔄 Starting allergies collection update...');
    console.log(`📝 Target: ${NEW_ALLERGIES.length} allergies`);
    console.log('');
    
    // Step 1: Delete all existing allergies
    console.log('🗑️  Step 1: Deleting all existing allergies...');
    const existingAllergiesSnapshot = await db.collection('allergies').get();
    
    if (!existingAllergiesSnapshot.empty) {
      const deletePromises = existingAllergiesSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);
      console.log(`✅ Deleted ${existingAllergiesSnapshot.size} existing allergies`);
    } else {
      console.log('ℹ️  No existing allergies to delete');
    }
    
    // Step 2: Create new allergies
    console.log('\n➕ Step 2: Creating new allergies...');
    const now = admin.firestore.Timestamp.now();
    
    for (const allergy of NEW_ALLERGIES) {
      const allergyData = {
        ...allergy,
        createdAt: now,
        updatedAt: now,
        expiresAt: now
      };
      
      await db.collection('allergies').doc(allergy.name).set(allergyData);
      console.log(`✅ Created: ${allergy.name}`);
    }
    
    console.log(`✅ Successfully created ${NEW_ALLERGIES.length} new allergies`);
    
    // Step 3: Update all children's allergies
    console.log('\n👶 Step 3: Updating children\'s allergies...');
    
    const usersSnapshot = await db.collection('users').get();
    let totalChildren = 0;
    let updatedChildren = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      if (userData.children) {
        const childrenSnapshot = await userDoc.ref.collection('children').get();
        
        for (const childDoc of childrenSnapshot.docs) {
          totalChildren++;
          
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
              randomAllergies.push(...shuffledAllergies.slice(0, numAllergies).map(a => a.name));
            }
            
            // Update child with new allergies
            await childDoc.ref.update({
              allergies: randomAllergies
            });
            
            const childData = childDoc.data();
            console.log(`✅ Child ${childData.name || childDoc.id}: ${randomAllergies.length > 0 ? randomAllergies.join(', ') : 'No allergies'}`);
            updatedChildren++;
            
          } catch (error) {
            console.error(`❌ Error updating child ${childDoc.id}:`, error.message);
          }
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   🗑️  Deleted: ${existingAllergiesSnapshot.size} old allergies`);
    console.log(`   ➕ Created: ${NEW_ALLERGIES.length} new allergies`);
    console.log(`   👶 Updated: ${updatedChildren}/${totalChildren} children`);
    console.log(`   🔒 New allergies: ${NEW_ALLERGIES.map(a => a.name).join(', ')}`);
    
    console.log('\n✅ Allergies collection update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating allergies collection:', error);
  } finally {
    process.exit(0);
  }
}

updateAllergiesCollection();
