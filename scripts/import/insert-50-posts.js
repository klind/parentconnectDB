const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Existing users from the database
const users = [
  { id: "user001", displayName: "Alice Johnson" },
  { id: "user002", displayName: "Maria Rodriguez" },
  { id: "user003", displayName: "David Chen" },
  { id: "user004", displayName: "Sarah Williams" },
  { id: "user005", displayName: "James Thompson" },
  { id: "user006", displayName: "Lisa Park" },
  { id: "user007", displayName: "Jennifer Davis" },
  { id: "user008", displayName: "Michael Brown" },
  { id: "user009", displayName: "Emily Wilson" },
  { id: "user010", displayName: "Robert Garcia" },
  { id: "user011", displayName: "Amanda Lee" },
  { id: "user012", displayName: "Carlos Martinez" },
  { id: "user013", displayName: "Rachel Green" }
];

// Post templates for variety
const postTemplates = [
  // OFFER posts
  {
    type: "offer",
    title: "Free art supplies for kids",
    description: "Cleaning out our art cabinet. Have markers, crayons, and construction paper to give away. All in good condition.",
    tags: ["art", "free", "supplies"],
    isUrgent: false
  },
  {
    type: "offer",
    title: "Babysitting exchange available",
    description: "Looking for a babysitting exchange partner. I can watch your kids on weekends if you can watch mine on weekdays.",
    tags: ["babysitting", "exchange", "weekends"],
    isUrgent: false
  },
  {
    type: "offer",
    title: "Math tutoring for elementary students",
    description: "Former teacher offering free math tutoring for grades 1-5. Can meet at library or community center.",
    tags: ["tutoring", "math", "free", "education"],
    isUrgent: false
  },
  {
    type: "offer",
    title: "Gently used winter clothes",
    description: "Have winter coats and boots in sizes 4-6 that my kids outgrew. All clean and in good condition.",
    tags: ["clothes", "winter", "free"],
    isUrgent: false
  },
  {
    type: "offer",
    title: "Piano lessons at home",
    description: "Music teacher offering piano lessons at your home. $25 per 30-minute lesson. All ages welcome.",
    tags: ["piano", "music", "lessons", "home"],
    isUrgent: false
  },

  // ASK posts
  {
    type: "ask",
    title: "Need help with science fair project",
    description: "My 8-year-old needs help with a science fair project about plants. Anyone have experience with this?",
    tags: ["science", "help", "project"],
    isUrgent: false
  },
  {
    type: "ask",
    title: "Looking for allergy-friendly birthday cake recipe",
    description: "Need a recipe for a birthday cake that's nut-free, dairy-free, and egg-free. Any suggestions?",
    tags: ["recipe", "allergies", "birthday"],
    isUrgent: false
  },
  {
    type: "ask",
    title: "Recommendations for pediatric dentist",
    description: "Looking for a good pediatric dentist in the area. Preferably one who's good with anxious kids.",
    tags: ["dentist", "health", "recommendations"],
    isUrgent: false
  },
  {
    type: "ask",
    title: "Help needed - carpool to soccer",
    description: "Need someone to help with carpool to soccer practice on Tuesdays and Thursdays. Will pay for gas.",
    tags: ["carpool", "soccer", "transportation"],
    isUrgent: true
  },
  {
    type: "ask",
    title: "Lost teddy bear - sentimental value",
    description: "My 4-year-old lost her favorite teddy bear at the playground yesterday. It's brown with a red bow. Reward offered.",
    tags: ["lost", "teddy bear", "playground", "reward"],
    isUrgent: true
  },

  // ANNOUNCEMENT posts
  {
    type: "announcement",
    title: "New Story Time at Library",
    description: "Starting next week: Bilingual story time at the library every Wednesday at 10 AM. English and Spanish stories.",
    tags: ["library", "story time", "bilingual", "free"],
    isUrgent: false
  },
  {
    type: "announcement",
    title: "Community Garden Opening",
    description: "The new community garden is opening this Saturday! Come plant vegetables with your kids. Tools provided.",
    tags: ["garden", "community", "vegetables", "free"],
    isUrgent: false
  },
  {
    type: "announcement",
    title: "Free Vaccination Clinic",
    description: "Free vaccination clinic for children this Sunday at the community center. No appointment needed.",
    tags: ["vaccination", "health", "free", "clinic"],
    isUrgent: false
  },
  {
    type: "announcement",
    title: "Holiday Craft Fair",
    description: "Annual holiday craft fair at the school gym. Kids can make ornaments and gifts. $5 entry fee.",
    tags: ["crafts", "holiday", "fair", "kids"],
    isUrgent: false
  },
  {
    type: "announcement",
    title: "Parent Support Group Meeting",
    description: "Monthly parent support group meeting this Thursday at 7 PM. Topic: Managing screen time. Free childcare provided.",
    tags: ["support group", "screen time", "free childcare"],
    isUrgent: false
  },

  // QUESTION posts
  {
    type: "question",
    title: "Best way to handle bedtime battles?",
    description: "My 6-year-old fights bedtime every night. What strategies have worked for other parents?",
    tags: ["bedtime", "parenting", "advice"],
    isUrgent: false
  },
  {
    type: "question",
    title: "How to introduce a new baby to older sibling?",
    description: "Expecting our second child in 3 months. Any tips for preparing our 3-year-old for the new baby?",
    tags: ["new baby", "siblings", "preparation"],
    isUrgent: false
  },
  {
    type: "question",
    title: "Recommendations for summer camps?",
    description: "Looking for summer camp options for my 9-year-old. Prefer something educational but fun. Any suggestions?",
    tags: ["summer camp", "education", "recommendations"],
    isUrgent: false
  },
  {
    type: "question",
    title: "Dealing with picky eater",
    description: "My 5-year-old refuses to eat vegetables. Any creative ways to get kids to try new foods?",
    tags: ["picky eater", "vegetables", "nutrition"],
    isUrgent: false
  },
  {
    type: "question",
    title: "Best age to start swimming lessons?",
    description: "What's the best age to start formal swimming lessons? My daughter is 3 and loves water.",
    tags: ["swimming", "lessons", "age"],
    isUrgent: false
  }
];

