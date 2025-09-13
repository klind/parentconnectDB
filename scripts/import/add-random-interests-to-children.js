const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addRandomInterestsToChildren() {
  try {
    console.log('🔄 Starting to add random interests to children...');
    
    // Step 1: Get all categories and their interests
    console.log('📋 Step 1: Fetching categories and interests...');
    const categoriesSnapshot = await db.collection('child_interests').get();
    
    if (categoriesSnapshot.empty) {
      console.log('❌ No categories found in the database.');
      return;
    }
    
    const allInterests = [];
    
    // Collect all interests from all categories
    for (const categoryDoc of categoriesSnapshot.docs) {
      const categoryId = categoryDoc.id;
      const categoryData = categoryDoc.data();
      
      const interestsSnapshot = await categoryDoc.ref.collection('interests').get();
      
      interestsSnapshot.forEach(doc => {
        const interestData = doc.data();
        allInterests.push({
          key: doc.id,
          name: interestData.name,
          category: categoryId,
          categoryName: categoryData.name,
          ageRange: interestData.ageRange,
          searchTerms: interestData.searchTerms || []
        });
      });
    }
    
    console.log(`✅ Found ${allInterests.length} interests across ${categoriesSnapshot.size} categories`);
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
            const childAge = childData.age || 5; // Default to 5 if age not specified
            
            try {
              // Filter interests by age appropriateness
              const ageAppropriateInterests = allInterests.filter(interest => {
                const [minAge, maxAge] = interest.ageRange.split('-').map(Number);
                return childAge >= minAge && childAge <= maxAge;
              });
              
              if (ageAppropriateInterests.length === 0) {
                console.log(`   ⚠️  Child ${childData.name || childDoc.id} (age ${childAge}): No age-appropriate interests found`);
                continue;
              }
              
              // Randomly select 2-5 interests for this child
              const numInterests = Math.floor(Math.random() * 4) + 2; // 2, 3, 4, or 5
              const maxInterests = Math.min(numInterests, ageAppropriateInterests.length);
              const randomInterests = [];
              
              if (maxInterests > 0) {
                // Shuffle interests and pick random ones
                const shuffledInterests = [...ageAppropriateInterests].sort(() => Math.random() - 0.5);
                const selectedInterests = shuffledInterests.slice(0, maxInterests);
                
                // Add the interest objects (key and name) to the child
                const interestObjects = selectedInterests.map(interest => ({
                  key: interest.key,
                  name: interest.name,
                  category: interest.category,
                  categoryName: interest.categoryName
                }));
                randomInterests.push(...interestObjects);
              }
              
              // Update child with random interests
              await childDoc.ref.update({
                interests: randomInterests
              });
              
              if (randomInterests.length > 0) {
                const interestNames = randomInterests.map(i => i.name);
                const categories = [...new Set(randomInterests.map(i => i.categoryName))];
                console.log(`   ✅ Child ${childData.name || childDoc.id} (age ${childAge}): ${interestNames.join(', ')} [${categories.join(', ')}]`);
              } else {
                console.log(`   ✅ Child ${childData.name || childDoc.id} (age ${childAge}): No interests assigned`);
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
    console.log(`   🏷️  Categories: ${categoriesSnapshot.size}`);
    console.log(`   📋 Available interests: ${allInterests.length}`);
    console.log(`   👶 Total children: ${totalChildren}`);
    console.log(`   ✅ Updated: ${updatedChildren} children`);
    console.log(`   ❌ Errors: ${errorCount} children`);
    console.log(`   🔑 Using Firebase-generated interest keys`);
    console.log(`   📝 Storing key, name, category, and categoryName for fast retrieval`);
    console.log(`   🎯 Age-appropriate filtering applied`);
    
    console.log('\n✅ Random interests assignment completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

addRandomInterestsToChildren();






