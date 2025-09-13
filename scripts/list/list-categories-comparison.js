const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://parentconnect2025.firebaseio.com',
  storageBucket: 'parentconnect2025.firebasestorage.app'
});

const db = admin.firestore();

async function listCategoriesComparison() {
  try {
    // Get activity_categories collection
    const categoriesSnapshot = await db.collection('activity_categories').get();
    const definedCategories = [];
    
    categoriesSnapshot.forEach(doc => {
      definedCategories.push(doc.data().name);
    });

    // Get unique categories used in activities
    const activitiesSnapshot = await db.collection('activities').get();
    const usedCategoryIds = new Set();
    
    activitiesSnapshot.forEach(doc => {
      const category = doc.data().category;
      if (category) {
        usedCategoryIds.add(category);
      }
    });

    // Get names for used category IDs
    const usedCategories = [];
    for (const categoryId of usedCategoryIds) {
      const categoryDoc = await db.collection('activity_categories').doc(categoryId).get();
      if (categoryDoc.exists) {
        usedCategories.push(categoryDoc.data().name);
      } else {
        usedCategories.push(categoryId); // fallback for "Sports & Fitness"
      }
    }

    console.log('📋 Defined in activity_categories:');
    definedCategories.sort().forEach((name, i) => {
      console.log(`${i + 1}. ${name}`);
    });

    console.log('\n🏷️  Used in activities:');
    usedCategories.sort().forEach((name, i) => {
      console.log(`${i + 1}. ${name}`);
    });

    // Check for categories used but not defined
    const definedSet = new Set(definedCategories);
    const usedSet = new Set(usedCategories);
    const undefinedUsed = usedCategories.filter(cat => !definedSet.has(cat));
    const unusedDefined = definedCategories.filter(cat => !usedSet.has(cat));

    if (undefinedUsed.length > 0) {
      console.log('\n❓ Used in activities but NOT defined in activity_categories:');
      undefinedUsed.forEach((name, i) => {
        console.log(`${i + 1}. ${name}`);
      });
    }

    if (unusedDefined.length > 0) {
      console.log('\n⚠️  Defined in activity_categories but NOT used in activities:');
      unusedDefined.forEach((name, i) => {
        console.log(`${i + 1}. ${name}`);
      });
    }

    if (undefinedUsed.length === 0 && unusedDefined.length === 0) {
      console.log('\n✅ Perfect match! All defined categories are used and all used categories are defined.');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the script
if (require.main === module) {
  listCategoriesComparison();
}

module.exports = { listCategoriesComparison };
