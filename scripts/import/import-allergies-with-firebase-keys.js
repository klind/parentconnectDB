const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importAllergiesWithFirebaseKeys() {
  try {
    console.log('🔄 Starting to import allergies with Firebase auto-generated keys...');
    
    // Define the 9 allergies (without IDs - Firebase will generate them)
    const allergiesData = [
      {
        name: "Milk",
        description: "Dairy milk allergy",
        category: "dairy",
        severity: "moderate"
      },
      {
        name: "Eggs",
        description: "Egg allergy",
        category: "protein",
        severity: "moderate"
      },
      {
        name: "Peanuts",
        description: "Peanut allergy",
        category: "nuts",
        severity: "severe"
      },
      {
        name: "Tree nuts",
        description: "Tree nuts allergy (almonds, walnuts, cashews, pistachios, etc.)",
        category: "nuts",
        severity: "severe"
      },
      {
        name: "Soybeans",
        description: "Soy allergy",
        category: "legumes",
        severity: "moderate"
      },
      {
        name: "Wheat",
        description: "Wheat allergy",
        category: "grains",
        severity: "moderate"
      },
      {
        name: "Fish",
        description: "Fish allergy (bass, cod, flounder, etc.)",
        category: "seafood",
        severity: "moderate"
      },
      {
        name: "Shellfish",
        description: "Shellfish allergy (shrimp, crab, lobster, etc.)",
        category: "seafood",
        severity: "severe"
      },
      {
        name: "Sesame",
        description: "Sesame allergy",
        category: "seeds",
        severity: "moderate"
      }
    ];
    
    console.log(`📋 Importing ${allergiesData.length} allergies...`);
    
    const importedAllergies = [];
    
    // Import each allergy with Firebase auto-generated key
    for (const allergyData of allergiesData) {
      try {
        const allergyRef = db.collection('allergies').doc(); // Let Firebase generate the key
        const allergyDoc = {
          ...allergyData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await allergyRef.set(allergyDoc);
        
        const importedAllergy = {
          key: allergyRef.id,
          name: allergyData.name,
          category: allergyData.category
        };
        
        importedAllergies.push(importedAllergy);
        console.log(`   ✅ Imported: ${allergyData.name} (Key: ${allergyRef.id})`);
        
      } catch (error) {
        console.error(`   ❌ Error importing ${allergyData.name}:`, error.message);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   📋 Total allergies: ${allergiesData.length}`);
    console.log(`   ✅ Successfully imported: ${importedAllergies.length}`);
    console.log(`   🔑 Using Firebase auto-generated keys`);
    
    console.log('\n📋 Imported allergies with keys:');
    importedAllergies.forEach(allergy => {
      console.log(`   • ${allergy.name}: ${allergy.key}`);
    });
    
    console.log('\n✅ Allergies import completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

importAllergiesWithFirebaseKeys();






