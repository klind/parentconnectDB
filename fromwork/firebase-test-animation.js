#!/usr/bin/env node

// Simple Firebase script to test chat button animation
// Run with: node firebase-test-animation.js create [your-user-id]
// Clean with: node firebase-test-animation.js cleanup [your-user-id]

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, query, where, getDocs, deleteDoc, serverTimestamp } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD8cCEL7j42Z_YIr_JzprPvbLfHPHdRS7Y",
  authDomain: "parentconnect2025.firebaseapp.com",
  projectId: "parentconnect2025",
  storageBucket: "parentconnect2025.firebasestorage.app",
  messagingSenderId: "422498223793",
  appId: "1:422498223793:web:17ee12b2e2702955fd4490",
  measurementId: "G-3RQ51YHTM3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestConversation(userId) {
  if (!userId) {
    console.error('❌ Please provide your user ID');
    console.log('Usage: node firebase-test-animation.js create [your-user-id]');
    return;
  }

  try {
    const testUserId = `test-${Date.now()}`;
    const conversationId = [userId, testUserId].sort().join('_');
    
    await setDoc(doc(db, 'conversations', conversationId), {
      participants: [userId, testUserId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: 'Test animation message! 🚀',
      lastSenderId: testUserId
    });
    
    console.log('✅ Test conversation created!');
    console.log('📱 Your chat button should now be animating');
    console.log('🧹 Clean up with: node firebase-test-animation.js cleanup', userId);
    
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
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId)
    );
    
    const snapshot = await getDocs(q);
    let deleted = 0;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data.lastSenderId?.startsWith('test-')) {
        await deleteDoc(doc(db, 'conversations', docSnap.id));
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
  console.log('Firebase Chat Animation Tester');
  console.log('');
  console.log('Usage:');
  console.log('  node firebase-test-animation.js create [your-user-id]   # Start animation');
  console.log('  node firebase-test-animation.js cleanup [your-user-id]  # Stop animation');
  console.log('');
  console.log('First, update the firebaseConfig in this file with your project settings.');
}