const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com'
});

const db = admin.firestore();

async function checkConversations() {
  try {
    console.log('🔍 Checking conversations in database...');
    
    // Check conversations collection
    const conversationsSnapshot = await db.collection('conversations').get();
    
    if (conversationsSnapshot.empty) {
      console.log('❌ NO CONVERSATIONS FOUND!');
      return;
    }
    
    console.log(`📝 Found ${conversationsSnapshot.size} conversations`);
    
    let totalMessages = 0;
    
    // Check each conversation for messages
    for (const conversationDoc of conversationsSnapshot.docs) {
      const conversationId = conversationDoc.id;
      const messagesSnapshot = await conversationDoc.ref.collection('messages').get();
      
      if (messagesSnapshot.empty) {
        console.log(`   ❌ Conversation ${conversationId}: NO MESSAGES`);
      } else {
        console.log(`   ✅ Conversation ${conversationId}: ${messagesSnapshot.size} messages`);
        totalMessages += messagesSnapshot.size;
        
        // Show first few messages as sample
        const firstMessage = messagesSnapshot.docs[0].data();
        console.log(`      Sample message fields: ${Object.keys(firstMessage).join(', ')}`);
      }
    }
    
    console.log(`\n📊 Total messages across all conversations: ${totalMessages}`);
    
  } catch (error) {
    console.error('Error checking conversations:', error);
  }
}

checkConversations().then(() => process.exit(0));








