const fs = require('fs');

console.log("🔄 Converting Pediatricians.md to JSON format:");
console.log("===============================================");
console.log("");

// Read the markdown file
const markdownContent = fs.readFileSync('./SaltLakeCityResources/Pediatricians.md', 'utf8');

// Parse the markdown content into structured data
function parsePediatriciansMarkdown(content) {
  const resources = [];
  
  // Split by numbered sections (## 1., ## 2., etc.)
  const sections = content.split(/(?=## \d+\.)/);
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    // Skip completely empty sections or the main header
    if (!section.trim() || section.trim().startsWith('# ') && !section.includes('## ')) {
      continue;
    }
    
    try {
      // Extract name
      const nameMatch = section.match(/## \d+\.\s*(.+?)(?:\n|$)/);
      if (!nameMatch) continue;
      const name = nameMatch[1].trim();
      
      // Extract address information - handle various formats
      let address = '';
      const addressMatch = section.match(/\*\*Address:\*\*\s*([^\n]+)/i) || 
                          section.match(/\*\*Locations:\*\*\s*([^\n]+)/i);
      if (addressMatch) {
        address = addressMatch[1].trim();
      }
      
      // Extract lat/lng - handle various formats
      let latitude = null, longitude = null;
      const latLngMatch = section.match(/\*\*Lat\/Lng:\*\*\s*([^\n]+)/i);
      if (latLngMatch) {
        const coords = latLngMatch[1].match(/(\d+\.\d+),\s*(-?\d+\.\d+)/);
        if (coords) {
          latitude = parseFloat(coords[1]);
          longitude = parseFloat(coords[2]);
        }
      }
      
      // Extract description - improved to stop at reviews section
      let description = '';
      const descMatch = section.match(/\*\*Description:\*\*\s*([\s\S]*?)(?=\*\*Reviews:\*\*|\*\*Addresses & Lat\/Lng:\*\*|$)/i);
      if (descMatch) {
        description = descMatch[1].trim();
        // Clean up description by removing trailing dashes and extra whitespace
        description = description.replace(/\n\s*-\s*$/, '').trim();
      }
      
      // Extract reviews - improved parsing with smart quotes
      const reviews = [];
      const reviewSectionMatch = section.match(/\*\*Reviews:\*\*\s*([\s\S]*?)(?=##|$)/i);
      if (reviewSectionMatch) {
        const reviewText = reviewSectionMatch[1];
        // Split by lines and look for quoted reviews (including smart quotes)
        const lines = reviewText.split('\n');
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('-')) {
            // Extract text between quotes (both regular and smart quotes)
            const quoteMatch = trimmedLine.match(/["""""\u201C\u201D]([^""""""\u201C\u201D]+)["""""\u201C\u201D]/);
            if (quoteMatch) {
              reviews.push(quoteMatch[1]);
            }
          }
        });
      }
      
      // Parse address components
      const addressInfo = parseAddress(address);
      
      // Create resource object with separate address fields (no combined address field)
      const resource = {
        name: name,
        category: 'Pediatricians',
        street: addressInfo.street,
        city: addressInfo.city,
        state: addressInfo.state,
        zip: addressInfo.zip,
        latitude: latitude,
        longitude: longitude,
        description: description,
        reviews: reviews
      };
      
      resources.push(resource);
      
    } catch (error) {
      console.log(`⚠️  Error parsing section ${i}: ${error.message}`);
    }
  }
  
  return resources;
}

// Helper function to parse address
function parseAddress(addressString) {
  if (!addressString) return { street: '', city: '', state: '', zip: '' };
  
  // Remove extra spaces and normalize
  let cleanAddress = addressString.trim().replace(/\s+/g, ' ');
  
  // Remove parenthetical notes
  cleanAddress = cleanAddress.replace(/\s*\([^)]*\)/g, '');
  
  // Handle special cases first
  if (cleanAddress.toLowerCase().includes('various locations') || 
      cleanAddress.toLowerCase().includes('multiple locations')) {
    // Extract city and state from "Various locations in Salt Lake City" format
    const cityStateMatch = cleanAddress.match(/(?:various|multiple)\s+locations\s+(?:in\s+)?(.+)/i);
    if (cityStateMatch) {
      const cityState = cityStateMatch[1].trim();
      const parts = cityState.split(',').map(part => part.trim());
      if (parts.length >= 2) {
        return {
          street: '',
          city: parts[0],
          state: parts[1],
          zip: ''
        };
      }
    }
  }
  
  // Split by commas
  const parts = cleanAddress.split(',').map(part => part.trim());
  
  if (parts.length >= 3) {
    // This is the format: "Street, City, State Zip"
    const street = parts[0];
    const city = parts[1];
    const stateZip = parts[2];
    
    // Parse state and zip
    const stateZipMatch = stateZip.match(/^([A-Z]{2})\s+(\d{5})$/);
    if (stateZipMatch) {
      return {
        street: street,
        city: city,
        state: stateZipMatch[1],
        zip: stateZipMatch[2]
      };
    }
    
    // Handle case where there's no zip code
    const stateMatch = stateZip.match(/^([A-Z]{2})$/);
    if (stateMatch) {
      return {
        street: street,
        city: city,
        state: stateMatch[1],
        zip: ''
      };
    }
  } else if (parts.length === 2) {
    // This could be "City, State" or "Street City, State"
    const firstPart = parts[0];
    const stateZip = parts[1];
    
    // Check if first part contains a street address (has numbers)
    const hasStreetAddress = /\d/.test(firstPart);
    
    if (hasStreetAddress) {
      // This is likely "Street City, State" format
      // Handle special case for "Salt Lake City"
      if (firstPart.includes('Salt Lake City')) {
        const streetMatch = firstPart.match(/(.+) Salt Lake City$/);
        if (streetMatch) {
          const street = streetMatch[1].trim();
          
          const stateZipMatch = stateZip.match(/^([A-Z]{2})\s+(\d{5})$/);
          if (stateZipMatch) {
            return {
              street: street,
              city: 'Salt Lake City',
              state: stateZipMatch[1],
              zip: stateZipMatch[2]
            };
          }
          
          const stateMatch = stateZip.match(/^([A-Z]{2})$/);
          if (stateMatch) {
            return {
              street: street,
              city: 'Salt Lake City',
              state: stateMatch[1],
              zip: ''
            };
          }
        }
      }
      
      // Try to separate street from city for other cases
      const words = firstPart.split(' ');
      const lastWord = words[words.length - 1];
      
      // If the last word looks like a city name (no numbers, capitalized)
      if (!/\d/.test(lastWord) && /^[A-Z]/.test(lastWord)) {
        const street = words.slice(0, -1).join(' ');
        const city = lastWord;
        
        const stateZipMatch = stateZip.match(/^([A-Z]{2})\s+(\d{5})$/);
        if (stateZipMatch) {
          return {
            street: street,
            city: city,
            state: stateZipMatch[1],
            zip: stateZipMatch[2]
          };
        }
        
        const stateMatch = stateZip.match(/^([A-Z]{2})$/);
        if (stateMatch) {
          return {
            street: street,
            city: city,
            state: stateMatch[1],
            zip: ''
          };
        }
      }
    }
    
    // Handle "City, State" format
    const city = firstPart;
    const stateZipMatch = stateZip.match(/^([A-Z]{2})\s+(\d{5})$/);
    if (stateZipMatch) {
      return {
        street: '',
        city: city,
        state: stateZipMatch[1],
        zip: stateZipMatch[2]
      };
    }
    
    const stateMatch = stateZip.match(/^([A-Z]{2})$/);
    if (stateMatch) {
      return {
        street: '',
        city: city,
        state: stateMatch[1],
        zip: ''
      };
    }
  }
  
  // Fallback - if we can't parse it properly, put the whole thing in street
  return {
    street: cleanAddress,
    city: '',
    state: '',
    zip: ''
  };
}

