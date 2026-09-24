import { memo, useState } from "react";
import { Printer, Eye, Pencil, Copy, Save, Loader2 } from "lucide-react";
import { formatCurrency, formatDocumentId } from "@/utils/invoiceUtils";
import { formatInvoiceDate } from "@/utils/historyUtils";

function InvoiceHistoryRow({ invoice, onPrint, onReview, onEdit, onCreateDraft }) {
  const [action, setAction] = useState(null);
  const isSavedDraft = invoice.isDraft && invoice.draftType === "saved";
  console.log(invoice);

  const handlePrint = async (e) => {
    e.stopPropagation();
    setAction({ type: "print", id: invoice.id });
    await onPrint(invoice.id);
    setAction(null);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setAction({type: "edit", id: invoice.id })
    onEdit(invoice.id);
  };

  const handleCreateDraft = async (e) => {
    e.stopPropagation();
    setAction({ type: "draft", id: invoice.id });
    try {
      await onCreateDraft(invoice.id);
    } finally {
      setAction(null);
    }
  };

  const handleReview = async (e) => {
    e.stopPropagation();
    setAction({ type: "review", id: invoice.id });
    await onReview(invoice.id);
    setAction(null);
  };

  const isLoading = (type) =>
    action?.type === type && action?.id === invoice.id;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-white p-3 transition hover:border-blue-200 hover:shadow-sm sm:gap-4 sm:p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* Document Number */}
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              invoice.documentType === "Quotation"
                ? "bg-blue-100 text-blue-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {invoice.documentType === "Quotation" ? "Quotation" : "Invoice"}
            <span className="ml-1 font-bold">
              {formatDocumentId(invoice)}
            </span>
          </span>

          {/* Currency */}
          {invoice.currency?.code && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              💱 {invoice.currency.code}
            </span>
          )}

          {/* Contract Type */}
          {/* {invoice.contractType && (
            <span className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
              📄 {invoice.contractType}
            </span>
          )} */}

          {invoice.isDraft &&
            (invoice.draftType === "copy" ? (
              <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                <Copy className="mr-1 h-3 w-3" />
                Copy Draft
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                <Save className="mr-1 h-3 w-3" />
                Saved Draft
              </span>
            ))}
        </div>
        <p className="mt-0.5 truncate text-sm font-medium text-gray-800 italic">
          {invoice.businessName || "—"}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span>Date: {formatInvoiceDate(invoice.invoiceDate)}</span>
          <span>Created: {formatInvoiceDate(invoice.createdAt)}</span>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-0.5 sm:gap-1">
        <span className="mr-0.5 text-xs font-semibold text-gray-900 sm:mr-1 sm:text-sm">
          {invoice.currency?.symbol || ""} {formatCurrency(invoice.total)}
        </span>
        {!isSavedDraft && (
          <button
            onClick={handleCreateDraft}
            disabled={isLoading("draft")}
            title="Create Draft"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-orange-50 hover:text-orange-600 sm:h-8 sm:w-8 cursor-pointer"
          >
            {isLoading("draft") ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
            ) : (
              <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </button>
        )}
        <button
          onClick={handleEdit}
          disabled={isLoading("edit")}
          title="Edit"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-amber-50 hover:text-amber-600 sm:h-8 sm:w-8 cursor-pointer"
        >
         {
          isLoading("edit") ? 
          (<Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />) 
          : 
          ( <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />)
         }
        </button>
        <button
          onClick={handleReview}
          disabled={isLoading("review")}
          title="Review"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 sm:h-8 sm:w-8 cursor-pointer"
        >
          {isLoading("review") ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
          ) : (
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          )}
        </button>
        {!isSavedDraft && (
          <button
            onClick={handlePrint}
            disabled={isLoading("print")}
            title="Print"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 sm:h-8 sm:w-8 cursor-pointer"
          >
            {isLoading("print") ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
            ) : (
              <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(InvoiceHistoryRow);
