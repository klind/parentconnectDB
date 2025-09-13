const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importStructuredChildInterests() {
  try {
    console.log('🔄 Starting to import structured child interests with Firebase auto-generated keys...');
    
    // Define the structured interests with categories, age ranges, and quick-pick favorites
    const structuredInterests = {
      // Quick-pick favorites (most common interests)
      "quick_picks": {
        name: "Quick Picks",
        description: "Most popular interests for quick selection",
        interests: [
          { name: "Soccer", ageRange: "3-12", isFavorite: true, searchTerms: ["soccer", "football", "ball", "sport"] },
          { name: "Music", ageRange: "2-18", isFavorite: true, searchTerms: ["music", "singing", "songs", "melody"] },
          { name: "Art", ageRange: "2-12", isFavorite: true, searchTerms: ["art", "drawing", "painting", "creative"] },
          { name: "Reading", ageRange: "2-12", isFavorite: true, searchTerms: ["reading", "books", "stories", "literature"] },
          { name: "LEGO", ageRange: "4-12", isFavorite: true, searchTerms: ["lego", "building", "blocks", "construction"] },
          { name: "Video Games", ageRange: "5-18", isFavorite: true, searchTerms: ["video games", "gaming", "games", "digital"] }
        ]
      },
      
      // Creative & Arts
      "creative_arts": {
        name: "Creative & Arts",
        description: "Artistic and creative expression activities",
        interests: [
          { name: "Drawing", ageRange: "2-12", searchTerms: ["drawing", "sketch", "pencil", "art"] },
          { name: "Painting", ageRange: "3-12", searchTerms: ["painting", "brush", "canvas", "colors"] },
          { name: "Coloring", ageRange: "2-8", searchTerms: ["coloring", "crayons", "markers", "fill"] },
          { name: "Dancing", ageRange: "2-12", searchTerms: ["dancing", "dance", "movement", "rhythm"] },
          { name: "Ballet", ageRange: "3-18", searchTerms: ["ballet", "classical", "dance", "grace"] },
          { name: "Hip Hop Dance", ageRange: "8-18", searchTerms: ["hip hop", "street dance", "urban", "rhythm"] },
          { name: "Drama", ageRange: "4-12", searchTerms: ["drama", "theater", "acting", "performance"] },
          { name: "Singing", ageRange: "2-12", searchTerms: ["singing", "voice", "vocal", "melody"] },
          { name: "Piano", ageRange: "5-18", searchTerms: ["piano", "keyboard", "music", "instrument"] },
          { name: "Guitar", ageRange: "8-18", searchTerms: ["guitar", "string", "music", "acoustic"] },
          { name: "Violin", ageRange: "4-18", searchTerms: ["violin", "classical", "string", "orchestra"] },
          { name: "Drums", ageRange: "6-18", searchTerms: ["drums", "percussion", "rhythm", "beat"] },
          { name: "Photography", ageRange: "8-18", searchTerms: ["photography", "camera", "photos", "images"] },
          { name: "Fashion", ageRange: "10-18", searchTerms: ["fashion", "style", "clothing", "design"] },
          { name: "Makeup", ageRange: "12-18", searchTerms: ["makeup", "beauty", "cosmetics", "style"] },
          { name: "Poetry", ageRange: "10-18", searchTerms: ["poetry", "poems", "writing", "creative"] },
          { name: "Creative Writing", ageRange: "8-18", searchTerms: ["writing", "stories", "creative", "narrative"] },
          { name: "Journaling", ageRange: "10-18", searchTerms: ["journaling", "diary", "reflection", "writing"] }
        ]
      },
      
      // Sports & Physical Activities
      "sports_physical": {
        name: "Sports & Physical Activities",
        description: "Physical activities, sports, and fitness",
        interests: [
          { name: "Basketball", ageRange: "6-18", searchTerms: ["basketball", "hoop", "ball", "team sport"] },
          { name: "Baseball", ageRange: "5-18", searchTerms: ["baseball", "bat", "ball", "team sport"] },
          { name: "Tennis", ageRange: "6-18", searchTerms: ["tennis", "racquet", "court", "individual sport"] },
          { name: "Swimming", ageRange: "3-12", searchTerms: ["swimming", "water", "pool", "aquatic"] },
          { name: "Biking", ageRange: "4-12", searchTerms: ["biking", "cycling", "bicycle", "outdoor"] },
          { name: "Skateboarding", ageRange: "8-18", searchTerms: ["skateboarding", "skate", "board", "extreme sport"] },
          { name: "Rock Climbing", ageRange: "6-12", searchTerms: ["rock climbing", "climbing", "wall", "adventure"] },
          { name: "Martial Arts", ageRange: "5-18", searchTerms: ["martial arts", "karate", "taekwondo", "self defense"] },
          { name: "Yoga", ageRange: "3-10", searchTerms: ["yoga", "mindfulness", "flexibility", "wellness"] }
        ]
      },
      
      // Educational & STEM
      "educational_stem": {
        name: "Educational & STEM",
        description: "Science, technology, engineering, and math activities",
        interests: [
          { name: "Math", ageRange: "3-10", searchTerms: ["math", "numbers", "counting", "arithmetic"] },
          { name: "Science", ageRange: "4-12", searchTerms: ["science", "experiments", "discovery", "learning"] },
          { name: "Biology", ageRange: "8-18", searchTerms: ["biology", "life science", "animals", "plants"] },
          { name: "Chemistry", ageRange: "10-18", searchTerms: ["chemistry", "lab", "experiments", "molecules"] },
          { name: "Physics", ageRange: "12-18", searchTerms: ["physics", "forces", "motion", "energy"] },
          { name: "Astronomy", ageRange: "8-18", searchTerms: ["astronomy", "space", "stars", "planets"] },
          { name: "Coding", ageRange: "8-18", searchTerms: ["coding", "programming", "computer", "technology"] },
          { name: "Robotics", ageRange: "6-12", searchTerms: ["robotics", "robots", "engineering", "technology"] },
          { name: "3D Printing", ageRange: "10-18", searchTerms: ["3d printing", "digital fabrication", "technology", "design"] },
          { name: "Chess", ageRange: "6-12", searchTerms: ["chess", "strategy", "board game", "thinking"] },
          { name: "Puzzles", ageRange: "3-10", searchTerms: ["puzzles", "problem solving", "logic", "games"] },
          { name: "Building Blocks", ageRange: "2-10", searchTerms: ["building blocks", "construction", "toys", "building"] },
          { name: "Woodworking", ageRange: "8-12", searchTerms: ["woodworking", "building", "crafts", "tools"] },
          { name: "Foreign Languages", ageRange: "3-18", searchTerms: ["foreign languages", "language learning", "bilingual", "communication"] },
          { name: "Korean Language", ageRange: "4-12", searchTerms: ["korean", "language", "asian", "communication"] },
          { name: "Debate", ageRange: "12-18", searchTerms: ["debate", "public speaking", "argument", "communication"] },
          { name: "Model UN", ageRange: "14-18", searchTerms: ["model un", "diplomacy", "international", "politics"] }
        ]
      },
      
      // Entertainment & Play
      "entertainment_play": {
        name: "Entertainment & Play",
        description: "Fun activities, toys, and entertainment",
        interests: [
          { name: "Cars", ageRange: "2-8", searchTerms: ["cars", "vehicles", "toys", "transportation"] },
          { name: "Trains", ageRange: "2-8", searchTerms: ["trains", "railroad", "toys", "transportation"] },
          { name: "Dolls", ageRange: "2-8", searchTerms: ["dolls", "pretend play", "imagination", "toys"] },
          { name: "Gaming", ageRange: "5-18", searchTerms: ["gaming", "video games", "digital", "entertainment"] },
          { name: "Social Media", ageRange: "13-18", searchTerms: ["social media", "digital", "communication", "online"] }
        ]
      },
      
      // Lifestyle & Wellness
      "lifestyle_wellness": {
        name: "Lifestyle & Wellness",
        description: "Daily life activities and wellness practices",
        interests: [
          { name: "Cooking", ageRange: "4-12", searchTerms: ["cooking", "food", "kitchen", "recipes"] },
          { name: "Baking", ageRange: "6-18", searchTerms: ["baking", "pastry", "desserts", "kitchen"] },
          { name: "Healthy Eating", ageRange: "3-12", searchTerms: ["healthy eating", "nutrition", "food", "wellness"] },
          { name: "Meditation", ageRange: "8-18", searchTerms: ["meditation", "mindfulness", "relaxation", "wellness"] },
          { name: "Gardening", ageRange: "4-12", searchTerms: ["gardening", "plants", "nature", "outdoor"] },
          { name: "Nature", ageRange: "2-12", searchTerms: ["nature", "outdoor", "exploration", "environment"] },
          { name: "Travel", ageRange: "10-18", searchTerms: ["travel", "exploration", "culture", "adventure"] },
          { name: "Driving", ageRange: "16-18", searchTerms: ["driving", "automotive", "transportation", "skills"] }
        ]
      },
      
      // Social & Business
      "social_business": {
        name: "Social & Business",
        description: "Social activities and business skills",
        interests: [
          { name: "Activism", ageRange: "14-18", searchTerms: ["activism", "advocacy", "social change", "community"] },
          { name: "Volunteering", ageRange: "12-18", searchTerms: ["volunteering", "community service", "helping", "social"] },
          { name: "Entrepreneurship", ageRange: "12-18", searchTerms: ["entrepreneurship", "business", "startup", "innovation"] },
          { name: "Investing", ageRange: "14-18", searchTerms: ["investing", "finance", "money", "financial literacy"] }
        ]
      }
    };
    
    console.log(`📋 Importing ${Object.keys(structuredInterests).length} categories with Firebase auto-generated keys...`);
    
    const importedInterests = [];
    
    // Import each category and its interests
    for (const [categoryId, categoryData] of Object.entries(structuredInterests)) {
      try {
        console.log(`\n🏷️  Processing category: ${categoryData.name}`);
        
        // Import each interest in the category
        for (const interest of categoryData.interests) {
          try {
            const interestRef = db.collection('child_interests').doc(); // Let Firebase generate the key
            const interestDoc = {
              name: interest.name,
              category: categoryId,
              categoryName: categoryData.name,
              description: categoryData.description,
              ageRange: interest.ageRange,
              isFavorite: interest.isFavorite || false,
              searchTerms: interest.searchTerms || [],
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            
            await interestRef.set(interestDoc);
            
            const importedInterest = {
              key: interestRef.id,
              name: interest.name,
              category: categoryId,
              categoryName: categoryData.name,
              ageRange: interest.ageRange,
              isFavorite: interest.isFavorite || false
            };
            
            importedInterests.push(importedInterest);
            console.log(`   ✅ Imported: ${interest.name} (Key: ${interestRef.id})`);
            
          } catch (error) {
            console.error(`   ❌ Error importing ${interest.name}:`, error.message);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing category ${categoryId}:`, error.message);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   🏷️  Categories: ${Object.keys(structuredInterests).length}`);
    console.log(`   📋 Total interests: ${importedInterests.length}`);
    console.log(`   ✅ Successfully imported: ${importedInterests.length}`);
    console.log(`   🔑 Using Firebase auto-generated keys`);
    console.log(`   ⭐ Quick-pick favorites: ${importedInterests.filter(i => i.isFavorite).length}`);
    
    console.log('\n🏷️  Categories created:');
    Object.entries(structuredInterests).forEach(([id, data]) => {
      const count = data.interests.length;
      console.log(`   • ${data.name}: ${count} interests`);
    });
    
    console.log('\n⭐ Quick-pick favorites:');
    importedInterests.filter(i => i.isFavorite).forEach(interest => {
      console.log(`   • ${interest.name} (${interest.categoryName})`);
    });
    
    console.log('\n✅ Structured child interests import completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
  } finally {
    process.exit(0);
  }
}

importStructuredChildInterests();






