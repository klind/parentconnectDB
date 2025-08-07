const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Available users for author selection
const users = [
  "kh9A93UuJuO5YaQ0M9nWSK0KeRo1",
  "user001",
  "user002", 
  "user003",
  "user004",
  "user005",
  "user006",
  "user007",
  "user008",
  "user009",
  "user010",
  "wr6TfEAKy8fcU9agJyWyOdtgfRO2",
  "z1RjlZyE5rdCfA3D0cMqEq57wcn1"
];

// Salt Lake City addresses
const saltLakeAddresses = [
  { street: "123 Main Street", city: "Salt Lake City", state: "UT", zip: "84101" },
  { street: "456 South Temple", city: "Salt Lake City", state: "UT", zip: "84101" },
  { street: "789 East 400 South", city: "Salt Lake City", state: "UT", zip: "84111" },
  { street: "321 West 200 South", city: "Salt Lake City", state: "UT", zip: "84101" },
  { street: "654 North 300 West", city: "Salt Lake City", state: "UT", zip: "84103" },
  { street: "987 East 600 South", city: "Salt Lake City", state: "UT", zip: "84102" },
  { street: "147 South 500 East", city: "Salt Lake City", state: "UT", zip: "84102" },
  { street: "258 West 400 North", city: "Salt Lake City", state: "UT", zip: "84103" },
  { street: "369 East 800 South", city: "Salt Lake City", state: "UT", zip: "84102" },
  { street: "741 North 900 West", city: "Salt Lake City", state: "UT", zip: "84116" },
  { street: "852 South 700 East", city: "Salt Lake City", state: "UT", zip: "84102" },
  { street: "963 West 1000 North", city: "Salt Lake City", state: "UT", zip: "84116" },
  { street: "159 East 1100 South", city: "Salt Lake City", state: "UT", zip: "84105" },
  { street: "357 North 1200 West", city: "Salt Lake City", state: "UT", zip: "84116" },
  { street: "468 South 1300 East", city: "Salt Lake City", state: "UT", zip: "84105" },
  { street: "579 West 1400 North", city: "Salt Lake City", state: "UT", zip: "84116" },
  { street: "680 East 1500 South", city: "Salt Lake City", state: "UT", zip: "84105" },
  { street: "791 North 1600 West", city: "Salt Lake City", state: "UT", zip: "84116" },
  { street: "802 South 1700 East", city: "Salt Lake City", state: "UT", zip: "84108" },
  { street: "913 West 1800 North", city: "Salt Lake City", state: "UT", zip: "84116" }
];

