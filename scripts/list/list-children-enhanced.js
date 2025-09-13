const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com' // Update with your project ID
});

const db = admin.firestore();

// Helper function to format dates safely for console output
function formatDate(dateField) {
  if (!dateField) return 'N/A';
  
  try {
    // If it's a Firestore Timestamp
    if (dateField.toDate && typeof dateField.toDate === 'function') {
      return new Date(dateField.toDate()).toLocaleString();
    }
    // If it's already a Date object
    else if (dateField instanceof Date) {
      return dateField.toLocaleString();
    }
    // If it's a string or number
    else if (typeof dateField === 'string' || typeof dateField === 'number') {
      return new Date(dateField).toLocaleString();
    }
    // If it's a Firestore Timestamp object (different format)
    else if (dateField._seconds) {
      return new Date(dateField._seconds * 1000).toLocaleString();
    }
    else {
      return 'Invalid Date';
    }
  } catch (error) {
    console.warn('Date formatting error:', error.message);
    return 'Invalid Date';
  }
}

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

// Helper function to merge child data from public and private collections
function mergeChildData(publicData, privateData) {
  const mergedData = {
    // Start with public data as base
    ...cleanFirestoreData(publicData),
    // Overlay private data (private data takes precedence for overlapping fields)
    ...cleanFirestoreData(privateData),
    // Add metadata about data sources
    _dataSources: {
      hasPublicData: !!publicData,
      hasPrivateData: !!privateData,
      lastUpdated: new Date().toISOString()
    }
  };
  
  return mergedData;
}

// Function to analyze user data structure
function analyzeUserData(userId, publicData, privateData) {
  const analysis = {
    userId: userId,
    hasPublicData: !!publicData,
    hasPrivateData: !!privateData,
    publicFields: publicData ? Object.keys(publicData) : [],
    privateFields: privateData ? Object.keys(privateData) : [],
    childrenFields: {
      public: null,
      private: null,
      publicType: null,
      privateType: null
    }
  };
  
  // Analyze children field in public data
  if (publicData) {
    if (publicData.children) {
      analysis.childrenFields.public = publicData.children;
      analysis.childrenFields.publicType = Array.isArray(publicData.children) ? 'array' : typeof publicData.children;
    }
  }
  
  // Analyze children field in private data
  if (privateData) {
    if (privateData.children) {
      analysis.childrenFields.private = privateData.children;
      analysis.childrenFields.privateType = Array.isArray(privateData.children) ? 'array' : typeof privateData.children;
    }
  }
  
  return analysis;
}

