const fs = require("fs");

console.log("📋 All Resources in Database:");
console.log("=============================");
console.log("");

// Load the JSON data
const data = JSON.parse(fs.readFileSync("firestore_full_test_data.json", "utf8"));

// Extract all resources
const resources = data.resources;

console.log(`Total Resources: ${Object.keys(resources).length}`);
console.log("");

// List all resources with details
Object.entries(resources).forEach(([resourceId, resource], index) => {
  console.log(`${index + 1}. ${resource.name}`);
  console.log(`   📍 Category: ${resource.category}`);
  console.log(`   📍 Location: ${resource.location.lat}, ${resource.location.lng}`);
  console.log(`   ⭐ Rating: ${resource.averageRating}/5 (${resource.totalRatings} reviews)`);
  console.log(`   📝 Description: ${resource.description.substring(0, 100)}${resource.description.length > 100 ? '...' : ''}`);
  console.log(`   👤 Submitted by: ${resource.submittedBy}`);
  console.log(`   ✅ Approved: ${resource.approved ? 'Yes' : 'No'}`);
  console.log(`   📅 Created: ${new Date(resource.createdAt).toLocaleDateString()}`);
  
  // Show review count
  const reviewCount = resource._subcollections?.reviews ? Object.keys(resource._subcollections.reviews).length : 0;
  console.log(`   💬 Reviews: ${reviewCount}`);
  console.log("");
});

// Group by category
console.log("📊 Resources by Category:");
console.log("=========================");
console.log("");

const categories = {};
Object.values(resources).forEach(resource => {
  if (!categories[resource.category]) {
    categories[resource.category] = [];
  }
  categories[resource.category].push(resource);
});

Object.entries(categories).sort().forEach(([category, categoryResources]) => {
  console.log(`🏷️  ${category.toUpperCase()} (${categoryResources.length} resources):`);
  categoryResources.forEach(resource => {
    console.log(`   • ${resource.name} (${resource.averageRating}/5 stars)`);
  });
  console.log("");
});

// Show geographic distribution
console.log("🗺️  Geographic Distribution:");
console.log("============================");
console.log("");

const locations = Object.values(resources).map(r => ({
  name: r.name,
  lat: r.location.lat,
  lng: r.location.lng,
  category: r.category
}));

// Group by approximate location (Odense vs San Francisco area)
const odenseResources = locations.filter(loc => loc.lat > 55 && loc.lat < 56);
const sfResources = locations.filter(loc => loc.lat > 37 && loc.lat < 38);

console.log(`🇩🇰 Odense, Denmark: ${odenseResources.length} resources`);
odenseResources.forEach(resource => {
  console.log(`   • ${resource.name} (${resource.category})`);
});

console.log("");
console.log(`🇺🇸 San Francisco Area: ${sfResources.length} resources`);
sfResources.forEach(resource => {
  console.log(`   • ${resource.name} (${resource.category})`);
});

console.log("");
console.log("✅ Resource listing complete!"); 