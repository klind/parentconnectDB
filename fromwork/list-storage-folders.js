const admin = require("firebase-admin");

// Load service account
const serviceAccount = require("./serviceAccountKey.json");

console.log("📋 Listing Firebase Storage Folders:");
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

// Function to list folders
async function listStorageFolders() {
  try {
    console.log("🔍 Scanning Firebase Storage...");
    console.log("");
    
    // List all files in the resources folder
    const [files] = await bucket.getFiles({
      prefix: 'resources/'
    });
    
    if (files.length === 0) {
      console.log("❌ No files found in resources/ folder");
      return;
    }
    
    console.log(`📁 Found ${files.length} files in resources/ folder:`);
    console.log("");
    
    // Group files by folder
    const folders = {};
    
    files.forEach(file => {
      const pathParts = file.name.split('/');
      if (pathParts.length >= 3) {
        const folderName = pathParts[1]; // resources/folderName/file.jpg
        if (!folders[folderName]) {
          folders[folderName] = [];
        }
        folders[folderName].push(pathParts[2]); // filename
      }
    });
    
    // Display folders and their files
    Object.keys(folders).sort().forEach(folderName => {
      console.log(`📂 ${folderName}/ (${folders[folderName].length} files):`);
      folders[folderName].forEach(fileName => {
        console.log(`   📄 ${fileName}`);
      });
      console.log("");
    });
    
    console.log("📊 Summary:");
    console.log(`- ${Object.keys(folders).length} folders found`);
    console.log(`- ${files.length} total files`);
    console.log("");
    
    // Check if folders match expected document IDs
    const expectedFolders = [
      'resource011', 'resource012', 'resource013', 'resource014', 'resource015',
      'resource016', 'resource017', 'resource018', 'resource019', 'resource020'
    ];
    
    console.log("🔍 Checking folder name consistency:");
    expectedFolders.forEach(expectedFolder => {
      if (folders[expectedFolder]) {
        console.log(`   ✅ ${expectedFolder}/ exists (${folders[expectedFolder].length} files)`);
      } else {
        console.log(`   ❌ ${expectedFolder}/ missing`);
      }
    });
    
  } catch (error) {
    console.error("❌ Error listing storage folders:", error.message);
  }
}

// Run the script
listStorageFolders();