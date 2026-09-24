import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Logo from "./Logo";
import TopBanner from "./TopBanner";
import BillingInfo from "./BillingInfo";
import BillingTable from "./BillingTable";
import BillingSummary from "./BillingSummary";
import BillingFooter from "./BillingFooter";

const MM_PX = 96 / 25.4;
const PAGE_H = Math.round(297 * MM_PX);
const FOOTER_H = Math.round(48 * MM_PX);
const SAFE_PX = 4;
const SUMMARY_WRAPPER_PT = 16;
const SUMMARY_WRAPPER_PB = 8;

function buildPagesFromMeasurements(
  items,
  contentHeight,
  headerHeight,
  billingInfoHeight,
  rowHeights,
  tableOverhead,
  bsHeight,
  notesHeight,
) {
  const getEffectiveBsHeight = (hasItems) =>
    bsHeight + (hasItems ? SUMMARY_WRAPPER_PT : 64) + SUMMARY_WRAPPER_PB;

  if (items.length === 0) {
    return [{ items: [], showBillingSummary: true }];
  }

  const totalItemHeight = rowHeights.reduce((a, b) => a + b, 0);

  const baseContentHeight = contentHeight;
  const firstPageFixed = headerHeight + billingInfoHeight + tableOverhead;
  const interiorPageFixed = headerHeight + tableOverhead + 12;

  const allOnOne = firstPageFixed + totalItemHeight + getEffectiveBsHeight(true) + notesHeight;
  if (allOnOne <= baseContentHeight) {
    return [{ items, showBillingSummary: true }];
  }

  const getPageBudget = (isFirstPage, showBillingSummary, hasItemsOnPage) => {
    let budget = baseContentHeight - (isFirstPage ? firstPageFixed : interiorPageFixed);
    if (showBillingSummary) budget -= getEffectiveBsHeight(hasItemsOnPage);
    return budget;
  };

  const pages = [];
  let start = 0;

  while (start < items.length) {
    const isFirstPage = pages.length === 0;
    const pageBudget = getPageBudget(isFirstPage, false, true);

    const page = [];
    let used = 0;

    while (start < items.length) {
      const h = rowHeights[start];

      if (used + h > pageBudget && page.length > 0) {
        break;
      }

      page.push(items[start]);
      used += h;
      start++;
    }

    if (page.length === 0) {
      page.push(items[start]);
      used += rowHeights[start];
      start++;
    }

    pages.push({ items: page, usedHeight: used });
  }

  const lastPage = pages[pages.length - 1];
  const isSinglePage = pages.length === 1;
  const lastPageHasItems = lastPage.items.length > 0;
  const lastPageBudgetWithSummary = getPageBudget(isSinglePage, true, lastPageHasItems);
  const lastPageItemsHeight = lastPage.usedHeight;

  const canFitSummaryOnLast = lastPageItemsHeight + getEffectiveBsHeight(lastPageHasItems) <= lastPageBudgetWithSummary;

  if (canFitSummaryOnLast) {
    lastPage.showBillingSummary = true;
  } else {
    pages.push({ items: [], showBillingSummary: true, usedHeight: 0 });
  }

  const chunks = pages.map((p) => ({
    items: p.items,
    showBillingSummary: p.showBillingSummary || false,
  }));

  console.log("[Pagination Chunks]", {
    baseContentHeight,
    firstPageFixed,
    interiorPageFixed,
    totalItemHeight,
    bsHeight,
    effectiveBsHeightWithItems: getEffectiveBsHeight(true),
    effectiveBsHeightWithoutItems: getEffectiveBsHeight(false),
    numChunks: chunks.length,
    chunks: chunks.map((c, i) => ({
      page: i + 1,
      itemCount: c.items.length,
      showBS: c.showBillingSummary,
    })),
  });

  return chunks;
}

function measureHeights(container) {
  const header = container.querySelector("[data-meas-header]");
  const billingInfo = container.querySelector("[data-meas-billing]");
  const itemsSection = container.querySelector("[data-meas-items]");
  const notes = container.querySelector("[data-meas-notes]");

  const headerHeight = header?.offsetHeight || 0;
  const billingInfoHeight = billingInfo?.offsetHeight || 0;
  const totalItemsHeight = itemsSection?.offsetHeight || 0;
  const table =
    itemsSection?.querySelector("table") ||
    itemsSection?.querySelector("[role='table']");
  const tbody =
    table?.querySelector("tbody") || table?.querySelector("[role='rowgroup']");
  const rowElements =
    tbody?.querySelectorAll(":scope > tr, :scope > [role='row']") || [];
  const rowHeights = Array.from(rowElements).map((el) => el.offsetHeight);
  const rowSum = rowHeights.reduce((a, b) => a + b, 0);
  const tableOverheadH = totalItemsHeight - rowSum;
  const notesHeight = notes?.offsetHeight || 0;

  const bsNode = container.querySelector("[data-meas-bs]");
  const bsHeight = bsNode?.offsetHeight || 0;

  return {
    headerHeight,
    billingInfoHeight,
    rowHeights,
    tableOverheadH: Math.max(0, tableOverheadH),
    bsHeight,
    notesHeight,
  };
}

function renderMeasureNodes(invoice, items, allItems, total) {
  return (
    <>
      <div data-meas-header>
        <div className="print-header relative shrink-0">
          <div className="relative flex items-start justify-between border-b border-slate-900 px-12 pt-6 pb-2">
            <Logo invoice={invoice} />
            <TopBanner invoice={invoice} />
          </div>
          <div className="border-b border-slate-900" />
        </div>
      </div>
      <div data-meas-billing>
        <BillingInfo invoice={invoice} />
      </div>
      <div data-meas-items>
        <BillingTable items={items} invoice={invoice} />
      </div>
      <div data-meas-summary>
        <div data-meas-bs>
          <BillingSummary
            invoice={invoice}
            items={allItems || items}
            total={total}
            notesPosition="inline"
          />
        </div>
      </div>
    </>
  );
}

