import { useState, useEffect, useCallback } from "react";
import { Clock, RefreshCcw, Settings } from "lucide-react";
import SettingsModal from "@/components/settings/SettingsModal";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { useInvoiceStore } from "@/store/invoiceStore";
import { checkDocumentNumberExists } from "@/actions/invoiceActions";
import { loadNextDocumentNumber } from "../../utils/InvoiceCounter";
import { formatDocumentId } from "@/utils/invoiceUtils";
import toast from "react-hot-toast";

export default function InvoiceHeader() {
  const invoice = useInvoiceStore((state) => state.invoice);
  const openInvoiceHistory = useInvoiceStore(
    (state) => state.openInvoiceHistory,
  );
  const updateInvoice = useInvoiceStore((state) => state.updateInvoice);

  const [editing, setEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempDocId, setTempDocId] = useState(formatDocumentId(invoice));
  const [loading, setLoading] = useState(false);

  const loadCounter = useCallback(async () => {
    try {
      setLoading(true);

      const next = await loadNextDocumentNumber(invoice.documentType);

      updateInvoice("documentCounter", next.documentCounter);
      updateInvoice("documentNumber", next.documentNumber);

      setTempDocId(formatDocumentId(useInvoiceStore.getState().invoice));
    } finally {
      setLoading(false);
    }
  }, [invoice.documentType, updateInvoice]);

  useEffect(() => {
    loadCounter();
  }, [loadCounter]);

  const parseDocId = (raw) => {
    const trimmed = raw.trim();

    if (!trimmed) return null;

    const parts = trimmed.replace(/^DV-/i, "").split("-");

    if (parts.length < 2) return null;

    return {
      documentNumber: parts[1],
      documentSuffix: parts.slice(2).join("-"),
    };
  };

  const handleSave = async () => {
    const parsed = parseDocId(tempDocId);

    if (!parsed) {
      toast.error("Invalid document ID format. Use DV-SH-NNN[-SSS].");
      return;
    }

    const exists = await checkDocumentNumberExists(
      parsed.documentNumber,
      invoice.documentType,
    );

    if (exists) {
      toast.error(`${invoice.documentType} number already exists.`);
      return;
    }

    updateInvoice("documentNumber", parsed.documentNumber);
    updateInvoice("documentSuffix", parsed.documentSuffix);

    setEditing(false);
  };

  return (
    <div className="relative overflow-hidden
     rounded-b-3xl bg-gradient-to-r from-[#5638D6] to-[#B154DF] shadow-md">
      <div className="relative z-10 px-5 py-5 sm:px-7 lg:px-9">
        <div className="flex flex-wrap items-center gap-5">
          {/* Invoice Identity */}
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center">
              <img
                src="/receipt.png"
                alt="Invoice"
                className="h-[150px] w-[150px] object-contain"
              />
            </div>

            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-white/75">
                {invoice.documentType}
              </div>

              {editing ? (
                <input
                  autoFocus
                  value={tempDocId}
                  onChange={(e) => setTempDocId(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSave();
                    }

                    if (e.key === "Escape") {
                      setTempDocId(formatDocumentId(invoice));
                      setEditing(false);
                    }
                  }}
                  className="w-44 rounded-lg border border-white/40 bg-white px-3 py-1.5 text-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-white/30 sm:w-52"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTempDocId(formatDocumentId(invoice));
                    setEditing(true);
                  }}
                  className="flex items-center rounded-lg px-2 py-1 text-xl font-bold tracking-tight text-white transition hover:bg-white/10"
                >
                  {loading ? (
                    <RefreshCcw className="mr-2 size-4 animate-spin text-white/70" />
                  ) : (
                    formatDocumentId(invoice)
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Document Type */}
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-semibold uppercase tracking-wider text-white/75 sm:block">
              Type
            </span>

            <Select
              value={invoice.documentType}
              onValueChange={(value) => updateInvoice("documentType", value)}
            >
              <SelectTrigger className="h-10 w-32 border-white/25 bg-white/15 font-medium text-white shadow-sm backdrop-blur-sm hover:bg-white/20 sm:w-36 [&>svg]:text-white">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Invoice">Invoice</SelectItem>
                <SelectItem value="Quotation">Quotation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 border-l border-white/20 pl-3">
            <Button
              variant="ghost"
              size="icon"
              className="size-10 text-white/80 hover:bg-white/15 hover:text-white"
              onClick={openInvoiceHistory}
              title="Document History"
            >
              <Clock className="size-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-10 text-white/80 hover:bg-white/15 hover:text-white"
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              <Settings className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
