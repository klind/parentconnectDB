const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com'
});

const db = admin.firestore();

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
    
    console.log(`Found ${ageRanges.length} age ranges:`);
    console.log('='.repeat(60));
    
    ageRanges.forEach((range, index) => {
      console.log(`${index + 1}. ${range.label}`);
      console.log(`   Age Range: ${range.minAge}-${range.maxAge} years`);
      console.log(`   Description: ${range.description}`);
      console.log(`   Document ID: ${range.id}`);
      console.log('');
    });
    
    const result = {
      collection: 'age_ranges',
      total: ageRanges.length,
      data: ageRanges
    };
    
    console.log('JSON Output:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error fetching age ranges:', error);
  }
}

listAgeRanges().then(() => {
  console.log('\nAge ranges listing completed!');
  process.exit(0);
}).catch(error => {
  console.error('Age ranges listing failed:', error);
  process.exit(1);
});
