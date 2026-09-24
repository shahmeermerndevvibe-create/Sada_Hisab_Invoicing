import { formatCurrency, calculateItemRow } from "@/utils/invoiceUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ReviewModalHeader from "./ReviewModalHeader";
import ReviewCustomerInfo from "./ReviewCustomerInfo";

export default function ReviewModal({ data, onClose }) {
  const { invoice, items, totals } = data;

  const symbol = invoice.currency?.symbol || "";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-4 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl overflow-hidden"
      >
        <ReviewModalHeader invoice={invoice} onClose={onClose} />

        <div className="flex-1 overflow-y-auto px-6 py-4">
        <ReviewCustomerInfo invoice={invoice} />
          <div className="rounded-lg border mt-5">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-1/2">Description</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, i) => {
                  const { discountAmount, netTotal } = calculateItemRow(item, invoice.discountType);
                  return (
                    <TableRow key={item.id || i} className="hover:bg-transparent">
                      <TableCell className="max-w-md align-top">
                        <p className="font-semibold text-gray-900">
                          {item.product || "—"}
                        </p>
                        {item.description && (
                          <p className="mt-2 text-sm leading-6 text-gray-500 whitespace-pre-wrap break-words overflow-wrap-anywhere">
                            {item.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.qty || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {symbol} {formatCurrency(item.rate)}
                      </TableCell>
                      <TableCell className="text-right">
                        {discountAmount > 0 ? (
                          <span className="text-red-600">
                            -{invoice.discountType === "percent" ? `${item.discount}%` : formatCurrency(item.discount)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {symbol} {formatCurrency(netTotal)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 space-y-2.5 border-t pt-4 text-sm">
                {totals.itemDiscountsTotal > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>{invoice.itemDiscountLabel || "Item Discounts"}</span>
                    <span>-{symbol} {formatCurrency(totals.itemDiscountsTotal)}</span>
                  </div>
                )}
                {totals.offerDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>{invoice.offerDiscountLabel || "Offer Discount"}</span>
                    <span>-{symbol} {formatCurrency(totals.offerDiscountAmount)}</span>
                  </div>
                )}
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>{invoice.invoiceDiscountLabel || "Discount"}</span>
                    <span>-{symbol} {formatCurrency(totals.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-3 text-base font-bold text-gray-900">
                  <span>Total</span>
                  <span>
                    {symbol} {formatCurrency(totals.total)}
                  </span>
                </div>
          </div>

          {invoice.payment && (
            <div className="mt-4 rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Payment Details
              </h3>
              {invoice.payment.startsWith("http://") ||
              invoice.payment.startsWith("https://") ? (
                <a
                  href={invoice.payment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-blue-600 underline hover:text-blue-800"
                >
                  {invoice.payment}
                </a>
              ) : (
                <div
                  className="
                  mt-2 text-sm text-slate-700
                  [&_p]:m-0
                  [&_p]:mb-1
                  [&_p]:break-words
                  [&_strong]:font-semibold
                  [&_a]:text-blue-600
                  [&_a]:underline
                  [&_ul]:list-disc
                  [&_ul]:pl-5
                  [&_ol]:list-decimal
                  [&_ol]:pl-5
                  [&_li]:mb-1
                "
                  dangerouslySetInnerHTML={{ __html: invoice.payment }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
