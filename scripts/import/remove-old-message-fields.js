const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Load service account from project root
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com' // Update with your project ID
});

const db = admin.firestore();

async function removeOldMessageFields() {
  try {
    console.log('🗑️  Starting removal of old message fields...');
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
        
        // Check if message has old fields that need removal
        const hasOldFields = messageData.createdAt !== undefined || messageData.text !== undefined;
        
        if (!hasOldFields) {
          console.log(`     Message ${messageId}: No old fields to remove (skipping)`);
          skippedMessages++;
          continue;
        }
        
        // Prepare update data to remove old fields
        const updateData = {};
        
        if (messageData.createdAt !== undefined) {
          updateData.createdAt = admin.firestore.FieldValue.delete();
          console.log(`     Message ${messageId}: Removing "createdAt" field`);
        }
        
        if (messageData.text !== undefined) {
          updateData.text = admin.firestore.FieldValue.delete();
          console.log(`     Message ${messageId}: Removing "text" field`);
        }
        
        // Update the message to remove old fields
        try {
          await messageDoc.ref.update(updateData);
          updatedMessages++;
          console.log(`     ✅ Message ${messageId}: Successfully removed old fields`);
        } catch (error) {
          console.error(`     ❌ Error updating message ${messageId}:`, error);
        }
      }
    }
    
    // Step 4: Show summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 FIELD REMOVAL SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total conversations processed: ${totalConversations}`);
    console.log(`Total messages found: ${totalMessages}`);
    console.log(`Messages updated (old fields removed): ${updatedMessages}`);
    console.log(`Messages skipped (no old fields): ${skippedMessages}`);
    console.log('=' .repeat(60));
    
    if (updatedMessages > 0) {
      console.log('✅ SUCCESS: Old message fields have been removed!');
      console.log('   - Field "createdAt" removed (renamed to "sentAt")');
      console.log('   - Field "text" removed (renamed to "content")');
    } else {
      console.log('ℹ️  INFO: No old fields needed removal');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR: Failed to remove old message fields:', error);
    throw error;
  }
}

async function verifyFieldRemoval() {
  try {
    console.log('\n🔍 Verifying field removal...');
    
    const conversationsSnapshot = await db.collection('conversations').get();
    let verifiedConversations = 0;
    let verifiedMessages = 0;
    let messagesWithOldFields = 0;
    let messagesWithNewFields = 0;
    
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
            messagesWithOldFields++;
          }
          
          if (messageData.text !== undefined) {
            console.log(`⚠️  Warning: Message ${messageDoc.id} still has "text" field`);
            messagesWithOldFields++;
          }
          
          // Check if new fields exist
          if (messageData.sentAt !== undefined) {
            messagesWithNewFields++;
          }
          
          if (messageData.content !== undefined) {
            messagesWithNewFields++;
          }
        }
      }
    }
    
    console.log(`\n📊 Verification Results:`);
    console.log(`   - Conversations checked: ${verifiedConversations}`);
    console.log(`   - Messages checked: ${verifiedMessages}`);
    console.log(`   - Messages with old fields: ${messagesWithOldFields}`);
    console.log(`   - Messages with new fields: ${messagesWithNewFields * 2} (sentAt + content)`);
    
    if (messagesWithOldFields === 0) {
      console.log('\n✅ SUCCESS: All old fields have been completely removed!');
    } else {
      console.log(`\n⚠️  WARNING: ${messagesWithOldFields} messages still have old fields`);
    }
    
  } catch (error) {
    console.error('Error during verification:', error);
  }
}

// Main execution
async function main() {
  try {
    await removeOldMessageFields();
    
    // Verify the field removal
    await verifyFieldRemoval();
    
    console.log('\n🎉 Old message fields removal completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Old message fields removal failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  removeOldMessageFields,
  verifyFieldRemoval
};








