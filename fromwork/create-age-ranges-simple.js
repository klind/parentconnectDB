const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com' // Update with your project ID
});

const db = admin.firestore();

// Age ranges data - simplified with only essential fields
const ageRanges = [
  {
    description: 'Children from birth to 2 years old',
    label: 'Infants & Toddlers',
    maxAge: 2,
    minAge: 0
  },
  {
    description: 'Children ages 3-4 years old',
    label: 'Preschool',
    maxAge: 4,
    minAge: 3
  },
  {
    description: 'Children ages 5-7 years old',
    label: 'Early Elementary',
    maxAge: 7,
    minAge: 5
  },
  {
    description: 'Children ages 8-10 years old',
    label: 'Late Elementary',
    maxAge: 10,
    minAge: 8
  },
  {
    description: 'Children ages 11-13 years old (COPPA still applies under 13)',
    label: 'Middle School',
    maxAge: 13,
    minAge: 11
  },
  {
    description: 'Teenagers ages 14-15 years old',
    label: 'Early Teens',
    maxAge: 15,
    minAge: 14
  },
  {
    description: 'Teenagers ages 16-17 years old',
    label: 'Older Teens',
    maxAge: 17,
    minAge: 16
  }
];

// Function to create the age_ranges collection
async function createAgeRangesCollection() {
  try {
    console.log('Creating simplified age_ranges collection...');
    
    const batch = db.batch();
    const collectionRef = db.collection('age_ranges');
    
    // Add each age range to the batch (Firebase will auto-generate document IDs)
    ageRanges.forEach(ageRange => {
      const docRef = collectionRef.doc(); // Let Firebase generate the ID
      batch.set(docRef, ageRange);
    });
    
    // Commit the batch
    await batch.commit();
    
    console.log(`Successfully created ${ageRanges.length} age range documents`);
    
    // Verify the collection was created
    const snapshot = await collectionRef.get();
    console.log(`Verification: Found ${snapshot.size} documents in age_ranges collection`);
    
    return {
      success: true,
      totalDocuments: snapshot.size,
      documents: snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }))
    };
    
  } catch (error) {
    console.error('Error creating age_ranges collection:', error);
    throw error;
  }
}

// Function to list all age ranges
async function listAgeRanges() {
  try {
    console.log('Fetching all age ranges...');
    
    const snapshot = await db.collection('age_ranges').get();
    
    if (snapshot.empty) {
      console.log('No age ranges found in the collection.');
      return;
    }
    
    const ageRanges = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      ageRanges.push({
        id: doc.id,
        ...data
      });
    });
    
    // Sort by minAge for better display
    ageRanges.sort((a, b) => a.minAge - b.minAge);
    
    const result = {
      collection: 'age_ranges',
      total: ageRanges.length,
      data: ageRanges
    };
    
    console.log(JSON.stringify(result, null, 2));
    return result;
    
  } catch (error) {
    console.error('Error fetching age ranges:', error);
    throw error;
  }
}

// Function to get age range by age
async function getAgeRangeByAge(age) {
  try {
    console.log(`Finding age range for age ${age}...`);
    
    const snapshot = await db.collection('age_ranges')
      .where('minAge', '<=', age)
      .where('maxAge', '>=', age)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      console.log(`No age range found for age ${age}`);
      return null;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    const result = {
      id: doc.id,
      ...data
    };
    
    console.log(`Age ${age} falls into: ${result.label} (${result.minAge}-${result.maxAge})`);
    return result;
    
  } catch (error) {
    console.error('Error finding age range by age:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Choose which function to run:
    
    // Option 1: Create the age_ranges collection
    // await createAgeRangesCollection();
    
    // Option 2: List all age ranges
    await listAgeRanges();
    
    // Option 3: Find age range for a specific age
    // await getAgeRangeByAge(8);
    
    console.log('\nAge ranges collection creation completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Age ranges collection creation failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  createAgeRangesCollection,
  listAgeRanges,
  getAgeRangeByAge
};
