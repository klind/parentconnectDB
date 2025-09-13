const { execSync } = require('child_process');
const fs = require('fs');

console.log("🚀 Starting conversion of all Salt Lake City resource markdown files to JSON");
console.log("==========================================================================");
console.log("");

// List of all conversion scripts
const conversionScripts = [
  './scripts/conversion/convert-daycare-md-to-json.js',
  './scripts/conversion/convert-family-restaurants-md-to-json.js',
  './scripts/conversion/convert-playgrounds-md-to-json.js',
  './scripts/conversion/convert-swimming-pools-md-to-json.js',
  './scripts/conversion/convert-libraries-md-to-json.js',
  './scripts/conversion/convert-pediatricians-md-to-json.js',
  './scripts/conversion/convert-schools-md-to-json.js',
  './scripts/conversion/convert-shopping-md-to-json.js',
  './scripts/conversion/convert-hospitals-md-to-json.js',
  './scripts/conversion/convert-museums-md-to-json.js',
  './scripts/conversion/convert-parks-md-to-json.js'
];

// Track results
const results = {
  successful: [],
  failed: [],
  totalResources: 0
};

console.log(`📋 Found ${conversionScripts.length} conversion scripts to run`);
console.log("");

// Run each conversion script
conversionScripts.forEach((script, index) => {
  console.log(`🔄 [${index + 1}/${conversionScripts.length}] Running ${script}...`);
  console.log("─".repeat(60));
  
  try {
    // Execute the script
    const output = execSync(`node ${script}`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log(output);
    
    // Extract the number of resources converted from the output
    const resourceMatch = output.match(/Successfully converted (\d+) .+ resources to JSON/);
    if (resourceMatch) {
      const resourceCount = parseInt(resourceMatch[1]);
      results.totalResources += resourceCount;
    }
    
    results.successful.push(script);
    
  } catch (error) {
    console.log(`❌ Error running ${script}:`);
    console.log(error.message);
    console.log("");
    results.failed.push(script);
  }
  
  console.log("");
});

// Final summary
console.log("🎉 CONVERSION COMPLETE!");
console.log("=======================");
console.log("");

console.log(`✅ Successfully converted: ${results.successful.length} categories`);
console.log(`❌ Failed conversions: ${results.failed.length} categories`);
console.log(`📊 Total resources converted: ${results.totalResources}`);
console.log("");

if (results.successful.length > 0) {
  console.log("✅ Successfully converted categories:");
  results.successful.forEach(script => {
    const category = script.replace('convert-', '').replace('-md-to-json.js', '');
    console.log(`   • ${category}`);
  });
  console.log("");
}

if (results.failed.length > 0) {
  console.log("❌ Failed conversions:");
  results.failed.forEach(script => {
    console.log(`   • ${script}`);
  });
  console.log("");
}

// List all generated JSON files
console.log("📁 Generated JSON files:");
console.log("========================");
console.log("");

const jsonFiles = [
  'daycares.json',
  'family-restaurants.json',
  'playgrounds.json',
  'swimming-pools.json',
  'libraries.json',
  'pediatricians.json',
  'schools.json',
  'shopping.json',
  'hospitals.json',
  'museums.json',
  'parks.json'
];

jsonFiles.forEach(file => {
  const filePath = `./SaltLakeCityResources/${file}`;
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`   ✅ ${file} (${sizeKB} KB)`);
  } else {
    console.log(`   ❌ ${file} (not found)`);
  }
});

console.log("");
console.log("💡 All JSON files are ready for:");
console.log("   • Direct import into databases");
console.log("   • API responses");
console.log("   • Programmatic data processing");
console.log("   • Validation and testing");
console.log("");
console.log("🎯 Next steps:");
console.log("   • Review the generated JSON files");
console.log("   • Import into your database");
console.log("   • Use in your application");
