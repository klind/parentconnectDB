const fs = require("fs");
const path = require("path");

// Function to parse address and extract city
function extractCityFromAddress(addressString) {
  if (!addressString) return null;
  
  // Expected format: "1120 E Sahara Ave, Las Vegas, NV 89104"
  // or "1120 E Sahara Ave Ste 110, Las Vegas, NV 89104"
  const parts = addressString.split(",").map(part => part.trim());
  
  if (parts.length >= 2) {
    // City is typically the second part after street address
    let city = parts[1];
    
    // Clean up the city part - remove any suite/ste information that might have been incorrectly parsed
    // Look for patterns like "Ste 110", "Suite #104", "Suite 15", etc. and remove them
    city = city.replace(/\b(?:Ste|Suite|#)\s*\d+/gi, '').trim();
    
    // Also remove any remaining numbers or special characters that aren't part of city names
    city = city.replace(/^[\d\s\-\.]+/, '').trim();
    
    // Additional cleanup: remove any remaining suite-like patterns
    city = city.replace(/\b(?:Ste|Suite)\s*#?\d*/gi, '').trim();
    
    // Only return if we have a meaningful city name
    if (city && city.length > 1 && !/^\d+$/.test(city)) {
      return city;
    }
  }
  
  return null;
}

// Function to process a single JSON file
function processJsonFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const resources = JSON.parse(fileContent);
    
    if (!Array.isArray(resources)) {
      console.log(`   ⚠️  File does not contain an array of resources`);
      return new Set();
    }
    
    const cities = new Set();
    
    resources.forEach(resource => {
      if (resource.address) {
        const city = extractCityFromAddress(resource.address);
        if (city && city.trim()) {
          cities.add(city.trim());
        }
      }
    });
    
    return cities;
  } catch (error) {
    console.error(`   ❌ Error processing file ${path.basename(filePath)}: ${error.message}`);
    return new Set();
  }
}

// Main function to process all LasVegasResources JSON files
function listLasVegasCities() {
  const resourcesDir = path.join(__dirname, "LasVegasResources");
  
  if (!fs.existsSync(resourcesDir)) {
    console.error("❌ LasVegasResources directory not found");
    process.exit(1);
  }
  
  console.log("🔍 Scanning LasVegasResources JSON files for unique cities...");
  console.log("==========================================================");
  console.log(`📂 Resources directory: ${resourcesDir}`);
  
  // Get all JSON files in the directory
  const files = fs.readdirSync(resourcesDir)
    .filter(file => file.endsWith(".json"))
    .map(file => path.join(resourcesDir, file));
  
  if (files.length === 0) {
    console.log("❌ No JSON files found in LasVegasResources directory");
    return;
  }
  
  console.log(`\n📋 Found ${files.length} category files to process\n`);
  
  const allCities = new Set();
  let totalResources = 0;
  
  // Process each JSON file
  files.forEach((filePath, index) => {
    const fileName = path.basename(filePath);
    const category = fileName.replace(".json", "")
      .replace(/([A-Z])/g, " $1") // Add space before capitals
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
    
    console.log(`${index + 1}. Processing ${category} (${fileName})`);
    
    const fileCities = processJsonFile(filePath);
    
    // Count resources in this file
    try {
      const fileContent = fs.readFileSync(filePath, "utf8");
      const resources = JSON.parse(fileContent);
      const resourceCount = Array.isArray(resources) ? resources.length : 0;
      totalResources += resourceCount;
      console.log(`   📊 Found ${resourceCount} resources, ${fileCities.size} unique cities`);
    } catch (e) {
      console.log(`   📊 Error counting resources`);
    }
    
    // Add cities from this file to the main set
    fileCities.forEach(city => allCities.add(city));
  });
  
  console.log("\n🎯 Summary");
  console.log("===========");
  console.log(`📊 Total resources across all files: ${totalResources}`);
  console.log(`🏙️  Total unique cities found: ${allCities.size}`);
  
  // Display all unique cities sorted alphabetically
  console.log(`\n📍 All unique cities in LasVegasResources:\n`);
  const sortedCities = Array.from(allCities).sort();
  sortedCities.forEach((city, index) => {
    console.log(`${index + 1}. ${city}`);
  });
  
  console.log(`\n✨ Cities listing complete!`);
}

// Run the listing
listLasVegasCities();
