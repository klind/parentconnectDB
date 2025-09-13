const admin = require('firebase-admin');
const path = require('path');

// Configure the target user ID here
const TARGET_USER_ID = process.env.TARGET_USER_ID || 'z1RjlZyE5rdCfA3D0cMqEq57wcn1';

function init() {
  const keyPath = path.join(__dirname, '../../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(keyPath)
  });
}

async function connectionExists(db, userA, userB) {
  // Check both directions
  const q1 = db.collection('friend_connections')
    .where('user1Id', '==', userA)
    .where('user2Id', '==', userB)
    .limit(1);
  const q2 = db.collection('friend_connections')
    .where('user1Id', '==', userB)
    .where('user2Id', '==', userA)
    .limit(1);

  const [s1, s2] = await Promise.all([q1.get(), q2.get()]);
  return !s1.empty || !s2.empty;
}

async function run() {
  init();
  const db = admin.firestore();

  if (!TARGET_USER_ID) {
    console.error('Missing TARGET_USER_ID');
    process.exit(1);
  }

  console.log(`Connecting user ${TARGET_USER_ID} to all other users...`);

  const usersSnap = await db.collection('users').get();
  if (usersSnap.empty) {
    console.log('No users found.');
    return;
  }

  const otherUserIds = usersSnap.docs
    .map(d => d.id)
    .filter(id => id !== TARGET_USER_ID);

  console.log(`Found ${otherUserIds.length} other users.`);

  let attempted = 0;
  let created = 0;
  let skipped = 0;

  for (const otherId of otherUserIds) {
    attempted++;
    const exists = await connectionExists(db, otherId, TARGET_USER_ID);
    if (exists) {
      skipped++;
      continue;
    }

    const payload = {
      user1Id: otherId,
      user2Id: TARGET_USER_ID,
      status: 'connected',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      connectedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('friend_connections').add(payload);
    created++;

    if (created % 50 === 0) {
      console.log(`Created ${created} so far...`);
    }
  }

  console.log('Done.');
  console.log({ attempted, created, skipped });
}

run().then(() => process.exit(0)).catch(err => { console.error('Error:', err); process.exit(1); });













