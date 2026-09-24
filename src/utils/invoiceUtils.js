const applyDiscount = (base, value, type) => {
  const amount = Number(value) || 0;
  if (base <= 0 || amount <= 0) return 0;

  if (type === "percent") {
    return (base * Math.min(amount, 100)) / 100;
  }

  return Math.min(amount, base);
};

const calculateTax = (taxableAmount, invoice) => {
  const tax = Number(invoice.tax) || 0;

  if (invoice.taxType === "percent") {
    return (taxableAmount * tax) / 100;
  }

  return tax;
};

const calculateBalanceDue = (
  total,
  deposit = 0
) => {
  return total - (Number(deposit) || 0);
};

export const formatCurrency = (value = 0) => {
  return new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
};

const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

// Distributes `total` across `weights` proportionally, rounding each share to
// 2 decimals via the largest-remainder method so the shares sum exactly to
// `round2(total)`.
export const distributeProportionally = (weights = [], total = 0) => {
  const count = weights.length;
  if (count === 0 || total <= 0) return weights.map(() => 0);

  const sum = weights.reduce((acc, w) => acc + w, 0);
  if (sum <= 0) return weights.map(() => 0);

  const raw = weights.map((w) => (w / sum) * total);
  const allocated = raw.map((v) => Math.floor(v * 100) / 100);

  let cents = Math.round(
    (round2(total) - allocated.reduce((acc, v) => acc + v, 0)) * 100,
  );

  const byFraction = raw
    .map((v, i) => ({ i, fraction: v - Math.floor(v * 100) / 100 }))
    .sort((a, b) => b.fraction - a.fraction);

  let idx = 0;
  while (cents > 0) {
    allocated[byFraction[idx % count].i] = round2(
      allocated[byFraction[idx % count].i] + 0.01,
    );
    cents--;
    idx++;
  }

  return allocated;
};

export const calculateItemRow = (item = {}, invoiceDiscountType = "fixed") => {
  const qty = Number(item.qty) || 0;
  const rate = Number(item.rate) || 0;
  const lineTotal = qty * rate;

  const discount = rate > 0 ? (Number(item.discount) || 0) : 0;
  const discountAmount = invoiceDiscountType === "percent"
    ? (lineTotal * Math.min(discount, 100)) / 100
    : Math.min(discount, lineTotal);

  return {
    lineTotal,
    discountAmount,
    netTotal: lineTotal - discountAmount,
  };
};

export function formatDocumentId(invoice) {
  if (!invoice) return "";
  const number = invoice.documentNumber || "—";
  const base = `DV-SH-${number}`;
  return invoice.documentSuffix ? `${base}-${invoice.documentSuffix}` : base;
}

// Multiple independent adjustment rows when `invoice.adjustments` exists;
// otherwise fall back to legacy single discount/offerDiscount fields.
export const getAdjustmentRows = (invoice = {}, type) => {
  if (Array.isArray(invoice.adjustments)) {
    return invoice.adjustments.filter((row) => row && row.type === type);
  }

  if (type === "discount") {
    return Number(invoice.discount) > 0
      ? [{
          id: "legacy-discount",
          type: "discount",
          mode: invoice.discountType || "fixed",
          value: invoice.discount,
        }]
      : [];
  }

  return Number(invoice.offerDiscount) > 0
    ? [{
        id: "legacy-offer",
        type: "offer",
        mode: invoice.offerDiscountType || "fixed",
        value: invoice.offerDiscount,
      }]
    : [];
};

export const adjustmentAmount = (row, base) =>
  applyDiscount(base, row?.value, row?.mode || "fixed");

// Sequential order: actual `invoice.adjustments` array order when present;
// legacy fallback keeps the historical offer-then-discount order.
export const getSequentialAdjustmentRows = (invoice = {}) => {
  if (Array.isArray(invoice.adjustments)) {
    return invoice.adjustments.filter(
      (row) => row && (row.type === "discount" || row.type === "offer"),
    );
  }

  return [
    ...getAdjustmentRows(invoice, "offer"),
    ...getAdjustmentRows(invoice, "discount"),
  ];
};

/**
 * Applies adjustments sequentially against the running remaining amount.
 * Percentage rows use the current remaining; fixed rows clamp to remaining.
 * Never lets remaining go below 0.
 *
 * Returns taxable remaining plus per-row applied amounts/bases (for UI).
 */
export const computeAdjustmentBreakdown = (invoice = {}, afterItemDiscounts = 0) => {
  const rows = getSequentialAdjustmentRows(invoice);
  let remaining = Math.max(0, Number(afterItemDiscounts) || 0);

  const rowAmounts = {};
  const rowBases = {};
  let discountAmount = 0;
  let offerDiscountAmount = 0;

  for (const row of rows) {
    const base = remaining;
    const amount = adjustmentAmount(row, base);
    remaining = Math.max(0, remaining - amount);

    if (row.id != null) {
      rowAmounts[row.id] = amount;
      rowBases[row.id] = base;
    }

    if (row.type === "offer") {
      offerDiscountAmount += amount;
    } else {
      discountAmount += amount;
    }
  }

  return {
    taxableAmount: remaining,
    discountAmount,
    offerDiscountAmount,
    rowAmounts,
    rowBases,
  };
};

export const calculateInvoiceTotals = (
  items = [],
  invoice = {}
) => {
  const itemRows = items.map(item => calculateItemRow(item, invoice.discountType));
  const subtotal = itemRows.reduce((sum, row) => sum + row.lineTotal, 0);
  const itemDiscountsTotal = itemRows.reduce((sum, row) => sum + row.discountAmount, 0);

  const afterItemDiscounts = Math.max(0, subtotal - itemDiscountsTotal);

  const breakdown = computeAdjustmentBreakdown(invoice, afterItemDiscounts);
  const {
    taxableAmount,
    discountAmount,
    offerDiscountAmount,
    rowAmounts,
    rowBases,
  } = breakdown;

  const taxAmount = calculateTax(taxableAmount, invoice);

  const total = taxableAmount + taxAmount;

  const balanceDue = calculateBalanceDue(
    total,
    invoice.deposit || 0
  );

  return {
    subtotal,
    itemDiscountsTotal,
    offerDiscountAmount,
    discountAmount,
    taxAmount,
    total,
    balanceDue,
    adjustmentRowAmounts: rowAmounts,
    adjustmentRowBases: rowBases,
  };
};