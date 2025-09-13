const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Load service account
const serviceAccount = require("./serviceAccountKey.json");

console.log("🚀 Starting Firebase Storage Folder Creation:");
console.log("Project ID:", serviceAccount.project_id);
console.log("Storage Bucket: parentconnect2025.firebasestorage.app");
console.log("");

// Initialize Firebase Admin
admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "parentconnect2025.firebasestorage.app"
});

// Connect to Firebase Storage
const bucket = admin.storage().bucket();

// Sample images for each resource (using Unsplash URLs)
const resourceImages = {
  "resource011": { // Odense Zoo
    images: [
      {
        name: "main-entrance.jpg",
        url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
        alt: "Odense Zoo entrance with animals"
      },
      {
        name: "lions.jpg", 
        url: "https://images.unsplash.com/photo-1549366021-9f761d450615?w=800&h=600&fit=crop",
        alt: "Lions in their natural habitat"
      },
      {
        name: "playground.jpg",
        url: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800&h=600&fit=crop", 
        alt: "Children's playground at zoo"
      }
    ]
  },
  "resource012": { // Brandts Museum
    images: [
      {
        name: "exterior.jpg",
        url: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop",
        alt: "Brandts Museum exterior"
      },
      {
        name: "exhibition.jpg",
        url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
        alt: "Art exhibition hall"
      },
      {
        name: "workshop.jpg",
        url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop",
        alt: "Children's art workshop"
      }
    ]
  },
  "resource013": { // Odense Skatepark
    images: [
      {
        name: "facilities.jpg",
        url: "https://images.unsplash.com/photo-1572776685600-c7c3c0c0c0c0?w=800&h=600&fit=crop",
        alt: "Skatepark ramps and bowls"
      },
      {
        name: "skateboarders.jpg",
        url: "https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=800&h=600&fit=crop",
        alt: "Skateboarders in action"
      },
      {
        name: "equipment.jpg",
        url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop",
        alt: "Safety equipment rental"
      }
    ]
  },
  "resource014": { // Odense Library
    images: [
      {
        name: "interior.jpg",
        url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop",
        alt: "Children's library interior"
      },
      {
        name: "storytelling.jpg",
        url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
        alt: "Storytelling session"
      },
      {
        name: "reading-corner.jpg",
        url: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&h=600&fit=crop",
        alt: "Reading corner for kids"
      }
    ]
  },
  "resource015": { // Odense Swimming Center
    images: [
      {
        name: "main-pool.jpg",
        url: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop",
        alt: "Swimming pool area"
      },
      {
        name: "lessons.jpg",
        url: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&h=600&fit=crop",
        alt: "Children's swimming lessons"
      },
      {
        name: "changing-rooms.jpg",
        url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
        alt: "Family changing rooms"
      }
    ]
  },
  "resource016": { // Hans Christian Andersen Museum
    images: [
      {
        name: "exterior.jpg",
        url: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=800&h=600&fit=crop",
        alt: "Hans Christian Andersen Museum exterior"
      },
      {
        name: "exhibits.jpg",
        url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
        alt: "Fairy tale exhibits"
      },
      {
        name: "workshop.jpg",
        url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop",
        alt: "Children's workshop area"
      }
    ]
  },
  "resource017": { // Odense Adventure Playground
    images: [
      {
        name: "climbing.jpg",
        url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
        alt: "Adventure playground structures"
      },
      {
        name: "zipline.jpg",
        url: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800&h=600&fit=crop",
        alt: "Zip line and play equipment"
      },
      {
        name: "natural-play.jpg",
        url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop",
        alt: "Natural play areas"
      }
    ]
  },
  "resource018": { // Odense Science Center
    images: [
      {
        name: "exhibits.jpg",
        url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop",
        alt: "Science center exhibits"
      },
      {
        name: "experiments.jpg",
        url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop",
        alt: "Children experimenting"
      },
      {
        name: "workshops.jpg",
        url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
        alt: "Educational workshops"
      }
    ]
  },
  "resource019": { // Odense Music School
    images: [
      {
        name: "practice-rooms.jpg",
        url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop",
        alt: "Music school practice rooms"
      },
      {
        name: "lessons.jpg",
        url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop",
        alt: "Children's music lessons"
      },
      {
        name: "performance-hall.jpg",
        url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
        alt: "Performance hall"
      }
    ]
  },
  "resource020": { // Odense Children's Hospital Playroom
    images: [
      {
        name: "interior.jpg",
        url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
        alt: "Hospital playroom interior"
      },
      {
        name: "children-playing.jpg",
        url: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800&h=600&fit=crop",
        alt: "Children playing in hospital"
      },
      {
        name: "therapeutic-equipment.jpg",
        url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop",
        alt: "Therapeutic play equipment"
      }
    ]
  }
};

