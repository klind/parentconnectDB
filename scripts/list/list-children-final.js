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

// Helper function to merge child data from public and private subcollections
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

// Helper function to calculate age from date of birth or age field
function calculateAge(ageField, dateOfBirth) {
  // If age is directly provided
  if (ageField && typeof ageField === 'number') {
    return ageField;
  }
  
  // If we have date of birth, calculate age
  if (dateOfBirth) {
    try {
      let birthDate;
      
      // Handle different date formats
      if (dateOfBirth.toDate && typeof dateOfBirth.toDate === 'function') {
        birthDate = new Date(dateOfBirth.toDate());
      } else if (dateOfBirth._seconds) {
        birthDate = new Date(dateOfBirth._seconds * 1000);
      } else if (dateOfBirth instanceof Date) {
        birthDate = dateOfBirth;
      } else {
        birthDate = new Date(dateOfBirth);
      }
      
      if (isNaN(birthDate.getTime())) {
        return null;
      }
      
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      console.warn('Age calculation error:', error.message);
      return null;
    }
  }
  
  return null;
}

// Function to get all children from both collections' subcollections
async function getAllChildren() {
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
      publicUsers.set(doc.id, doc);
    });
    
    // Process private users
    privateUsersSnapshot.forEach(doc => {
      privateUsers.set(doc.id, doc);
    });
    
    // Get all unique user IDs
    const allUserIds = new Set([...publicUsers.keys(), ...privateUsers.keys()]);
    console.log(`Found ${allUserIds.size} unique users across both collections`);
    
    const allChildren = [];
    let childrenCount = 0;
    
    // Process each user to find their children in subcollections
    for (const userId of allUserIds) {
      const publicUserDoc = publicUsers.get(userId);
      const privateUserDoc = privateUsers.get(userId);
      
      console.log(`\nProcessing user ${userId}...`);
      
      // Get children from public subcollection
      let publicChildren = [];
      if (publicUserDoc) {
        try {
          const publicChildrenSnapshot = await publicUserDoc.ref.collection('children').get();
          publicChildren = publicChildrenSnapshot.docs.map(doc => ({
            childId: doc.id,
            data: doc.data(),
            source: 'public'
          }));
          console.log(`  Found ${publicChildren.length} children in public subcollection`);
        } catch (error) {
          console.log(`  No public children subcollection or error: ${error.message}`);
        }
      }
      
      // Get children from private subcollection
      let privateChildren = [];
      if (privateUserDoc) {
        try {
          const privateChildrenSnapshot = await privateUserDoc.ref.collection('children').get();
          privateChildren = privateChildrenSnapshot.docs.map(doc => ({
            childId: doc.id,
            data: doc.data(),
            source: 'private'
          }));
          console.log(`  Found ${privateChildren.length} children in private subcollection`);
        } catch (error) {
          console.log(`  No private children subcollection or error: ${error.message}`);
        }
      }
      
      // Create a map to merge children by their ID
      const childrenMap = new Map();
      
      // Add public children
      publicChildren.forEach(child => {
        childrenMap.set(child.childId, {
          childId: child.childId,
          parentUserId: userId,
          ...child.data,
          _source: 'public'
        });
      });
      
      // Add/merge private children
      privateChildren.forEach(child => {
        const existingChild = childrenMap.get(child.childId);
        if (existingChild) {
          // Merge private data with existing public data
          childrenMap.set(child.childId, {
            ...existingChild,
            ...child.data,
            _source: 'both'
          });
        } else {
          childrenMap.set(child.childId, {
            childId: child.childId,
            parentUserId: userId,
            ...child.data,
            _source: 'private'
          });
        }
      });
      
      // Add children to the main list
      childrenMap.forEach((child, childId) => {
        // Calculate age if not provided
        const age = calculateAge(child.age, child.dateOfBirth);
        
        allChildren.push({
          childId: childId,
          parentUserId: userId,
          ...child,
          _calculatedAge: age,
          _hasCompleteProfile: !!(child.name || child.firstName) && (child.age || child.dateOfBirth)
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
      children: allChildren
    };
    
    return result;
    
  } catch (error) {
    console.error('Error fetching children:', error);
    throw error;
  }
}

// Function to get children with detailed information
async function getChildrenWithDetails() {
  try {
    console.log('Fetching children with detailed information...');
    
    const result = await getAllChildren();
    
    // Add additional processing
    result.children.forEach(child => {
      // Add computed fields
      child._hasCompleteProfile = !!(child.name || child.firstName) && (child.age || child.dateOfBirth || child._calculatedAge);
      child._age = child._calculatedAge;
      
      // Add summary information
      child._summary = {
        hasName: !!(child.name || child.firstName),
        hasAge: !!(child.age || child.dateOfBirth || child._calculatedAge),
        hasGender: !!child.gender,
        hasInterests: !!(child.interests && child.interests.length > 0),
        hasDiagnoses: !!(child.diagnoses && child.diagnoses.length > 0),
        hasAllergies: !!(child.allergies && child.allergies.length > 0)
      };
    });
    
    return result;
    
  } catch (error) {
    console.error('Error fetching children with details:', error);
    throw error;
  }
}

// Function to get children statistics
async function getChildrenStatistics() {
  try {
    console.log('Fetching children statistics...');
    
    const result = await getAllChildren();
    const children = result.children;
    
    const stats = {
      total: children.length,
      bySource: {
        public: 0,
        private: 0,
        both: 0
      },
      byAge: {
        '0-2': 0,
        '3-5': 0,
        '6-12': 0,
        '13-17': 0,
        '18+': 0,
        unknown: 0
      },
      withCompleteProfile: 0,
      byGender: {},
      byDiagnosis: {},
      byInterest: {},
      byAllergy: {}
    };
    
    children.forEach(child => {
      // Count by source
      if (child._source) {
        stats.bySource[child._source] = (stats.bySource[child._source] || 0) + 1;
      }
      
      // Count by age
      const age = child._calculatedAge;
      if (age !== null && age !== undefined) {
        if (age <= 2) stats.byAge['0-2']++;
        else if (age <= 5) stats.byAge['3-5']++;
        else if (age <= 12) stats.byAge['6-12']++;
        else if (age <= 17) stats.byAge['13-17']++;
        else stats.byAge['18+']++;
      } else {
        stats.byAge.unknown++;
      }
      
      // Count complete profiles
      if (child._hasCompleteProfile) {
        stats.withCompleteProfile++;
      }
      
      // Count by gender
      if (child.gender) {
        stats.byGender[child.gender] = (stats.byGender[child.gender] || 0) + 1;
      }
      
      // Count by diagnosis
      if (child.diagnoses && Array.isArray(child.diagnoses)) {
        child.diagnoses.forEach(diagnosis => {
          const diagnosisName = diagnosis.name || diagnosis;
          if (diagnosisName) {
            stats.byDiagnosis[diagnosisName] = (stats.byDiagnosis[diagnosisName] || 0) + 1;
          }
        });
      }
      
      // Count by interest
      if (child.interests && Array.isArray(child.interests)) {
        child.interests.forEach(interest => {
          const interestName = interest.name || interest;
          if (interestName) {
            stats.byInterest[interestName] = (stats.byInterest[interestName] || 0) + 1;
          }
        });
      }
      
      // Count by allergy
      if (child.allergies && Array.isArray(child.allergies)) {
        child.allergies.forEach(allergy => {
          const allergyName = allergy.name || allergy;
          if (allergyName) {
            stats.byAllergy[allergyName] = (stats.byAllergy[allergyName] || 0) + 1;
          }
        });
      }
    });
    
    // Add percentages
    stats.bySourcePercentages = {};
    Object.entries(stats.bySource).forEach(([source, count]) => {
      stats.bySourcePercentages[source] = {
        count: count,
        percentage: ((count / stats.total) * 100).toFixed(1)
      };
    });
    
    stats.completeProfilePercentage = stats.total > 0 ? ((stats.withCompleteProfile / stats.total) * 100).toFixed(1) : '0.0';
    
    return {
      ...result,
      statistics: stats
    };
    
  } catch (error) {
    console.error('Error fetching children statistics:', error);
    throw error;
  }
}

// Function to search children by criteria
async function searchChildren(criteria = {}) {
  try {
    console.log('Searching children with criteria:', criteria);
    
    const result = await getAllChildren();
    let filteredChildren = result.children;
    
    // Apply filters
    if (criteria.ageRange) {
      const [minAge, maxAge] = criteria.ageRange;
      filteredChildren = filteredChildren.filter(child => {
        const age = child._calculatedAge;
        if (age === null || age === undefined) return false;
        return age >= minAge && age <= maxAge;
      });
    }
    
    if (criteria.gender) {
      filteredChildren = filteredChildren.filter(child => 
        child.gender === criteria.gender
      );
    }
    
    if (criteria.diagnosis) {
      filteredChildren = filteredChildren.filter(child => 
        child.diagnoses?.some(d => (d.name || d) === criteria.diagnosis)
      );
    }
    
    if (criteria.interest) {
      filteredChildren = filteredChildren.filter(child => 
        child.interests?.some(i => (i.name || i) === criteria.interest)
      );
    }
    
    if (criteria.allergy) {
      filteredChildren = filteredChildren.filter(child => 
        child.allergies?.some(a => (a.name || a) === criteria.allergy)
      );
    }
    
    if (criteria.hasCompleteProfile !== undefined) {
      filteredChildren = filteredChildren.filter(child => 
        child._hasCompleteProfile === criteria.hasCompleteProfile
      );
    }
    
    if (criteria.parentUserId) {
      filteredChildren = filteredChildren.filter(child => 
        child.parentUserId === criteria.parentUserId
      );
    }
    
    return {
      ...result,
      children: filteredChildren,
      total: filteredChildren.length,
      filters: criteria
    };
    
  } catch (error) {
    console.error('Error searching children:', error);
    throw error;
  }
}

// Function to get children by parent user ID
async function getChildrenByParent(parentUserId) {
  try {
    console.log(`Fetching children for parent: ${parentUserId}`);
    
    const result = await searchChildren({ parentUserId });
    
    return {
      parentUserId: parentUserId,
      total: result.total,
      children: result.children
    };
    
  } catch (error) {
    console.error('Error fetching children by parent:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Choose which function to run:
    
    // Option 1: List all children (basic info)
    const result = await getAllChildren();
    console.log(JSON.stringify(result, null, 2));
    
    // Option 2: List children with detailed information
    // const result = await getChildrenWithDetails();
    // console.log(JSON.stringify(result, null, 2));
    
    // Option 3: Get children statistics
    // const result = await getChildrenStatistics();
    // console.log(JSON.stringify(result, null, 2));
    
    // Option 4: Search children by criteria
    // const result = await searchChildren({
    //   ageRange: [3, 12],
    //   gender: 'Female',
    //   hasCompleteProfile: true
    // });
    // console.log(JSON.stringify(result, null, 2));
    
    // Option 5: Get children by specific parent
    // const result = await getChildrenByParent('BLgLtG4Cfqf3mBkyEjUFMB0i9uZ2');
    // console.log(JSON.stringify(result, null, 2));
    
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
  getAllChildren,
  getChildrenWithDetails,
  getChildrenStatistics,
  searchChildren,
  getChildrenByParent
};