// Activity templates with diverse categories
const activityTemplates = [
  {
    title: "Family Art Workshop",
    description: "Join us for a fun family art workshop where kids and parents can create together. We'll be making seasonal crafts and paintings. All materials provided.",
    category: "WkipTqWAGnSQAmD9aIzk", // Creative Arts
    tags: ["art", "family", "creative", "workshop"]
  },
  {
    title: "Science Discovery Day",
    description: "Explore the wonders of science through hands-on experiments. Perfect for curious kids aged 6-12. We'll cover chemistry, physics, and biology basics.",
    category: "4UJ7gCrr5mtyte1oDICR", // STEM Activities
    tags: ["science", "educational", "experiments", "hands-on"]
  },
  {
    title: "Outdoor Nature Hike",
    description: "Family-friendly nature hike in the beautiful Salt Lake City mountains. Learn about local flora and fauna while getting exercise and fresh air.",
    category: "qCi5dCwxe6gNUNv7EziL", // Outdoor Adventure
    tags: ["hiking", "nature", "outdoor", "family"]
  },
  {
    title: "Cooking Class for Kids",
    description: "Learn basic cooking skills in a safe, supervised environment. Kids will make simple, healthy recipes they can recreate at home.",
    category: "Gy2ZNPdCmMtLwJCfLraP", // Life Skills
    tags: ["cooking", "life skills", "healthy", "educational"]
  },
  {
    title: "Family Yoga Session",
    description: "Gentle yoga session designed for families. Improve flexibility, balance, and mindfulness together. No experience required.",
    category: "PlYwl5vd3CynhzEfKed1", // Wellness & Mindfulness
    tags: ["yoga", "wellness", "family", "mindfulness"]
  },
  {
    title: "Cultural Story Time",
    description: "Multicultural story time featuring books from around the world. Learn about different cultures through storytelling and activities.",
    category: "RqKcPjNXbWpPAB5YR9wq", // Cultural & Heritage
    tags: ["cultural", "storytelling", "education", "diversity"]
  },
  {
    title: "Family Game Night",
    description: "Board games and card games for the whole family. A great way to spend quality time together and develop strategic thinking.",
    category: "iI7sWU3YkkvR9mM8nNFK", // Entertainment
    tags: ["games", "family", "entertainment", "strategy"]
  },
  {
    title: "Soccer Skills Clinic",
    description: "Basic soccer skills clinic for kids aged 5-10. Learn dribbling, passing, and shooting in a fun, supportive environment.",
    category: "cPXisl0N6IX0SZmU2hW7", // Sports & Fitness
    tags: ["soccer", "sports", "fitness", "skills"]
  },
  {
    title: "Math Fun Workshop",
    description: "Make math exciting through games, puzzles, and hands-on activities. Perfect for elementary school students.",
    category: "YYKB1SKzS5OeQ50ArFiY", // Educational
    tags: ["math", "educational", "games", "fun"]
  },
  {
    title: "Community Playdate",
    description: "Casual playdate for families to meet and socialize. Kids can play while parents connect and share parenting tips.",
    category: "3kNEoeW48l4qT63uuZRB", // Social Events
    tags: ["playdate", "social", "community", "networking"]
  },
  {
    title: "Music and Movement",
    description: "Interactive music session with singing, dancing, and simple instruments. Great for developing rhythm and coordination.",
    category: "WkipTqWAGnSQAmD9aIzk", // Creative Arts
    tags: ["music", "movement", "creative", "rhythm"]
  },
  {
    title: "Gardening Workshop",
    description: "Learn about plants and gardening. Kids will plant seeds and learn about the growing process. Take home your own plant!",
    category: "qCi5dCwxe6gNUNv7EziL", // Outdoor Adventure
    tags: ["gardening", "plants", "outdoor", "educational"]
  },
  {
    title: "Craft and Create",
    description: "Various crafting activities using recycled materials. Create unique art pieces while learning about sustainability.",
    category: "WkipTqWAGnSQAmD9aIzk", // Creative Arts
    tags: ["crafts", "recycling", "creative", "sustainability"]
  },
  {
    title: "Family Fitness Fun",
    description: "Energetic fitness session designed for families. Fun exercises that get everyone moving and laughing together.",
    category: "cPXisl0N6IX0SZmU2hW7", // Sports & Fitness
    tags: ["fitness", "exercise", "family", "fun"]
  },
  {
    title: "Reading Adventure",
    description: "Interactive reading session with book-related activities and crafts. Foster a love of reading in children.",
    category: "YYKB1SKzS5OeQ50ArFiY", // Educational
    tags: ["reading", "literacy", "educational", "books"]
  },
  {
    title: "Cultural Dance Workshop",
    description: "Learn traditional dances from different cultures. Great way to appreciate diversity and get some exercise.",
    category: "RqKcPjNXbWpPAB5YR9wq", // Cultural & Heritage
    tags: ["dance", "cultural", "movement", "diversity"]
  },
  {
    title: "Mindfulness for Kids",
    description: "Simple mindfulness and meditation techniques adapted for children. Help kids develop emotional awareness and calm.",
    category: "PlYwl5vd3CynhzEfKed1", // Wellness & Mindfulness
    tags: ["mindfulness", "meditation", "wellness", "emotional"]
  },
  {
    title: "Building and Construction",
    description: "Hands-on building activities using blocks, LEGO, and other construction materials. Develop spatial reasoning and creativity.",
    category: "4UJ7gCrr5mtyte1oDICR", // STEM Activities
    tags: ["building", "construction", "engineering", "creative"]
  },
  {
    title: "Family Movie Night",
    description: "Family-friendly movie screening with discussion and activities. A great way to spend quality time together.",
    category: "iI7sWU3YkkvR9mM8nNFK", // Entertainment
    tags: ["movie", "family", "entertainment", "discussion"]
  },
  {
    title: "Life Skills Workshop",
    description: "Practical life skills workshop covering basic first aid, safety, and everyday tasks. Important skills for growing independence.",
    category: "Gy2ZNPdCmMtLwJCfLraP", // Life Skills
    tags: ["life skills", "safety", "independence", "practical"]
  }
];

