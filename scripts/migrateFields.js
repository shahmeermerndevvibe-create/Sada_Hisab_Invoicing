/**
 * One-time migration script.
 *
 * Copies old field names to new ones for all existing Firestore documents:
 *   invoices:   invoiceNumber → documentNumber, invoiceCounter → documentCounter
 *   invoices:   adds documentType = "Invoice"
 *   invoiceItems: invoiceId → documentId
 *
 * Usage:
 *   1. npm install firebase-admin
 *   2. Go to Firebase Console → Project Settings → Service Accounts →
 *      "Generate new private key", save as serviceAccount.json
 *   3. Update SERVICE_ACCOUNT_PATH below
 *   4. node scripts/migrateFields.js
 */

const SERVICE_ACCOUNT_PATH = "./serviceAccount.json";

const admin = require("firebase-admin");
const serviceAccount = require(SERVICE_ACCOUNT_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateInvoices() {
  console.log("Migrating invoices collection...");
  const snapshot = await db.collection("invoices").get();
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const update = {};

    if (data.invoiceNumber !== undefined) {
      update.documentNumber = String(data.invoiceNumber);
    }

    if (data.invoiceCounter !== undefined) {
      update.documentCounter = Number(data.invoiceCounter);
    }

    if (!data.documentType) {
      update.documentType = "Invoice";
    }

    if (Object.keys(update).length > 0) {
      await doc.ref.update(update);
      count++;
    }
  }

  console.log(`Updated ${count} invoice documents.`);
}

async function migrateInvoiceItems() {
  console.log("Migrating invoiceItems collection...");
  const snapshot = await db.collection("invoiceItems").get();
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    if (data.invoiceId !== undefined) {
      await doc.ref.update({
        documentId: data.invoiceId,
      });
      count++;
    }
  }

  console.log(`Updated ${count} invoiceItem documents.`);
}

async function main() {
  try {
    await migrateInvoices();
    await migrateInvoiceItems();
    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
  }

  process.exit(0);
}

main();
