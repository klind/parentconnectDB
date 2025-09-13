const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Make sure you have your service account key file or use environment variables
const serviceAccount = require('./serviceAccountKey.json'); // Update path to your service account key

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

async function listAllChildInterests() {
  try {
    console.log('Fetching all child interests from the database...');
    
    // Get all child interests from the child_interests collection
    const interestsSnapshot = await db.collection('child_interests').get();
    
    if (interestsSnapshot.empty) {
      console.log('No child interests found in the database.');
      return;
    }
    
    const interests = {};
    interestsSnapshot.forEach((doc) => {
      const interestData = doc.data();
      interests[doc.id] = cleanFirestoreData(interestData);
    });
    
    const result = {
      collection: 'child_interests',
      total: Object.keys(interests).length,
      data: interests
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error fetching child interests:', error);
    throw error;
  }
}

async function listChildInterestsByCategory(category) {
  try {
    console.log(`Fetching child interests with category: ${category}...`);
    
    // Get child interests with specific category
    const interestsSnapshot = await db.collection('child_interests').where('category', '==', category).get();
    
    if (interestsSnapshot.empty) {
      console.log(`No child interests found with category: ${category}`);
      return;
    }
    
    const interests = {};
    interestsSnapshot.forEach((doc) => {
      const interestData = doc.data();
      interests[doc.id] = cleanFirestoreData(interestData);
    });
    
    const result = {
      collection: 'child_interests',
      filter: { category: category },
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
    
    // Get child interests with specific age group
    const interestsSnapshot = await db.collection('child_interests').where('ageGroup', '==', ageGroup).get();
    
    if (interestsSnapshot.empty) {
      console.log(`No child interests found for age group: ${ageGroup}`);
      return;
    }
    
    const interests = {};
    interestsSnapshot.forEach((doc) => {
      const interestData = doc.data();
      interests[doc.id] = cleanFirestoreData(interestData);
    });
    
    const result = {
      collection: 'child_interests',
      filter: { ageGroup: ageGroup },
      total: Object.keys(interests).length,
      data: interests
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
    
    // Get all child interests
    const interestsSnapshot = await db.collection('child_interests').get();
    
    if (interestsSnapshot.empty) {
      console.log('No child interests found in the database.');
      return;
    }
    
    const stats = {
      total: interestsSnapshot.size,
      byCategory: {},
      byAgeGroup: {},
      byStatus: {},
      byMonth: {}
    };
    
    interestsSnapshot.forEach(doc => {
      const interestData = doc.data();
      
      // Count by category
      const category = interestData.category || 'unknown';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      
      // Count by age group
      const ageGroup = interestData.ageGroup || 'unknown';
      stats.byAgeGroup[ageGroup] = (stats.byAgeGroup[ageGroup] || 0) + 1;
      
      // Count by status
      const status = interestData.status || 'unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      
      // Count by month
      if (interestData.createdAt) {
        let date;
        try {
          // If it's a Firestore Timestamp
          if (interestData.createdAt.toDate && typeof interestData.createdAt.toDate === 'function') {
            date = new Date(interestData.createdAt.toDate());
          }
          // If it's already a Date object
          else if (interestData.createdAt instanceof Date) {
            date = interestData.createdAt;
          }
          // If it's a string or number
          else if (typeof interestData.createdAt === 'string' || typeof interestData.createdAt === 'number') {
            date = new Date(interestData.createdAt);
          }
          // If it's a Firestore Timestamp object (different format)
          else if (interestData.createdAt._seconds) {
            date = new Date(interestData.createdAt._seconds * 1000);
          }
          
          if (date && !isNaN(date.getTime())) {
            const month = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
          }
        } catch (error) {
          // Skip invalid dates
        }
      }
    });
    
    // Convert to percentages
    const byCategoryWithPercentages = {};
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      byCategoryWithPercentages[category] = {
        count: count,
        percentage: ((count / stats.total) * 100).toFixed(1)
      };
    });
    
    const byAgeGroupWithPercentages = {};
    Object.entries(stats.byAgeGroup).forEach(([ageGroup, count]) => {
      byAgeGroupWithPercentages[ageGroup] = {
        count: count,
        percentage: ((count / stats.total) * 100).toFixed(1)
      };
    });
    
    const byStatusWithPercentages = {};
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      byStatusWithPercentages[status] = {
        count: count,
        percentage: ((count / stats.total) * 100).toFixed(1)
      };
    });
    
    const result = {
      total: stats.total,
      byCategory: byCategoryWithPercentages,
      byAgeGroup: byAgeGroupWithPercentages,
      byStatus: byStatusWithPercentages,
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
    
    // Option 1: List all child interests
    await listAllChildInterests();
    
    // Option 2: List child interests by category (e.g., 'sports', 'arts', 'education')
    // await listChildInterestsByCategory('sports');
    
    // Option 3: List child interests by age group (e.g., 'toddler', 'preschool', 'school-age')
    // await listChildInterestsByAgeGroup('toddler');
    
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