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

/**
 * Get the value at a nested path in an object
 * @param {Object} obj - The object to get the value from
 * @param {string} path - The dot-separated path
 * @returns {*} The value at the path
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Create a user document with only public fields
 * @param {Object} userData - The full user document
 * @param {Array} publicFields - Array of public field patterns
 * @returns {Object} User document with only public fields
 */
function createPublicUserDocument(userData, publicFields) {
  const publicDoc = {};
  
  publicFields.forEach(fieldPattern => {
    if (fieldPattern.includes('*')) {
      // Handle wildcard patterns
      const basePath = fieldPattern.replace('*', '');
      const value = getNestedValue(userData, basePath);
      if (value !== undefined) {
        const pathParts = basePath.split('.');
        let current = publicDoc;
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!current[pathParts[i]]) {
            current[pathParts[i]] = {};
          }
          current = current[pathParts[i]];
        }
        current[pathParts[pathParts.length - 1]] = value;
      }
    } else {
      // Handle exact field paths
      const value = getNestedValue(userData, fieldPattern);
      if (value !== undefined) {
        const pathParts = fieldPattern.split('.');
        let current = publicDoc;
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!current[pathParts[i]]) {
            current[pathParts[i]] = {};
          }
          current = current[pathParts[i]];
        }
        current[pathParts[pathParts.length - 1]] = value;
      }
    }
  });
  
  return publicDoc;
}

/**
 * Create a user document with only private fields
 * @param {Object} userData - The full user document
 * @param {Array} publicFields - Array of public field patterns
 * @returns {Object} User document with only private fields
 */
function createPrivateUserDocument(userData, publicFields) {
  const privateDoc = { ...userData };
  
  // Remove public fields from the private document
  publicFields.forEach(fieldPattern => {
    if (fieldPattern.includes('*')) {
      // Handle wildcard patterns - remove the base path
      const basePath = fieldPattern.replace('*', '');
      const pathParts = basePath.split('.');
      let current = privateDoc;
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (current[pathParts[i]]) {
          current = current[pathParts[i]];
        }
      }
      if (current[pathParts[pathParts.length - 1]]) {
        delete current[pathParts[pathParts.length - 1]];
      }
    } else {
      // Handle exact field paths
      const pathParts = fieldPattern.split('.');
      let current = privateDoc;
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (current[pathParts[i]]) {
          current = current[pathParts[i]];
        }
      }
      if (current[pathParts[pathParts.length - 1]]) {
        delete current[pathParts[pathParts.length - 1]];
      }
    }
  });
  
  return privateDoc;
}

async function showUserCollectionBreakdown() {
  try {
    console.log('🔍 Showing breakdown of users_private_data vs users_public_data...');
    console.log(`📋 Public fields configuration: ${JSON.stringify(publicFieldsConfig.publicFields, null, 2)}`);
    console.log('');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in the database.');
      return;
    }
    
    console.log(`📊 Analyzing ${usersSnapshot.size} users...`);
    
    // Process first user as example
    const firstUser = usersSnapshot.docs[0];
    const userId = firstUser.id;
    const userData = firstUser.data();
    
    console.log(`\n👤 EXAMPLE USER: ${userId}`);
    console.log('='.repeat(60));
    
    // Create public and private versions
    const publicUserDoc = createPublicUserDocument(userData, publicFieldsConfig.publicFields);
    const privateUserDoc = createPrivateUserDocument(userData, publicFieldsConfig.publicFields);
    
    console.log('\n🌐 USERS_PUBLIC_DATA would contain:');
    console.log(JSON.stringify(publicUserDoc, null, 2));
    
    console.log('\n🔒 USERS_PRIVATE_DATA would contain:');
    console.log(JSON.stringify(privateUserDoc, null, 2));
    
    // Analyze all users for field statistics
    const allFields = new Set();
    const publicFields = new Set();
    const privateFields = new Set();
    
    usersSnapshot.docs.forEach(doc => {
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
    });
    
    console.log('\n📊 FIELD STATISTICS:');
    console.log('='.repeat(60));
    console.log(`Total unique fields across all users: ${allFields.size}`);
    console.log(`Fields in users_public_data: ${publicFields.size}`);
    console.log(`Fields in users_private_data: ${privateFields.size}`);
    
    console.log('\n🌐 FIELDS IN USERS_PUBLIC_DATA:');
    Array.from(publicFields).sort().forEach(field => {
      console.log(`   ✓ ${field}`);
    });
    
    console.log('\n🔒 FIELDS IN USERS_PRIVATE_DATA:');
    Array.from(privateFields).sort().forEach(field => {
      console.log(`   • ${field}`);
    });
    
    // Check for any potential overlaps
    const overlappingFields = new Set();
    publicFields.forEach(publicField => {
      const hasPrivateChildren = Array.from(privateFields).some(privateField => {
        return privateField.startsWith(publicField + '.');
      });
      
      if (hasPrivateChildren) {
        overlappingFields.add(publicField);
      }
    });
    
    if (overlappingFields.size > 0) {
      console.log('\n⚠️  POTENTIAL OVERLAP FIELDS:');
      Array.from(overlappingFields).sort().forEach(field => {
        console.log(`   ⚠️  ${field} - has private children`);
      });
    } else {
      console.log('\n✅ NO OVERLAP FIELDS FOUND');
      console.log('   All fields are cleanly separated between collections.');
    }
    
  } catch (error) {
    console.error('❌ Error showing user collection breakdown:', error);
  } finally {
    process.exit(0);
  }
}

showUserCollectionBreakdown();
