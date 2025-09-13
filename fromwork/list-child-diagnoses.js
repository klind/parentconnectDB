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

async function listAllChildDiagnoses() {
  try {
    console.log('Fetching all child diagnoses from the database...');
    
    // Get all categories from the child_diagnoses collection
    const categoriesSnapshot = await db.collection('child_diagnoses').get();
    
    if (categoriesSnapshot.empty) {
      console.log('No child diagnoses found in the database.');
      return;
    }
    
    const result = {
      collection: 'child_diagnoses',
      totalCategories: categoriesSnapshot.size,
      categories: {}
    };
    
    let totalDiagnoses = 0;
    
    // Iterate through each category
    for (const categoryDoc of categoriesSnapshot.docs) {
      const categoryData = categoryDoc.data();
      const categoryId = categoryDoc.id;
      
      // Get diagnoses for this category
      const diagnosesSnapshot = await categoryDoc.ref.collection('diagnoses').get();
      const diagnoses = {};
      
      diagnosesSnapshot.forEach((diagnosisDoc) => {
        const diagnosisData = diagnosisDoc.data();
        diagnoses[diagnosisDoc.id] = cleanFirestoreData(diagnosisData);
      });
      
      result.categories[categoryId] = {
        ...cleanFirestoreData(categoryData),
        diagnoses: diagnoses,
        diagnosisCount: diagnosesSnapshot.size
      };
      
      totalDiagnoses += diagnosesSnapshot.size;
    }
    
    result.totalDiagnoses = totalDiagnoses;
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error fetching child diagnoses:', error);
    throw error;
  }
}

async function listChildDiagnosesByCategory(categoryId) {
  try {
    console.log(`Fetching child diagnoses for category: ${categoryId}...`);
    
    // Get the specific category
    const categoryDoc = await db.collection('child_diagnoses').doc(categoryId).get();
    
    if (!categoryDoc.exists) {
      console.log(`Category ${categoryId} not found in the database.`);
      return;
    }
    
    const categoryData = categoryDoc.data();
    
    // Get diagnoses for this category
    const diagnosesSnapshot = await categoryDoc.ref.collection('diagnoses').get();
    const diagnoses = {};
    
    diagnosesSnapshot.forEach((diagnosisDoc) => {
      const diagnosisData = diagnosisDoc.data();
      diagnoses[diagnosisDoc.id] = cleanFirestoreData(diagnosisData);
    });
    
    const result = {
      collection: 'child_diagnoses',
      category: categoryId,
      categoryData: cleanFirestoreData(categoryData),
      totalDiagnoses: diagnosesSnapshot.size,
      diagnoses: diagnoses
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error fetching child diagnoses by category:', error);
    throw error;
  }
}

async function getChildDiagnosesStatistics() {
  try {
    console.log('Fetching child diagnoses statistics...');
    
    // Get all categories
    const categoriesSnapshot = await db.collection('child_diagnoses').get();
    
    if (categoriesSnapshot.empty) {
      console.log('No child diagnoses found in the database.');
      return;
    }
    
    const stats = {
      totalCategories: categoriesSnapshot.size,
      totalDiagnoses: 0,
      byCategory: {},
      bySeverity: {},
      byAgeRange: {}
    };
    
    // Iterate through each category
    for (const categoryDoc of categoriesSnapshot.docs) {
      const categoryData = categoryDoc.data();
      const categoryId = categoryDoc.id;
      
      // Get diagnoses for this category
      const diagnosesSnapshot = await categoryDoc.ref.collection('diagnoses').get();
      
      stats.byCategory[categoryData.name] = {
        count: diagnosesSnapshot.size,
        icon: categoryData.icon
      };
      
      stats.totalDiagnoses += diagnosesSnapshot.size;
      
      // Count by severity and age range
      diagnosesSnapshot.forEach((diagnosisDoc) => {
        const diagnosisData = diagnosisDoc.data();
        
        // Count by severity
        const severity = diagnosisData.severity || 'unknown';
        stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
        
        // Count by age range
        const ageRange = diagnosisData.ageRange || 'unknown';
        stats.byAgeRange[ageRange] = (stats.byAgeRange[ageRange] || 0) + 1;
      });
    }
    
    // Convert to percentages
    const bySeverityWithPercentages = {};
    Object.entries(stats.bySeverity).forEach(([severity, count]) => {
      bySeverityWithPercentages[severity] = {
        count: count,
        percentage: ((count / stats.totalDiagnoses) * 100).toFixed(1)
      };
    });
    
    const byAgeRangeWithPercentages = {};
    Object.entries(stats.byAgeRange).forEach(([ageRange, count]) => {
      byAgeRangeWithPercentages[ageRange] = {
        count: count,
        percentage: ((count / stats.totalDiagnoses) * 100).toFixed(1)
      };
    });
    
    const result = {
      totalCategories: stats.totalCategories,
      totalDiagnoses: stats.totalDiagnoses,
      byCategory: stats.byCategory,
      bySeverity: bySeverityWithPercentages,
      byAgeRange: byAgeRangeWithPercentages
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error fetching child diagnoses statistics:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Choose which function to run:
    
    // Option 1: List all child diagnoses with categories
    await listAllChildDiagnoses();
    
    // Option 2: List child diagnoses by specific category
    // await listChildDiagnosesByCategory('neurodevelopmental_behavioral');
    
    // Option 3: Get child diagnoses statistics
    // await getChildDiagnosesStatistics();
    
    console.log('\nChild diagnoses listing completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Child diagnoses listing failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  listAllChildDiagnoses,
  listChildDiagnosesByCategory,
  getChildDiagnosesStatistics
}; 