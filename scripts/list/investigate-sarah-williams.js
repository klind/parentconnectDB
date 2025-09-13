const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com'
});

const db = admin.firestore();

// Function to find Sarah Williams and investigate her data
async function investigateSarahWilliams() {
  try {
    console.log('Investigating Sarah Williams data...');
    
    // Search for Sarah Williams in public data
    const publicUsersSnapshot = await db.collection('users_public_data').get();
    let sarahUserId = null;
    let sarahPublicData = null;
    
    for (const doc of publicUsersSnapshot.docs) {
      const data = doc.data();
      if (data.displayName && data.displayName.toLowerCase().includes('sarah') && 
          data.displayName.toLowerCase().includes('williams')) {
        sarahUserId = doc.id;
        sarahPublicData = data;
        console.log(`Found Sarah Williams with user ID: ${sarahUserId}`);
        break;
      }
    }
    
    if (!sarahUserId) {
      console.log('Sarah Williams not found in public data. Searching by other criteria...');
      
      // Search by other possible identifiers
      for (const doc of publicUsersSnapshot.docs) {
        const data = doc.data();
        console.log(`User ${doc.id}: ${data.displayName || 'No display name'}`);
      }
      return;
    }
    
    console.log(`\nSarah Williams (${sarahUserId}) public data:`);
    console.log(`  Display Name: ${sarahPublicData.displayName}`);
    console.log(`  Bio: ${sarahPublicData.bio || 'No bio'}`);
    console.log(`  Location: ${sarahPublicData.location || 'No location'}`);
    
    // Check Sarah's children in public data
    const sarahPublicChildrenSnapshot = await db.collection('users_public_data').doc(sarahUserId).collection('children').get();
    console.log(`\nSarah's public children (${sarahPublicChildrenSnapshot.size}):`);
    
    sarahPublicChildrenSnapshot.forEach((childDoc, index) => {
      const childData = childDoc.data();
      console.log(`  Child ${index + 1} (${childDoc.id}):`);
      console.log(`    Name: ${childData.name || 'Unknown'}`);
      console.log(`    Age Range ID: ${childData.ageRangeId || 'Not set'}`);
      console.log(`    Allergies: ${childData.allergies ? childData.allergies.length : 0} items`);
      console.log(`    Diagnoses: ${childData.diagnoses ? childData.diagnoses.length : 0} items`);
      console.log(`    Interests: ${childData.interests ? childData.interests.length : 0} items`);
      
      if (childData.allergies && childData.allergies.length > 0) {
        console.log(`    Allergy details:`, childData.allergies.map(a => a.name || a));
      }
      if (childData.diagnoses && childData.diagnoses.length > 0) {
        console.log(`    Diagnosis details:`, childData.diagnoses.map(d => d.name || d));
      }
    });
    
    // Check Sarah's children in private data
    const sarahPrivateChildrenSnapshot = await db.collection('users_private_data').doc(sarahUserId).collection('children').get();
    console.log(`\nSarah's private children (${sarahPrivateChildrenSnapshot.size}):`);
    
    sarahPrivateChildrenSnapshot.forEach((childDoc, index) => {
      const childData = childDoc.data();
      console.log(`  Child ${index + 1} (${childDoc.id}):`);
      console.log(`    Name: ${childData.name || 'Unknown'}`);
      console.log(`    Age: ${childData.age || 'Not set'}`);
      console.log(`    Allergies: ${childData.allergies ? childData.allergies.length : 0} items`);
      console.log(`    Diagnoses: ${childData.diagnoses ? childData.diagnoses.length : 0} items`);
      console.log(`    Notes: ${childData.notes || 'No notes'}`);
      
      if (childData.allergies && childData.allergies.length > 0) {
        console.log(`    Allergy details:`, childData.allergies.map(a => a.name || a));
      }
      if (childData.diagnoses && childData.diagnoses.length > 0) {
        console.log(`    Diagnosis details:`, childData.diagnoses.map(d => d.name || d));
      }
    });
    
    // Check if there are any children that might have been copied from Sarah
    console.log(`\nChecking for children that might have been copied from Sarah...`);
    
    // Look for children with similar allergy patterns
    const allPublicChildrenSnapshot = await db.collection('users_public_data').get();
    let potentialMatches = [];
    
    for (const userDoc of allPublicChildrenSnapshot.docs) {
      if (userDoc.id === sarahUserId) continue; // Skip Sarah herself
      
      const childrenSnapshot = await userDoc.ref.collection('children').get();
      childrenSnapshot.forEach(childDoc => {
        const childData = childDoc.data();
        if (childData.allergies && childData.allergies.length > 0) {
          // Check if this child has similar allergy patterns
          const allergyNames = childData.allergies.map(a => a.name || a).sort();
          potentialMatches.push({
            userId: userDoc.id,
            childId: childDoc.id,
            childName: childData.name || 'Unknown',
            allergies: allergyNames,
            allergyCount: childData.allergies.length
          });
        }
      });
    }
    
    if (potentialMatches.length > 0) {
      console.log(`\nFound ${potentialMatches.length} children with allergies (potential matches):`);
      potentialMatches.forEach((match, index) => {
        console.log(`  ${index + 1}. User ${match.userId}, Child ${match.childName} (${match.childId})`);
        console.log(`     Allergies (${match.allergyCount}): ${match.allergies.join(', ')}`);
      });
    }
    
    return {
      sarahUserId,
      sarahPublicData,
      publicChildrenCount: sarahPublicChildrenSnapshot.size,
      privateChildrenCount: sarahPrivateChildrenSnapshot.size,
      potentialMatches
    };
    
  } catch (error) {
    console.error('Error investigating Sarah Williams:', error);
    throw error;
  }
}

// Function to restore Sarah's allergy data if needed
async function restoreSarahAllergyData(sarahUserId, childId, allergies) {
  try {
    console.log(`Restoring allergy data for Sarah's child ${childId}...`);
    
    // Add allergies back to public data
    await db.collection('users_public_data').doc(sarahUserId).collection('children').doc(childId).update({
      allergies: allergies,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Restored ${allergies.length} allergies to public data`);
    
    // Remove from private data
    await db.collection('users_private_data').doc(sarahUserId).collection('children').doc(childId).update({
      allergies: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Removed allergies from private data`);
    
  } catch (error) {
    console.error('Error restoring allergy data:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await investigateSarahWilliams();
    
    console.log('\nInvestigation completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('Investigation failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  investigateSarahWilliams,
  restoreSarahAllergyData
};