// Generate random date in the past (last 30 days) with specific time
function getRandomPastDate() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const randomTime = thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime());
  const date = new Date(randomTime);
  
  // Add random time of day (between 9 AM and 8 PM)
  const hour = 9 + Math.floor(Math.random() * 11); // 9 AM to 8 PM
  const minute = Math.floor(Math.random() * 60);
  date.setHours(hour, minute, 0, 0);
  
  return date;
}

// Generate random date in the future (next month) with specific time
function getRandomFutureDate() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1); // Start of next month
  const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0); // End of next month
  
  // Generate random day in next month
  const daysInMonth = endOfNextMonth.getDate();
  const randomDay = 1 + Math.floor(Math.random() * daysInMonth);
  
  const date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), randomDay);
  
  // Add random time of day (between 9 AM and 8 PM)
  const hour = 9 + Math.floor(Math.random() * 11); // 9 AM to 8 PM
  const minute = Math.floor(Math.random() * 60);
  date.setHours(hour, minute, 0, 0);
  
  return date;
}

// Generate random interactions
function getRandomInteractions() {
  const likes = Math.floor(Math.random() * 20);
  const comments = Math.floor(Math.random() * 10);
  const likedBy = [];
  
  // Randomly select users who liked the activity
  for (let i = 0; i < likes; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    if (!likedBy.includes(randomUser)) {
      likedBy.push(randomUser);
    }
  }
  
  return {
    likes: likes,
    comments: comments,
    likedBy: likedBy
  };
}

async function insert20SaltLakeActivitiesFixed() {
  try {
    console.log('Inserting 20 activities in Salt Lake City with diverse dates...');
    console.log('5 activities in the past, 15 in the future next month');
    
    // Create arrays to store dates to ensure diversity
    const pastDates = [];
    const futureDates = [];
    
    // Generate 5 unique past dates
    for (let i = 0; i < 5; i++) {
      let date;
      do {
        date = getRandomPastDate();
      } while (pastDates.some(d => d.toDateString() === date.toDateString()));
      pastDates.push(date);
    }
    
    // Generate 15 unique future dates
    for (let i = 0; i < 15; i++) {
      let date;
      do {
        date = getRandomFutureDate();
      } while (futureDates.some(d => d.toDateString() === date.toDateString()));
      futureDates.push(date);
    }
    
    // Shuffle the dates for more randomness
    pastDates.sort(() => Math.random() - 0.5);
    futureDates.sort(() => Math.random() - 0.5);
    
    for (let i = 1; i <= 20; i++) {
      // Select random template and user
      const template = activityTemplates[Math.floor(Math.random() * activityTemplates.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const address = saltLakeAddresses[Math.floor(Math.random() * saltLakeAddresses.length)];
      
      // Use pre-generated dates (5 in past, 15 in future)
      const eventDate = i <= 5 ? pastDates[i-1] : futureDates[i-6];
      const createdAt = new Date(eventDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Created 0-7 days before event
      const updatedAt = new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000); // Updated within 24 hours
      
      const activity = {
        title: template.title,
        description: template.description,
        eventDate: admin.firestore.Timestamp.fromDate(eventDate),
        category: template.category,
        street: address.street,
        city: address.city,
        state: address.state,
        zip: address.zip,
        tags: template.tags,
        author: user,
        createdAt: admin.firestore.Timestamp.fromDate(createdAt),
        updatedAt: admin.firestore.Timestamp.fromDate(updatedAt),
        active: true,
        interactions: getRandomInteractions(),
        image: null
      };
      
      // Insert the activity
      await db.collection('activities').add(activity);
      
      const dateType = i <= 5 ? 'PAST' : 'FUTURE';
      const dateStr = eventDate.toLocaleDateString() + ' ' + eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      console.log(`✅ Inserted activity ${i}/20 (${dateType}): ${template.title} - ${dateStr}`);
    }
    
    console.log('✅ Successfully inserted 20 Salt Lake City activities with diverse dates!');
    console.log('📊 Summary:');
    console.log('   • 5 activities in the past (last 30 days) - each on different days');
    console.log('   • 15 activities in the future (next month) - each on different days');
    console.log('   • All activities have different event dates and times');
    console.log('   • All activities located in Salt Lake City');
    console.log('   • Random authors from users collection');
    console.log('   • Location set to null as requested');
    
  } catch (error) {
    console.error('❌ Error inserting activities:', error);
  } finally {
    process.exit(0);
  }
}

insert20SaltLakeActivitiesFixed(); 