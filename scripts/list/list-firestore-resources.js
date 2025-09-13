const admin = require('firebase-admin');

// Load service account
const serviceAccount = require('../../serviceAccountKey.json');

console.log('📋 Salt Lake City Resources in Firestore Database:');
console.log('==================================================');
console.log('');

// Initialize Firebase Admin
admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount)
});

// Connect to Firestore
const db = admin.firestore();

async function listFirestoreResources() {
  try {
    console.log('🔍 Querying Firestore for resources...');
    console.log('');
    
    // Get all resources from Firestore
    const resourcesSnapshot = await db.collection('resources').get();
    
    if (resourcesSnapshot.empty) {
      console.log('📭 No resources found in Firestore database.');
      return;
    }
    
    console.log(`📊 Total Resources: ${resourcesSnapshot.size}`);
    console.log('');
    
    // Group by category
    const categories = {};
    const resources = [];
    
    resourcesSnapshot.forEach(doc => {
      const resource = doc.data();
      resources.push({
        id: doc.id,
        ...resource
      });
      
      if (!categories[resource.category]) {
        categories[resource.category] = [];
      }
      categories[resource.category].push(resource);
    });
    
    // List all resources
    resources.forEach((resource, index) => {
      console.log(`${index + 1}. ${resource.name}`);
      console.log(`   📍 Category: ${resource.category}`);
      console.log(`   📍 Address: ${resource.street}, ${resource.city}, ${resource.state} ${resource.zip}`);
      if (resource.location) {
        console.log(`   🗺️  Coordinates: ${resource.location.latitude}, ${resource.location.longitude}`);
      }
      console.log(`   📝 Description: ${resource.description ? resource.description.substring(0, 100) + '...' : 'No description'}`);
      console.log(`   📅 Created: ${resource.createdAt ? new Date(resource.createdAt.toDate()).toLocaleDateString() : 'Unknown'}`);
      console.log('');
    });
    
    // Show category breakdown
    console.log('📊 Resources by Category:');
    console.log('=========================');
    console.log('');
    
    Object.entries(categories).sort().forEach(([category, categoryResources]) => {
      console.log(`🏷️  ${category.toUpperCase()} (${categoryResources.length} resources):`);
      categoryResources.forEach(resource => {
        console.log(`   • ${resource.name}`);
      });
      console.log('');
    });
    
    // Show geographic distribution
    console.log('🗺️  Geographic Distribution:');
    console.log('============================');
    console.log('');
    
    const cities = {};
    resources.forEach(resource => {
      if (resource.city) {
        if (!cities[resource.city]) {
          cities[resource.city] = [];
        }
        cities[resource.city].push(resource);
      }
    });
    
    Object.entries(cities).sort().forEach(([city, cityResources]) => {
      console.log(`🏙️  ${city}: ${cityResources.length} resources`);
      cityResources.forEach(resource => {
        console.log(`   • ${resource.name} (${resource.category})`);
      });
      console.log('');
    });
    
    console.log('✅ Firestore resource listing complete!');
    
  } catch (error) {
    console.error('❌ Error listing Firestore resources:', error.message);
  }
}

// Run the listing
async function run() {
  try {
    await listFirestoreResources();
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  } finally {
    process.exit(0);
  }
}

run();


















