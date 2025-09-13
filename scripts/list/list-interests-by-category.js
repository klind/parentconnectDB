const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listInterestsByCategory(categoryId) {
  try {
    console.log(`📋 Fetching interests from category: ${categoryId}...`);
    
    const interestsSnapshot = await db.collection('child_interests')
      .doc(categoryId)
      .collection('interests')
      .get();
    
    if (interestsSnapshot.empty) {
      console.log(`❌ No interests found in category: ${categoryId}`);
      return;
    }
    
    const interests = {};
    interestsSnapshot.forEach((doc) => {
      const interestData = doc.data();
      interests[doc.id] = {
        name: interestData.name,
        ageRange: interestData.ageRange,
        searchTerms: interestData.searchTerms,
        createdAt: interestData.createdAt,
        updatedAt: interestData.updatedAt
      };
    });
    
    const result = {
      category: categoryId,
      collection: `child_interests/${categoryId}/interests`,
      total: Object.keys(interests).length,
      data: interests
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error fetching interests by category:', error);
    throw error;
  }
}

async function main() {
  try {
    // List interests from Creative & Arts category
    await listInterestsByCategory('creative_arts');
    
    console.log('\nInterests by category listing completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Interests by category listing failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  listInterestsByCategory
};






