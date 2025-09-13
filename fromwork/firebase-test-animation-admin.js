#!/usr/bin/env node

// Firebase Admin SDK version of the chat button animation test
// Run with: node firebase-test-animation-admin.js create [your-user-id]
// Clean with: node firebase-test-animation-admin.js cleanup [your-user-id]

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createTestConversation(userId) {
  if (!userId) {
    console.error('❌ Please provide your user ID');
    console.log('Usage: node firebase-test-animation-admin.js create [your-user-id]');
    return;
  }

  try {
    const testUserId = `test-${Date.now()}`;
    const conversationId = [userId, testUserId].sort().join('_');
    
    const conversationRef = db.collection('conversations').doc(conversationId);

    await conversationRef.set({
      participants: [userId, testUserId],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessage: 'Test animation message! 🚀',
      lastSenderId: testUserId
    });

    // Also create a message in the messages subcollection (matching app schema)
    const nowIso = new Date().toISOString();
    await conversationRef.collection('messages').add({
      content: `Test animation message! 🚀 ${nowIso}`,
      conversationId: conversationId,
      recipientId: userId,
      senderId: testUserId,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      sentAtMs: Date.now()
    });
    
    console.log('✅ Test conversation created!');
    console.log('📱 Your chat button should now be animating');
    console.log('🧹 Clean up with: node firebase-test-animation-admin.js cleanup', userId);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function cleanupTestConversations(userId) {
  if (!userId) {
    console.error('❌ Please provide your user ID');
    return;
  }

  try {
    // Get all conversations and filter by document ID starting with 'test-'
    const snapshot = await db.collection('conversations').get();
    
    let deleted = 0;
    
    for (const docSnap of snapshot.docs) {
      if (docSnap.id.startsWith('test-')) {
        await docSnap.ref.delete();
        deleted++;
      }
    }
    
    console.log(`✅ Cleaned up ${deleted} test conversation(s)`);
    console.log('📱 Animation should now be stopped');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Parse command line arguments
const [,, command, userId] = process.argv;

if (command === 'create') {
  createTestConversation(userId);
} else if (command === 'cleanup') {
  cleanupTestConversations(userId);
} else {
  console.log('Firebase Admin Chat Animation Tester');
  console.log('');
  console.log('Usage:');
  console.log('  node firebase-test-animation-admin.js create [your-user-id]   # Start animation');
  console.log('  node firebase-test-animation-admin.js cleanup [your-user-id]  # Stop animation');
  console.log('');
  console.log('This version uses Firebase Admin SDK with proper permissions.');
}
