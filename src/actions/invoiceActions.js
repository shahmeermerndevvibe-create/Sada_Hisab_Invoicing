import { invoiceService, documentItemService } from "@/services/InvoiceService";
import { useInvoiceStore } from "@/store/invoiceStore";
import { calculateInvoiceTotals, calculateItemRow } from "@/utils/invoiceUtils";

const stripItemMeta = ({ id, createdAt, updatedAt, documentId, ...rest }) => rest;

const itemSignature = (item) =>
  `${item.product}|${item.rate}|${item.qty}|${item.description}|${item.status}`;

const deduplicateItems = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const sig = itemSignature(item);
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
};

export const saveDocument = async (document, items) => {
  const totals = calculateInvoiceTotals(items, document);

  const documentData = {
    ...document,
    ...totals,
  };

  const itemData = items.map((item) => {
    const { netTotal } = calculateItemRow(item, document.discountType);
    return {
      ...item,
      amount: netTotal,
    };
  });

  const editingInvoiceId = useInvoiceStore.getState().editingInvoiceId;

  if (editingInvoiceId) {
    const { id, createdAt, updatedAt, ...cleanData } = documentData;
    await invoiceService.updateDocument(editingInvoiceId, cleanData);

    const existingItems = await documentItemService.getItems(editingInvoiceId);
    const completedItems = deduplicateItems(
      existingItems.filter((item) => item.status === "Completed"),
    );
    const completedItemIds = new Set(completedItems.map((item) => item.id));

    const itemsToDelete = existingItems.filter((item) => !completedItemIds.has(item.id));

    const incomingEditableItems = itemData.filter(
      (item) => !item.id || !completedItemIds.has(item.id),
    );

    const preservedCompletedData = completedItems.map(stripItemMeta);

    // Sort combined array by the store's visual order before assigning sortOrder
    const storeOrderLookup = new Map();
    itemData.forEach((item, idx) => {
      storeOrderLookup.set(itemSignature(item), idx);
    });

    const combinedItems = [...preservedCompletedData, ...incomingEditableItems.map(stripItemMeta)];
    combinedItems.sort((a, b) => {
      const aOrder = storeOrderLookup.get(itemSignature(a)) ?? 0;
      const bOrder = storeOrderLookup.get(itemSignature(b)) ?? 0;
      return aOrder - bOrder;
    });

    const orderedItems = combinedItems.map((item, idx) => ({
      ...item,
      sortOrder: idx,
    }));

    await documentItemService.replaceItems(
      editingInvoiceId,
      itemsToDelete,
      orderedItems,
    );

    return { success: true, documentId: editingInvoiceId };
  }

  const documentId = await invoiceService.createDocument(documentData);

  const orderedItemData = itemData.map((item, idx) => ({
    ...item,
    sortOrder: idx,
  }));

  await documentItemService.createItems(documentId, orderedItemData.map(stripItemMeta));

  if (documentData.isDraft) {
    useInvoiceStore.getState().setEditingInvoiceId(documentId);
  }

  return {
    success: true,
    documentId,
  };
};

export const getLatestDocumentCounter = async (type) => {
  const counter = await invoiceService.getLatestDocumentCounter(type);
  return counter;
};

export const checkDocumentNumberExists = async (documentNumber, type) => {
  return invoiceService.checkDocumentNumberExists(documentNumber, type);
};

export const fetchDocumentHistory = async ({
  pageSize = 10,
  startAfterDoc = null,
  dateFrom = null,
  dateTo = null,
  searchQuery = "",
  documentType = null,
  draftType = null,
}) => {
  try {
    const matchesDraft = (inv) => !draftType || inv.draftType === draftType;

    let invoices = [];
    let cursor = startAfterDoc;
    let lastDoc = null;
    let hasMore = false;
    const scanLimit = 200;

    while (invoices.filter(matchesDraft).length < pageSize) {
      const result = await invoiceService.getDocumentsPaginated({
        pageSize,
        startAfterDoc: cursor,
        dateFrom,
        dateTo,
        documentType,
      });

      lastDoc = result.lastDoc;
      hasMore = result.hasMore;
      invoices = invoices.concat(result.invoices);

      if (!hasMore || result.invoices.length === 0 || invoices.length >= scanLimit) {
        break;
      }

      cursor = lastDoc;
    }

    invoices = invoices.filter(matchesDraft).slice(0, pageSize);

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      invoices = invoices.filter((inv) => {
        const docNumber = (inv.documentNumber || "").toLowerCase();
        const customer = (inv.customer || "").toLowerCase();
        const email = (inv.customerEmail || "").toLowerCase();
        return (
          docNumber.includes(q) ||
          customer.includes(q) ||
          email.includes(q)
        );
      });
    }

    return {
      success: true,
      invoices,
      lastDoc,
      hasMore,
    };
  } catch (error) {
    console.error("Failed to fetch document history:", error);
    return {
      success: false,
      invoices: [],
      lastDoc: null,
      hasMore: false,
    };
  }
};

export const fetchDocumentForPrint = async (documentId) => {
  try {
    const data = await invoiceService.getDocumentWithItems(documentId);
    if (!data) return { success: false };

    const { invoice, items } = data;
    const totals = calculateInvoiceTotals(items, invoice);

    return { success: true, invoice, items, totals };
  } catch (error) {
    console.error("Failed to fetch document for print:", error);
    return { success: false };
  }
};
