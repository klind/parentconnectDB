const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteAllChildDiagnoses() {
  try {
    console.log('🗑️  Starting deletion of all child_diagnoses entries...');
    
    // Get all categories in child_diagnoses collection
    const categoriesSnapshot = await db.collection('child_diagnoses').get();
    
    if (categoriesSnapshot.empty) {
      console.log('ℹ️  No categories found in child_diagnoses collection.');
      return;
    }
    
    console.log(`📊 Found ${categoriesSnapshot.size} categories to delete`);
    console.log('');
    
    let totalCategories = 0;
    let totalDiagnoses = 0;
    let deletedCategories = 0;
    let deletedDiagnoses = 0;
    let errorCount = 0;
    
    // Process each category
    for (const categoryDoc of categoriesSnapshot.docs) {
      const categoryId = categoryDoc.id;
      const categoryData = categoryDoc.data();
      
      try {
        console.log(`🗑️  Processing category: ${categoryData.name} (${categoryId})`);
        
        // Get all diagnoses in this category's subcollection
        const diagnosesSnapshot = await categoryDoc.ref.collection('diagnoses').get();
        
        if (!diagnosesSnapshot.empty) {
          console.log(`   📝 Found ${diagnosesSnapshot.size} diagnoses to delete`);
          
          // Delete all diagnoses in the subcollection
          const deletePromises = diagnosesSnapshot.docs.map(doc => doc.ref.delete());
          await Promise.all(deletePromises);
          
          deletedDiagnoses += diagnosesSnapshot.size;
          totalDiagnoses += diagnosesSnapshot.size;
          console.log(`   ✅ Deleted ${diagnosesSnapshot.size} diagnoses`);
        } else {
          console.log(`   ℹ️  No diagnoses found in this category`);
        }
        
        // Delete the category document itself
        await categoryDoc.ref.delete();
        deletedCategories++;
        totalCategories++;
        
        console.log(`   ✅ Deleted category: ${categoryData.name}`);
        console.log('');
        
      } catch (error) {
        console.error(`❌ Error processing category ${categoryId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`📊 Summary:`);
    console.log(`   📁 Categories: ${deletedCategories}/${totalCategories} deleted`);
    console.log(`   📝 Diagnoses: ${deletedDiagnoses}/${totalDiagnoses} deleted`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   🗑️  Collection: child_diagnoses completely cleared`);
    
    console.log('\n✅ All child_diagnoses entries deletion completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

deleteAllChildDiagnoses();






