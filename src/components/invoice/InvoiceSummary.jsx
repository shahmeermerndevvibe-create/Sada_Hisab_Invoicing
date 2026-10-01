import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Printer,
  Loader2,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";

import { useInvoiceStore } from "@/store/invoiceStore";
import { useInvoiceTotals } from "@/hooks/useInvoiceTotals";
import { formatCurrency } from "@/utils/invoiceUtils";
import { saveDocument } from "@/actions/invoiceActions";
import { validateInvoice } from "@/vaidations/invoiceValidation";
import { toast } from "react-hot-toast";

const SECTION_LABEL =
  "text-[11px] font-semibold uppercase tracking-wider text-slate-400";

const ADD_BUTTON_CLASS =
  "flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3.5 text-[13px] font-medium text-slate-500 transition-colors hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300 disabled:hover:border-slate-200 disabled:hover:bg-slate-50 disabled:hover:text-slate-300";

const MODE_SELECT_CLASS =
  "h-9 shrink-0 rounded-md border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-600 focus:outline-none focus:ring-1 focus-visible:ring-slate-300";

// Structured card shell for the invoice discount and offer rows.
const DISCOUNT_CARD_CLASS =
  "space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-4";

const clampNumber = (raw, percent, max) => {
  if (raw === "") return "";
  const num = Number(raw);
  if (Number.isNaN(num)) return null;
  if (num < 0) return "0";
  if (percent && num > 100) return "100";
  if (!percent && max != null && num > max) return String(max);
  return raw;
};

function AddButton({ children, onClick, disabled = false, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={ADD_BUTTON_CLASS}
    >
      <span aria-hidden="true" className="text-base leading-none">
        +
      </span>
      {children}
    </button>
  );
}

// Always-visible numeric input, uncontrolled: typing edits the DOM directly
// (smooth decimals/backspacing), while external updates (mode conversion,
// invoice loads) sync the DOM value only when the numeric value differs.
function InlineNumberInput({
  value,
  max,
  percent = false,
  onChange,
  suffix,
  ariaLabel = "Value",
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    const el = inputRef.current;
    if (el && Number(el.value) !== Number(value)) {
      el.value = String(Number(value) || 0);
    }
  }, [value]);

  const handleChange = (e) => {
    const next = clampNumber(e.target.value, percent, max);
    if (next === null) return;
    e.target.value = next;
    onChange(Number(next) || 0);
  };

  const handleBlur = (e) => {
    if (e.target.value.trim() !== "") {
      e.target.value = String(Number(e.target.value) || 0);
    }
  };

  return (
    <div className="relative shrink-0">
      <input
        ref={inputRef}
        type="number"
        inputMode="decimal"
        min={0}
        max={percent ? 100 : max}
        defaultValue={String(Number(value) || 0)}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-label={ariaLabel}
        className="h-9 w-28 rounded-md border border-slate-200 bg-white px-2 pr-6 text-right text-sm font-medium tabular-nums text-slate-800 focus:outline-none focus:ring-1 focus-visible:ring-blue-400"
      />
      {suffix && (
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
          {suffix}
        </span>
      )}
    </div>
  );
}

// One discount line inside the Total breakdown container.
function BreakdownRow({ label, amount, symbol }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span className="min-w-0 truncate font-medium text-slate-600">
        {label}
      </span>
      <span className="font-medium whitespace-nowrap tabular-nums text-rose-600">
        − {symbol} {formatCurrency(amount)}
      </span>
    </div>
  );
}

// Named offer line (name + target) inside the Total breakdown container.
function OfferBreakdownRow({ name, target, amount, symbol }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-600">{name}</p>
        <p className="mt-0.5 truncate text-xs text-slate-400">
          Off — {target}
        </p>
      </div>
      <span className="font-medium whitespace-nowrap tabular-nums text-rose-600">
        − {symbol} {formatCurrency(amount)}
      </span>
    </div>
  );
}

// One line inside the item price progression breakdown.
function PriceRow({ label, amount, symbol, discount = false, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span
        className={
          strong
            ? "min-w-0 truncate font-medium text-slate-700"
            : "min-w-0 truncate text-slate-500"
        }
      >
        {label}
      </span>
      <span
        className={`whitespace-nowrap tabular-nums ${
          discount
            ? "font-medium text-rose-600"
            : strong
              ? "font-semibold text-slate-900"
              : "font-medium text-slate-800"
        }`}
      >
        {discount && "− "}
        {symbol} {formatCurrency(amount)}
      </span>
    </div>
  );
}

