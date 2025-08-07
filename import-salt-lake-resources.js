const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load service account
const serviceAccount = require('./serviceAccountKey.json');

console.log('🏔️ Importing Salt Lake City Resources to Firestore:');
console.log('==================================================');
console.log('');

// Initialize Firebase Admin
admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount)
});

// Connect to Firestore
const db = admin.firestore();

// Helper function to parse address
function parseAddress(addressString) {
  if (!addressString) return { street: '', city: '', state: '', zip: '' };
  
  // Remove extra spaces and normalize
  const cleanAddress = addressString.trim().replace(/\s+/g, ' ');
  
  // Split by commas
  const parts = cleanAddress.split(',').map(part => part.trim());
  
  if (parts.length >= 3) {
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
  }
  
  // Fallback: return original address as street
  return {
    street: cleanAddress,
    city: '',
    state: '',
    zip: ''
  };
}

// Helper function to extract reviews
function extractReviews(content) {
  const reviews = [];
  
  // Find all review sections (both with and without - prefix, and different variations)
  // Handle both bold format (**Reviews:**) and plain format (Reviews:)
  // Include Highlights/Reviews and Top Reviews, but exclude pure Highlights sections
  const reviewSectionMatches = content.match(/(?:-\s*)?(?:\*\*)?(?:Reviews?|Ratings & Reviews?|Reviews & Reputation?|Highlights\/Reviews?|Top Reviews?)(?:\*\*)?:\s*(?:\*\*)?\s*\n/gi);
  
  console.log(`   🔍 Debug: Found ${reviewSectionMatches ? reviewSectionMatches.length : 0} review sections`);
  
  if (reviewSectionMatches) {
    let lastIndex = 0;
    
    for (const match of reviewSectionMatches) {
      console.log(`   🔍 Debug: Processing review section: ${match.trim()}`);
      
      // Find the position of this review section (after the last one)
      const sectionIndex = content.indexOf(match, lastIndex);
      if (sectionIndex !== -1) {
        lastIndex = sectionIndex + match.length;
        
        // Get all content after this review section
        const contentAfterReviews = content.substring(sectionIndex + match.length);
        
        // Split into lines and process each line
        const lines = contentAfterReviews.split('\n');
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // If line starts with -, it's a review
          if (trimmedLine.startsWith('-')) {
            let reviewText = trimmedLine.substring(1).trim();
            
            // Remove quotes if they exist (both smart quotes and regular quotes)
            // Unicode smart quotes: 8220 (left) and 8221 (right)
            reviewText = reviewText.replace(/^["""""\u201C\u201D]+|["""""\u201C\u201D]+$/g, '');
            
            // Only add if it's a meaningful review (not empty and not too short)
            if (reviewText && reviewText.length > 10 && !reviewText.includes('**')) {
              console.log(`   🔍 Debug: Found review: ${reviewText.substring(0, 50)}...`);
              reviews.push(reviewText);
            }
          }
          // Stop processing if we hit another section (starts with ## or **)
          else if (trimmedLine.startsWith('##') || (trimmedLine.startsWith('**') && trimmedLine.includes(':'))) {
            console.log(`   🔍 Debug: Stopping at section: ${trimmedLine}`);
            break;
          }
        }
      }
    }
  }
  
  console.log(`   🔍 Debug: Total reviews extracted: ${reviews.length}`);
  return reviews;
}

