import Logo from "./Logo";
import TopBanner from "./TopBanner";
import BillingInfo from "./BillingInfo";
import BillingTable from "./BillingTable";
import BillingSummary from "./BillingSummary";
import BillingFooter from "./BillingFooter";

const InvoicePrintPage = ({
  invoice,
  items,
  allItems,
  isFirstPage,
  isLastPage,
  pageNumber,
  totalPages,
  total,
}) => {
  return (
    <div
      className="invoice-page bg-white flex flex-col"
      style={{
        width: "210mm",
        height: "297mm",
        margin: "0 auto",
        background: "white",
        overflow: "hidden",
        position: "relative",
        paddingBottom: "55mm",
      }}
    >
      <header className="print-header relative shrink-0">
        <div className="relative flex items-start justify-between border-b border-slate-900 px-12 pt-8 pb-8">
          <Logo invoice={invoice} />
          <TopBanner invoice={invoice} />
        </div>
        <div className="border-b border-slate-900" />
      </header>

      {isFirstPage && <div className="shrink-0"><BillingInfo invoice={invoice} /></div>}

      <div className={"shrink-0" + (isFirstPage ? "" : " pt-8")}>
        <BillingTable items={items} invoice={invoice} />
      </div>

      {isLastPage && (
        <div className="shrink-0">
          <BillingSummary
            invoice={invoice}
            items={allItems || items}
            total={total}
            notesPosition="inline"
          />
        </div>
      )}

      {totalPages > 1 && (
        <div className="absolute -bottom-7 left-9 pb-16 z-30">
          <span className="text-xs text-black font-semibold">
            Page {pageNumber} of {totalPages}
          </span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 w-full">
        <BillingFooter isLastPage={isLastPage} invoice={invoice} />
      </div>
    </div>
  );
};

export default InvoicePrintPage;
