const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com'
});

const db = admin.firestore();

async function checkSpecificConversation() {
  try {
    console.log('🔍 Checking specific conversation...');
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
    
    // Check messages subcollection
    console.log('\n📝 Checking messages subcollection...');
    const messagesSnapshot = await conversationRef.collection('messages').get();
    
    if (messagesSnapshot.empty) {
      console.log('❌ NO MESSAGES FOUND in this conversation!');
      return;
    }
    
    console.log(`✅ Found ${messagesSnapshot.size} messages`);
    
    // Show first few messages to verify structure
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
    
    if (messagesSnapshot.size > 3) {
      console.log(`... and ${messagesSnapshot.size - 3} more messages`);
    }
    
  } catch (error) {
    console.error('❌ Error checking conversation:', error);
  }
}

checkSpecificConversation().then(() => process.exit(0));








