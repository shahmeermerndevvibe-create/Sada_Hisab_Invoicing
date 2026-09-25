import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Logo from "./Logo";
import TopBanner from "./TopBanner";
import BillingInfo from "./BillingInfo";
import BillingTable from "./BillingTable";
import BillingSummary from "./BillingSummary";
import BillingFooter from "./BillingFooter";
import { TABLE_DENSITY_TIERS } from "./tableDensity";
import {
  SUMMARY_WRAPPER_CLASS,
  SUMMARY_SPACING_TIERS,
  buildPagesFromMeasurements,
  measureHeights,
} from "./pagination";

const MM_PX = 96 / 25.4;
const PAGE_H = Math.round(297 * MM_PX);
const FOOTER_H = Math.round(48 * MM_PX);
const SAFE_PX = 4;

/**
 * Off-screen copy of everything pagination needs to measure. It renders one
 * BillingTable PER density tier and one BillingSummary PER spacing tier, so
 * `measureHeights()` returns real heights for every candidate combination and
 * the density the ladder picks is the density that gets printed.
 */
export function MeasureNodes({ invoice, items, allItems, total }) {
  const summaryProps = {
    invoice,
    items: allItems || items,
    total,
    notesPosition: "inline",
  };

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
        {TABLE_DENSITY_TIERS.map((density) => (
          <div key={density} data-meas-table data-density={density}>
            <BillingTable
              items={items}
              invoice={invoice}
              allItems={allItems || items}
              density={density}
            />
          </div>
        ))}
      </div>
      <div data-meas-summary>
        {SUMMARY_SPACING_TIERS.map((tier) => (
          <div key={tier} data-meas-bs data-spacing={tier}>
            <BillingSummary {...summaryProps} spacing={tier} />
          </div>
        ))}
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

      // The density ladder in buildPagesFromMeasurements now always starts from
      // "normal" and tests all three tiers, so we pass "normal" as the baseline.
      const autoDensity = "normal";

      const chunks = buildPagesFromMeasurements(
        items,
        contentHeight,
        m.headerHeight,
        m.billingInfoHeight,
        m.densityMeasurements,
        m.summarySectionHeights,
        m.notesHeight,
        autoDensity,
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
  }, [items, allItems, invoice, onReady]);

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
            summarySpacing={chunk.summarySpacing || "normal"}
            density={chunk.density}
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
          <MeasureNodes
            invoice={invoice}
            items={items}
            allItems={allItems}
            total={total}
          />
        </div>,
        document.body,
      )}
    </>
  );
};

export const BillingTableSection = ({
  invoice,
  items,
  startIndex = 0,
  showBillingSummary,
  summarySpacing = "normal",
  density,
  allItems,
  isFirstPage,
  isLastPage,
  pageNumber,
  totalPages,
  total,
  balanceDue,
}) => {
  const summaryWrapperClass =
    items.length === 0
      ? "pt-16 pb-2"
      : SUMMARY_WRAPPER_CLASS[summarySpacing] || SUMMARY_WRAPPER_CLASS.normal;

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
            isLastPage={isLastPage}
            density={density}
          />
        </div>
      )}

      {showBillingSummary && (
        <div className={`shrink-0 ${summaryWrapperClass}`}>
          <BillingSummary
            invoice={invoice}
            items={allItems || items}
            total={total}
            notesPosition="inline"
            spacing={summarySpacing}
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