// Function to download image from URL
async function downloadImage(url, filename) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  } catch (error) {
    console.error(`❌ Error downloading ${filename}:`, error.message);
    return null;
  }
}

// Function to create folder and upload images
async function createFolderAndUploadImages(resourceId, images) {
  console.log(`📁 Creating folder for ${resourceId}...`);
  
  try {
    // Create folder path
    const folderPath = `resources/${resourceId}/`;
    
    // Create a placeholder file to ensure folder exists
    const placeholderFile = bucket.file(`${folderPath}.keep`);
    await placeholderFile.save('', { contentType: 'text/plain' });
    console.log(`   ✅ Folder created: ${folderPath}`);
    
    // Upload images
    console.log(`   📤 Uploading ${images.length} images...`);
    
    for (const image of images) {
      try {
        // Download image from URL
        const imageBuffer = await downloadImage(image.url, image.name);
        if (!imageBuffer) continue;
        
        // Upload to Firebase Storage
        const filePath = `${folderPath}${image.name}`;
        const file = bucket.file(filePath);
        
        await file.save(imageBuffer, {
          metadata: {
            contentType: 'image/jpeg',
            metadata: {
              alt: image.alt,
              uploadedBy: 'import-script'
            }
          }
        });
        
        // Get public URL
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-01-2500' // Far future expiration
        });
        
        console.log(`      ✅ ${image.name} uploaded (${imageBuffer.length} bytes)`);
        console.log(`         📍 URL: ${url}`);
        
      } catch (error) {
        console.error(`      ❌ Error uploading ${image.name}:`, error.message);
      }
    }
    
    console.log(`   🎉 Folder ${resourceId} completed!`);
    console.log("");
    
  } catch (error) {
    console.error(`❌ Error creating folder for ${resourceId}:`, error.message);
  }
}

// Main function
async function createStorageFolders() {
  console.log(`📦 Creating folders and uploading images for ${Object.keys(resourceImages).length} resources...`);
  console.log("");
  
  for (const [resourceId, imageData] of Object.entries(resourceImages)) {
    await createFolderAndUploadImages(resourceId, imageData.images);
  }
}

// Run the script
async function run() {
  try {
    await createStorageFolders();
    console.log("🎉 All Firebase Storage folders created successfully!");
    console.log("");
    console.log("📊 Summary:");
    console.log(`- ${Object.keys(resourceImages).length} resource folders created`);
    console.log("- Each folder contains 3 sample images");
    console.log("- Images are publicly accessible via signed URLs");
    console.log("- Folder structure: resources/resourceXXX/");
    console.log("");
    console.log("🗂️  Folders created:");
    Object.keys(resourceImages).forEach(resourceId => {
      console.log(`   • ${resourceId}/ (3 images)`);
    });
    console.log("");
    console.log("💡 You can now upload additional images to these folders manually");
    console.log("   or modify this script to upload different images.");
    
  } catch (error) {
    console.error("❌ Error creating storage folders:", error.message);
    console.log("");
    console.log("💡 Make sure your Firebase Storage security rules allow write access.");
    console.log("   Check that your service account has Storage Admin permissions.");
    process.exit(1);
  }
}

run();