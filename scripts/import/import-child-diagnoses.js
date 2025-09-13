const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Load service account from project root
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com' // Update with your project ID
});

const db = admin.firestore();

// Child diagnoses data structure
const childDiagnosesData = {
  "neurodevelopmental_behavioral": {
    name: "Neurodevelopmental & Behavioral",
    description: "Conditions affecting brain development, behavior, and learning",
    diagnoses: [
      {
        name: "Autism Spectrum Disorder (ASD)",
        description: "A developmental disorder affecting communication and behavior",
        ageRange: "2-18"
      },
      {
        name: "Attention-Deficit/Hyperactivity Disorder (ADHD)",
        description: "A neurodevelopmental disorder affecting attention and impulse control",
        ageRange: "3-18"
      },
      {
        name: "Attention Deficit Disorder (ADD)",
        description: "A subtype of ADHD without hyperactivity",
        ageRange: "3-18"
      },
      {
        name: "Sensory Processing Disorder",
        description: "Difficulty processing sensory information from the environment",
        ageRange: "2-18"
      },
      {
        name: "Learning Disability",
        description: "Specific learning difficulties (e.g., dyslexia, dyscalculia)",
        ageRange: "5-18"
      },
      {
        name: "Oppositional Defiant Disorder (ODD)",
        description: "A pattern of angry, defiant, and vindictive behavior",
        ageRange: "3-18"
      },
      {
        name: "Anxiety Disorder",
        description: "Excessive worry and fear affecting daily life",
        ageRange: "3-18"
      },
      {
        name: "Speech or Language Delay",
        description: "Delayed development of speech and language skills",
        ageRange: "2-8"
      },
      {
        name: "Intellectual Disability",
        description: "Significant limitations in intellectual functioning and adaptive behavior",
        ageRange: "2-18"
      },
      {
        name: "Developmental Delay",
        description: "Global or specific delays in developmental milestones",
        ageRange: "0-8"
      }
    ]
  },
  "chronic_medical_conditions": {
    name: "Chronic Medical Conditions",
    description: "Long-term health conditions requiring ongoing management",
    diagnoses: [
      {
        name: "Asthma",
        description: "Chronic respiratory condition affecting breathing",
        ageRange: "2-18"
      },
      {
        name: "Allergies",
        description: "Food or environmental allergies",
        ageRange: "0-18"
      },
      {
        name: "Eczema",
        description: "Chronic skin condition causing inflammation and itching",
        ageRange: "0-18"
      },
      {
        name: "Diabetes (Type 1)",
        description: "Autoimmune condition affecting blood sugar regulation",
        ageRange: "0-18"
      },
      {
        name: "Prediabetes",
        description: "Elevated blood sugar levels below diabetes threshold",
        ageRange: "8-18"
      },
      {
        name: "Epilepsy or Seizure Disorder",
        description: "Neurological disorder causing recurrent seizures",
        ageRange: "0-18"
      },
      {
        name: "Gastrointestinal Issues",
        description: "Digestive system disorders (e.g., IBS, reflux)",
        ageRange: "0-18"
      },
      {
        name: "Sleep Disorder",
        description: "Sleep-related conditions (e.g., insomnia, apnea)",
        ageRange: "0-18"
      },
      {
        name: "Heart Condition",
        description: "Various cardiovascular conditions",
        ageRange: "0-18"
      },
      {
        name: "Cystic Fibrosis",
        description: "Genetic disorder affecting lungs and digestive system",
        ageRange: "0-18"
      }
    ]
  },
  "genetic_neurological": {
    name: "Genetic or Neurological",
    description: "Conditions caused by genetic factors or neurological differences",
    diagnoses: [
      {
        name: "Down Syndrome",
        description: "Genetic condition caused by extra chromosome 21",
        ageRange: "0-18"
      },
      {
        name: "Cerebral Palsy",
        description: "Neurological disorder affecting movement and posture",
        ageRange: "0-18"
      },
      {
        name: "Fragile X Syndrome",
        description: "Genetic condition causing intellectual disability",
        ageRange: "0-18"
      },
      {
        name: "Muscular Dystrophy",
        description: "Group of genetic diseases causing muscle weakness",
        ageRange: "0-18"
      },
      {
        name: "Spina Bifida",
        description: "Birth defect affecting spinal cord development",
        ageRange: "0-18"
      }
    ]
  },
  "emotional_psychological": {
    name: "Emotional or Psychological",
    description: "Mental health conditions affecting emotional well-being",
    diagnoses: [
      {
        name: "Depression",
        description: "Persistent feelings of sadness and loss of interest",
        ageRange: "6-18"
      },
      {
        name: "PTSD (Post-Traumatic Stress Disorder)",
        description: "Mental health condition triggered by traumatic events",
        ageRange: "3-18"
      },
      {
        name: "Mood Disorder",
        description: "Conditions affecting emotional state and mood regulation",
        ageRange: "6-18"
      },
      {
        name: "Social Anxiety",
        description: "Intense fear of social situations and interactions",
        ageRange: "8-18"
      },
      {
        name: "Behavioral Regulation Challenges",
        description: "Difficulties managing emotions and behaviors",
        ageRange: "3-18"
      }
    ]
  }
};