const MEAS_STYLE = {
  position: "fixed",
  left: "-9999px",
  top: 0,
  width: Math.round(210 * MM_PX) + "px",
  pointerEvents: "none",
  opacity: 0.01,
};

const InvoicePrint = ({
  invoice,
  items,
  allItems,
  total,
  balanceDue,
  onReady,
}) => {
  const [pageChunks, setPageChunks] = useState(null);
  const measRef = useRef(null);
  const fontsLoaded = useRef(false);

  useLayoutEffect(() => {
    if (!measRef.current) return;

    let cancelled = false;
    let imagesLoading = 0;
    let fontsReady = false;
    fontsLoaded.current = false;

    const measure = () => {
      if (cancelled || !measRef.current) return;
      if (!(fontsLoaded.current && imagesLoading <= 0)) return;
      const root = measRef.current;
      const m = measureHeights(root);
      const contentHeight = PAGE_H - FOOTER_H - SAFE_PX;

      const totalItemHeight = m.rowHeights.reduce((a, b) => a + b, 0);
      const firstBudget = contentHeight - m.headerHeight - m.billingInfoHeight - m.tableOverheadH;
      console.log("[Pagination]", {
        PAGE_H, FOOTER_H, SAFE_PX, contentHeight,
        headerHeight: m.headerHeight,
        billingInfoHeight: m.billingInfoHeight,
        tableOverheadH: m.tableOverheadH,
        rowHeights: m.rowHeights,
        totalItemHeight,
        bsHeight: m.bsHeight,
        notesHeight: m.notesHeight,
        firstBudget,
        itemsCount: items.length,
      });

      const chunks = buildPagesFromMeasurements(
        items,
        contentHeight,
        m.headerHeight,
        m.billingInfoHeight,
        m.rowHeights,
        m.tableOverheadH,
        m.bsHeight,
        m.notesHeight,
      );
      setPageChunks(chunks);
    };

    const onAssetReady = () => {
      imagesLoading -= 1;
      if (imagesLoading <= 0 && fontsReady) measure();
    };

    // Track image loading
    measRef.current.querySelectorAll("img").forEach((img) => {
      if (img.complete) return;
      imagesLoading += 1;
      img.addEventListener("load", onAssetReady, { once: true });
      img.addEventListener("error", onAssetReady, { once: true });
    });

    // Track font loading
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        fontsReady = true;
        fontsLoaded.current = true;
        if (!cancelled && imagesLoading <= 0) measure();
      });
    } else {
      fontsReady = true;
      fontsLoaded.current = true;
    }

    // Observe for any subsequent layout changes (font swap, dynamic content, etc.)
    const observer = new ResizeObserver(() => {
      if (!cancelled) measure();
    });
    observer.observe(measRef.current);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [items, invoice, onReady]);

  // Signal readiness only after the paginated DOM has been committed by React.
  // `useLayoutEffect` runs after DOM mutation, so `onReady` can never fire while
  // the print node still shows the single-chunk fallback.
  useLayoutEffect(() => {
    if (pageChunks !== null) onReady?.();
  }, [pageChunks, onReady]);

  const pages = pageChunks || [{ items, showBillingSummary: true }];

  let running = 0;
  const pageStarts = pages.map((p) => {
    const start = running;
    running += p.items.length;
    return start;
  });

  return (
    <>
      {pages.map((chunk, index) => (
        <div
          key={index}
          style={index > 0 ? { pageBreakBefore: "always" } : undefined}
        >
          <BillingTableSection
            invoice={invoice}
            items={chunk.items}
            startIndex={pageStarts[index]}
            showBillingSummary={chunk.showBillingSummary}
            allItems={allItems || items}
            isFirstPage={index === 0}
            isLastPage={index === pages.length - 1}
            pageNumber={index + 1}
            totalPages={pages.length}
            total={total}
            balanceDue={balanceDue}
          />
        </div>
      ))}
      {createPortal(
        <div ref={measRef} style={MEAS_STYLE}>
          {renderMeasureNodes(invoice, items, allItems, total)}
        </div>,
        document.body,
      )}
    </>
  );
};

const BillingTableSection = ({
  invoice,
  items,
  startIndex = 0,
  showBillingSummary,
  allItems,
  isFirstPage,
  isLastPage,
  pageNumber,
  totalPages,
  total,
  balanceDue,
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
        paddingBottom: "48mm",
      }}
    >
      <header className="print-header relative shrink-0">
        <div className="relative flex items-start justify-between border-b border-slate-900 px-12 pt-6 pb-2">
          <Logo invoice={invoice} />
          <TopBanner invoice={invoice} />
        </div>
        <div className="border-b border-slate-900" />
      </header>

      {isFirstPage && (
        <div className="shrink-0">
          <BillingInfo invoice={invoice} />
        </div>
      )}

      {items.length > 0 && (
        <div className={"shrink-0" + (isFirstPage ? "" : " pt-3")}>
          <BillingTable
            items={items}
            invoice={invoice}
            startIndex={startIndex}
            allItems={allItems}
          />
        </div>
      )}

      {showBillingSummary && (
        <div
          className={`shrink-0 ${items.length === 0 ? "pt-16" : "pt-4"} pb-2`}
        >
          <BillingSummary
            invoice={invoice}
            items={allItems || items}
            total={total}
            notesPosition="inline"
          />
        </div>
      )}

      {totalPages > 1 && (
        <div className="absolute bottom-1 left-5 z-30">
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

export default InvoicePrint;
