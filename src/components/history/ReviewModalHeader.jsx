import { X } from "lucide-react";
import { formatInvoiceDate } from "@/utils/historyUtils";
import { formatDocumentId } from "@/utils/invoiceUtils";

export default function ReviewModalHeader({ invoice, onClose }) {
  return (
    <div className="flex items-start justify-between border-b px-6 py-4 shrink-0">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {formatDocumentId(invoice)}
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">
          {invoice.businessName || "—"} ·{" "}
          {formatInvoiceDate(invoice.invoiceDate)}
        </p>
      </div>
      <button
        onClick={onClose}
        className="cursor-pointer rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
