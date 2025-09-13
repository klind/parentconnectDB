const fs = require('fs');
const path = require('path');

// Define the mapping of files to their target directories
const fileMappings = {
  // Files that already exist in scripts/ - DELETE from fromwork
  'delete-users.js': 'scripts/import/delete-users.js',
  'fix-resource-addresses.js': 'scripts/fix/fix-resource-addresses.js',
  'import-activity-categories.js': 'scripts/import/import-activity-categories.js',
  'import-child-diagnoses.js': 'scripts/import/import-child-diagnoses.js',
  'import-salt-lake-resources.js': 'scripts/import/import-salt-lake-resources.js',
  'insert-20-salt-lake-activities.js': 'scripts/import/insert-20-salt-lake-activities.js',
  'insert-50-posts.js': 'scripts/import/insert-50-posts.js',
  'insert-app-config.js': 'scripts/import/insert-app-config.js',
  'list-activity-categories.js': 'scripts/list/list-activity-categories.js',
  'list-all-activities.js': 'scripts/list/list-all-activities.js',
  'list-all-categories.js': 'scripts/list/list-all-categories.js',
  'list-all-resources.js': 'scripts/list/list-all-resources.js',
  'list-allergies.js': 'scripts/list/list-allergies.js',
  'list-child-diagnoses.js': 'scripts/list/list-child-diagnoses.js',
  'list-child-interests.js': 'scripts/list/list-child-interests.js',
  'list-collections.js': 'scripts/list/list-collections.js',
  'list-parent-interests.js': 'scripts/list/list-parent-interests.js',
  'list-resource-attributes.js': 'scripts/list/list-resource-attributes.js',
  'list-resource-categories.js': 'scripts/list/list-resource-categories.js',
  'list-resources-with-imagefolder.js': 'scripts/list/list-resources-with-imagefolder.js',
  'list-storage-folders.js': 'scripts/list/list-storage-folders.js',
  'list-users.js': 'scripts/list/list-users.js',
  'read_community_posts.js': 'scripts/list/read_community_posts.js',
  'update-posts-author-location.js': 'scripts/import/update-posts-author-location.js',
  'validate-resource-fields.js': 'scripts/validation/validate-resource-fields.js',
  'create-storage-folders.js': 'scripts/import/create-storage-folders.js',
  'upload-resource-images.js': 'scripts/import/upload-resource-images.js',

  // Files that don't exist - MOVE to appropriate folders
  'add-age-range-to-children.js': 'scripts/fix/add-age-range-to-children.js',
  'analyze-location-data.js': 'scripts/list/analyze-location-data.js',
  'cleanup-age-range-fields.js': 'scripts/fix/cleanup-age-range-fields.js',
  'copy-children-between-users.js': 'scripts/fix/copy-children-between-users.js',
  'create-age-ranges-simple.js': 'scripts/import/create-age-ranges-simple.js',
  'delete-resource-images.js': 'scripts/fix/delete-resource-images.js',
  'firebase-test-animation-admin.js': 'scripts/import/firebase-test-animation-admin.js',
  'firebase-test-animation.js': 'scripts/import/firebase-test-animation.js',
  'fix-message-created-at.js': 'scripts/fix/fix-message-created-at.js',
  'fix-resource-categories.js': 'scripts/fix/fix-resource-categories.js',
  'fix-sarah-allergy-data.js': 'scripts/fix/fix-sarah-allergy-data.js',
  'get-validation-rules.js': 'scripts/list/get-validation-rules.js',
  'import-las-vegas-resources.js': 'scripts/import/import-las-vegas-resources.js',
  'insert-validation-rules.js': 'scripts/import/insert-validation-rules.js',
  'investigate-sarah-williams.js': 'scripts/list/investigate-sarah-williams.js',
  'list-age-ranges.js': 'scripts/list/list-age-ranges.js',
  'list-all-resources-basic-json.js': 'scripts/list/list-all-resources-basic-json.js',
  'list-children-enhanced.js': 'scripts/list/list-children-enhanced.js',
  'list-children-final.js': 'scripts/list/list-children-final.js',
  'list-children.js': 'scripts/list/list-children.js',
  'list-las-vegas-cities.js': 'scripts/list/list-las-vegas-cities.js',
  'list-nv-resources-basic-json.js': 'scripts/list/list-nv-resources-basic-json.js',
  'list-unique-categories.js': 'scripts/list/list-unique-categories.js',
  'list-unique-states.js': 'scripts/list/list-unique-states.js',
  'move-age-field.js': 'scripts/fix/move-age-field.js',
  'move-allergies-diagnoses.js': 'scripts/fix/move-allergies-diagnoses.js',
  'reorganize-location-data.js': 'scripts/fix/reorganize-location-data.js',
  'verify-age-ranges.js': 'scripts/list/verify-age-ranges.js'
};

async function organizeFromworkFiles() {
  try {
    console.log('🗂️  Organizing files from fromwork folder...');
    console.log('');

    const fromworkDir = './fromwork';
    const files = fs.readdirSync(fromworkDir);
    
    let deletedCount = 0;
    let movedCount = 0;
    let errorCount = 0;

    for (const file of files) {
      const fromworkPath = path.join(fromworkDir, file);
      
      if (fileMappings[file]) {
        const targetPath = fileMappings[file];
        
        // Check if target file already exists
        if (fs.existsSync(targetPath)) {
          // File exists in scripts/ - DELETE from fromwork
          fs.unlinkSync(fromworkPath);
          console.log(`🗑️  DELETED: ${file} (already exists in ${targetPath})`);
          deletedCount++;
        } else {
          // File doesn't exist - MOVE to target location
          const targetDir = path.dirname(targetPath);
          
          // Create target directory if it doesn't exist
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          
          // Move file
          fs.renameSync(fromworkPath, targetPath);
          console.log(`📁 MOVED: ${file} → ${targetPath}`);
          movedCount++;
        }
      } else {
        console.log(`⚠️  UNMAPPED: ${file} - no mapping defined`);
        errorCount++;
      }
    }

    console.log('');
    console.log('📊 SUMMARY:');
    console.log(`   🗑️  Files deleted (already existed): ${deletedCount}`);
    console.log(`   📁 Files moved to scripts/: ${movedCount}`);
    console.log(`   ⚠️  Unmapped files: ${errorCount}`);

    // Check if fromwork folder is empty
    const remainingFiles = fs.readdirSync(fromworkDir);
    if (remainingFiles.length === 0) {
      console.log('\n✅ fromwork folder is now empty!');
      // Optionally remove the empty folder
      fs.rmdirSync(fromworkDir);
      console.log('🗑️  Removed empty fromwork folder');
    } else {
      console.log(`\n⚠️  fromwork folder still contains ${remainingFiles.length} files:`);
      remainingFiles.forEach(file => console.log(`   • ${file}`));
    }

  } catch (error) {
    console.error('❌ Error organizing files:', error);
  }
}

organizeFromworkFiles();
