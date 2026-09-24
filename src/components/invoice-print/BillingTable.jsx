import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, calculateItemRow } from "@/utils/invoiceUtils";
import BillingTableTitle from "./BillingTableTitle";

const BillingTable = ({ items = [], invoice = {}, startIndex = 0, allItems }) => {
  const minRows = 1;
  const emptyRows = Math.max(0, minRows - items.length);

  const itemsForSizing = allItems?.length ? allItems : items;
  const showDiscount = itemsForSizing.some((item) => Number(item.discount) > 0);

  const totalRenderedRows = itemsForSizing.length;
  const compact = totalRenderedRows >= 5;
  const veryCompact = totalRenderedRows >= 8;

  const cellPad = veryCompact ? "py-1" : compact ? "py-1.5" : "py-2.5";

  const titleText = veryCompact
    ? "text-[12px]"
    : compact
      ? "text-[13px]"
      : "text-[14.5px]";

  const titleLeading = veryCompact
    ? "leading-4"
    : compact
      ? "leading-4"
      : "leading-5";

  const descText = veryCompact
    ? "text-[10px]"
    : compact
      ? "text-[11px]"
      : "text-base";

  const descLeading = veryCompact
    ? "leading-4"
    : compact
      ? "leading-4"
      : "leading-5";

  const cellText = veryCompact
  ? "text-[11px]"
  : compact
    ? "text-[12px]"
    : "text-[13px]";

  const emptyH = veryCompact ? "h-6" : compact ? "h-10" : "h-20";

  return (
    <section className="px-8 md:px-14">
      <div className="border border-slate-200">
        <Table className="w-full table-fixed">
          <colgroup>
            <col className="w-[40%]" />
            <col className="w-[13%]" />
            <col className="w-[13%]" />
            {showDiscount && <col className="w-[13%]" />}
            <col className="w-[15%]" />
          </colgroup>

          <TableHeader className="[&_tr]:border-b-0">
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead className="bg-gradient-to-r from-blue-950 to-blue-500 py-2 text-left text-[12px] font-semibold text-white">
                Description
              </TableHead>

              <TableHead className="bg-[#0A4A95] py-2 text-center text-[12px] font-semibold text-white">
                Unit Price
              </TableHead>

              <TableHead className="bg-[#1E90FF] py-2 text-center text-[12px] font-semibold text-white">
                Quantity
              </TableHead>

              {showDiscount && (
                <TableHead className="bg-[#0A4A95] py-2 text-center text-[12px] font-semibold text-white">
                  Discount
                </TableHead>
              )}

              <TableHead
                className={`${showDiscount ? "bg-[#1E90FF]" : "bg-[#0A4A95]"} py-2 text-center text-[12px] font-semibold text-white`}
              >
                Total Price
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.map((item, index) => {
              const { discountAmount, netTotal } = calculateItemRow(
                item,
                invoice.discountType,
              );

              return (
                <TableRow key={item.id || index} className="hover:bg-transparent">
                  <TableCell className={`min-w-0 ${cellPad} align-top`}>
                    <p
                      className={`${titleText} font-bold ${titleLeading} whitespace-normal break-words [overflow-wrap:anywhere]`}
                    >
                      <BillingTableTitle text={item.product} />
                    </p>

                    {item.description && (
                      <p
                        className={`mt-0.5 ${descText} ${descLeading} text-black whitespace-pre-wrap break-words [overflow-wrap:anywhere]`}
                      >
                        {item.description}
                      </p>
                    )}
                  </TableCell>

                  <TableCell
                    className={`bg-slate-50 ${cellPad} text-center ${cellText} align-middle whitespace-nowrap`}
                  >
                    {formatCurrency(item.rate)}
                  </TableCell>

                  <TableCell
                    className={`bg-white ${cellPad} text-center ${cellText} align-middle`}
                  >
                    <span className="font-semibold whitespace-normal">
                      {item.qty}
                    </span>
                  </TableCell>

                  {showDiscount && (
                    <TableCell
                      className={`bg-slate-50 ${cellPad} text-center ${cellText} align-middle whitespace-nowrap`}
                    >
                      {discountAmount > 0
                        ? `-${formatCurrency(discountAmount)}`
                        : "-"}
                    </TableCell>
                  )}

                  <TableCell
                    className={`${showDiscount ? "bg-white" : "bg-slate-50"} ${cellPad} text-center ${cellText} font-semibold text-black align-middle whitespace-nowrap`}
                  >
                    {formatCurrency(netTotal)}
                  </TableCell>
                </TableRow>
              );
            })}

            {Array.from({ length: emptyRows }).map((_, index) => (
              <TableRow key={`empty-${index}`} className="hover:bg-transparent">
                <TableCell className={emptyH}></TableCell>
                <TableCell className="bg-slate-50"></TableCell>
                <TableCell className="bg-slate-50"></TableCell>
                {showDiscount && (
                  <TableCell className="bg-slate-50"></TableCell>
                )}
                <TableCell
                  className={`${showDiscount ? "bg-white" : "bg-slate-50"}`}
                ></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};

export default BillingTable;
