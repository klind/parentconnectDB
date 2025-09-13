const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Load the public fields configuration
const publicFieldsConfig = require('../../user_field_visibility_config.json');

/**
 * Check if a field path matches any of the public field patterns
 * @param {string} fieldPath - The field path to check
 * @param {Array} publicFields - Array of public field patterns
 * @returns {boolean} True if the field should be public
 */
function isPublicField(fieldPath, publicFields) {
  return publicFields.some(publicField => {
    // Exact match
    if (fieldPath === publicField) {
      return true;
    }
    
    // Check if field is a child of the public field (e.g., "location.city" matches "location.city")
    if (fieldPath.startsWith(publicField + '.')) {
      return true;
    }
    
    // Check if public field is a parent of this field (e.g., "location" matches "location.city")
    if (publicField.endsWith('*') && fieldPath.startsWith(publicField.slice(0, -1))) {
      return true;
    }
    
    return false;
  });
}

/**
 * Extract all field paths from a user document
 * @param {Object} userData - The user document data
 * @returns {Array} Array of field paths
 */
function extractUserFields(userData) {
  const fields = [];
  
  function extractFields(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Recursively extract nested fields
        extractFields(value, fieldPath);
      } else {
        // Add the field path
        fields.push(fieldPath);
      }
    }
  }
  
  extractFields(userData);
  return fields;
}

async function checkDuplicateUserFields() {
  try {
    console.log('🔍 Checking for duplicate fields between users_private_data and users_public_data...');
    console.log(`📋 Public fields configuration: ${JSON.stringify(publicFieldsConfig.publicFields, null, 2)}`);
    console.log('');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in the database.');
      return;
    }
    
    console.log(`📊 Analyzing ${usersSnapshot.size} users...`);
    
    const allFields = new Set();
    const publicFields = new Set();
    const privateFields = new Set();
    const duplicateFields = new Set();
    
    // Process each user
    usersSnapshot.docs.forEach((doc, index) => {
      const userData = doc.data();
      const userFields = extractUserFields(userData);
      
      userFields.forEach(field => {
        allFields.add(field);
        
        if (isPublicField(field, publicFieldsConfig.publicFields)) {
          publicFields.add(field);
        } else {
          privateFields.add(field);
        }
      });
      
      if ((index + 1) % 10 === 0) {
        console.log(`   Processed ${index + 1}/${usersSnapshot.size} users...`);
      }
    });
    
    // Check for potential duplicates
    // A field is considered a duplicate if:
    // 1. It's marked as public in the config
    // 2. But there might be a more specific version that would be private
    
    publicFields.forEach(publicField => {
      // Check if there are any private fields that are children of this public field
      const hasPrivateChildren = Array.from(privateFields).some(privateField => {
        return privateField.startsWith(publicField + '.');
      });
      
      if (hasPrivateChildren) {
        duplicateFields.add(publicField);
      }
    });
    
    // Also check for fields that might exist in both forms
    allFields.forEach(field => {
      if (isPublicField(field, publicFieldsConfig.publicFields)) {
        // This field would be in public data
        // Check if there's a more general version that might also be public
        const fieldParts = field.split('.');
        for (let i = 1; i < fieldParts.length; i++) {
          const parentField = fieldParts.slice(0, i).join('.');
          if (isPublicField(parentField, publicFieldsConfig.publicFields)) {
            duplicateFields.add(parentField);
          }
        }
      }
    });
    
    console.log('\n📊 ANALYSIS RESULTS:');
    console.log('='.repeat(60));
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`   Total unique fields: ${allFields.size}`);
    console.log(`   Fields that would be PUBLIC: ${publicFields.size}`);
    console.log(`   Fields that would be PRIVATE: ${privateFields.size}`);
    console.log(`   Potential DUPLICATE fields: ${duplicateFields.size}`);
    
    if (duplicateFields.size > 0) {
      console.log(`\n⚠️  DUPLICATE FIELDS FOUND:`);
      console.log('   These fields might appear in both collections:');
      Array.from(duplicateFields).sort().forEach(field => {
        console.log(`   • ${field}`);
      });
      
      console.log(`\n🔍 DETAILED ANALYSIS:`);
      Array.from(duplicateFields).sort().forEach(field => {
        const privateChildren = Array.from(privateFields).filter(f => f.startsWith(field + '.'));
        console.log(`\n   Field: ${field}`);
        console.log(`   Public: YES`);
        console.log(`   Private children: ${privateChildren.length > 0 ? privateChildren.join(', ') : 'None'}`);
      });
    } else {
      console.log(`\n✅ NO DUPLICATE FIELDS FOUND`);
      console.log('   All fields are cleanly separated between public and private collections.');
    }
    
    console.log(`\n🌐 PUBLIC FIELDS (${publicFields.size}):`);
    Array.from(publicFields).sort().forEach(field => {
      console.log(`   ✓ ${field}`);
    });
    
    console.log(`\n🔒 PRIVATE FIELDS (${privateFields.size}):`);
    Array.from(privateFields).sort().forEach(field => {
      console.log(`   • ${field}`);
    });
    
    // Additional analysis for specific field types
    console.log(`\n🎯 FIELD TYPE ANALYSIS:`);
    const locationFields = Array.from(allFields).filter(f => f.startsWith('location.'));
    const preferenceFields = Array.from(allFields).filter(f => f.startsWith('preferences.'));
    const childFields = Array.from(allFields).filter(f => f.startsWith('_subcollections.children.'));
    
    console.log(`   Location fields: ${locationFields.length} (${locationFields.filter(f => publicFields.has(f)).length} public, ${locationFields.filter(f => privateFields.has(f)).length} private)`);
    console.log(`   Preference fields: ${preferenceFields.length} (${preferenceFields.filter(f => publicFields.has(f)).length} public, ${preferenceFields.filter(f => privateFields.has(f)).length} private)`);
    console.log(`   Child-related fields: ${childFields.length} (${childFields.filter(f => publicFields.has(f)).length} public, ${childFields.filter(f => privateFields.has(f)).length} private)`);
    
  } catch (error) {
    console.error('❌ Error checking duplicate user fields:', error);
  } finally {
    process.exit(0);
  }
}

checkDuplicateUserFields();