async function importChildDiagnoses() {
  try {
    console.log('Starting import of child diagnoses data...');
    
    let totalDiagnoses = 0;
    
    // Iterate through each category
    for (const [categoryId, categoryData] of Object.entries(childDiagnosesData)) {
      console.log(`Processing category: ${categoryData.name}`);
      
      // Create the category document
      const categoryRef = db.collection('child_diagnoses').doc(categoryId);
      const categoryDoc = {
        name: categoryData.name,
        description: categoryData.description,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await categoryRef.set(categoryDoc);
      
      // Add each diagnosis as a subcollection document with Firebase auto-generated keys
      for (const diagnosis of categoryData.diagnoses) {
        const diagnosisRef = categoryRef.collection('diagnoses').doc();
        const diagnosisDoc = {
          name: diagnosis.name,
          description: diagnosis.description,
          ageRange: diagnosis.ageRange,
          category: categoryId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await diagnosisRef.set(diagnosisDoc);
        totalDiagnoses++;
      }
    }
    
    console.log(`✅ Successfully imported child diagnoses data!`);
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${Object.keys(childDiagnosesData).length}`);
    console.log(`   - Total Diagnoses: ${totalDiagnoses}`);
    
    // Print breakdown by category
    console.log(`\n📋 Breakdown by category:`);
    for (const [categoryId, categoryData] of Object.entries(childDiagnosesData)) {
      console.log(`   ${categoryData.name}: ${categoryData.diagnoses.length} diagnoses`);
    }
    
  } catch (error) {
    console.error('❌ Error importing child diagnoses:', error);
    throw error;
  }
}

async function verifyImport() {
  try {
    console.log('\n🔍 Verifying import...');
    
    const categoriesSnapshot = await db.collection('child_diagnoses').get();
    
    if (categoriesSnapshot.empty) {
      console.log('❌ No categories found in the database.');
      return;
    }
    
    console.log(`✅ Found ${categoriesSnapshot.size} categories in the database.`);
    
    let totalDiagnoses = 0;
    
    for (const categoryDoc of categoriesSnapshot.docs) {
      const categoryData = categoryDoc.data();
      const diagnosesSnapshot = await categoryDoc.ref.collection('diagnoses').get();
      
      console.log(`   ${categoryData.name}: ${diagnosesSnapshot.size} diagnoses`);
      totalDiagnoses += diagnosesSnapshot.size;
    }
    
    console.log(`\n📊 Total diagnoses imported: ${totalDiagnoses}`);
    
  } catch (error) {
    console.error('❌ Error verifying import:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Import the child diagnoses data
    await importChildDiagnoses();
    
    // Verify the import
    await verifyImport();
    
    console.log('\n🎉 Child diagnoses import completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Child diagnoses import failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  importChildDiagnoses,
  verifyImport,
  childDiagnosesData
}; 