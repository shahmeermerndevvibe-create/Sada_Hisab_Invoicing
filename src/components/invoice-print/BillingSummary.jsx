import {
  formatCurrency,
  calculateInvoiceTotals,
  getSequentialAdjustmentRows,
} from "@/utils/invoiceUtils";

const DEFAULT_ADJUSTMENT_LABEL = {
  discount: "Invoice Discount",
  offer: "Offer Discount",
};

const SUMMARY_SECTION_SPACING = {
  normal: "pt-4 pb-4",
  compact: "pt-2 pb-2",
  tight: "pt-1 pb-1",
};

export default function BillingSummary({
  invoice,
  items,
  total,
  notesPosition = "inline",
  spacing = "normal",
}) {
  const { subtotal, itemDiscountsTotal, adjustmentRowAmounts } =
    calculateInvoiceTotals(items, invoice);

  const adjustmentRows = getSequentialAdjustmentRows(invoice);
  const hasItemDiscounts = itemDiscountsTotal > 0;

  return (
    <section
      className={`totals px-8 ${
        SUMMARY_SECTION_SPACING[spacing] ?? SUMMARY_SECTION_SPACING.normal
      } md:px-14`}
    >
      <div className="flex items-center">
        {/* Notes */}
        {notesPosition === "inline" && (
          <div className="max-w-[320px] flex-1">
            <h3 className="mb-1 text-[12px] font-bold leading-[14px] text-[#0A4A95]">
              Note:
            </h3>

            <div
              className="
    max-w-[480px]
    text-[13px] font-normal leading-[15px] text-black

    [&_*]:!text-[11px]
    [&_*]:!leading-[15px]

    [&_p]:!m-0
    [&_p]:!mb-[1px]

    [&_div]:!m-0
    [&_div]:!mb-[1px]

    [&_span]:!m-0

    [&_strong]:!font-bold
    [&_b]:!font-bold
    [&_em]:!italic
    [&_i]:!italic

    [&_h1]:!m-0
    [&_h1]:!mb-[2px]

    [&_h2]:!m-0
    [&_h2]:!mb-[2px]

    [&_h3]:!m-0
    [&_h3]:!mb-[2px]

    [&_h4]:!m-0
    [&_h4]:!mb-[2px]

    [&_h5]:!m-0
    [&_h5]:!mb-[2px]

    [&_h6]:!m-0
    [&_h6]:!mb-[2px]

    [&_ul]:!m-0
    [&_ul]:!mb-[2px]
    [&_ul]:!pl-5
    [&_ul]:!list-disc

    [&_ol]:!m-0
    [&_ol]:!mb-[2px]
    [&_ol]:!pl-5
    [&_ol]:!list-decimal

    [&_li]:!m-0
    [&_li]:!mb-[1px]
  "
              dangerouslySetInnerHTML={{
                __html: invoice.notes || "<p>No notes available.</p>",
              }}
            />
          </div>
        )}

        {/* Total Cost */}
        <div className="ml-auto mt-4 w-full max-w-[320px] shrink-0">
          {/* Subtotal */}
          <div className="mb-2 flex w-full items-center justify-between rounded px-4 py-2 text-black">
            <span className="text-[14px] font-bold leading-none">
              Subtotal:
            </span>

            <span className="whitespace-nowrap text-[16px] font-bold leading-none">
              <span className="font-extrabold">{invoice.currency.symbol}</span>{" "}
              {formatCurrency(subtotal)}
            </span>
          </div>

          {/* Item Discounts */}
          {hasItemDiscounts && (
            <div className="mb-2 flex w-full items-center justify-between rounded px-4 py-2 text-black">
              <span className="text-[12px] leading-none">
                {invoice.itemDiscountLabel || "Item Discounts"}
              </span>

              <span className="whitespace-nowrap text-[16px] leading-none">
                <span>{invoice.currency.symbol}</span>{" "}
                {formatCurrency(itemDiscountsTotal)}
              </span>
            </div>
          )}

          {/* Adjustment Rows */}
          {adjustmentRows.map((row, idx) => {
            const amount = adjustmentRowAmounts[row.id] ?? 0;

            if (amount <= 0) return null;

            const label =
              row.label ||
              DEFAULT_ADJUSTMENT_LABEL[row.type] ||
              row.type ||
              "Discount";

            return (
              <div
                key={row.id ?? `${row.type}-${idx}`}
                className="mb-2 flex w-full items-center justify-between rounded px-4 py-2 text-black"
              >
                <span className="text-[12px] leading-none">
                  {label}
                  {row.mode === "percent" && Number(row.value) > 0
                    ? ` (${formatCurrency(Number(row.value))}%)`
                    : ""}
                  :
                </span>

                <span className="whitespace-nowrap text-[16px] leading-none">
                  <span>{invoice.currency.symbol}</span>{" "}
                  {formatCurrency(amount)}
                </span>
              </div>
            );
          })}

          {/* Total Cost */}
          <div
            className="ml-auto flex h-[52px] w-[90%] items-center bg-gradient-to-r from-[#087FE3] to-[#0F3476] text-white"
            style={{
              clipPath: "polygon(0 0, 100% 0, 100% 52%, 90.5% 100%, 0 100%)",
            }}
          >
            <div className="pl-4 text-[18px] font-bold leading-none">
              Total Cost:
            </div>

            <div className="ml-auto flex items-center pr-5">
              <span className="mr-1.5 text-[18px] font-extrabold">
                {invoice.currency.symbol}
              </span>

              <span className="whitespace-nowrap text-[20px] font-bold leading-none">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
