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

async function listAllAllergies() {
  try {
    console.log('Fetching all allergies from the database...');
    
    // Get all allergies from the allergies collection
    const allergiesSnapshot = await db.collection('allergies').get();
    
    if (allergiesSnapshot.empty) {
      console.log('No allergies found in the database.');
      return;
    }
    
    const allergies = {};
    allergiesSnapshot.forEach((doc) => {
      const allergyData = doc.data();
      allergies[doc.id] = cleanFirestoreData(allergyData);
    });
    
    const result = {
      collection: 'allergies',
      total: Object.keys(allergies).length,
      data: allergies
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error fetching allergies:', error);
    throw error;
  }
}

async function listAllergiesByCategory(category) {
  try {
    console.log(`Fetching allergies in category: ${category}`);
    
    // Get allergies filtered by category
    const allergiesSnapshot = await db.collection('allergies')
      .where('category', '==', category)
      .get();
    
    if (allergiesSnapshot.empty) {
      console.log(`No allergies found in category: ${category}`);
      return;
    }
    
    const allergies = {};
    allergiesSnapshot.forEach((doc) => {
      const allergyData = doc.data();
      allergies[doc.id] = cleanFirestoreData(allergyData);
    });
    
    const result = {
      collection: 'allergies',
      category: category,
      total: Object.keys(allergies).length,
      data: allergies
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error fetching allergies by category:', error);
    throw error;
  }
}

async function listAllergiesBySeverity(severity) {
  try {
    console.log(`Fetching allergies with severity: ${severity}`);
    
    // Get allergies filtered by severity
    const allergiesSnapshot = await db.collection('allergies')
      .where('severity', '==', severity)
      .get();
    
    if (allergiesSnapshot.empty) {
      console.log(`No allergies found with severity: ${severity}`);
      return;
    }
    
    const allergies = {};
    allergiesSnapshot.forEach((doc) => {
      const allergyData = doc.data();
      allergies[doc.id] = cleanFirestoreData(allergyData);
    });
    
    const result = {
      collection: 'allergies',
      severity: severity,
      total: Object.keys(allergies).length,
      data: allergies
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error fetching allergies by severity:', error);
    throw error;
  }
}

async function getAllergiesStatistics() {
  try {
    console.log('Fetching allergies statistics...');
    
    // Get all allergies from the allergies collection
    const allergiesSnapshot = await db.collection('allergies').get();
    
    if (allergiesSnapshot.empty) {
      console.log('No allergies found in the database.');
      return;
    }
    
    const stats = {
      total: allergiesSnapshot.size,
      byCategory: {},
      bySeverity: {}
    };
    
    // Process each allergy
    allergiesSnapshot.forEach((doc) => {
      const allergyData = doc.data();
      
      // Count by category
      const category = allergyData.category || 'unknown';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      
      // Count by severity
      const severity = allergyData.severity || 'unknown';
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
    });
    
    // Convert to percentages
    const byCategoryWithPercentages = {};
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      byCategoryWithPercentages[category] = {
        count: count,
        percentage: ((count / stats.total) * 100).toFixed(1)
      };
    });
    
    const bySeverityWithPercentages = {};
    Object.entries(stats.bySeverity).forEach(([severity, count]) => {
      bySeverityWithPercentages[severity] = {
        count: count,
        percentage: ((count / stats.total) * 100).toFixed(1)
      };
    });
    
    const result = {
      total: stats.total,
      byCategory: byCategoryWithPercentages,
      bySeverity: bySeverityWithPercentages
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error fetching allergies statistics:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Choose which function to run:

    // Option 1: List all allergies
    await listAllAllergies();

    // Option 2: List allergies by specific category
    // await listAllergiesByCategory('nuts');

    // Option 3: List allergies by specific severity
    // await listAllergiesBySeverity('high');

    // Option 4: Get allergies statistics
    // await getAllergiesStatistics();

    console.log('\nAllergies listing completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Allergies listing failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  listAllAllergies,
  listAllergiesByCategory,
  listAllergiesBySeverity,
  getAllergiesStatistics
}; 