// Function to get all children from both collections with detailed analysis
async function getAllChildrenWithAnalysis() {
  try {
    console.log('Fetching all children from both public and private collections...');
    
    // Get all users from users_public_data collection
    const publicUsersSnapshot = await db.collection('users_public_data').get();
    console.log(`Found ${publicUsersSnapshot.size} users in users_public_data collection`);
    
    // Get all users from users_private_data collection
    const privateUsersSnapshot = await db.collection('users_private_data').get();
    console.log(`Found ${privateUsersSnapshot.size} users in users_private_data collection`);
    
    // Create maps for quick lookup
    const publicUsers = new Map();
    const privateUsers = new Map();
    
    // Process public users
    publicUsersSnapshot.forEach(doc => {
      publicUsers.set(doc.id, doc.data());
    });
    
    // Process private users
    privateUsersSnapshot.forEach(doc => {
      privateUsers.set(doc.id, doc.data());
    });
    
    // Get all unique user IDs
    const allUserIds = new Set([...publicUsers.keys(), ...privateUsers.keys()]);
    console.log(`Found ${allUserIds.size} unique users across both collections`);
    
    const allChildren = [];
    let childrenCount = 0;
    const userAnalysis = [];
    
    // Process each user to find their children
    for (const userId of allUserIds) {
      const publicData = publicUsers.get(userId) || {};
      const privateData = privateUsers.get(userId) || {};
      
      // Analyze user data structure
      const analysis = analyzeUserData(userId, publicData, privateData);
      userAnalysis.push(analysis);
      
      // Get children from both collections
      const publicChildren = publicData.children || [];
      const privateChildren = privateData.children || [];
      
      console.log(`\nUser ${userId}:`);
      console.log(`  Public children: ${Array.isArray(publicChildren) ? publicChildren.length : 'not an array'}`);
      console.log(`  Private children: ${Array.isArray(privateChildren) ? privateChildren.length : 'not an array'}`);
      
      // Create a map to merge children by their ID
      const childrenMap = new Map();
      
      // Add public children
      if (Array.isArray(publicChildren)) {
        publicChildren.forEach((child, index) => {
          if (child?.id) {
            childrenMap.set(child.id, {
              ...child,
              _source: 'public',
              _parentUserId: userId,
              _index: index
            });
          } else {
            console.log(`    Public child at index ${index} has no ID:`, child);
          }
        });
      } else if (publicChildren) {
        console.log(`    Public children is not an array:`, typeof publicChildren, publicChildren);
      }
      
      // Add/merge private children
      if (Array.isArray(privateChildren)) {
        privateChildren.forEach((child, index) => {
          if (child?.id) {
            const existingChild = childrenMap.get(child.id);
            if (existingChild) {
              // Merge private data with existing public data
              childrenMap.set(child.id, {
                ...existingChild,
                ...child,
                _source: 'both',
                _parentUserId: userId,
                _index: index
              });
            } else {
              childrenMap.set(child.id, {
                ...child,
                _source: 'private',
                _parentUserId: userId,
                _index: index
              });
            }
          } else {
            console.log(`    Private child at index ${index} has no ID:`, child);
          }
        });
      } else if (privateChildren) {
        console.log(`    Private children is not an array:`, typeof privateChildren, privateChildren);
      }
      
      // Add children to the main list
      childrenMap.forEach((child, childId) => {
        allChildren.push({
          childId: childId,
          parentUserId: userId,
          ...child
        });
        childrenCount++;
      });
    }
    
    console.log(`\nFound ${childrenCount} children across all users`);
    
    const result = {
      collection: 'children',
      total: childrenCount,
      dataSources: {
        publicCollection: 'users_public_data',
        privateCollection: 'users_private_data',
        totalUsers: allUserIds.size
      },
      children: allChildren,
      analysis: {
        userAnalysis: userAnalysis,
        summary: {
          usersWithPublicChildren: userAnalysis.filter(u => u.childrenFields.public).length,
          usersWithPrivateChildren: userAnalysis.filter(u => u.childrenFields.private).length,
          usersWithBothChildren: userAnalysis.filter(u => u.childrenFields.public && u.childrenFields.private).length,
          usersWithNoChildren: userAnalysis.filter(u => !u.childrenFields.public && !u.childrenFields.private).length
        }
      }
    };
    
    return result;
    
  } catch (error) {
    console.error('Error fetching children:', error);
    throw error;
  }
}