// Convert markdown to JSON
const pediatriciansData = parsePediatriciansMarkdown(markdownContent);

// Create the JSON structure - simplified without metadata
const jsonOutput = {
  category: "Pediatricians",
  totalResources: pediatriciansData.length,
  resources: pediatriciansData
};

// Write to JSON file
const outputPath = './SaltLakeCityResources/pediatricians.json';
fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2));

console.log(`✅ Successfully converted ${pediatriciansData.length} pediatrician resources to JSON`);
console.log(`📁 Output saved to: ${outputPath}`);
console.log("");

// Display summary
console.log("📊 Conversion Summary:");
console.log("======================");
console.log("");

pediatriciansData.forEach((resource, index) => {
  console.log(`${index + 1}. ${resource.name}`);
  console.log(`   📍 Street: ${resource.street || 'N/A'}`);
  console.log(`   🏙️  City: ${resource.city || 'N/A'}`);
  console.log(`   🏛️  State: ${resource.state || 'N/A'}`);
  console.log(`   📮 Zip: ${resource.zip || 'N/A'}`);
  if (resource.latitude && resource.longitude) {
    console.log(`   🗺️  Location: ${resource.latitude}, ${resource.longitude}`);
  }
  console.log(`   💬 Reviews: ${resource.reviews.length}`);
  if (resource.reviews.length > 0) {
    resource.reviews.forEach((review, i) => {
      console.log(`      ${i + 1}. "${review.substring(0, 60)}${review.length > 60 ? '...' : ''}"`);
    });
  }
  console.log("");
});

console.log("🎉 Conversion complete!");
console.log("");
console.log("💡 The JSON file can now be used for:");
console.log("   • Direct import into databases");
console.log("   • API responses");
console.log("   • Programmatic data processing");
console.log("   • Validation and testing");
