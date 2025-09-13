const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com'
});

const db = admin.firestore();

async function deepCheckConversation() {
  try {
    console.log('🔍 DEEP CHECKING conversation...');
    console.log('Conversation ID: BLgLtG4Cfqf3mBkyEjUFMB0i9uZ2_z1RjlZyE5rdCfA3D0cMqEq57wcn1');
    console.log('=' .repeat(80));
    
    // Check the specific conversation
    const conversationRef = db.collection('conversations').doc('BLgLtG4Cfqf3mBkyEjUFMB0i9uZ2_z1RjlZyE5rdCfA3D0cMqEq57wcn1');
    const conversationDoc = await conversationRef.get();
    
    if (!conversationDoc.exists) {
      console.log('❌ Conversation document does not exist!');
      return;
    }
    
    console.log('✅ Conversation document exists');
    console.log('📋 Conversation data:', JSON.stringify(conversationDoc.data(), null, 2));
    
    // Try to access messages subcollection directly
    console.log('\n📝 Trying to access messages subcollection directly...');
    
    try {
      const messagesRef = conversationRef.collection('messages');
      console.log('✅ Messages subcollection reference created');
      
      // Try to get messages
      const messagesSnapshot = await messagesRef.get();
      
      if (messagesSnapshot.empty) {
        console.log('❌ Messages subcollection is EMPTY!');
        console.log('This means the messages were actually deleted or lost!');
        return;
      }
      
      console.log(`✅ Found ${messagesSnapshot.size} messages in subcollection`);
      
      // Show first few messages
      console.log('\n📱 First 3 messages:');
      let count = 0;
      messagesSnapshot.forEach(doc => {
        if (count < 3) {
          console.log(`Message ${count + 1} (ID: ${doc.id}):`);
          console.log(JSON.stringify(doc.data(), null, 2));
          console.log('---');
          count++;
        }
      });
      
    } catch (subcollectionError) {
      console.error('❌ Error accessing messages subcollection:', subcollectionError);
      console.log('This suggests the subcollection might not exist or there are permission issues');
    }
    
    // Also try to list all subcollections
    console.log('\n📚 Checking all subcollections...');
    try {
      const collections = await conversationRef.listCollections();
      console.log('Subcollections found:', collections.map(col => col.id));
    } catch (listError) {
      console.error('❌ Error listing subcollections:', listError);
    }
    
  } catch (error) {
    console.error('❌ Error in deep check:', error);
  }
}

deepCheckConversation().then(() => process.exit(0));








