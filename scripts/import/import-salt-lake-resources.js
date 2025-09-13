const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load service account (fixed path)
const serviceAccount = require('../../serviceAccountKey.json');

console.log('🏔️ Importing Salt Lake City Resources from JSON files to Firestore:');
console.log('==================================================================');
console.log('');

// Initialize Firebase Admin
admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount)
});

// Connect to Firestore
const db = admin.firestore();

// Helper function to delete all existing resources
async function deleteAllResources() {
  try {
    console.log('🗑️  Deleting all existing resources...');
    
    const resourcesSnapshot = await db.collection('resources').get();
    
    if (resourcesSnapshot.empty) {
      console.log('📭 No existing resources found to delete.');
      return;
    }
    
    console.log(`📊 Found ${resourcesSnapshot.size} existing resources to delete...`);
    
    let deletedCount = 0;
    let errorCount = 0;
    
    // Delete in batches of 500 (Firestore batch limit)
    const batchSize = 500;
    const docs = resourcesSnapshot.docs;
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = db.batch();
      const batchDocs = docs.slice(i, i + batchSize);
      
      batchDocs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      try {
        await batch.commit();
        deletedCount += batchDocs.length;
        console.log(`   ✅ Deleted batch: ${batchDocs.length} resources (${deletedCount}/${docs.length} total)`);
      } catch (error) {
        console.error(`   ❌ Error deleting batch:`, error.message);
        errorCount += batchDocs.length;
      }
    }
    
    console.log(`🗑️  Deletion Summary: ${deletedCount} resources deleted, ${errorCount} errors`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error deleting resources:', error.message);
  }
}

async function importSaltLakeResources() {
  try {
    console.log('📖 Reading Salt Lake City JSON resource files...');
    
    const resourcesDir = './SaltLakeCityResources';
    const files = fs.readdirSync(resourcesDir).filter(file => file.endsWith('.json'));
    
    console.log(`📁 Found ${files.length} JSON resource files`);
    console.log('');
    
    // Delete all existing resources first
    await deleteAllResources();
    
    let totalResources = 0;
    let totalReviews = 0;
    let importedCount = 0;
    let errorCount = 0;
    
    for (const file of files) {
      try {
        console.log(`📄 Processing: ${file}`);
        
        // Read JSON file
        const filePath = path.join(resourcesDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContent);
        
        const category = data.category;
        const resources = data.resources || [];
        
        console.log(`   📊 Found ${resources.length} resources in ${category}`);
        
        // Import resources to Firestore
        for (const resource of resources) {
          try {
            // Create resource document
            const resourceRef = db.collection('resources').doc();
            
            const resourceData = {
              name: resource.name,
              category: resource.category,
              street: resource.street || '',
              city: resource.city || '',
              state: resource.state || '',
              zip: resource.zip || '',
              description: resource.description || '',
              location: resource.latitude && resource.longitude ? 
                new admin.firestore.GeoPoint(resource.latitude, resource.longitude) : null,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            
            // Add resource document
            await resourceRef.set(resourceData);
            
            // Add reviews to subcollection
            if (resource.reviews && resource.reviews.length > 0) {
              const reviewsRef = resourceRef.collection('reviews');
              
              for (const reviewText of resource.reviews) {
                await reviewsRef.add({
                  text: reviewText,
                  source: 'Salt Lake City Resources',
                  createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
              }
              
              totalReviews += resource.reviews.length;
            }
            
            importedCount++;
            totalResources++;
            
            console.log(`   ✅ Imported: ${resource.name}`);
            
          } catch (error) {
            console.error(`   ❌ Error importing resource ${resource.name}:`, error.message);
            errorCount++;
          }
        }
        
        console.log(`   ✅ Completed ${category} (${resources.length} resources)`);
        console.log('');
        
      } catch (error) {
        console.error(`❌ Error processing file ${file}:`, error.message);
        errorCount++;
      }
    }
    
    // Summary
    console.log('📊 Import Summary:');
    console.log(`✅ Successfully imported: ${importedCount} resources`);
    console.log(`📝 Total reviews: ${totalReviews}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📁 Files processed: ${files.length}`);
    console.log('');
    
    if (errorCount === 0) {
      console.log('🎉 All Salt Lake City resources imported successfully!');
      console.log('');
      console.log('💡 Each resource now has:');
      console.log('   • Basic info: name, category, description');
      console.log('   • Location: street, city, state, zip, lat/lng, GeoPoint');
      console.log('   • Timestamps: createdAt, updatedAt');
      console.log('   • Reviews: subcollection with individual review documents');
      console.log('');
      console.log('🌍 You can now query resources by:');
      console.log('   • Category (Daycares, Family Restaurants, Parks, etc.)');
      console.log('   • Location (city, state, zip)');
      console.log('   • Geographic proximity (using GeoPoint)');
      console.log('   • Reviews (from subcollection)');
    } else {
      console.log('⚠️  Some resources had errors. Check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Error importing Salt Lake City resources:', error.message);
  }
}

// Run the import
async function run() {
  try {
    await importSaltLakeResources();
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  } finally {
    process.exit(0);
  }
}

run(); 