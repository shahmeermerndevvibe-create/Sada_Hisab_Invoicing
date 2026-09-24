import { Loader2, Clock } from "lucide-react";
import InvoiceHistoryRow from "./InvoiceHistoryRow";

export default function InvoiceHistoryList({
  invoices,
  loading,
  error,
  onPrint,
  onReview,
  onEdit,
  onCreateDraft,
}) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-gray-500">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-gray-400">
        <Clock className="mb-3 h-12 w-12 text-gray-300" />
        <p className="text-lg font-medium text-gray-500">No invoices found</p>
        <p className="mt-1 text-sm">Try adjusting your search or date filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {invoices.map((inv) => (
        <InvoiceHistoryRow
          key={inv.id}
          invoice={inv}
          onPrint={onPrint}
          onReview={onReview}
          onEdit={onEdit}
          onCreateDraft={onCreateDraft}
        />
      ))}
    </div>
  );
}
