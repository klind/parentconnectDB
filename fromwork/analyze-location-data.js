const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com'
});

const db = admin.firestore();

// Helper function to clean Firestore data for display
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
      // Handle nested objects
      else {
        cleanData[key] = value;
      }
    } else {
      cleanData[key] = value;
    }
  });
  
  return cleanData;
}

// Function to analyze location data across both collections
async function analyzeLocationData() {
  try {
    console.log('Analyzing location data across users_public_data and users_private_data...');
    
    // Get all users from both collections
    const publicUsersSnapshot = await db.collection('users_public_data').get();
    const privateUsersSnapshot = await db.collection('users_private_data').get();
    
    console.log(`Found ${publicUsersSnapshot.size} public users and ${privateUsersSnapshot.size} private users`);
    
    // Create maps for quick lookup
    const publicUsers = new Map();
    const privateUsers = new Map();
    
    publicUsersSnapshot.forEach(doc => {
      publicUsers.set(doc.id, doc.data());
    });
    
    privateUsersSnapshot.forEach(doc => {
      privateUsers.set(doc.id, doc.data());
    });
    
    const allUserIds = new Set([...publicUsers.keys(), ...privateUsers.keys()]);
    console.log(`Processing ${allUserIds.size} unique users...`);
    
    const locationAnalysis = [];
    let totalUsers = 0;
    let usersWithLocationData = 0;
    
    // Process each user
    for (const userId of allUserIds) {
      const publicData = publicUsers.get(userId) || {};
      const privateData = privateUsers.get(userId) || {};
      
      totalUsers++;
      
      const userLocation = {
        userId: userId,
        displayName: publicData.displayName || 'Unknown',
        hasPublicData: !!publicUsers.get(userId),
        hasPrivateData: !!privateUsers.get(userId),
        publicLocation: {},
        privateLocation: {},
        combinedLocation: {},
        locationFields: {
          city: { public: null, private: null, combined: null },
          zipCode: { public: null, private: null, combined: null },
          state: { public: null, private: null, combined: null },
          zipCodeGeo: { public: null, private: null, combined: null }
        }
      };
      
      // Analyze public location data
      if (publicData.location) {
        userLocation.publicLocation = cleanFirestoreData(publicData.location);
        
        // Extract specific fields
        if (publicData.location.city) userLocation.locationFields.city.public = publicData.location.city;
        if (publicData.location.zipCode) userLocation.locationFields.zipCode.public = publicData.location.zipCode;
        if (publicData.location.state) userLocation.locationFields.state.public = publicData.location.state;
        if (publicData.location.zipCodeGeo) userLocation.locationFields.zipCodeGeo.public = publicData.location.zipCodeGeo;
      }
      
      // Analyze private location data
      if (privateData.location) {
        userLocation.privateLocation = cleanFirestoreData(privateData.location);
        
        // Extract specific fields
        if (privateData.location.city) userLocation.locationFields.city.private = privateData.location.city;
        if (privateData.location.zipCode) userLocation.locationFields.zipCode.private = privateData.location.zipCode;
        if (privateData.location.state) userLocation.locationFields.state.private = privateData.location.state;
        if (privateData.location.zipCodeGeo) userLocation.locationFields.zipCodeGeo.private = privateData.location.zipCodeGeo;
      }
      
      // Determine combined location (private takes precedence)
      const combinedLocation = { ...userLocation.publicLocation, ...userLocation.privateLocation };
      userLocation.combinedLocation = combinedLocation;
      
      // Set combined fields
      userLocation.locationFields.city.combined = userLocation.locationFields.city.private || userLocation.locationFields.city.public;
      userLocation.locationFields.zipCode.combined = userLocation.locationFields.zipCode.private || userLocation.locationFields.zipCode.public;
      userLocation.locationFields.state.combined = userLocation.locationFields.state.private || userLocation.locationFields.state.public;
      userLocation.locationFields.zipCodeGeo.combined = userLocation.locationFields.zipCodeGeo.private || userLocation.locationFields.zipCodeGeo.public;
      
      // Check if user has any location data
      const hasLocationData = userLocation.locationFields.city.combined || 
                             userLocation.locationFields.zipCode.combined || 
                             userLocation.locationFields.state.combined || 
                             userLocation.locationFields.zipCodeGeo.combined;
      
      if (hasLocationData) {
        usersWithLocationData++;
      }
      
      locationAnalysis.push(userLocation);
    }
    
    // Display results
    console.log('\n' + '='.repeat(80));
    console.log('LOCATION DATA BY USER');
    console.log('='.repeat(80));
    
    locationAnalysis.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.displayName} (${user.userId})`);
      
      // Show public collection data
      if (user.hasPublicData && Object.keys(user.publicLocation).length > 0) {
        console.log(`   PUBLIC DATA:`);
        console.log(`     ${JSON.stringify(user.publicLocation, null, 6)}`);
      } else {
        console.log(`   PUBLIC DATA: No location data`);
      }
      
      // Show private collection data
      if (user.hasPrivateData && Object.keys(user.privateLocation).length > 0) {
        console.log(`   PRIVATE DATA:`);
        console.log(`     ${JSON.stringify(user.privateLocation, null, 6)}`);
      } else {
        console.log(`   PRIVATE DATA: No location data`);
      }
    });
    
    // Simple summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total users: ${totalUsers}`);
    console.log(`Users with location data: ${usersWithLocationData}`);
    console.log(`Users without location data: ${totalUsers - usersWithLocationData}`);
    
    return {
      totalUsers,
      usersWithLocationData,
      usersWithoutLocationData: totalUsers - usersWithLocationData,
      locationAnalysis
    };
    
  } catch (error) {
    console.error('Error analyzing location data:', error);
    throw error;
  }
}