// Function to explore data structure
async function exploreDataStructure() {
  try {
    console.log('Exploring data structure to understand how children are stored...');
    
    // Get a sample of users from both collections
    const publicUsersSnapshot = await db.collection('users_public_data').limit(3).get();
    const privateUsersSnapshot = await db.collection('users_private_data').limit(3).get();
    
    console.log('\n=== SAMPLE PUBLIC USERS ===');
    publicUsersSnapshot.forEach((doc, index) => {
      console.log(`\nPublic User ${index + 1} (${doc.id}):`);
      const data = doc.data();
      console.log('Fields:', Object.keys(data));
      
      // Look for children-related fields
      const childrenFields = Object.keys(data).filter(key => 
        key.toLowerCase().includes('child') || 
        key.toLowerCase().includes('kid') ||
        key.toLowerCase().includes('offspring')
      );
      
      if (childrenFields.length > 0) {
        console.log('Children-related fields:', childrenFields);
        childrenFields.forEach(field => {
          console.log(`  ${field}:`, typeof data[field], Array.isArray(data[field]) ? `(array, length: ${data[field].length})` : '');
          if (Array.isArray(data[field]) && data[field].length > 0) {
            console.log(`    Sample:`, data[field][0]);
          }
        });
      } else {
        console.log('No children-related fields found');
      }
    });
    
    console.log('\n=== SAMPLE PRIVATE USERS ===');
    privateUsersSnapshot.forEach((doc, index) => {
      console.log(`\nPrivate User ${index + 1} (${doc.id}):`);
      const data = doc.data();
      console.log('Fields:', Object.keys(data));
      
      // Look for children-related fields
      const childrenFields = Object.keys(data).filter(key => 
        key.toLowerCase().includes('child') || 
        key.toLowerCase().includes('kid') ||
        key.toLowerCase().includes('offspring')
      );
      
      if (childrenFields.length > 0) {
        console.log('Children-related fields:', childrenFields);
        childrenFields.forEach(field => {
          console.log(`  ${field}:`, typeof data[field], Array.isArray(data[field]) ? `(array, length: ${data[field].length})` : '');
          if (Array.isArray(data[field]) && data[field].length > 0) {
            console.log(`    Sample:`, data[field][0]);
          }
        });
      } else {
        console.log('No children-related fields found');
      }
    });
    
  } catch (error) {
    console.error('Error exploring data structure:', error);
    throw error;
  }
}

// Function to search for children in subcollections
async function searchChildrenInSubcollections() {
  try {
    console.log('Searching for children in subcollections...');
    
    // Get a sample of users
    const publicUsersSnapshot = await db.collection('users_public_data').limit(2).get();
    const privateUsersSnapshot = await db.collection('users_private_data').limit(2).get();
    
    const allChildren = [];
    
    // Check public users for children subcollections
    for (const doc of publicUsersSnapshot.docs) {
      console.log(`\nChecking public user ${doc.id} for children subcollection...`);
      try {
        const childrenSnapshot = await doc.ref.collection('children').get();
        console.log(`  Found ${childrenSnapshot.size} children in subcollection`);
        
        childrenSnapshot.forEach(childDoc => {
          allChildren.push({
            childId: childDoc.id,
            parentUserId: doc.id,
            source: 'public_subcollection',
            data: cleanFirestoreData(childDoc.data())
          });
        });
      } catch (error) {
        console.log(`  No children subcollection or error: ${error.message}`);
      }
    }
    
    // Check private users for children subcollections
    for (const doc of privateUsersSnapshot.docs) {
      console.log(`\nChecking private user ${doc.id} for children subcollection...`);
      try {
        const childrenSnapshot = await doc.ref.collection('children').get();
        console.log(`  Found ${childrenSnapshot.size} children in subcollection`);
        
        childrenSnapshot.forEach(childDoc => {
          allChildren.push({
            childId: childDoc.id,
            parentUserId: doc.id,
            source: 'private_subcollection',
            data: cleanFirestoreData(childDoc.data())
          });
        });
      } catch (error) {
        console.log(`  No children subcollection or error: ${error.message}`);
      }
    }
    
    console.log(`\nTotal children found in subcollections: ${allChildren.length}`);
    
    return {
      total: allChildren.length,
      children: allChildren
    };
    
  } catch (error) {
    console.error('Error searching children in subcollections:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Choose which function to run:
    
    // Option 1: Explore data structure first
    await exploreDataStructure();
    
    // Option 2: Search for children in subcollections
    const subcollectionResult = await searchChildrenInSubcollections();
    console.log('\n=== SUBCOLLECTION RESULTS ===');
    console.log(JSON.stringify(subcollectionResult, null, 2));
    
    // Option 3: Get all children with analysis
    const result = await getAllChildrenWithAnalysis();
    console.log('\n=== MAIN RESULTS ===');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\nChildren listing completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Children listing failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  getAllChildrenWithAnalysis,
  exploreDataStructure,
  searchChildrenInSubcollections
};