// Generate random dates over the past 3 months
function getRandomDate() {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
  const randomTime = threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime());
  return new Date(randomTime);
}

// Generate random interactions
function getRandomInteractions() {
  const likes = Math.floor(Math.random() * 15);
  const comments = Math.floor(Math.random() * 8);
  const likedBy = [];
  
  // Randomly select users who liked the post
  for (let i = 0; i < likes; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    if (!likedBy.includes(randomUser.id)) {
      likedBy.push(randomUser.id);
    }
  }
  
  return {
    likes: likes,
    comments: comments,
    likedBy: likedBy
  };
}

// Generate random visibility settings
function getRandomVisibility() {
  const maxDistance = [5, 8, 10, 15, 20, 25, 30][Math.floor(Math.random() * 7)];
  return {
    maxDistance: maxDistance,
    blockedUsers: []
  };
}

async function insert50Posts() {
  try {
    console.log('Inserting 50 additional community posts...');
    
    for (let i = 1; i <= 50; i++) {
      // Select random template and user
      const template = postTemplates[Math.floor(Math.random() * postTemplates.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      
      // Generate random date
      const createdAt = getRandomDate();
      const updatedAt = new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000); // Updated within 24 hours
      
      const post = {
        title: template.title,
        description: template.description,
        type: template.type,
        status: "active",
        author: {
          id: user.id,
          displayName: user.displayName
        },
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        tags: template.tags,
        isUrgent: template.isUrgent,
        nearbyOnly: Math.random() > 0.3, // 70% are nearby only
        interactions: getRandomInteractions(),
        visibility: getRandomVisibility()
      };
      
      // Insert the post
      await db.collection('community_posts').add(post);
      
      if (i % 10 === 0) {
        console.log(`✅ Inserted ${i} posts...`);
      }
    }
    
    console.log('✅ Successfully inserted 50 additional community posts!');
    
  } catch (error) {
    console.error('❌ Error inserting posts:', error);
  } finally {
    process.exit(0);
  }
}

insert50Posts(); 