// Function to generate location summary statistics
function generateLocationSummary(locationAnalysis) {
  const summary = {
    totalUsers: locationAnalysis.length,
    usersWithLocationData: 0,
    usersWithoutLocationData: 0,
    fieldCoverage: {
      city: { total: 0, public: 0, private: 0, both: 0 },
      zipCode: { total: 0, public: 0, private: 0, both: 0 },
      state: { total: 0, public: 0, private: 0, both: 0 },
      zipCodeGeo: { total: 0, public: 0, private: 0, both: 0 }
    },
    dataSources: {
      publicOnly: 0,
      privateOnly: 0,
      both: 0,
      neither: 0
    },
    states: {},
    cities: {},
    zipCodes: {}
  };
  
  locationAnalysis.forEach(user => {
    const hasLocationData = user.locationFields.city.combined || 
                           user.locationFields.zip.combined || 
                           user.locationFields.state.combined || 
                           user.locationFields.zipGeoCode.combined;
    
    if (hasLocationData) {
      summary.usersWithLocationData++;
    } else {
      summary.usersWithoutLocationData++;
    }
    
    // Analyze each field
    ['city', 'zipCode', 'state', 'zipCodeGeo'].forEach(field => {
      const fieldData = user.locationFields[field];
      if (fieldData.combined) {
        summary.fieldCoverage[field].total++;
        
        if (fieldData.public && fieldData.private) {
          summary.fieldCoverage[field].both++;
        } else if (fieldData.public) {
          summary.fieldCoverage[field].public++;
        } else if (fieldData.private) {
          summary.fieldCoverage[field].private++;
        }
      }
    });
    
    // Track data sources
    const hasPublic = user.hasPublicData && Object.keys(user.publicLocation).length > 0;
    const hasPrivate = user.hasPrivateData && Object.keys(user.privateLocation).length > 0;
    
    if (hasPublic && hasPrivate) {
      summary.dataSources.both++;
    } else if (hasPublic) {
      summary.dataSources.publicOnly++;
    } else if (hasPrivate) {
      summary.dataSources.privateOnly++;
    } else {
      summary.dataSources.neither++;
    }
    
    // Track unique values
    if (user.locationFields.state.combined) {
      summary.states[user.locationFields.state.combined] = (summary.states[user.locationFields.state.combined] || 0) + 1;
    }
    
    if (user.locationFields.city.combined) {
      summary.cities[user.locationFields.city.combined] = (summary.cities[user.locationFields.city.combined] || 0) + 1;
    }
    
    if (user.locationFields.zipCode.combined) {
      summary.zipCodes[user.locationFields.zipCode.combined] = (summary.zipCodes[user.locationFields.zipCode.combined] || 0) + 1;
    }
  });
  
  // Calculate percentages
  summary.fieldCoverage.city.percentage = ((summary.fieldCoverage.city.total / summary.totalUsers) * 100).toFixed(1);
  summary.fieldCoverage.zipCode.percentage = ((summary.fieldCoverage.zipCode.total / summary.totalUsers) * 100).toFixed(1);
  summary.fieldCoverage.state.percentage = ((summary.fieldCoverage.state.total / summary.totalUsers) * 100).toFixed(1);
  summary.fieldCoverage.zipCodeGeo.percentage = ((summary.fieldCoverage.zipCodeGeo.total / summary.totalUsers) * 100).toFixed(1);
  
  return summary;
}

// Function to show only users with complete location data
async function showUsersWithCompleteLocationData() {
  try {
    console.log('Finding users with complete location data...');
    
    const result = await analyzeLocationData();
    const completeUsers = result.locationAnalysis.filter(user => 
      user.locationFields.city.combined && 
      user.locationFields.zipCode.combined && 
      user.locationFields.state.combined
    );
    
    console.log(`\nUsers with complete location data (${completeUsers.length}):`);
    console.log('='.repeat(80));
    
    completeUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.displayName} (${user.userId})`);
      console.log(`   City: ${user.locationFields.city.combined}`);
      console.log(`   State: ${user.locationFields.state.combined}`);
      console.log(`   ZipCode: ${user.locationFields.zipCode.combined}`);
      if (user.locationFields.zipCodeGeo.combined) {
        console.log(`   ZipCodeGeo: ${user.locationFields.zipCodeGeo.combined}`);
      }
      console.log('');
    });
    
    return completeUsers;
    
  } catch (error) {
    console.error('Error finding users with complete location data:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Choose which function to run:
    
    // Option 1: Analyze all location data
    await analyzeLocationData();
    
    // Option 2: Show only users with complete location data
    // await showUsersWithCompleteLocationData();
    
    console.log('\nLocation data analysis completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('Location data analysis failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  analyzeLocationData,
  showUsersWithCompleteLocationData,
  generateLocationSummary
};
