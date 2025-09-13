const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com'
});

const db = admin.firestore();

// Function to fix Sarah's allergy data
async function fixSarahAllergyData() {
  try {
    console.log('Fixing Sarah Williams allergy data...');
    
    const sarahUserId = 'user004';
    
    // Get Sarah's public children
    const sarahPublicChildrenSnapshot = await db.collection('users_public_data').doc(sarahUserId).collection('children').get();
    console.log(`Found ${sarahPublicChildrenSnapshot.size} public children for Sarah`);
    
    // Get Sarah's private children
    const sarahPrivateChildrenSnapshot = await db.collection('users_private_data').doc(sarahUserId).collection('children').get();
    console.log(`Found ${sarahPrivateChildrenSnapshot.size} private children for Sarah`);
    
    // Create maps for matching
    const publicChildrenMap = new Map();
    const privateChildrenMap = new Map();
    
    sarahPublicChildrenSnapshot.forEach(doc => {
      publicChildrenMap.set(doc.id, doc.data());
    });
    
    sarahPrivateChildrenSnapshot.forEach(doc => {
      privateChildrenMap.set(doc.id, doc.data());
    });
    
    let totalFixed = 0;
    let totalErrors = 0;
    
    // Process each public child
    for (const [childId, publicChildData] of publicChildrenMap) {
      console.log(`\nProcessing child ${childId}...`);
      
      const hasAllergies = publicChildData.allergies && Array.isArray(publicChildData.allergies) && publicChildData.allergies.length > 0;
      const hasDiagnoses = publicChildData.diagnoses && Array.isArray(publicChildData.diagnoses) && publicChildData.diagnoses.length > 0;
      
      if (!hasAllergies && !hasDiagnoses) {
        console.log(`  No allergies or diagnoses to move`);
        continue;
      }
      
      // Find matching private child by name or create new one
      let privateChildId = null;
      let privateChildData = null;
      
      // First, try to find by matching name
      for (const [privId, privData] of privateChildrenMap) {
        if (privData.name && publicChildData.name && 
            privData.name.toLowerCase() === publicChildData.name.toLowerCase()) {
          privateChildId = privId;
          privateChildData = privData;
          console.log(`  Found matching private child by name: ${privData.name} (${privId})`);
          break;
        }
      }
      
      // If no match by name, try to find by age range or other criteria
      if (!privateChildId) {
        console.log(`  No matching private child found by name, will create new one`);
      }
      
      try {
        if (privateChildId) {
          // Update existing private child
          const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          if (hasAllergies) {
            updateData.allergies = publicChildData.allergies;
            console.log(`  Adding ${publicChildData.allergies.length} allergies to existing private child`);
          }
          
          if (hasDiagnoses) {
            updateData.diagnoses = publicChildData.diagnoses;
            console.log(`  Adding ${publicChildData.diagnoses.length} diagnoses to existing private child`);
          }
          
          await db.collection('users_private_data').doc(sarahUserId).collection('children').doc(privateChildId).update(updateData);
          
        } else {
          // Create new private child
          const newPrivateChildRef = db.collection('users_private_data').doc(sarahUserId).collection('children').doc();
          privateChildId = newPrivateChildRef.id;
          
          const newPrivateChildData = {
            name: publicChildData.name || 'Unknown',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          if (hasAllergies) {
            newPrivateChildData.allergies = publicChildData.allergies;
            console.log(`  Creating new private child with ${publicChildData.allergies.length} allergies`);
          }
          
          if (hasDiagnoses) {
            newPrivateChildData.diagnoses = publicChildData.diagnoses;
            console.log(`  Creating new private child with ${publicChildData.diagnoses.length} diagnoses`);
          }
          
          await newPrivateChildRef.set(newPrivateChildData);
          console.log(`  Created new private child: ${privateChildId}`);
        }
        
        // Remove allergies and diagnoses from public child
        const removeData = {
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        if (hasAllergies) {
          removeData.allergies = admin.firestore.FieldValue.delete();
        }
        
        if (hasDiagnoses) {
          removeData.diagnoses = admin.firestore.FieldValue.delete();
        }
        
        await db.collection('users_public_data').doc(sarahUserId).collection('children').doc(childId).update(removeData);
        
        console.log(`  ✅ Successfully moved data and removed from public child`);
        totalFixed++;
        
      } catch (error) {
        console.error(`  ❌ Error processing child ${childId}: ${error.message}`);
        totalErrors++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('FIX SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total children fixed: ${totalFixed}`);
    console.log(`Total errors: ${totalErrors}`);
    
    return {
      success: true,
      totalFixed,
      totalErrors
    };
    
  } catch (error) {
    console.error('Error fixing Sarah allergy data:', error);
    throw error;
  }
}

// Function to verify the fix
async function verifySarahFix() {
  try {
    console.log('Verifying Sarah Williams data after fix...');
    
    const sarahUserId = 'user004';
    
    // Check Sarah's children in public data
    const sarahPublicChildrenSnapshot = await db.collection('users_public_data').doc(sarahUserId).collection('children').get();
    console.log(`\nSarah's public children (${sarahPublicChildrenSnapshot.size}):`);
    
    let publicAllergies = 0;
    let publicDiagnoses = 0;
    
    sarahPublicChildrenSnapshot.forEach((childDoc, index) => {
      const childData = childDoc.data();
      const allergies = childData.allergies ? childData.allergies.length : 0;
      const diagnoses = childData.diagnoses ? childData.diagnoses.length : 0;
      
      publicAllergies += allergies;
      publicDiagnoses += diagnoses;
      
      console.log(`  Child ${index + 1} (${childDoc.id}): ${childData.name || 'Unknown'}`);
      console.log(`    Allergies: ${allergies}, Diagnoses: ${diagnoses}`);
    });
    
    // Check Sarah's children in private data
    const sarahPrivateChildrenSnapshot = await db.collection('users_private_data').doc(sarahUserId).collection('children').get();
    console.log(`\nSarah's private children (${sarahPrivateChildrenSnapshot.size}):`);
    
    let privateAllergies = 0;
    let privateDiagnoses = 0;
    
    sarahPrivateChildrenSnapshot.forEach((childDoc, index) => {
      const childData = childDoc.data();
      const allergies = childData.allergies ? childData.allergies.length : 0;
      const diagnoses = childData.diagnoses ? childData.diagnoses.length : 0;
      
      privateAllergies += allergies;
      privateDiagnoses += diagnoses;
      
      console.log(`  Child ${index + 1} (${childDoc.id}): ${childData.name || 'Unknown'}`);
      console.log(`    Allergies: ${allergies}, Diagnoses: ${diagnoses}`);
      
      if (allergies > 0) {
        console.log(`    Allergy details:`, childData.allergies.map(a => a.name || a));
      }
    });
    
    console.log('\nSUMMARY:');
    console.log(`Public allergies: ${publicAllergies}, Public diagnoses: ${publicDiagnoses}`);
    console.log(`Private allergies: ${privateAllergies}, Private diagnoses: ${privateDiagnoses}`);
    
    if (publicAllergies === 0 && publicDiagnoses === 0 && (privateAllergies > 0 || privateDiagnoses > 0)) {
      console.log('✅ Fix successful: All data moved to private collection');
    } else {
      console.log('⚠️  Some data may still be in public collection');
    }
    
    return {
      publicAllergies,
      publicDiagnoses,
      privateAllergies,
      privateDiagnoses,
      fixSuccessful: publicAllergies === 0 && publicDiagnoses === 0 && (privateAllergies > 0 || privateDiagnoses > 0)
    };
    
  } catch (error) {
    console.error('Error during verification:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Choose which function to run:
    
    // Option 1: Fix Sarah's allergy data
    // await fixSarahAllergyData();
    
    // Option 2: Verify the fix
    await verifySarahFix();
    
    console.log('\nSarah Williams allergy data fix completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('Sarah Williams fix failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  fixSarahAllergyData,
  verifySarahFix
};
