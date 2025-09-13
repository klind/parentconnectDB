const admin = require("firebase-admin");

// Load service account
const serviceAccount = JSON.parse(require("fs").readFileSync(require("path").join(__dirname, "serviceAccountKey.json"), "utf8"));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Connect to Firestore
const db = admin.firestore();

async function exportBasicResources() {
  try {
    const snapshot = await db.collection("resources").get();
    if (snapshot.empty) {
      console.log("[]");
      return;
    }

    const results = [];

    snapshot.forEach((doc) => {
      const r = doc.data() || {};

      // Support both top-level and nested address fields
      const address = r.address || {};

      const name = r.name || "";
      const city = r.city || address.city || "";
      const state = r.state || address.state || address.region || "";
      const street = r.street || address.street || address.line1 || address.address1 || r.addressLine1 || "";
      const zip = r.zip || address.zip || address.postalCode || address.zipcode || address.postcode || "";

      const imageFolder = r.imageFolder || "";
      results.push({ name, street, city, state, zip, imageFolder });
    });

    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error("Error exporting resources:", err && err.message ? err.message : err);
    process.exitCode = 1;
  }
}

exportBasicResources();