// Helper function to extract resource data from markdown content
function extractResourceData(content, category) {
  const resources = [];
  
  console.log(`   🔍 Debug: Content length: ${content.length} characters`);
  
  // Split by numbered sections (## 1., ## 2., etc.)
  const sections = content.split(/(?=## \d+\.)/);
  
  console.log(`   🔍 Debug: Found ${sections.length} sections`);
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    // Skip completely empty sections
    if (!section.trim()) {
      console.log(`   🔍 Debug: Skipping section ${i} (empty)`);
      continue;
    }
    
    // Skip the main header section (contains only # Category)
    if (section.trim().startsWith('# ') && !section.includes('## ')) {
      console.log(`   🔍 Debug: Skipping section ${i} (main header)`);
      continue;
    }
    
    console.log(`   🔍 Debug: Processing section ${i}: ${section.substring(0, 100)}...`);
    
    try {
      // Extract name
      const nameMatch = section.match(/## \d+\.\s*(.+?)(?:\n|$)/);
      if (!nameMatch) {
        console.log(`   🔍 Debug: No name found in section ${i}`);
        continue;
      }
      // Remove asterisks from the name and trim
      const name = nameMatch[1].replace(/\*/g, '').trim();
      console.log(`   🔍 Debug: Found name: ${name}`);
      
      // Extract address - handle both **Address:** and - **Address:** formats
      const addressMatch = section.match(/\*\*Address:\*\*\s*([^\n]+)/i) || 
                          section.match(/-\s*\*\*Address:\*\*\s*([^\n]+)/i) ||
                          section.match(/Address:\s*([^\n]+)/i);
      const address = addressMatch ? addressMatch[1].trim() : '';
      console.log(`   🔍 Debug: Found address: ${address}`);
      
      // Extract lat/lng - handle both **Lat/Lng:** and - **Lat/Lng:** formats
      const latLngMatch = section.match(/\*\*Lat\/Lng:\*\*\s*([^\n]+)/i) || 
                         section.match(/-\s*\*\*Lat\/Lng:\*\*\s*([^\n]+)/i) ||
                         section.match(new RegExp('Lat/Lng:\\s*([^\\n]+)', 'i'));
      let lat = null, lng = null;
      if (latLngMatch) {
        const coords = latLngMatch[1].split(',').map(c => parseFloat(c.trim()));
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          lat = coords[0];
          lng = coords[1];
        }
      }
      console.log(`   🔍 Debug: Found coordinates: ${lat}, ${lng}`);
      
      // Extract description - handle both **Description:** and - **Description:** formats
      // Use a simpler approach: find the description start and then find the next review section
      let description = '';
      
      // Find description start
      const descStartMatch = section.match(/\*\*Description:\*\*\s*/i) || 
                            section.match(/-\s*\*\*Description:\*\*\s*/i) ||
                            section.match(/Description:\s*/i);
      
      if (descStartMatch) {
        const descStartIndex = section.indexOf(descStartMatch[0]) + descStartMatch[0].length;
        const contentAfterDesc = section.substring(descStartIndex);
        
        // Find the next review section (include Highlights/Reviews and Top Reviews, exclude pure Highlights)
        const reviewPatterns = [
          '**Ratings & Reviews:**',
          '**Reviews & Reputation:**', 
          '**Reviews:**',
          '**Highlights/Reviews:**',
          '**Top Reviews:**',
          '- **Ratings & Reviews:**',
          '- **Reviews & Reputation:**',
          '- **Reviews:**',
          '- **Highlights/Reviews:**',
          '- **Top Reviews:**'
        ];
        
        let descEndIndex = contentAfterDesc.length;
        for (const pattern of reviewPatterns) {
          const index = contentAfterDesc.indexOf(pattern);
          if (index !== -1 && index < descEndIndex) {
            descEndIndex = index;
          }
        }
        
        description = contentAfterDesc.substring(0, descEndIndex).trim();
      }
      
      // Clean up description by removing any review content that might be on the same line
      description = description.replace(/\s*-\s*\*\*Reviews?\*\*:.*$/i, '');
      description = description.replace(/\s*-\s*\*\*Ratings & Reviews?\*\*:.*$/i, '');
      description = description.replace(/\s*-\s*\*\*Reviews & Reputation?\*\*:.*$/i, '');
      description = description.replace(/\s*-\s*\*\*Highlights?\*\*:.*$/i, '');
      description = description.replace(/\s*-\s*Reviews?:.*$/i, '');
      description = description.replace(/\s*-\s*Ratings & Reviews?:.*$/i, '');
      description = description.replace(/\s*-\s*Reviews & Reputation?:.*$/i, '');
      description = description.replace(/\s*-\s*Highlights?:.*$/i, '');
      
      console.log(`   🔍 Debug: Found description: ${description.substring(0, 100)}...`);
      if (description.includes('Reviews')) {
        console.log(`   ⚠️  Warning: Description still contains 'Reviews' - may need regex adjustment`);
      }
      
      // Extract reviews
      const reviews = extractReviews(section);
      console.log(`   🔍 Debug: Found ${reviews.length} reviews`);
      
      // Parse address
      const parsedAddress = parseAddress(address);
      
      if (name && address) {
        console.log(`   ✅ Adding resource: ${name}`);
        resources.push({
          name: name,
          category: category,
          address: address,
          parsedAddress: parsedAddress,
          lat: lat,
          lng: lng,
          description: description,
          reviews: reviews
        });
      } else {
        console.log(`   ❌ Skipping resource: missing name or address`);
      }
    } catch (error) {
      console.log(`⚠️  Error parsing section ${i}: ${error.message}`);
    }
  }
  
  console.log(`   📊 Debug: Total resources extracted: ${resources.length}`);
  return resources;
}

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
    console.log('📖 Reading Salt Lake City resource files...');
    
    const resourcesDir = './SaltLakeCityResources';
    const files = fs.readdirSync(resourcesDir).filter(file => file.endsWith('.md'));
    
    console.log(`📁 Found ${files.length} resource files`);
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
        
        // Extract category from filename and map to existing system categories
        const filename = file.replace('.md', ''); // Remove .md extension
        
        // Use the exact category name from the markdown filename
        // These match the categories in the Firestore 'categories' collection
        const category = filename;
        
        // Read file content
        const content = fs.readFileSync(path.join(resourcesDir, file), 'utf8');
        
        // Debug: Show first 500 characters of content
        console.log(`   🔍 Debug: Content preview (first 500 chars):`);
        console.log(`   ${content.substring(0, 500)}...`);
        console.log('');
        
        // Extract resources from content
        const resources = extractResourceData(content, category);
        
        console.log(`   📊 Found ${resources.length} resources in ${category}`);
        
        // Import resources to Firestore
        for (const resource of resources) {
          try {
            // Create resource document
            const resourceRef = db.collection('resources').doc();
            
            const resourceData = {
              name: resource.name,
              category: resource.category,
              address: resource.address,
              street: resource.parsedAddress.street,
              city: resource.parsedAddress.city,
              state: resource.parsedAddress.state,
              zip: resource.parsedAddress.zip,
              description: resource.description,
              location: resource.lat && resource.lng ? 
                new admin.firestore.GeoPoint(resource.lat, resource.lng) : null,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            
            // Add resource document
            await resourceRef.set(resourceData);
            
            // Add reviews to subcollection
            if (resource.reviews.length > 0) {
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
            
          } catch (error) {
            console.error(`   ❌ Error importing resource ${resource.name}:`, error.message);
            errorCount++;
          }
        }
        
        console.log(`   ✅ Completed ${category}`);
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
      console.log('   • Location: address, street, city, state, zip, lat/lng, GeoPoint');
      console.log('   • Timestamps: createdAt, updatedAt');
      console.log('   • Reviews: subcollection with individual review documents');
      console.log('');
      console.log('🌍 You can now query resources by:');
      console.log('   • Category (Library, Parks, etc.)');
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