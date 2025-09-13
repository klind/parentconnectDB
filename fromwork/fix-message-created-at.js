const admin = require("firebase-admin");

// Load service account without require() to appease strict linters
const serviceAccount = JSON.parse(require("fs").readFileSync(require("path").join(__dirname, "serviceAccountKey.json"), "utf8"));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixMessageFields() {
  try {
    console.log("🔍 Checking conversations.messages for createdAt and text fields...");
    
    // Get all conversations
    const conversationsSnapshot = await db.collection("conversations").get();
    
    if (conversationsSnapshot.empty) {
      console.log("❌ No conversations found.");
      return;
    }
    
    console.log(`📊 Found ${conversationsSnapshot.size} conversations`);
    
    let totalMessagesChecked = 0;
    let totalMessagesUpdated = 0;
    let createdAtUpdated = 0;
    let textUpdated = 0;
    let conversationsWithUpdates = 0;
    
    // Process each conversation
    for (const conversationDoc of conversationsSnapshot.docs) {
      const conversationId = conversationDoc.id;
      
      // Get all messages in this conversation
      const messagesSnapshot = await db
        .collection("conversations")
        .doc(conversationId)
        .collection("messages")
        .get();
      
      if (messagesSnapshot.empty) {
        continue;
      }
      
      let conversationUpdated = false;
      let batch = db.batch();
      let opsInBatch = 0;
      
      // Check each message for createdAt and text fields
      for (const messageDoc of messagesSnapshot.docs) {
        const messageData = messageDoc.data();
        totalMessagesChecked++;
        
        const updates = {};
        let needsUpdate = false;
        
        // Check for createdAt → sentAt
        if (messageData.createdAt && !messageData.sentAt) {
          updates.sentAt = messageData.createdAt;
          updates.createdAt = admin.firestore.FieldValue.delete();
          createdAtUpdated++;
          needsUpdate = true;
        }
        
        // Check for text → content
        if (messageData.text && !messageData.content) {
          updates.content = messageData.text;
          updates.text = admin.firestore.FieldValue.delete();
          textUpdated++;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          batch.update(messageDoc.ref, updates);
          totalMessagesUpdated++;
          conversationUpdated = true;
          opsInBatch++;
          
          // Firestore batch limit is 500 operations
          if (opsInBatch >= 450) {
            await batch.commit();
            batch = db.batch();
            opsInBatch = 0;
          }
        }
      }
      
      // Commit remaining operations for this conversation
      if (opsInBatch > 0) {
        await batch.commit();
      }
      
      if (conversationUpdated) {
        conversationsWithUpdates++;
        console.log(`  ✅ Updated messages in conversation: ${conversationId}`);
      }
    }
    
    console.log("\n🎯 Summary:");
    console.log("===========");
    console.log(`📊 Total conversations checked: ${conversationsSnapshot.size}`);
    console.log(`💬 Total messages checked: ${totalMessagesChecked}`);
    console.log(`✏️  Total messages updated: ${totalMessagesUpdated}`);
    console.log(`📝 Conversations with updates: ${conversationsWithUpdates}`);
    console.log(`🕒 createdAt → sentAt updates: ${createdAtUpdated}`);
    console.log(`📝 text → content updates: ${textUpdated}`);
    
    if (totalMessagesUpdated > 0) {
      console.log("\n✅ Successfully updated message fields!");
      if (createdAtUpdated > 0) {
        console.log(`   • Updated ${createdAtUpdated} messages: createdAt → sentAt`);
      }
      if (textUpdated > 0) {
        console.log(`   • Updated ${textUpdated} messages: text → content`);
      }
    } else {
      console.log("\n✨ No messages found with outdated fields - all up to date!");
    }
    
  } catch (error) {
    console.error("❌ Error fixing message fields:", error.message);
    process.exit(1);
  }
}

// Run the fix
(async function main() {
  try {
    await fixMessageFields();
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  }
})();
