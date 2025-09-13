const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Load service account from project root
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com' // Update with your project ID
});

const db = admin.firestore();

// Helper function to clean Firestore data for JSON serialization
function cleanFirestoreData(data) {
  const cleanData = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value && typeof value === 'object') {
      // Handle Firestore Timestamps
      if (value.toDate && typeof value.toDate === 'function') {
        cleanData[key] = value.toDate().toISOString();
      }
      // Handle Firestore Timestamp objects with _seconds
      else if (value._seconds) {
        cleanData[key] = new Date(value._seconds * 1000).toISOString();
      }
      // Handle regular Date objects
      else if (value instanceof Date) {
        cleanData[key] = value.toISOString();
      }
      // Handle nested objects (like location, preferences, etc.)
      else {
        cleanData[key] = value;
      }
    } else {
      cleanData[key] = value;
    }
  });
  
  return cleanData;
}

// Helper function to check if an age falls within an age range
function isAgeInRange(age, ageRange) {
  if (!ageRange || typeof ageRange !== 'string') return false;
  
  const [minAge, maxAge] = ageRange.split('-').map(Number);
  if (isNaN(minAge) || isNaN(maxAge)) return false;
  
  return age >= minAge && age <= maxAge;
}

async function listAllChildInterests() {
  try {
    console.log('Fetching all child interests from the database...');
    
    // Get all categories from the child_interests collection
    const categoriesSnapshot = await db.collection('child_interests').get();
    
    if (categoriesSnapshot.empty) {
      console.log('No child interest categories found in the database.');
      return;
    }
    
    const categories = {};
    let totalInterests = 0;
    
    // Process each category and its interests
    for (const categoryDoc of categoriesSnapshot.docs) {
      const categoryId = categoryDoc.id;
      const categoryData = categoryDoc.data();
      
      // Get interests for this category
      const interestsSnapshot = await categoryDoc.ref.collection('interests').get();
      const interests = {};
      
      interestsSnapshot.forEach((doc) => {
        const interestData = doc.data();
        interests[doc.id] = cleanFirestoreData(interestData);
      });
      
      categories[categoryId] = {
        ...cleanFirestoreData(categoryData),
        interests: interests,
        interestCount: interestsSnapshot.size
      };
      
      totalInterests += interestsSnapshot.size;
    }
    
    const result = {
      collection: 'child_interests',
      structure: 'hierarchical (categories/interests)',
      totalCategories: Object.keys(categories).length,
      totalInterests: totalInterests,
      data: categories
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error fetching child interests:', error);
    throw error;
  }
}

async function listChildInterestsByCategory(categoryId) {
  try {
    console.log(`Fetching child interests from category: ${categoryId}...`);
    
    // Get the category document
    const categoryDoc = await db.collection('child_interests').doc(categoryId).get();
    
    if (!categoryDoc.exists) {
      console.log(`Category not found: ${categoryId}`);
      return;
    }
    
    const categoryData = categoryDoc.data();
    
    // Get interests for this category
    const interestsSnapshot = await categoryDoc.ref.collection('interests').get();
    
    if (interestsSnapshot.empty) {
      console.log(`No interests found in category: ${categoryId}`);
      return;
    }
    
    const interests = {};
    interestsSnapshot.forEach((doc) => {
      const interestData = doc.data();
      interests[doc.id] = cleanFirestoreData(interestData);
    });
    
    const result = {
      collection: 'child_interests',
      category: categoryId,
      categoryName: categoryData.name,
      categoryDescription: categoryData.description,
      total: Object.keys(interests).length,
      data: interests
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error fetching child interests by category:', error);
    throw error;
  }
}

async function listChildInterestsByAgeGroup(ageGroup) {
  try {
    console.log(`Fetching child interests for age group: ${ageGroup}...`);
    
    // Convert ageGroup to number for comparison
    const age = parseInt(ageGroup);
    if (isNaN(age)) {
      console.log('Invalid age group. Please provide a number (e.g., 5, 10, 15)');
      return;
    }
    
    // Get all categories and filter interests by age group
    const categoriesSnapshot = await db.collection('child_interests').get();
    
    if (categoriesSnapshot.empty) {
      console.log('No child interest categories found in the database.');
      return;
    }
    
    const categories = {};
    let totalInterests = 0;
    
    // Process each category and filter interests by age group
    for (const categoryDoc of categoriesSnapshot.docs) {
      const categoryId = categoryDoc.id;
      const categoryData = categoryDoc.data();
      
      // Get interests for this category and filter by age group
      const interestsSnapshot = await categoryDoc.ref.collection('interests').get();
      const interests = {};
      
      interestsSnapshot.forEach((doc) => {
        const interestData = doc.data();
        // Check if the interest matches the age group using improved logic
        if (interestData.ageRange && isAgeInRange(age, interestData.ageRange)) {
          interests[doc.id] = cleanFirestoreData(interestData);
        }
      });
      
      // Only include categories that have interests for this age group
      if (Object.keys(interests).length > 0) {
        categories[categoryId] = {
          ...cleanFirestoreData(categoryData),
          interests: interests,
          interestCount: Object.keys(interests).length
        };
        
        totalInterests += Object.keys(interests).length;
      }
    }
    
    const result = {
      collection: 'child_interests',
      filter: { ageGroup: age, ageType: 'exact' },
      structure: 'hierarchical (categories/interests)',
      totalCategories: Object.keys(categories).length,
      totalInterests: totalInterests,
      data: categories
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error fetching child interests by age group:', error);
    throw error;
  }
}

async function getChildInterestsStatistics() {
  try {
    console.log('Fetching child interests statistics...');
    
    // Get all categories
    const categoriesSnapshot = await db.collection('child_interests').get();
    
    if (categoriesSnapshot.empty) {
      console.log('No child interest categories found in the database.');
      return;
    }
    
    const stats = {
      totalCategories: categoriesSnapshot.size,
      totalInterests: 0,
      byCategory: {},
      byAgeRange: {},
      byMonth: {}
    };
    
    // Process each category and its interests
    for (const categoryDoc of categoriesSnapshot.docs) {
      const categoryId = categoryDoc.id;
      const categoryData = categoryDoc.data();
      
      // Get interests for this category
      const interestsSnapshot = await categoryDoc.ref.collection('interests').get();
      const interestCount = interestsSnapshot.size;
      
      stats.totalInterests += interestCount;
      
      // Count by category
      stats.byCategory[categoryId] = {
        name: categoryData.name,
        count: interestCount,
        percentage: 0 // Will be calculated later
      };
      
      // Count by age range
      interestsSnapshot.forEach(doc => {
        const interestData = doc.data();
        const ageRange = interestData.ageRange || 'unknown';
        stats.byAgeRange[ageRange] = (stats.byAgeRange[ageRange] || 0) + 1;
      });
      
      // Count by month (using category creation date)
      if (categoryData.createdAt) {
        let date;
        try {
          // If it's a Firestore Timestamp
          if (categoryData.createdAt.toDate && typeof categoryData.createdAt.toDate === 'function') {
            date = new Date(categoryData.createdAt.toDate());
          }
          // If it's already a Date object
          else if (categoryData.createdAt instanceof Date) {
            date = categoryData.createdAt;
          }
          // If it's a string or number
          else if (typeof categoryData.createdAt === 'string' || typeof categoryData.createdAt === 'number') {
            date = new Date(categoryData.createdAt);
          }
          // If it's a Firestore Timestamp object (different format)
          else if (categoryData.createdAt._seconds) {
            date = new Date(categoryData.createdAt._seconds * 1000);
          }
          
          if (date && !isNaN(date.getTime())) {
            const month = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
          }
        } catch (error) {
          // Skip invalid dates
        }
      }
    }
    
    // Calculate percentages for categories
    Object.values(stats.byCategory).forEach(category => {
      category.percentage = ((category.count / stats.totalInterests) * 100).toFixed(1);
    });
    
    // Convert age range counts to percentages
    const byAgeRangeWithPercentages = {};
    Object.entries(stats.byAgeRange).forEach(([ageRange, count]) => {
      byAgeRangeWithPercentages[ageRange] = {
        count: count,
        percentage: ((count / stats.totalInterests) * 100).toFixed(1)
      };
    });
    
    const result = {
      structure: 'hierarchical (categories/interests)',
      totalCategories: stats.totalCategories,
      totalInterests: stats.totalInterests,
      byCategory: stats.byCategory,
      byAgeRange: byAgeRangeWithPercentages,
      byMonth: stats.byMonth
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error fetching child interests statistics:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Choose which function to run:
    
    // Option 1: List all child interests (hierarchical structure)
    await listAllChildInterests();
    
    // Option 2: List child interests by category ID (e.g., 'creative_arts', 'sports_physical')
    // await listChildInterestsByCategory('creative_arts');
    
    // Option 3: List child interests by age group (e.g., '5', '10', '15')
    // await listChildInterestsByAgeGroup('5');
    
    // Option 4: Get child interests statistics
    // await getChildInterestsStatistics();
    
    console.log('\nChild interests listing completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Child interests listing failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  listAllChildInterests,
  listChildInterestsByCategory,
  listChildInterestsByAgeGroup,
  getChildInterestsStatistics
}; 