const fs = require("fs");

console.log("📋 All Categories in firestore_full_test_data.json:");
console.log("==================================================");
console.log("");

// Load the JSON data
const data = JSON.parse(fs.readFileSync("firestore_full_test_data.json", "utf8"));

// Check each collection for categories
const collectionsWithCategories = {};

for (const [collectionName, collectionData] of Object.entries(data)) {
  if (typeof collectionData === 'object' && collectionData !== null) {
    const categories = new Set();
    
    // Check if this collection has items with category field
    for (const [itemId, itemData] of Object.entries(collectionData)) {
      if (typeof itemData === 'object' && itemData !== null && itemData.category) {
        categories.add(itemData.category);
      }
    }
    
    if (categories.size > 0) {
      collectionsWithCategories[collectionName] = Array.from(categories).sort();
    }
  }
}

// Display categories by collection
for (const [collectionName, categories] of Object.entries(collectionsWithCategories)) {
  console.log(`🏷️  ${collectionName.toUpperCase()} (${categories.length} categories):`);
  categories.forEach((category, index) => {
    // Count items in this category
    const count = Object.values(data[collectionName]).filter(item => 
      typeof item === 'object' && item !== null && item.category === category
    ).length;
    console.log(`   ${index + 1}. ${category} (${count} items)`);
  });
  console.log("");
}

console.log("📊 Summary:");
console.log(`- Collections with categories: ${Object.keys(collectionsWithCategories).length}`);
console.log(`- Total unique categories across all collections: ${new Set(Object.values(collectionsWithCategories).flat()).size}`);

// Show all unique categories across all collections
const allCategories = new Set();
for (const categories of Object.values(collectionsWithCategories)) {
  categories.forEach(cat => allCategories.add(cat));
}

console.log("");
console.log("🌐 All Unique Categories Across Collections:");
console.log("============================================");
Array.from(allCategories).sort().forEach((category, index) => {
  console.log(`${index + 1}. ${category}`);
}); 