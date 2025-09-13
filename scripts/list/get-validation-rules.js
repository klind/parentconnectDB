const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function getValidationRules() {
  try {
    console.log('Retrieving validation_rules from Firestore...');
    
    // Get the validation_rules document
    const docRef = db.collection('validation_rules').doc('main');
    const doc = await docRef.get();
    
    if (!doc.exists) {
      console.log('❌ No validation_rules document found with ID: main');
      console.log('Make sure to run insert-validation-rules.js first to create the document.');
      return;
    }
    
    const validationRules = doc.data();
    
    console.log('✅ validation_rules retrieved successfully!');
    console.log('Document ID: main');
    console.log('Collection: validation_rules');
    console.log('\n=== VALIDATION RULES JSON ===\n');
    
    // Output the JSON with pretty formatting
    console.log(JSON.stringify(validationRules, null, 2));
    
    console.log('\n=== SUMMARY ===');
    console.log('- Version:', validationRules.version);
    console.log('- Last Updated:', new Date(validationRules.lastUpdated).toISOString());
    console.log('- Character limits:', Object.keys(validationRules.limits || {}).length);
    console.log('- Rate limits:', Object.keys(validationRules.rateLimits || {}).length);
    console.log('- Profanity filtering:', validationRules.profanity?.enabled ? 'enabled' : 'disabled');
    console.log('- PII detection:', validationRules.pii?.enabled ? 'enabled' : 'disabled');
    console.log('- Suspicious content detection:', validationRules.suspicious?.enabled ? 'enabled' : 'disabled');
    console.log('- Email validation:', validationRules.email?.enabled ? 'enabled' : 'disabled');
    
    if (validationRules.email?.enabled) {
      console.log('  - Disposable domains blocked:', validationRules.email.disposableEmailDomains?.length || 0);
      console.log('  - Domain corrections:', Object.keys(validationRules.email.domainCorrections || {}).length);
      console.log('  - Email verification required:', validationRules.email.verification?.required ? 'yes' : 'no');
    }
    
  } catch (error) {
    console.error('❌ Error retrieving validation_rules:', error);
  } finally {
    process.exit(0);
  }
}

getValidationRules();


