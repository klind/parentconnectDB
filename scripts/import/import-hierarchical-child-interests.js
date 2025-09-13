const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importHierarchicalChildInterests() {
  try {
    console.log('🔄 Starting to import hierarchical child interests with Firebase auto-generated keys...');
    
    // Define the structured interests with categories (no quick picks)
    const structuredInterests = {
      // Creative & Arts
      "creative_arts": {
        name: "Creative & Arts",
        description: "Artistic and creative expression activities",
        interests: [
                  { name: "Drawing", ageRange: "2-12" },
        { name: "Painting", ageRange: "3-12" },
        { name: "Coloring", ageRange: "2-8" },
        { name: "Dancing", ageRange: "2-12" },
        { name: "Ballet", ageRange: "3-18" },
        { name: "Hip Hop Dance", ageRange: "8-18" },
        { name: "Drama", ageRange: "4-12" },
        { name: "Singing", ageRange: "2-12" },
        { name: "Piano", ageRange: "5-18" },
        { name: "Guitar", ageRange: "8-18" },
        { name: "Violin", ageRange: "4-18" },
        { name: "Drums", ageRange: "6-18" },
        { name: "Photography", ageRange: "8-18" },
        { name: "Fashion", ageRange: "10-18" },
        { name: "Makeup", ageRange: "12-18" },
        { name: "Poetry", ageRange: "10-18" },
        { name: "Creative Writing", ageRange: "8-18" },
        { name: "Journaling", ageRange: "10-18" }
        ]
      },
      
      // Sports & Physical Activities
      "sports_physical": {
        name: "Sports & Physical Activities",
        description: "Physical activities, sports, and fitness",
        interests: [
                  { name: "Soccer", ageRange: "3-12" },
        { name: "Basketball", ageRange: "6-18" },
        { name: "Baseball", ageRange: "5-18" },
        { name: "Tennis", ageRange: "6-18" },
        { name: "Swimming", ageRange: "3-12" },
        { name: "Biking", ageRange: "4-12" },
        { name: "Skateboarding", ageRange: "8-18" },
        { name: "Rock Climbing", ageRange: "6-12" },
        { name: "Martial Arts", ageRange: "5-18" },
        { name: "Yoga", ageRange: "3-10" }
        ]
      },
      
      // Educational & STEM
      "educational_stem": {
        name: "Educational & STEM",
        description: "Science, technology, engineering, and math activities",
        interests: [
                  { name: "Math", ageRange: "3-10" },
        { name: "Science", ageRange: "4-12" },
        { name: "Biology", ageRange: "8-18" },
        { name: "Chemistry", ageRange: "10-18" },
        { name: "Physics", ageRange: "12-18" },
        { name: "Astronomy", ageRange: "8-18" },
        { name: "Coding", ageRange: "8-18" },
        { name: "Robotics", ageRange: "6-12" },
        { name: "3D Printing", ageRange: "10-18" },
        { name: "Chess", ageRange: "6-12" },
        { name: "Puzzles", ageRange: "3-10" },
        { name: "Building Blocks", ageRange: "2-10" },
        { name: "LEGO", ageRange: "4-12" },
        { name: "Woodworking", ageRange: "8-12" },
        { name: "Foreign Languages", ageRange: "3-18" },
        { name: "Korean Language", ageRange: "4-12" },
        { name: "Debate", ageRange: "12-18" },
        { name: "Model UN", ageRange: "14-18" }
        ]
      },
      
      // Entertainment & Play
      "entertainment_play": {
        name: "Entertainment & Play",
        description: "Fun activities, toys, and entertainment",
        interests: [
                  { name: "Cars", ageRange: "2-8" },
        { name: "Trains", ageRange: "2-8" },
        { name: "Dolls", ageRange: "2-8" },
        { name: "Gaming", ageRange: "5-18" },
        { name: "Video Games", ageRange: "5-18" },
        { name: "Social Media", ageRange: "13-18" }
        ]
      },
      
      // Lifestyle & Wellness
      "lifestyle_wellness": {
        name: "Lifestyle & Wellness",
        description: "Daily life activities and wellness practices",
        interests: [
                  { name: "Cooking", ageRange: "4-12" },
        { name: "Baking", ageRange: "6-18" },
        { name: "Healthy Eating", ageRange: "3-12" },
        { name: "Meditation", ageRange: "8-18" },
        { name: "Gardening", ageRange: "4-12" },
        { name: "Nature", ageRange: "2-12" },
        { name: "Travel", ageRange: "10-18" },
        { name: "Driving", ageRange: "16-18" }
        ]
      },
      
      // Social & Business
      "social_business": {
        name: "Social & Business",
        description: "Social activities and business skills",
        interests: [
                  { name: "Activism", ageRange: "14-18" },
        { name: "Volunteering", ageRange: "12-18" },
        { name: "Entrepreneurship", ageRange: "12-18" },
        { name: "Investing", ageRange: "14-18" }
        ]
      }
    };
    
    console.log(`📋 Importing ${Object.keys(structuredInterests).length} categories with Firebase auto-generated keys...`);
    
    const importedCategories = [];
    const importedInterests = [];
    
    // Import each category and its interests as subcollections
    for (const [categoryId, categoryData] of Object.entries(structuredInterests)) {
      try {
        console.log(`\n🏷️  Processing category: ${categoryData.name}`);
        
        // Create the category document
        const categoryRef = db.collection('child_interests').doc(categoryId);
        const categoryDoc = {
          name: categoryData.name,
          description: categoryData.description,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await categoryRef.set(categoryDoc);
        
        const importedCategory = {
          key: categoryId,
          name: categoryData.name,
          description: categoryData.description
        };
        
        importedCategories.push(importedCategory);
        console.log(`   ✅ Category created: ${categoryData.name}`);
        
        // Import interests as subcollection
        for (const interest of categoryData.interests) {
          try {
            const interestRef = categoryRef.collection('interests').doc(); // Let Firebase generate the key
                         const interestDoc = {
               name: interest.name,
               ageRange: interest.ageRange,
               createdAt: admin.firestore.FieldValue.serverTimestamp(),
               updatedAt: admin.firestore.FieldValue.serverTimestamp()
             };
            
            await interestRef.set(interestDoc);
            
            const importedInterest = {
              key: interestRef.id,
              name: interest.name,
              category: categoryId,
              categoryName: categoryData.name,
              ageRange: interest.ageRange
            };
            
            importedInterests.push(importedInterest);
            console.log(`   ✅ Interest imported: ${interest.name} (Key: ${interestRef.id})`);
            
          } catch (error) {
            console.error(`   ❌ Error importing interest ${interest.name}:`, error.message);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing category ${categoryId}:`, error.message);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   🏷️  Categories: ${importedCategories.length}`);
    console.log(`   📋 Total interests: ${importedInterests.length}`);
    console.log(`   ✅ Successfully imported: ${importedInterests.length} interests`);
    console.log(`   🔑 Using Firebase auto-generated keys for interests`);
    console.log(`   🏗️  Hierarchical structure: categories/interests subcollections`);
    
    console.log('\n🏷️  Categories created:');
    importedCategories.forEach(category => {
      const categoryInterests = importedInterests.filter(i => i.category === category.key);
      console.log(`   • ${category.name}: ${categoryInterests.length} interests`);
    });
    
    console.log('\n✅ Hierarchical child interests import completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

importHierarchicalChildInterests();
