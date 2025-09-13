const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Load service account from project root
const serviceAccount = require('../../serviceAccountKey.json');

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

// Helper function to format dates for JSON output
function formatDateForJson(dateField) {
  if (!dateField) return null;
  
  try {
    // If it's a Firestore Timestamp
    if (dateField.toDate && typeof dateField.toDate === 'function') {
      return dateField.toDate().toISOString();
    }
    // If it's already a Date object
    else if (dateField instanceof Date) {
      return dateField.toISOString();
    }
    // If it's a string or number
    else if (typeof dateField === 'string' || typeof dateField === 'number') {
      return new Date(dateField).toISOString();
    }
    // If it's a Firestore Timestamp object (different format)
    else if (dateField._seconds) {
      return new Date(dateField._seconds * 1000).toISOString();
    }
    else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

async function listAllUsers() {
  try {
    console.log('Fetching all users from the database...');
    
    // Get all users from the users collection
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No users found in the database.');
      return;
    }
    
    const users = {};
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      users[doc.id] = cleanFirestoreData(userData);
    });
    
    const result = {
      collection: 'users',
      total: Object.keys(users).length,
      data: users
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

async function listUsersWithDetails() {
  try {
    console.log('Fetching all users with detailed information...');
    
    // Get all users from the users collection
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No users found in the database.');
      return;
    }
    
    const users = {};
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      users[doc.id] = cleanFirestoreData(userData);
    }
    
    const result = {
      collection: 'users',
      total: Object.keys(users).length,
      data: users
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

async function listUsersByStatus(status) {
  try {
    console.log(`Fetching users with status: ${status}...`);
    
    // Get users with specific status
    const usersSnapshot = await db.collection('users').where('status', '==', status).get();
    
    if (usersSnapshot.empty) {
      console.log(`No users found with status: ${status}`);
      return;
    }
    
    const users = {};
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      users[doc.id] = cleanFirestoreData(userData);
    });
    
    const result = {
      collection: 'users',
      filter: { status: status },
      total: Object.keys(users).length,
      data: users
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error fetching users by status:', error);
    throw error;
  }
}

async function listUsersByRole(role) {
  try {
    console.log(`Fetching users with role: ${role}...`);
    
    // Get users with specific role
    const usersSnapshot = await db.collection('users').where('role', '==', role).get();
    
    if (usersSnapshot.empty) {
      console.log(`No users found with role: ${role}`);
      return;
    }
    
    const users = {};
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      users[doc.id] = cleanFirestoreData(userData);
    });
    
    const result = {
      collection: 'users',
      filter: { role: role },
      total: Object.keys(users).length,
      data: users
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error fetching users by role:', error);
    throw error;
  }
}

async function getUserStatistics() {
  try {
    console.log('Fetching user statistics...');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No users found in the database.');
      return;
    }
    
    const stats = {
      total: usersSnapshot.size,
      byStatus: {},
      byRole: {},
      byMonth: {},
      verified: 0,
      profileComplete: 0
    };
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      
      // Count by status
      const status = userData.status || 'unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      
      // Count by role
      const role = userData.role || 'unknown';
      stats.byRole[role] = (stats.byRole[role] || 0) + 1;
      
             // Count by month
       if (userData.createdAt) {
         let date;
         try {
           // If it's a Firestore Timestamp
           if (userData.createdAt.toDate && typeof userData.createdAt.toDate === 'function') {
             date = new Date(userData.createdAt.toDate());
           }
           // If it's already a Date object
           else if (userData.createdAt instanceof Date) {
             date = userData.createdAt;
           }
           // If it's a string or number
           else if (typeof userData.createdAt === 'string' || typeof userData.createdAt === 'number') {
             date = new Date(userData.createdAt);
           }
           // If it's a Firestore Timestamp object (different format)
           else if (userData.createdAt._seconds) {
             date = new Date(userData.createdAt._seconds * 1000);
           }
           
           if (date && !isNaN(date.getTime())) {
             const month = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
             stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
           }
         } catch (error) {
           // Skip invalid dates
         }
       }
      
      // Count verified emails
      if (userData.emailVerified) {
        stats.verified++;
      }
      
      // Count complete profiles
      if (userData.profileComplete) {
        stats.profileComplete++;
      }
    });
    
    // Convert to percentages
    const byStatusWithPercentages = {};
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      byStatusWithPercentages[status] = {
        count: count,
        percentage: ((count / stats.total) * 100).toFixed(1)
      };
    });
    
    const byRoleWithPercentages = {};
    Object.entries(stats.byRole).forEach(([role, count]) => {
      byRoleWithPercentages[role] = {
        count: count,
        percentage: ((count / stats.total) * 100).toFixed(1)
      };
    });
    
    const result = {
      total: stats.total,
      emailVerified: {
        count: stats.verified,
        percentage: ((stats.verified / stats.total) * 100).toFixed(1)
      },
      profileComplete: {
        count: stats.profileComplete,
        percentage: ((stats.profileComplete / stats.total) * 100).toFixed(1)
      },
      byStatus: byStatusWithPercentages,
      byRole: byRoleWithPercentages,
      byMonth: stats.byMonth
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Choose which function to run:
    
    // Option 1: List all users (basic info)
    await listAllUsers();
    
    // Option 2: List all users with detailed information
    // await listUsersWithDetails();
    
    // Option 3: List users by status (e.g., 'active', 'inactive', 'pending')
    // await listUsersByStatus('active');
    
    // Option 4: List users by role (e.g., 'user', 'admin', 'moderator')
    // await listUsersByRole('user');
    
    // Option 5: Get user statistics
    // await getUserStatistics();
    
    console.log('\nUser listing completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('User listing failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  listAllUsers,
  listUsersWithDetails,
  listUsersByStatus,
  listUsersByRole,
  getUserStatistics
}; 