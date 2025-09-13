const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateActivitiesEventDates() {
  try {
    console.log('🔄 Starting to update activities event dates to future dates...');
    
    // Get all activities
    const activitiesSnapshot = await db.collection('activities').get();
    
    if (activitiesSnapshot.empty) {
      console.log('No activities found in the database.');
      return;
    }
    
    console.log(`📋 Found ${activitiesSnapshot.docs.length} activities to update...`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Calculate date range for next 6 months
    const now = new Date();
    const sixMonthsFromNow = new Date(now.getTime() + (6 * 30 * 24 * 60 * 60 * 1000));
    
    // Process each activity
    for (const activityDoc of activitiesSnapshot.docs) {
      try {
        const activityId = activityDoc.id;
        
        // Generate a random future date within the next 6 months
        const randomTime = now.getTime() + Math.random() * (sixMonthsFromNow.getTime() - now.getTime());
        const futureDate = new Date(randomTime);
        
        // Update the activity with the new eventDate
        await activityDoc.ref.update({
          eventDate: admin.firestore.Timestamp.fromDate(futureDate),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`   ✅ Updated: ${activityId} - New event date: ${futureDate.toISOString().split('T')[0]}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`   ❌ Error updating activity ${activityDoc.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   📋 Total activities: ${activitiesSnapshot.docs.length}`);
    console.log(`   ✅ Successfully updated: ${updatedCount}`);
    console.log(`   ❌ Failed to update: ${errorCount}`);
    console.log(`   📅 Date range: ${now.toISOString().split('T')[0]} to ${sixMonthsFromNow.toISOString().split('T')[0]}`);
    
    if (errorCount === 0) {
      console.log('\n✅ All activities event dates updated successfully!');
    } else {
      console.log('\n⚠️  Some activities failed to update. Check the errors above.');
    }
    
  } catch (error) {
    console.error('❌ Error updating activities event dates:', error);
  } finally {
    process.exit(0);
  }
}

updateActivitiesEventDates();






