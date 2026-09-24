import { useState, useEffect, useRef, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useInvoiceStore } from "@/store/invoiceStore";
import { fetchDocumentHistory, fetchDocumentForPrint } from "@/actions/invoiceActions";
import { loadNextDocumentNumber } from "@/utils/InvoiceCounter";
import { getDateRange } from "@/utils/historyUtils";
import { getTodayDateString } from "@/utils/dateUtils";
import InvoicePrint from "@/components/invoice-print/InvoicePrint";
import InvoiceHistoryFilters from "./InvoiceHistoryFilters";
import InvoiceHistoryList from "./InvoiceHistoryList";
import ReviewModal from "./ReviewModal";
import toast from "react-hot-toast";
import { formatDocumentId } from "@/utils/invoiceUtils";

export default function InvoiceHistoryPanel() {
  const isOpen = useInvoiceStore((s) => s.isInvoiceHistoryOpen);
  const close = useInvoiceStore((s) => s.closeInvoiceHistory);
  const loadInvoiceForEdit = useInvoiceStore((s) => s.loadInvoiceForEdit);
  const setItems = useInvoiceStore((s) => s.setItems);
  const setEditingInvoiceId = useInvoiceStore((s) => s.setEditingInvoiceId);
  const updateInvoice = useInvoiceStore((s) => s.updateInvoice);

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [search, setSearch] = useState("");
  const [preset, setPreset] = useState("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [draftFilter, setDraftFilter] = useState("");
  const [printData, setPrintData] = useState(null);
  const [reviewData, setReviewData] = useState(null);

  const cursors = useRef([null]);
  const page = useRef(0);
  const version = useRef(0);
  const printRef = useRef(null);
  const searchRef = useRef(search);
  const printReady = useRef(false);
  const printing = useRef(false);
  const safetyTimer = useRef(null);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: () => {
      const docType = printData?.invoice?.documentType === "Quotation" ? "Quotation" : "Invoice";
      return `${docType}-${formatDocumentId(printData?.invoice)}`;
    },
  });

  const fetchData = useCallback(async () => {
    const id = ++version.current;
    setLoading(true);
    setError(null);

    try {
      const cursor = cursors.current[page.current] ?? null;
      const range = getDateRange(preset, customFrom, customTo);
      const result = await fetchDocumentHistory({
        startAfterDoc: cursor, pageSize: 10,
        dateFrom: range.dateFrom, dateTo: range.dateTo,
        searchQuery: searchRef.current,
        documentType: documentType || null,
        draftType: draftFilter || null,
      });

      if (id !== version.current) return;
      if (!result.success) throw new Error("Failed to fetch documents");

      setInvoices(result.invoices);
      setHasMore(result.hasMore);
      setCanGoPrev(page.current > 0);
      cursors.current[page.current + 1] = result.lastDoc;
    } catch (err) {
      if (id !== version.current) return;
      console.error("Failed to load history:", err);
      toast.error("Failed to load history");
      setError("Failed to load documents. Please try again.");
    } finally {
      if (id === version.current) setLoading(false);
    }
  }, [preset, customFrom, customTo, documentType, draftFilter]);

  const resetAndFetch = useCallback(() => {
    page.current = 0;
    cursors.current = [null];
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(resetAndFetch, 0);
    return () => clearTimeout(timer);
  }, [isOpen, resetAndFetch]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  useEffect(() => {
    if (isOpen) return;
    queueMicrotask(() => {
      setInvoices([]); setSearch(""); setPreset("");
      setCustomFrom(""); setCustomTo(""); setError(null);
      setHasMore(false); setCanGoPrev(false); setDocumentType("");
      setDraftFilter("");
    });
    cursors.current = [null]; page.current = 0;
    printing.current = false;
    printReady.current = false;
    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
  }, [isOpen]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(resetAndFetch, 400);
    return () => clearTimeout(timer);
  }, [search, isOpen, resetAndFetch]);

  const handlePresetChange = (e) => {
    const val = e.target.value;
    setPreset(val);
    if (val !== "custom") { setCustomFrom(""); setCustomTo(""); }
  };

  const handleCustomDateChange = (type, value) => {
    setPreset("custom");
    if (type === "from") setCustomFrom(value);
    else setCustomTo(value);
  };

  const handleTypeChange = (e) => {
    setDocumentType(e.target.value);
  };

  const handleDraftFilterChange = (e) => {
    setDraftFilter(e.target.value);
  };

  const handlePrintClick = useCallback(async (documentId) => {
    if (printing.current) return;
    try {
      printing.current = true;
      printReady.current = false;
      const result = await fetchDocumentForPrint(documentId);
      if (!result.success) throw new Error("Failed to fetch document data");
      setPrintData(result);
    } catch (err) {
      console.error("Print error:", err);
      toast.error("Failed to print document");
      printing.current = false;
    }
  }, []);

  const handleReviewClick = useCallback(async (documentId) => {
    try {
      const result = await fetchDocumentForPrint(documentId);
      if (!result.success) throw new Error("Failed to fetch document data");
      setReviewData(result);
    } catch (err) {
      console.error("Review error:", err);
      toast.error("Failed to load document details");
    }
  }, []);

  const handleEditClick = useCallback(async (documentId) => {
    try {
      const result = await fetchDocumentForPrint(documentId);
      if (!result.success) throw new Error("Failed to fetch document data");
      loadInvoiceForEdit(result.invoice);
      setItems(result.items);
      setEditingInvoiceId(documentId);
      close();
    } catch (err) {
      console.error("Edit error:", err);
      toast.error("Failed to load document for editing");
    }
  }, [loadInvoiceForEdit, setItems, setEditingInvoiceId, close]);

  const handleCreateDraft = useCallback(async (documentId) => {
    try {
      const result = await fetchDocumentForPrint(documentId);
      if (!result.success) throw new Error("Failed to fetch document data");

      if (result.invoice.isDraft) {
        toast.error("Cannot create a draft from an existing draft.");
        return;
      }

      const cleanInvoice = { ...result.invoice, isDraft: true, draftType: "copy" };
      delete cleanInvoice.id;
      delete cleanInvoice.createdAt;
      delete cleanInvoice.updatedAt;
      cleanInvoice.documentYear = new Date().getFullYear().toString().slice(-2);
      cleanInvoice.invoiceDate = getTodayDateString();
      loadInvoiceForEdit(cleanInvoice);

      const cleanItems = result.items.map((item) => {
        const copy = { ...item };
        delete copy.id;
        delete copy.createdAt;
        delete copy.updatedAt;
        delete copy.documentId;
        return copy;
      });
      setItems(cleanItems);

      setEditingInvoiceId(null);

      const nextDoc = await loadNextDocumentNumber(cleanInvoice.documentType);
      updateInvoice("documentCounter", nextDoc.documentCounter);
      updateInvoice("documentNumber", nextDoc.documentNumber);

      close();
    } catch (err) {
      console.error("Create draft error:", err);
      toast.error("Failed to create draft");
    }
  }, [loadInvoiceForEdit, setItems, setEditingInvoiceId, updateInvoice, close]);

  const handlePrintReady = useCallback(() => {
    printReady.current = true;
    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
  }, []);

  useEffect(() => {
    if (!printData) return;

    safetyTimer.current = setTimeout(() => {
      if (printReady.current && printRef.current) {
        handlePrintAction();
      } else {
        toast.error("Print timed out. Please try again.");
      }
      setPrintData(null);
      printing.current = false;
      safetyTimer.current = null;
    }, 15000);

    let rafId;
    const poll = () => {
      if (printReady.current && printRef.current) {
        handlePrintAction();
        setPrintData(null);
        printing.current = false;
        if (safetyTimer.current) {
          clearTimeout(safetyTimer.current);
          safetyTimer.current = null;
        }
        return;
      }
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (safetyTimer.current) {
        clearTimeout(safetyTimer.current);
        safetyTimer.current = null;
      }
    };
  }, [printData, handlePrintAction]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-0 backdrop-blur-sm sm:pt-16"
        onClick={close}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="mx-0 flex h-full w-full flex-col rounded-none bg-white shadow-2xl sm:mx-4 sm:h-[85vh] sm:max-w-4xl sm:rounded-xl"
        >
          <div className="flex items-center justify-between border-b px-3 py-3 sm:px-6">
            <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Document History</h2>
            <button onClick={close} className="cursor-pointer rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          <InvoiceHistoryFilters
            search={search}
            preset={preset}
            customFrom={customFrom}
            customTo={customTo}
            documentType={documentType}
            draftFilter={draftFilter}
            onSearchChange={handleSearchChange}
            onPresetChange={handlePresetChange}
            onCustomDateChange={handleCustomDateChange}
            onTypeChange={handleTypeChange}
            onDraftFilterChange={handleDraftFilterChange}
          />

          <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-6">
            <InvoiceHistoryList
              invoices={invoices}
              loading={loading}
              error={error}
              onPrint={handlePrintClick}
              onReview={handleReviewClick}
              onEdit={handleEditClick}
              onCreateDraft={handleCreateDraft}
            />
          </div>

          <div className="flex items-center justify-between border-t px-3 py-3 sm:px-6">
            <span className="text-xs text-gray-500 sm:text-sm">
              {invoices.length > 0 && `${invoices.length} document${invoices.length > 1 ? "s" : ""}`}
            </span>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => { page.current--; fetchData(); }}
                disabled={!canGoPrev || loading}
                className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-sm"
              >
                <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Previous</span>
              </button>
              <button
                onClick={() => { page.current++; fetchData(); }}
                disabled={!hasMore || loading}
                className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-sm"
              >
                <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {printData && (
        <div className="hidden">
          <div ref={printRef}>
            <InvoicePrint
              invoice={printData.invoice}
              items={printData.items}
              allItems={printData.items}
              total={printData.totals.total}
              balanceDue={printData.totals.balanceDue}
              onReady={handlePrintReady}
            />
          </div>
        </div>
      )}

      {reviewData && (
        <ReviewModal data={reviewData} onClose={() => setReviewData(null)} />
      )}
    </>
  );
}
