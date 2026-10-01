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

export const calculateItemRow = (
  item = {},
  invoiceDiscountType = "fixed",
  offers = [],
) => {
  const qty = Number(item.qty) || 0;
  const rate = Number(item.rate) || 0;
  const lineTotal = qty * rate;

  const discount = rate > 0 ? (Number(item.discount) || 0) : 0;
  const discountAmount = invoiceDiscountType === "percent"
    ? (lineTotal * Math.min(discount, 100)) / 100
    : Math.min(discount, lineTotal);

  // Offers target one specific item (`appliesTo` === item.product).
  // An item can have either a line-item discount or an offer, not both.
  // `offerSteps` is a display-only per-offer breakdown for the print
  // pipeline; its amounts always sum exactly to `offerDiscountAmount`.
  let offerDiscountAmount = 0;
  const offerSteps = [];
  if (rate > 0 && item.product && !(Number(item.discount) > 0)) {
    offers.forEach((offer, offerIndex) => {
      if (offer?.appliesTo !== item.product) return;
      const offerValue = Number(offer.value) || 0;
      const amount =
        offer.type === "percent"
          ? (lineTotal * Math.min(offerValue, 100)) / 100
          : Math.min(offerValue, lineTotal - offerDiscountAmount);
      offerDiscountAmount += amount;
      offerSteps.push({ index: offerIndex, amount });
    });

    const accumulated = offerDiscountAmount;
    offerDiscountAmount = Math.min(
      accumulated,
      lineTotal - discountAmount,
    );

    // Same final clamp; trim the excess off the last offers so the steps
    // still sum exactly to `offerDiscountAmount`.
    let excess = accumulated - offerDiscountAmount;
    for (let i = offerSteps.length - 1; i >= 0 && excess > 0; i--) {
      const cut = Math.min(excess, offerSteps[i].amount);
      offerSteps[i].amount -= cut;
      excess -= cut;
    }
  }

  return {
    lineTotal,
    discountAmount,
    offerDiscountAmount,
    offerSteps,
    netTotal: lineTotal - discountAmount - offerDiscountAmount,
  };
};

export function formatDocumentId(invoice) {
  if (!invoice) return "";
  const number = invoice.documentNumber || "—";
  const base = `DV-SH-${number}`;
  return invoice.documentSuffix ? `${base}-${invoice.documentSuffix}` : base;
}

// Display rows for the summary/print, in flow order:
//   one row per offer (actual offer name) → overall invoice discount.
// Amounts live in `adjustmentRowAmounts` (see calculateInvoiceTotals),
// keyed `offer-<index>` to match these row ids.
export const getSequentialAdjustmentRows = (invoice = {}) => {
  const rows = [];

  if (Array.isArray(invoice.offers)) {
    invoice.offers.forEach((offer, index) => {
      if (!offer) return;
      rows.push({
        id: `offer-${index}`,
        type: "offer",
        label: offer.name || invoice.offerDiscountLabel || "Offer Discount",
        mode: offer.type === "percent" ? "percent" : "fixed",
        value: offer.value,
      });
    });
  }

  if (Number(invoice.discount) > 0) {
    rows.push({
      id: "invoice-discount",
      type: "discount",
      label: invoice.invoiceDiscountLabel || "Discount",
      mode: invoice.discountType || "fixed",
      value: invoice.discount,
    });
  }

  return rows;
};

export const calculateInvoiceTotals = (
  items = [],
  invoice = {}
) => {
  const offers = Array.isArray(invoice.offers) ? invoice.offers : [];
  const itemRows = items.map(item =>
    calculateItemRow(item, invoice.discountType, offers),
  );

  const subtotal = itemRows.reduce((sum, row) => sum + row.lineTotal, 0);
  const itemDiscountsTotal = itemRows.reduce((sum, row) => sum + row.discountAmount, 0);
  const offerDiscountsTotal = itemRows.reduce((sum, row) => sum + row.offerDiscountAmount, 0);

  // Per-offer amounts for the print rows (display only); each row's steps
  // sum exactly to that item's offerDiscountAmount, so the totals add up.
  const offerAmounts = offers.map(() => 0);
  for (const row of itemRows) {
    for (const step of row.offerSteps) {
      offerAmounts[step.index] += step.amount;
    }
  }

  // Flow: subtotal → item discounts → offers → invoice discount → tax
  const afterItemAndOfferDiscounts = Math.max(
    0,
    subtotal - itemDiscountsTotal - offerDiscountsTotal,
  );

  const discountAmount = applyDiscount(
    afterItemAndOfferDiscounts,
    invoice.discount,
    invoice.discountType,
  );
  const taxableAmount = Math.max(0, afterItemAndOfferDiscounts - discountAmount);
  const taxAmount = calculateTax(taxableAmount, invoice);
  const total = taxableAmount + taxAmount;

  const balanceDue = calculateBalanceDue(
    total,
    invoice.deposit || 0
  );

  const adjustmentRowAmounts = {
    "offer-total": offerDiscountsTotal,
    "invoice-discount": discountAmount,
  };
  offerAmounts.forEach((amount, index) => {
    adjustmentRowAmounts[`offer-${index}`] = amount;
  });

  return {
    subtotal,
    itemDiscountsTotal,
    offerDiscountsTotal,
    // Alias kept for existing consumers (ReviewModal).
    offerDiscountAmount: offerDiscountsTotal,
    discountAmount,
    taxAmount,
    total,
    balanceDue,
    adjustmentRowAmounts,
  };
};