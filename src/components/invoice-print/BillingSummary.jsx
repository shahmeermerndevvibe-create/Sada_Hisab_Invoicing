import {
  formatCurrency,
  calculateInvoiceTotals,
  getSequentialAdjustmentRows,
} from "@/utils/invoiceUtils";

const DEFAULT_ADJUSTMENT_LABEL = {
  discount: "Invoice Discount",
  offer: "Offer Discount",
};

export default function BillingSummary({
  invoice,
  items,
  total,
  notesPosition = "inline",
}) {
  const { itemDiscountsTotal, adjustmentRowAmounts } = calculateInvoiceTotals(
    items,
    invoice,
  );
  const adjustmentRows = getSequentialAdjustmentRows(invoice);
  const hasItemDiscounts = itemDiscountsTotal > 0;

  return (
    <section className="totals px-8 pt-4 pb-4 md:px-14">
      <div className="flex items-center">
        {notesPosition === "inline" && (
          <div className="max-w-[320px] flex-1">
            <h3 className="mb-1 text-[12px] font-bold text-[#0A4A95]">Note:</h3>

            <div
              className="
      max-w-[480px]
      text-[10px] leading-[13px] text-black
      [&_p]:text-[10px]
      [&_span]:text-[10px]
      [&_li]:text-[10px]
      [&_div]:text-[10px]
      [&_ul]:list-disc
      [&_ul]:pl-4
      [&_ol]:list-decimal
      [&_ol]:pl-4
      [&_li]:mb-0
    "
              dangerouslySetInnerHTML={{
                __html: invoice.notes || "<p>No notes available.</p>",
              }}
            />
          </div>
        )}

        {/* Total Cost */}
        <div className="ml-auto mt-4 w-full max-w-[320px] shrink-0">
          {hasItemDiscounts && (
            <div className="mb-2 flex w-full items-center justify-between rounded bg-gradient-to-r from-[#0F3476] to-[#087FE3] px-4 py-2.5 text-[11px] text-white">
              <span className="text-[12px] font-bold leading-none">{invoice.itemDiscountLabel || "Item Discounts"}</span>
              <span className="whitespace-nowrap text-[15px] font-bold leading-none">{invoice.currency.symbol} {formatCurrency(itemDiscountsTotal)}</span>
            </div>
          )}
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
                className="mb-2 flex w-full items-center justify-between rounded bg-gradient-to-r from-[#0F3476] to-[#087FE3] px-4 py-2.5 text-[11px] text-white"
              >
                <span className="text-[12px] font-bold leading-none">
                  {label}
                  {row.mode === "percent" && Number(row.value) > 0
                    ? ` (${formatCurrency(Number(row.value))}%)`
                    : ""}
                </span>
                <span className="whitespace-nowrap text-[15px] font-bold leading-none">
                  {invoice.currency.symbol} {formatCurrency(amount)}
                </span>
              </div>
            );
          })}
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
              <span className="mr-1.5 text-[12px] font-extrabold">
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
