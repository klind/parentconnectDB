const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listAllCollections() {
  const collections = await db.listCollections();
  for (const col of collections) {
    console.log(`📁 ${col.id}`);
    const snapshot = await col.limit(1).get();
    snapshot.forEach(async (doc) => {
      const subcollections = await doc.ref.listCollections();
      subcollections.forEach(sub => {
        console.log(`   └── 📂 ${sub.id}`);
      });
    });
  }
}

listAllCollections();