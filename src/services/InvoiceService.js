import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/firebase/firebase";

const invoiceCollection = collection(db, "invoices");
const documentItemCollection = collection(db, "invoiceItems");
const settingsCollection = collection(db, "settings");

export const invoiceService = {
  async createDocument(data) {
    const docRef = await addDoc(invoiceCollection, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  },

  async getDocument(id) {
    const snapshot = await getDoc(doc(invoiceCollection, id));

    if (!snapshot.exists()) return null;

    return {
      ...snapshot.data(),
      id: snapshot.id,
    };
  },

  async getDocuments() {
    const snapshot = await getDocs(invoiceCollection);

    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
  },

  async getDocumentWithItems(documentId) {
    const [document, items] = await Promise.all([
      this.getDocument(documentId),
      documentItemService.getItems(documentId),
    ]);

    if (!document) {
      return {
        success: false,
      };
    }

    return {
      success: true,
      invoice: document,
      items,
      totals: {
        subtotal: document.subtotal,
        total: document.total,
        balanceDue: document.balanceDue,
      },
    };
  },

  async updateDocument(id, data) {
    await updateDoc(doc(invoiceCollection, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteDocument(id) {
    await deleteDoc(doc(invoiceCollection, id));
  },

  async deleteDocumentWithItems(documentId) {
    const items = await documentItemService.getItems(documentId);

    await Promise.all(
      items.map((item) => documentItemService.deleteItem(item.id)),
    );

    await this.deleteDocument(documentId);
  },

  async getLatestDocumentCounter(type) {
    const q = query(
      invoiceCollection,
      where("documentType", "==", type),
      orderBy("documentCounter", "desc"),
      limit(1),
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return 1000;
    }

    const latest = snapshot.docs[0].data();
    return Number(latest.documentCounter);
  },

  async checkDocumentNumberExists(documentNumber, type) {
    const q = query(
      invoiceCollection,
      where("documentType", "==", type),
      where("documentNumber", "==", documentNumber),
      limit(1),
    );

    const snapshot = await getDocs(q);

    return !snapshot.empty;
  },

  async getDocumentsPaginated({
    pageSize = 10,
    startAfterDoc = null,
    dateFrom = null,
    dateTo = null,
    documentType = null,
  }) {
    const constraints = [];

    if (dateFrom) constraints.push(where("createdAt", ">=", dateFrom));
    if (dateTo) constraints.push(where("createdAt", "<=", dateTo));
    if (documentType) constraints.push(where("documentType", "==", documentType));

    constraints.push(orderBy("createdAt", "desc"));
    constraints.push(limit(pageSize));

    if (startAfterDoc) constraints.push(startAfter(startAfterDoc));

    const q = query(invoiceCollection, ...constraints);
    const snapshot = await getDocs(q);

    return {
      invoices: snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })),
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === pageSize,
    };
  },
};

export const documentItemService = {
  async createItem(data) {
    const docRef = await addDoc(documentItemCollection, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  },

  async createItems(documentId, items) {
    if (items.length === 0) return [];

    const batch = writeBatch(db);
    const ids = [];

    for (const item of items) {
      const ref = doc(documentItemCollection);
      batch.set(ref, {
        ...item,
        documentId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      ids.push(ref.id);
    }

    await batch.commit();
    return ids;
  },

  async replaceItems(documentId, existingItems, newItems) {
    if (existingItems.length === 0 && newItems.length === 0) return;

    const batch = writeBatch(db);

    for (const item of existingItems) {
      batch.delete(doc(documentItemCollection, item.id));
    }

    for (const item of newItems) {
      const ref = doc(documentItemCollection);
      batch.set(ref, {
        ...item,
        documentId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  },

  async getItem(id) {
    const snapshot = await getDoc(doc(documentItemCollection, id));

    if (!snapshot.exists()) return null;

    return {
      id: snapshot.id,
      ...snapshot.data(),
    };
  },

  async getItems(documentId) {
    const q = query(documentItemCollection, where("documentId", "==", documentId));

    const snapshot = await getDocs(q);

    return snapshot.docs
      .map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  },

  async updateItem(id, data) {
    await updateDoc(doc(documentItemCollection, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteItem(id) {
    await deleteDoc(doc(documentItemCollection, id));
  },
};

const SETTINGS_DOC_ID = "company";

export const settingsService = {
  async getSettings() {
    const snapshot = await getDoc(doc(settingsCollection, SETTINGS_DOC_ID));

    if (!snapshot.exists()) return null;

    return snapshot.data();
  },

  async saveSettings(data) {
    await setDoc(doc(settingsCollection, SETTINGS_DOC_ID), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },
};
