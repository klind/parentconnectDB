const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Helper function to safely format timestamps
function formatTimestamp(timestamp) {
  if (!timestamp) return null;
  
  try {
    if (timestamp.toDate) {
      return timestamp.toDate().toISOString();
    } else if (timestamp instanceof Date) {
      return timestamp.toISOString();
    } else if (typeof timestamp === 'string') {
      return new Date(timestamp).toISOString();
    } else if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toISOString();
    }
    return null;
  } catch (error) {
    return null;
  }
}



async function listAllActivities() {
  try {
    const activitiesSnapshot = await db.collection('activities').get();
    
    if (activitiesSnapshot.empty) {
      console.log(JSON.stringify({ activities: [], count: 0 }, null, 2));
      return;
    }
    
    const activities = [];
    
    activitiesSnapshot.forEach(doc => {
      const activity = doc.data();
      
      const formattedActivity = {
        id: doc.id,
        title: activity.title || null,
        description: activity.description || null,
        street: activity.street || null,
        city: activity.city || null,
        state: activity.state || null,
        zip: activity.zip || null,
        location: activity.location || null,
        time: activity.time || null,
        eventDate: formatTimestamp(activity.eventDate),
        maxParticipants: activity.maxParticipants || null,
        category: activity.category || null,
        image: activity.image || null,
        active: activity.active !== undefined ? activity.active : null,
        tags: activity.tags || null,
        createdAt: formatTimestamp(activity.createdAt),
        updatedAt: formatTimestamp(activity.updatedAt)
      };
      
      activities.push(formattedActivity);
    });
    
    const result = {
      activities: activities,
      count: activities.length,
      timestamp: new Date().toISOString()
    };
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }, null, 2));
  } finally {
    process.exit(0);
  }
}

listAllActivities(); 