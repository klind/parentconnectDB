const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Load service account from project root
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com' // Update with your project ID
});

const db = admin.firestore();

async function updateConversationMessages() {
  try {
    console.log('🔄 Starting update of conversation messages...');
    console.log('=' .repeat(60));
    
    // Step 1: Get all conversations
    console.log('📋 Step 1: Fetching all conversations...');
    const conversationsSnapshot = await db.collection('conversations').get();
    
    if (conversationsSnapshot.empty) {
      console.log('No conversations found in the database.');
      return;
    }
    
    console.log(`Found ${conversationsSnapshot.size} conversations.`);
    
    let totalConversations = 0;
    let totalMessages = 0;
    let updatedMessages = 0;
    let skippedMessages = 0;
    
    // Step 2: Process each conversation
    for (const conversationDoc of conversationsSnapshot.docs) {
      const conversationId = conversationDoc.id;
      const conversationData = conversationDoc.data();
      
      totalConversations++;
      console.log(`\n📝 Processing conversation ${conversationId}...`);
      
      // Get messages subcollection for this conversation
      const messagesSnapshot = await conversationDoc.ref.collection('messages').get();
      
      if (messagesSnapshot.empty) {
        console.log(`   No messages found in conversation ${conversationId}`);
        continue;
      }
      
      console.log(`   Found ${messagesSnapshot.size} messages in conversation ${conversationId}`);
      
      // Step 3: Process each message in the conversation
      for (const messageDoc of messagesSnapshot.docs) {
        const messageId = messageDoc.id;
        const messageData = messageDoc.data();
        
        totalMessages++;
        
        // Check if message needs updating
        const needsUpdate = messageData.createdAt !== undefined || messageData.text !== undefined;
        
        if (!needsUpdate) {
          console.log(`     Message ${messageId}: Already updated (skipping)`);
          skippedMessages++;
          continue;
        }
        
        // Prepare update data
        const updateData = {};
        
        // Rename createdAt to sentAt
        if (messageData.createdAt !== undefined) {
          updateData.sentAt = messageData.createdAt;
          console.log(`     Message ${messageId}: createdAt → sentAt`);
        }
        
        // Rename text to content
        if (messageData.text !== undefined) {
          updateData.content = messageData.text;
          console.log(`     Message ${messageId}: text → content`);
        }
        
        // Update the message
        try {
          await messageDoc.ref.update(updateData);
          updatedMessages++;
          console.log(`     ✅ Message ${messageId}: Successfully updated`);
        } catch (error) {
          console.error(`     ❌ Error updating message ${messageId}:`, error);
        }
      }
    }
    
    // Step 4: Show summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 UPDATE SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total conversations processed: ${totalConversations}`);
    console.log(`Total messages found: ${totalMessages}`);
    console.log(`Messages updated: ${updatedMessages}`);
    console.log(`Messages skipped (already updated): ${skippedMessages}`);
    console.log('=' .repeat(60));
    
    if (updatedMessages > 0) {
      console.log('✅ SUCCESS: All conversation messages have been updated!');
      console.log('   - Field "createdAt" renamed to "sentAt"');
      console.log('   - Field "text" renamed to "content"');
    } else {
      console.log('ℹ️  INFO: No messages needed updating');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR: Failed to update conversation messages:', error);
    throw error;
  }
}

async function verifyUpdates() {
  try {
    console.log('\n🔍 Verifying updates...');
    
    const conversationsSnapshot = await db.collection('conversations').get();
    let verifiedConversations = 0;
    let verifiedMessages = 0;
    
    for (const conversationDoc of conversationsSnapshot.docs) {
      const messagesSnapshot = await conversationDoc.ref.collection('messages').get();
      
      if (!messagesSnapshot.empty) {
        verifiedConversations++;
        
        for (const messageDoc of messagesSnapshot.docs) {
          const messageData = messageDoc.data();
          verifiedMessages++;
          
          // Check if old fields still exist
          if (messageData.createdAt !== undefined) {
            console.log(`⚠️  Warning: Message ${messageDoc.id} still has "createdAt" field`);
          }
          
          if (messageData.text !== undefined) {
            console.log(`⚠️  Warning: Message ${messageDoc.id} still has "text" field`);
          }
          
          // Check if new fields exist
          if (messageData.sentAt === undefined) {
            console.log(`⚠️  Warning: Message ${messageDoc.id} missing "sentAt" field`);
          }
          
          if (messageData.content === undefined) {
            console.log(`⚠️  Warning: Message ${messageDoc.id} missing "content" field`);
          }
        }
      }
    }
    
    console.log(`\n✅ Verification complete: ${verifiedConversations} conversations, ${verifiedMessages} messages checked`);
    
  } catch (error) {
    console.error('Error during verification:', error);
  }
}

// Main execution
async function main() {
  try {
    await updateConversationMessages();
    
    // Optionally verify the updates
    await verifyUpdates();
    
    console.log('\n🎉 Conversation messages update completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Conversation messages update failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  updateConversationMessages,
  verifyUpdates
};