// Display-only mirror of calculateItemRow's per-offer application: for each
// item with applying offers, the ordered progression and the resulting price
// after each step. Also powers the Totals breakdown (steps summed per offer
// index). Keep in sync with src/utils/invoiceUtils.js; never used for math.
const computeOfferProgressions = (items, offers, discountType) => {
  const progressions = [];

  items.forEach((item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const lineTotal = qty * rate;
    const discount = rate > 0 ? Number(item.discount) || 0 : 0;
    const discountAmount =
      discountType === "percent"
        ? (lineTotal * Math.min(discount, 100)) / 100
        : Math.min(discount, lineTotal);

    if (!(rate > 0) || !item.product || Number(item.discount) > 0) return;
    if (!(lineTotal > 0)) return;

    const matched = [];
    let accumulated = 0;

    offers.forEach((offer, index) => {
      if (offer?.appliesTo !== item.product) return;
      const offerValue = Number(offer.value) || 0;
      const amount =
        offer.type === "percent"
          ? (lineTotal * Math.min(offerValue, 100)) / 100
          : Math.min(offerValue, lineTotal - accumulated);
      accumulated += amount;
      matched.push({ index, name: offer.name, amount });
    });

    if (matched.length === 0) return;

    // Same final clamp as calculateItemRow; trim excess off the last offers
    // so the amounts still sum to offerDiscountsTotal.
    let excess = accumulated - Math.min(accumulated, lineTotal - discountAmount);
    for (let i = matched.length - 1; i >= 0 && excess > 0; i--) {
      const cut = Math.min(excess, matched[i].amount);
      matched[i].amount -= cut;
      excess -= cut;
    }

    let running = lineTotal;
    const steps = matched.map((step) => {
      running = Math.max(0, running - step.amount);
      return { ...step, after: running };
    });

    progressions.push({ product: item.product, original: lineTotal, steps });
  });

  return progressions;
};

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
    offerDiscountsTotal,
    discountAmount,
    total,
    balanceDue,
  } = useInvoiceTotals();

  const symbol = invoice.currency.symbol;
  const offers = Array.isArray(invoice.offers) ? invoice.offers : [];
  const selectableItems = items.filter((item) => item.product?.trim());

  // Amount the overall invoice discount applies to.
  const discountBase = Math.max(
    0,
    subtotal - itemDiscountsTotal - offerDiscountsTotal,
  );

  // Adding a discount/offer requires a real amount to discount.
  const hasValidAmount = discountBase > 0;
  const canAddOffer =
    hasValidAmount &&
    selectableItems.some((item) => {
      const lineTotal = (Number(item.qty) || 0) * (Number(item.rate) || 0);
      return lineTotal > 0 && !(Number(item.discount) > 0);
    });
  const showBreakdown =
    itemDiscountsTotal > 0 || offerDiscountsTotal > 0 || discountAmount > 0;
  const totalDiscounts =
    itemDiscountsTotal + offerDiscountsTotal + discountAmount;
  // Display only: per-item offer progression (shown under Offers) and the
  // per-offer amounts used by the Totals breakdown.
  const offerProgressions = computeOfferProgressions(
    items,
    offers,
    invoice.discountType,
  );
  const offerAmounts = offers.map(() => 0);
  offerProgressions.forEach((progression) => {
    progression.steps.forEach((step) => {
      offerAmounts[step.index] += step.amount;
    });
  });

  // ── Offer form ──
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [editingOfferIndex, setEditingOfferIndex] = useState(null);
  const [offerForm, setOfferForm] = useState({
    name: "",
    type: "percent",
    value: "",
    appliesTo: "",
  });

  const resetOfferForm = () => {
    setOfferForm({ name: "", type: "percent", value: "", appliesTo: "" });
    setEditingOfferIndex(null);
    setShowOfferForm(false);
  };

  const targetItem = selectableItems.find(
    (item) => item.product === offerForm.appliesTo,
  );
  const targetLineTotal = targetItem
    ? (Number(targetItem.qty) || 0) * (Number(targetItem.rate) || 0)
    : 0;

  const handleSaveOffer = () => {
    const name = offerForm.name.trim();
    const value = Number(offerForm.value);

    if (!name) {
      toast.error("Offer name is required.");
      return;
    }
    if (!offerForm.value || Number.isNaN(value) || value <= 0) {
      toast.error("Discount value is required.");
      return;
    }
    if (!offerForm.appliesTo) {
      toast.error("Please select an item.");
      return;
    }
    if (!targetItem) {
      toast.error("Selected item was not found.");
      return;
    }
    if (targetLineTotal <= 0) {
      toast.error("Selected item has no amount. Set qty and rate first.");
      return;
    }
    if (Number(targetItem.discount) > 0) {
      toast.error(
        "This item already has a discount. Remove the item discount first before applying an offer.",
      );
      return;
    }
    if (offerForm.type === "percent" && value > 100) {
      toast.error("Percentage discount cannot exceed 100%.");
      return;
    }
    if (offerForm.type === "fixed" && value > targetLineTotal) {
      toast.error(
        `Fixed discount cannot exceed item total of ${symbol} ${formatCurrency(targetLineTotal)}.`,
      );
      return;
    }

    const newOffer = {
      id:
        editingOfferIndex !== null
          ? offers[editingOfferIndex]?.id ?? `offer_${Date.now()}`
          : `offer_${Date.now()}`,
      name,
      type: offerForm.type,
      value,
      appliesTo: offerForm.appliesTo,
    };

    const updatedOffers =
      editingOfferIndex !== null
        ? offers.map((offer, i) => (i === editingOfferIndex ? newOffer : offer))
        : [...offers, newOffer];

    updateInvoice("offers", updatedOffers);
    resetOfferForm();
  };

  const handleEditOffer = (index) => {
    const offer = offers[index];
    if (!offer) return;
    setOfferForm({
      name: offer.name || "",
      type: offer.type === "fixed" ? "fixed" : "percent",
      value: String(offer.value ?? ""),
      appliesTo: offer.appliesTo || "",
    });
    setEditingOfferIndex(index);
    setShowOfferForm(true);
  };

  const handleDeleteOffer = (index) => {
    updateInvoice(
      "offers",
      offers.filter((_, i) => i !== index),
    );
  };

  const handleOfferValueSave = (index, num) => {
    const offer = offers[index];
    if (!offer) return;
    const item = selectableItems.find((i) => i.product === offer.appliesTo);
    const lineTotal = item
      ? (Number(item.qty) || 0) * (Number(item.rate) || 0)
      : 0;

    let value = num;
    if (offer.type === "percent") value = Math.min(num, 100);
    else if (lineTotal > 0) value = Math.min(num, lineTotal);

    updateInvoice(
      "offers",
      offers.map((o, i) => (i === index ? { ...o, value } : o)),
    );
  };

  // Converts the offer value when switching Fixed ↔ Percentage,
  // using the target item's line total as the base.
  const handleOfferTypeChange = (index, nextType) => {
    const offer = offers[index];
    if (!offer || nextType === offer.type) return;

    const item = selectableItems.find((i) => i.product === offer.appliesTo);
    const lineTotal = item
      ? (Number(item.qty) || 0) * (Number(item.rate) || 0)
      : 0;

    let value = Number(offer.value) || 0;
    value =
      nextType === "percent"
        ? lineTotal > 0
          ? (value / lineTotal) * 100
          : 0
        : (value / 100) * lineTotal;
    value = Math.max(0, Math.round(value * 100) / 100);
    value = Math.min(value, nextType === "percent" ? 100 : lineTotal);

    updateInvoice(
      "offers",
      offers.map((o, i) =>
        i === index ? { ...o, type: nextType, value } : o,
      ),
    );
  };

  // ── Overall invoice discount ──
  const [showInvoiceDiscount, setShowInvoiceDiscount] = useState(false);
  const invoiceDiscountVisible =
    showInvoiceDiscount || Number(invoice.discount) > 0;

  const handleInvoiceDiscountModeChange = (nextMode) => {
    const current = Number(invoice.discount) || 0;
    let next = current;

    if (nextMode !== invoice.discountType) {
      next =
        nextMode === "percent"
          ? discountBase > 0
            ? (current / discountBase) * 100
            : 0
          : (current / 100) * discountBase;
      next = Math.max(0, Math.round(next * 100) / 100);
      next = Math.min(next, nextMode === "percent" ? 100 : discountBase);
    }

    updateInvoice("discountType", nextMode);
    updateInvoice("discount", next);
  };

  const clearInvoiceDiscount = () => {
    updateInvoice("discount", 0);
    setShowInvoiceDiscount(false);
  };

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

        {/* Controls */}
        <div className="space-y-4 px-5 py-4">
          {/* Overall invoice discount */}
          {invoiceDiscountVisible ? (
            <div className={DISCOUNT_CARD_CLASS}>
              <p className={SECTION_LABEL}>Invoice Discount</p>

              <Input
                type="text"
                placeholder="Discount name"
                value={invoice.invoiceDiscountLabel ?? ""}
                onChange={(e) =>
                  updateInvoice("invoiceDiscountLabel", e.target.value)
                }
                aria-label="Invoice discount name"
                className="h-9 border-slate-200 bg-white text-sm shadow-none focus-visible:ring-blue-400"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <select
                    value={
                      invoice.discountType === "percent" ? "percent" : "fixed"
                    }
                    onChange={(e) =>
                      handleInvoiceDiscountModeChange(e.target.value)
                    }
                    aria-label="Invoice discount mode"
                    className={MODE_SELECT_CLASS}
                  >
                    <option value="fixed">Fixed</option>
                    <option value="percent">Percentage</option>
                  </select>

                  <InlineNumberInput
                    value={Number(invoice.discount) || 0}
                    max={discountBase}
                    percent={invoice.discountType === "percent"}
                    onChange={(num) => updateInvoice("discount", num)}
                    suffix={
                      invoice.discountType === "percent" ? "%" : symbol
                    }
                    ariaLabel="Invoice discount value"
                  />
                </div>

                <button
                  type="button"
                  onClick={clearInvoiceDiscount}
                  className="h-9 shrink-0 rounded-md px-3 text-sm font-medium text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <AddButton
              onClick={() => setShowInvoiceDiscount(true)}
              disabled={!hasValidAmount}
              title={
                !hasValidAmount ? "Invoice has no amount to discount" : undefined
              }
            >
              Invoice Discount
            </AddButton>
          )}

          {/* Offers */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between gap-3">
              <p className={SECTION_LABEL}>Offers</p>
              {!showOfferForm && (
                <AddButton
                  onClick={() => {
                    resetOfferForm();
                    setShowOfferForm(true);
                  }}
                  disabled={!canAddOffer}
                  title={!canAddOffer ? "No offerable item amount" : undefined}
                >
                  Add Offer
                </AddButton>
              )}
            </div>

            {/* Offer form */}
            {showOfferForm && (
              <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                <div>
                  <label
                    htmlFor="offer-item"
                    className="mb-1 block text-xs font-medium text-slate-500"
                  >
                    Item
                  </label>
                  <Select
                    value={offerForm.appliesTo}
                    onValueChange={(value) =>
                      setOfferForm((form) => ({
                        ...form,
                        appliesTo: value,
                        value: "",
                      }))
                    }
                  >
                    <SelectTrigger
                      id="offer-item"
                      className="h-9 w-full border-slate-200 bg-white"
                    >
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableItems.map((item, index) => (
                        <SelectItem
                          key={`${index}-${item.product}`}
                          value={item.product}
                          className="whitespace-normal"
                        >
                          {item.product}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label
                    htmlFor="offer-name"
                    className="mb-1 block text-xs font-medium text-slate-500"
                  >
                    Offer name
                  </label>
                  <Input
                    id="offer-name"
                    placeholder="e.g. Student Discount"
                    value={offerForm.name}
                    onChange={(e) =>
                      setOfferForm((form) => ({ ...form, name: e.target.value }))
                    }
                    className="h-9 border-slate-200 bg-white text-sm shadow-none focus-visible:ring-blue-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="offer-type"
                      className="mb-1 block text-xs font-medium text-slate-500"
                    >
                      Type
                    </label>
                    <select
                      id="offer-type"
                      value={offerForm.type}
                      onChange={(e) =>
                        setOfferForm((form) => ({
                          ...form,
                          type: e.target.value,
                          value: "",
                        }))
                      }
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      <option value="percent">Percentage</option>
                      <option value="fixed">Fixed</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="offer-value"
                      className="mb-1 block text-xs font-medium text-slate-500"
                    >
                      Value
                    </label>
                    <div className="relative">
                      <Input
                        id="offer-value"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={offerForm.type === "percent" ? 100 : undefined}
                        placeholder={
                          !offerForm.appliesTo
                            ? "Select item first"
                            : offerForm.type === "percent"
                              ? "e.g. 10"
                              : "Amount"
                        }
                        disabled={!offerForm.appliesTo}
                        value={offerForm.value}
                        onChange={(e) => {
                          const next = clampNumber(
                            e.target.value,
                            offerForm.type === "percent",
                            offerForm.type === "fixed" && targetLineTotal > 0
                              ? targetLineTotal
                              : undefined,
                          );
                          if (next !== null) {
                            setOfferForm((form) => ({ ...form, value: next }));
                          }
                        }}
                        className="h-9 border-slate-200 bg-white pr-7 text-right text-sm shadow-none focus-visible:ring-blue-400"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                        {offerForm.type === "percent" ? "%" : symbol}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <Button
                    size="sm"
                    onClick={handleSaveOffer}
                    className="h-8 bg-blue-600 px-3 text-xs hover:bg-blue-700"
                  >
                    <Check className="mr-1 h-3 w-3" />
                    {editingOfferIndex !== null ? "Update" : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={resetOfferForm}
                    className="h-8 px-3 text-xs text-slate-500 hover:text-slate-800"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {offers.length === 0 && !showOfferForm && (
              <p className="py-2 text-center text-xs text-slate-400">
                No offers added yet
              </p>
            )}

            {/* Offers list */}
            {offers.map((offer, index) => {
              const item = selectableItems.find(
                (i) => i.product === offer.appliesTo,
              );
              const lineTotal = item
                ? (Number(item.qty) || 0) * (Number(item.rate) || 0)
                : 0;

              return (
                <div
                  key={offer.id ?? `offer-${index}`}
                  className={DISCOUNT_CARD_CLASS}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {offer.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      Off — {offer.appliesTo}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={offer.type === "fixed" ? "fixed" : "percent"}
                        onChange={(e) =>
                          handleOfferTypeChange(index, e.target.value)
                        }
                        aria-label={`Type for ${offer.name}`}
                        className={MODE_SELECT_CLASS}
                      >
                        <option value="fixed">Fixed</option>
                        <option value="percent">Percentage</option>
                      </select>

                      <InlineNumberInput
                        value={Number(offer.value) || 0}
                        max={lineTotal > 0 ? lineTotal : undefined}
                        percent={offer.type === "percent"}
                        onChange={(num) => handleOfferValueSave(index, num)}
                        suffix={offer.type === "percent" ? "%" : symbol}
                        ariaLabel={`Value for ${offer.name}`}
                      />
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        title="Edit offer"
                        onClick={() => handleEditOffer(index)}
                        className="rounded-md p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-400"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Delete offer"
                        onClick={() => handleDeleteOffer(index)}
                        className="rounded-md p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Item price progression after offers (display only) */}
            {offerProgressions.length > 0 && (
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <p className={SECTION_LABEL}>Item Price After Offers</p>
                {offerProgressions.map((progression, pIndex) => (
                  <div
                    key={`${progression.product}-${pIndex}`}
                    className="rounded-xl border border-slate-200/80 bg-white px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-slate-800">
                      {progression.product}
                    </p>

                    <div className="mt-2">
                      <PriceRow
                        label="Original price"
                        amount={progression.original}
                        symbol={symbol}
                      />
                    </div>

                    <div className="mt-2 space-y-2">
                      {progression.steps.map((step, sIndex) => {
                        const isLast =
                          sIndex === progression.steps.length - 1;
                        return (
                          <div key={`${step.index}-${sIndex}`}>
                            <PriceRow
                              label={step.name}
                              amount={step.amount}
                              symbol={symbol}
                              discount
                            />
                            <div className="mt-1">
                              <PriceRow
                                label={isLast ? "After discounts" : "After offer"}
                                amount={step.after}
                                symbol={symbol}
                                strong={isLast}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Totals */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-4">
          {/* Subtotal */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Subtotal</span>
            <span className="text-sm font-medium whitespace-nowrap tabular-nums text-slate-900">
              {symbol} {formatCurrency(subtotal)}
            </span>
          </div>

          {/* Discount breakdown */}
          {showBreakdown && (
            <div className="mt-3 space-y-2.5">
              {itemDiscountsTotal > 0 && (
                <BreakdownRow
                  label={invoice.itemDiscountLabel || "Item Discounts"}
                  amount={itemDiscountsTotal}
                  symbol={symbol}
                />
              )}

              {offers.map((offer, index) => {
                const amount = offerAmounts[index] || 0;
                if (amount <= 0) return null;
                return (
                  <OfferBreakdownRow
                    key={offer.id ?? `offer-${index}`}
                    name={offer.name}
                    target={offer.appliesTo}
                    amount={amount}
                    symbol={symbol}
                  />
                );
              })}

              {discountAmount > 0 && (
                <BreakdownRow
                  label={invoice.invoiceDiscountLabel || "Discount"}
                  amount={discountAmount}
                  symbol={symbol}
                />
              )}
            </div>
          )}

          {/* Total Discounts */}
          {totalDiscounts > 0 && (
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
              <span className="text-[13px] font-medium text-slate-600">
                Total Discounts
              </span>
              <span className="text-[13px] font-semibold whitespace-nowrap tabular-nums text-rose-600">
                − {symbol} {formatCurrency(totalDiscounts)}
              </span>
            </div>
          )}

          {/* Total */}
          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-700">
                Total
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-400">
                Final quotation amount
              </p>
            </div>
            <p className="text-2xl font-bold whitespace-nowrap tabular-nums leading-none text-slate-900">
              {symbol} {formatCurrency(total)}
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
