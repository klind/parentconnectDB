const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com'
});

const db = admin.firestore();

async function listValidationRules() {
  try {
    console.log('📋 Fetching validation_rules collection...');
    
    // Get all documents in validation_rules collection
    const validationRulesSnapshot = await db.collection('validation_rules').get();
    
    if (validationRulesSnapshot.empty) {
      console.log('❌ No validation rules found');
      return;
    }
    
    console.log(`✅ Found ${validationRulesSnapshot.size} validation rules`);
    
    // Convert to JSON format
    const validationRules = [];
    validationRulesSnapshot.forEach(doc => {
      const data = doc.data();
      // Clean Firestore data for JSON serialization
      const cleanData = {};
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (value && typeof value === 'object') {
          // Handle Firestore Timestamps
          if (value.toDate && typeof value.toDate === 'function') {
            cleanData[key] = value.toDate().toISOString();
          } else if (value._seconds !== undefined) {
            cleanData[key] = new Date(value._seconds * 1000).toISOString();
          } else {
            cleanData[key] = value;
          }
        } else {
          cleanData[key] = value;
        }
      });
      
      validationRules.push({
        id: doc.id,
        ...cleanData
      });
    });
    
    // Output as formatted JSON
    console.log('\n📄 Validation Rules JSON:');
    console.log(JSON.stringify(validationRules, null, 2));
    
    // Also save to file
    const fs = require('fs');
    const outputFile = 'validation_rules.json';
    fs.writeFileSync(outputFile, JSON.stringify(validationRules, null, 2));
    console.log(`\n💾 Saved to ${outputFile}`);
    
  } catch (error) {
    console.error('❌ Error fetching validation rules:', error);
  }
}

listValidationRules().then(() => process.exit(0));








