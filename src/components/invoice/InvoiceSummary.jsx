import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Loader2 } from "lucide-react";

import { useInvoiceStore } from "@/store/invoiceStore";
import { useInvoiceTotals } from "@/hooks/useInvoiceTotals";
import {
  formatCurrency,
  getSequentialAdjustmentRows,
} from "@/utils/invoiceUtils";
import { saveDocument } from "@/actions/invoiceActions";
import { validateInvoice } from "@/vaidations/invoiceValidation";
import { toast } from "react-hot-toast";

const ADJUSTMENT_META = {
  discount: { title: "Invoice Discount" },
  offer: { title: "Offer Discount" },
};

const createAdjustmentId = () =>
  `adj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const clampAdjustmentValue = (raw, mode, max) => {
  let num = Number(raw);
  if (raw === "" || Number.isNaN(num)) num = 0;
  if (num < 0) num = 0;
  if (mode === "percent") return Math.min(num, 100);
  return Math.min(num, Math.max(0, max ?? 0));
};

// Convert value between Fixed/Percentage using the row's current base amount.
// Returns 0 when conversion is not possible (base <= 0 or invalid input).
const convertAdjustmentValue = (value, fromMode, toMode, base) => {
  if (fromMode === toMode) {
    return clampAdjustmentValue(value, toMode, base);
  }

  const num = Number(value) || 0;
  const safeBase = Math.max(0, base ?? 0);
  if (num <= 0 || safeBase <= 0) return 0;

  let converted;
  if (fromMode === "fixed" && toMode === "percent") {
    converted = (num / safeBase) * 100;
  } else if (fromMode === "percent" && toMode === "fixed") {
    converted = (num / 100) * safeBase;
  } else {
    return 0;
  }

  if (!Number.isFinite(converted) || converted < 0) return 0;
  return clampAdjustmentValue(converted, toMode, safeBase);
};

function EditableLabel({ label, onCommit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);

  const commit = () => {
    const next = draft.trim();
    onCommit(next || label);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        title="Click to edit label"
        onClick={() => {
          setDraft(label);
          setEditing(true);
        }}
        className="min-w-0 flex-1 cursor-text truncate text-left text-sm font-medium text-slate-800 hover:text-blue-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-400"
      >
        {label}
      </button>
    );
  }

  return (
    <input
      autoFocus
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") {
          setDraft(label);
          setEditing(false);
        }
      }}
      aria-label="Adjustment label"
      className="h-7 min-w-0 flex-1 rounded-md border border-blue-300 bg-white px-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
    />
  );
}

function AdjustmentRow({
  row,
  computed,
  max,
  symbol,
  onChange,
  onRemove,
}) {
  const meta = ADJUSTMENT_META[row.type] || { title: row.type };
  const label = row.label || meta.title;
  const mode = row.mode || "fixed";
  const isPercent = mode === "percent";
  const safeMax = Math.max(0, max ?? 0);
  const rawValue = Number(row.value) || 0;
  const effectiveValue = isPercent
    ? Math.min(rawValue, 100)
    : Math.min(rawValue, safeMax);

  const handleValueChange = (raw) => {
    onChange({ value: clampAdjustmentValue(raw, mode, safeMax) });
  };

  return (
    <div
      data-adjustment-id={row.id}
      className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3.5"
    >
      <div className="flex items-center justify-between gap-3">
        <EditableLabel
          label={label}
          onCommit={(next) => onChange({ label: next })}
        />
        <span className="shrink-0 text-right text-sm font-semibold whitespace-nowrap tabular-nums text-slate-800">
          −{isPercent
            ? `${formatCurrency(rawValue)}% · ${symbol} ${formatCurrency(computed)}`
            : `${symbol} ${formatCurrency(computed)}`}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <select
            value={isPercent ? "percent" : "fixed"}
            onChange={(e) => {
              const nextMode = e.target.value;
              const converted = convertAdjustmentValue(
                rawValue,
                mode,
                nextMode,
                safeMax,
              );
              onChange({ mode: nextMode, value: converted });
            }}
            aria-label={`${label} mode`}
            className="h-8 shrink-0 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 focus:outline-none focus:ring-1 focus-visible:ring-slate-300"
          >
            <option value="fixed">Fixed</option>
            <option value="percent">Percentage</option>
          </select>

          <div className="relative min-w-0">
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              max={isPercent ? 100 : safeMax}
              value={effectiveValue}
              onChange={(e) => handleValueChange(e.target.value)}
              onFocus={(e) => {
                const input = e.target;
                if (input.value === "0" || input.value === "0.00") {
                  input.select();
                }
              }}
              aria-label={`${label} value`}
              className="h-8 w-32 border-slate-200 bg-white pr-6 text-right text-sm shadow-none focus-visible:ring-1 focus-visible:ring-slate-300"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
              {isPercent ? "%" : symbol}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-300"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function AddAdjustmentButtons({ onAdd, disabled = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(["discount", "offer"]).map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onAdd(type)}
          disabled={disabled}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3.5 text-[13px] font-medium text-slate-500 transition-colors hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300 disabled:hover:border-slate-200 disabled:hover:bg-slate-50 disabled:hover:text-slate-300"
        >
          <span aria-hidden="true" className="text-base leading-none">+</span>
          {ADJUSTMENT_META[type].title}
        </button>
      ))}
    </div>
  );
}

const validateAndNotify = (invoice, items, subtotal, setErrors) => {
  const { isValid, errors } = validateInvoice(invoice, items, subtotal);

  if (!isValid) {
    setErrors(errors);
    const messages = [];
    for (const [key, val] of Object.entries(errors)) {
      if (key === "itemErrors") {
        for (const item of val) messages.push(...Object.values(item));
      } else {
        messages.push(val);
      }
    }
    toast.error(
      <div className="text-left">
        {messages.map((msg, i) => (
          <p key={i} className={i > 0 ? "mt-1" : ""}>
            {msg}
          </p>
        ))}
      </div>,
    );
  }

  return isValid;
};

export default function InvoiceSummary({ onPrint }) {
  const invoice = useInvoiceStore((state) => state.invoice);

  const items = useInvoiceStore((state) => state.items);
  const updateInvoice = useInvoiceStore((state) => state.updateInvoice);
  const resetInvoice = useInvoiceStore((state) => state.resetInvoice);
  const editingInvoiceId = useInvoiceStore((state) => state.editingInvoiceId);
  const setErrors = useInvoiceStore((state) => state.setErrors);
  const processing = useInvoiceStore((state) => state.processing);
  const setProcessing = useInvoiceStore((state) => state.setProcessing);
  const openInvoiceHistory = useInvoiceStore(
    (state) => state.openInvoiceHistory,
  );

  const {
    subtotal,
    itemDiscountsTotal,
    total,
    balanceDue,
    adjustmentRowAmounts,
    adjustmentRowBases,
  } = useInvoiceTotals();

  const adjustments = getSequentialAdjustmentRows(invoice);

  const offerBase = Math.max(0, subtotal - itemDiscountsTotal);
  const canAddAdjustments = offerBase > 0;

  // Sequential display: each row's label + amount + remaining after it
  const breakdownSteps = [];
  {
    let remaining = offerBase;
    for (const row of adjustments) {
      const meta = ADJUSTMENT_META[row.type] || { title: row.type };
      const label = row.label || meta.title;
      const amount = adjustmentRowAmounts[row.id] ?? 0;
      remaining = Math.max(0, remaining - amount);
      breakdownSteps.push({ id: row.id, label, amount, after: remaining });
    }
  }

  const commitAdjustments = (rows) => {
    updateInvoice("adjustments", rows);
  };

  const addAdjustment = (type) => {
    if (!canAddAdjustments) return;
    const meta = ADJUSTMENT_META[type] || { title: type };
    const row = {
      id: createAdjustmentId(),
      type,
      mode: "fixed",
      value: 0,
      label: meta.title,
    };
    commitAdjustments([...adjustments, row]);
  };

  const updateAdjustment = (id, patch) => {
    commitAdjustments(
      adjustments.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const removeAdjustment = (id) => {
    commitAdjustments(adjustments.filter((row) => row.id !== id));
  };

  const rowComputed = (row) => adjustmentRowAmounts[row.id] ?? 0;

  const rowMax = (row) => adjustmentRowBases[row.id] ?? offerBase;

  const handlePrintInvoice = async () => {
    try {
      const currentInvoice = useInvoiceStore.getState().invoice;
      const invoiceToSave = {
        ...currentInvoice,
        subtotal,
        total,
        balanceDue,
      };

      if (!validateAndNotify(invoiceToSave, items, subtotal, setErrors)) {
        return;
      }

      setProcessing({
        title: "Saving Invoice...",
        message: "Please wait while we save your invoice.",
      });

      const result = await saveDocument(invoiceToSave, items);

      if (!result.success) {
        toast.error("Failed to save.");
        return;
      }

      toast.success("Saved successfully!");

      await onPrint();

      const nextCounter = invoiceToSave.documentCounter + 1;

      resetInvoice();
      setErrors({});

      updateInvoice("documentCounter", nextCounter);
      updateInvoice("documentNumber", String(nextCounter));
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while saving the invoice.");
    } finally {
      setProcessing(null);
    }
  };

  const handleDraftSaved = (draftInvoice) => {
    openInvoiceHistory();
    resetInvoice();
    setErrors({});
    const nextCounter = draftInvoice.documentCounter + 1;
    updateInvoice("documentCounter", nextCounter);
    updateInvoice("documentNumber", String(nextCounter));
  };

  const handleSaveDraft = async ({ newDraft = false } = {}) => {
    if (newDraft && editingInvoiceId) return;
    try {
      const current = useInvoiceStore.getState();
      const draftInvoice = {
        ...current.invoice,
        isDraft: true,
        ...(newDraft ? { draftType: "saved" } : {}),
      };

      if (
        !validateAndNotify(draftInvoice, current.items, subtotal, setErrors)
      ) {
        return;
      }

      setProcessing({
        title: "Saving Draft...",
        message: "Please wait while we save your draft.",
      });

      const result = await saveDocument(draftInvoice, current.items);

      if (!result.success) {
        toast.error("Failed to save draft.");
        return;
      }

      toast.success("Draft saved!");
      handleDraftSaved(draftInvoice);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while saving the draft.");
    } finally {
      setProcessing(null);
    }
  };

  const handleFinalizeDraft = async () => {
    updateInvoice("isDraft", false);
    updateInvoice("draftType", null);
    await handlePrintInvoice();
  };

  return (
    <Card className="w-full border border-slate-200 bg-white shadow-sm">
      <CardContent className="p-0">
        {/* Header */}
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">
            Invoice Summary
          </h2>
        </div>

        {/* Subtotal + Adjustments */}
        <div className="space-y-4 px-5 py-4">
          {/* Subtotal */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Subtotal</span>
            <span className="text-sm font-medium whitespace-nowrap tabular-nums text-slate-900">
              {invoice.currency.symbol} {formatCurrency(subtotal)}
            </span>
          </div>

          {/* Adjustments */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Adjustments
            </p>

            <AddAdjustmentButtons
              onAdd={addAdjustment}
              disabled={!canAddAdjustments}
            />

            {adjustments.length > 0 && (
              <div className="space-y-2.5">
                {adjustments.map((row) => (
                  <AdjustmentRow
                    key={row.id}
                    row={row}
                    computed={rowComputed(row)}
                    max={rowMax(row)}
                    symbol={invoice.currency.symbol}
                    onChange={(patch) => updateAdjustment(row.id, patch)}
                    onRemove={() => removeAdjustment(row.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Calculation breakdown */}
        {breakdownSteps.length > 0 && (
          <div className="space-y-1.5 border-t border-slate-100 px-5 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Calculation
            </p>
            <div className="space-y-1">
              {breakdownSteps.map((step) => (
                <div key={`amt-${step.id}`} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-[12px]">
                    <span className="min-w-0 truncate text-slate-500">
                      {step.label}
                    </span>
                    <span className="font-medium whitespace-nowrap tabular-nums text-slate-700">
                      −{invoice.currency.symbol} {formatCurrency(step.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[12px]">
                    <span className="min-w-0 truncate text-slate-400">
                      After {step.label}
                    </span>
                    <span className="font-medium whitespace-nowrap tabular-nums text-slate-600">
                      {invoice.currency.symbol} {formatCurrency(step.after)}
                    </span>
                  </div>
                </div>
              ))}
              <div className="mt-1 flex items-center justify-between gap-3 border-t border-slate-100 pt-1.5 text-[12px]">
                <span className="font-medium text-slate-700">Final Total</span>
                <span className="font-semibold whitespace-nowrap tabular-nums text-slate-900">
                  {invoice.currency.symbol} {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-700">
                Total
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-400">
                Final quotation amount
              </p>
            </div>
            <p className="text-2xl font-bold whitespace-nowrap tabular-nums leading-none text-slate-900">
              {invoice.currency.symbol} {formatCurrency(total)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 border-t border-slate-100 px-5 py-4">
          {invoice.isDraft ? (
            <>
              <Button
                className="h-10 w-full bg-blue-600 text-sm font-medium hover:bg-blue-700"
                size="lg"
                onClick={handleSaveDraft}
                disabled={!!processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingInvoiceId ? (
                  "Update Draft"
                ) : (
                  "Save Draft"
                )}
              </Button>
              {editingInvoiceId && (
                <Button
                  variant="outline"
                  className="h-10 w-full border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  size="lg"
                  onClick={handleFinalizeDraft}
                  disabled={!!processing}
                >
                  Finalize
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                className="h-10 w-full bg-blue-600 text-sm font-medium hover:bg-blue-700"
                size="lg"
                onClick={handlePrintInvoice}
                disabled={!!processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingInvoiceId ? (
                  <>
                    <Printer className="mr-2 h-4 w-4" />
                    Update Invoice
                  </>
                ) : (
                  <>
                    <Printer className="mr-2 h-4 w-4" />
                    Print {invoice.documentType}
                  </>
                )}
              </Button>
              {!editingInvoiceId && (
                <Button
                  variant="ghost"
                  className="h-10 w-full text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  size="lg"
                  onClick={() => handleSaveDraft({ newDraft: true })}
                  disabled={!!processing}
                >
                  Save Draft
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
