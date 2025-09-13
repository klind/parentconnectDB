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
 * Recursively extract all field paths from an object
 * @param {Object} obj - The object to extract fields from
 * @param {string} prefix - The current path prefix
 * @returns {Array} Array of field paths
 */
function extractFieldPaths(obj, prefix = '') {
  const fields = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fieldPath = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // Recursively extract nested fields
      fields.push(...extractFieldPaths(value, fieldPath));
    } else {
      // Add the field path
      fields.push(fieldPath);
    }
  }
  
  return fields;
}

/**
 * Get all unique field paths from a collection of user documents
 * @param {Array} userDocs - Array of user document data
 * @returns {Set} Set of unique field paths
 */
function getAllUserFields(userDocs) {
  const allFields = new Set();
  
  userDocs.forEach(userData => {
    const fields = extractFieldPaths(userData);
    fields.forEach(field => allFields.add(field));
  });
  
  return allFields;
}

/**
 * Determine which fields would be public based on the configuration
 * @param {Set} allFields - Set of all user fields
 * @param {Array} publicFieldsConfig - Array of public field patterns
 * @returns {Set} Set of fields that would be public
 */
function getPublicFields(allFields, publicFieldsConfig) {
  const publicFields = new Set();
  
  allFields.forEach(field => {
    // Check if field matches any public field pattern
    const isPublic = publicFieldsConfig.some(publicField => {
      // Exact match
      if (field === publicField) {
        return true;
      }
      
      // Check if field starts with public field pattern (for nested fields)
      if (publicField.includes('*')) {
        const pattern = publicField.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(field);
      }
      
      // Check if field is a child of the public field
      if (field.startsWith(publicField + '.')) {
        return true;
      }
      
      return false;
    });
    
    if (isPublic) {
      publicFields.add(field);
    }
  });
  
  return publicFields;
}

/**
 * Find fields that would appear in both public and private data
 * @param {Set} allFields - Set of all user fields
 * @param {Set} publicFields - Set of public fields
 * @returns {Object} Analysis results
 */
function analyzeFieldOverlap(allFields, publicFields) {
  const privateFields = new Set();
  const overlappingFields = new Set();
  
  allFields.forEach(field => {
    if (publicFields.has(field)) {
      // This field would be in public data
      // Check if it also exists in a form that would be in private data
      const isInPrivate = allFields.has(field) && !publicFields.has(field);
      if (isInPrivate) {
        overlappingFields.add(field);
      }
    } else {
      privateFields.add(field);
    }
  });
  
  // Check for potential overlaps where a field exists in both forms
  allFields.forEach(field => {
    if (publicFields.has(field)) {
      // Check if there's a more specific version that would be private
      const hasPrivateVersion = Array.from(allFields).some(otherField => {
        return otherField.startsWith(field + '.') && !publicFields.has(otherField);
      });
      
      if (hasPrivateVersion) {
        overlappingFields.add(field);
      }
    }
  });
  
  return {
    allFields: Array.from(allFields).sort(),
    publicFields: Array.from(publicFields).sort(),
    privateFields: Array.from(privateFields).sort(),
    overlappingFields: Array.from(overlappingFields).sort()
  };
}

async function analyzeUserFieldOverlap() {
  try {
    console.log('🔍 Analyzing user field overlap between public and private data...');
    console.log(`📋 Public fields configuration: ${JSON.stringify(publicFieldsConfig.publicFields, null, 2)}`);
    console.log('');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in the database.');
      return;
    }
    
    console.log(`📊 Found ${usersSnapshot.size} users to analyze`);
    
    // Extract user data
    const userDocs = usersSnapshot.docs.map(doc => doc.data());
    
    // Get all unique fields from user documents
    const allFields = getAllUserFields(userDocs);
    console.log(`📝 Found ${allFields.size} unique fields across all users`);
    
    // Determine which fields would be public
    const publicFields = getPublicFields(allFields, publicFieldsConfig.publicFields);
    console.log(`🌐 ${publicFields.size} fields would be public`);
    
    // Analyze overlap
    const analysis = analyzeFieldOverlap(allFields, publicFields);
    
    console.log('\n📊 ANALYSIS RESULTS:');
    console.log('='.repeat(50));
    
    console.log(`\n🌐 PUBLIC FIELDS (${analysis.publicFields.length}):`);
    analysis.publicFields.forEach(field => {
      console.log(`   ✓ ${field}`);
    });
    
    console.log(`\n🔒 PRIVATE FIELDS (${analysis.privateFields.length}):`);
    analysis.privateFields.forEach(field => {
      console.log(`   • ${field}`);
    });
    
    console.log(`\n⚠️  POTENTIAL OVERLAP FIELDS (${analysis.overlappingFields.length}):`);
    if (analysis.overlappingFields.length > 0) {
      analysis.overlappingFields.forEach(field => {
        console.log(`   ⚠️  ${field} - appears in both public and private data`);
      });
    } else {
      console.log('   ✅ No overlapping fields found');
    }
    
    console.log('\n📋 SUMMARY:');
    console.log(`   Total unique fields: ${analysis.allFields.length}`);
    console.log(`   Public fields: ${analysis.publicFields.length}`);
    console.log(`   Private fields: ${analysis.privateFields.length}`);
    console.log(`   Overlapping fields: ${analysis.overlappingFields.length}`);
    
    // Additional analysis for nested fields
    console.log('\n🔍 NESTED FIELD ANALYSIS:');
    const nestedFields = analysis.allFields.filter(field => field.includes('.'));
    const publicNestedFields = analysis.publicFields.filter(field => field.includes('.'));
    const privateNestedFields = analysis.privateFields.filter(field => field.includes('.'));
    
    console.log(`   Nested fields total: ${nestedFields.length}`);
    console.log(`   Public nested fields: ${publicNestedFields.length}`);
    console.log(`   Private nested fields: ${privateNestedFields.length}`);
    
    // Check for specific patterns
    console.log('\n🎯 FIELD PATTERN ANALYSIS:');
    const locationFields = analysis.allFields.filter(field => field.startsWith('location.'));
    const preferenceFields = analysis.allFields.filter(field => field.startsWith('preferences.'));
    const childFields = analysis.allFields.filter(field => field.startsWith('_subcollections.children.'));
    
    console.log(`   Location fields: ${locationFields.length}`);
    console.log(`   Preference fields: ${preferenceFields.length}`);
    console.log(`   Child-related fields: ${childFields.length}`);
    
  } catch (error) {
    console.error('❌ Error analyzing user field overlap:', error);
  } finally {
    process.exit(0);
  }
}

analyzeUserFieldOverlap();
