const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com'
});

const db = admin.firestore();

async function verifyAgeRanges() {
  try {
    console.log('Verifying age_ranges collection...');
    
    const snapshot = await db.collection('age_ranges').orderBy('order').get();
    
    if (snapshot.empty) {
      console.log('No age ranges found in the collection.');
      return;
    }
    
    console.log(`Found ${snapshot.size} age ranges:`);
    console.log('='.repeat(50));
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`${data.order}. ${data.label}`);
      console.log(`   Age Range: ${data.minAge}-${data.maxAge} years`);
      console.log(`   Category: ${data.category}`);
      console.log(`   Description: ${data.description}`);
      if (data.specialNotes) {
        console.log(`   Special Notes: ${data.specialNotes}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('Error verifying age ranges:', error);
  }
}

verifyAgeRanges().then(() => {
  console.log('Verification completed!');
  process.exit(0);
}).catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});
