const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listResourceForReview() {
  try {
    console.log('Reading resource_for_review collection...');
    
    const snapshot = await db.collection('resource_for_review').get();
    
    if (snapshot.empty) {
      console.log('No resources for review found in the database.');
      return;
    }
    
    console.log(`Found ${snapshot.size} resources for review:`);
    console.log('=' .repeat(50));
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\nResource ID: ${doc.id}`);
      console.log('Data:', JSON.stringify(data, null, 2));
      console.log('-'.repeat(30));
    });
    
  } catch (error) {
    console.error('Error reading resource_for_review:', error);
  } finally {
    process.exit(0);
  }
}

listResourceForReview();

