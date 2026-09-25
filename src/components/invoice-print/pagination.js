import { TABLE_DENSITY_TIERS } from "./tableDensity";

/**
 * Page-level wrapper around <BillingSummary> (the `shrink-0 ...` div rendered
 * in BillingTableSection). This wrapper is NOT part of the measure DOM, so its
 * padding is added exactly once by `renderedSummaryHeight()` and nowhere else.
 * Keyed by spacing tier; `normal` is the untouched production styling.
 */
export const SUMMARY_WRAPPER_CLASS = {
  normal: "pt-4 pb-2",
  compact: "pt-2 pb-1",
  tight: "pt-1 pb-0",
};
const SUMMARY_WRAPPER_PT = { normal: 16, compact: 8, tight: 4 };
const SUMMARY_WRAPPER_PB = { normal: 8, compact: 4, tight: 0 };
// A page that carries only the Billing Summary renders `pt-16 pb-2`.
const SUMMARY_WRAPPER_PT_NO_ITEMS = 64;
const SUMMARY_WRAPPER_PB_NO_ITEMS = 8;
// Least aggressive compaction first — only as much as the fit test needs.
export const SUMMARY_SPACING_TIERS = ["normal", "compact", "tight"];

/**
 * Attempt to rebalance the last two pages so that BillingSummary fits on the
 * last page alongside the table. Progressively moves rows from the last page
 * to the previous page, checking after each move whether the summary fits at
 * any spacing tier (tested least-compact first).
 *
 * Returns { fits: true, pages, summaryTier } if successful, or { fits: false }
 * if summary cannot fit even after moving all movable rows.
 */
function rebalanceLastPageForSummary(
  pages,
  rowHeights,
  density,
  densityMeasurements,
  summarySectionHeights,
  contentHeight,
  headerHeight,
  billingInfoHeight,
  notesHeight,
  isFirstPage,
) {
  const { rowHeights: densityRowHeights, tableOverhead } = densityMeasurements[density];

  const lastPageIdx = pages.length - 1;
  const lastPage = pages[lastPageIdx];
  const prevPage = pages[lastPageIdx - 1];

  const firstPageFixed = headerHeight + billingInfoHeight + tableOverhead;
  const interiorPageFixed = headerHeight + tableOverhead + 12;
  const baseContentHeight = contentHeight;

  // Starting indices of items on the last two pages in the original items array
  let lastPageStartIdx = 0;
  for (let i = 0; i < lastPageIdx; i++) {
    lastPageStartIdx += pages[i].items.length;
  }
  const prevPageStartIdx = lastPageStartIdx - prevPage.items.length;

  // Try each summary spacing tier from least to most compact
  for (const tier of SUMMARY_SPACING_TIERS) {
    const summaryHeight = renderedSummaryHeight(summarySectionHeights, tier, { withItems: true });
    const lastPageBudgetWithSummary = baseContentHeight -
      (isFirstPage ? firstPageFixed : interiorPageFixed) - summaryHeight;

    // Working copies for this tier attempt
    let lastPageItems = [...lastPage.items];
    let prevPageItems = [...prevPage.items];
    let lastPageUsed = lastPage.usedHeight;
    let prevPageUsed = prevPage.usedHeight;
    let lastPageStart = lastPageStartIdx;
    let prevPageStart = prevPageStartIdx;

    // Progressively move rows from last page to previous page
    while (lastPageItems.length > 1) { // Keep at least 1 item on last page
      // Check if summary fits NOW with current distribution
      if (lastPageUsed <= lastPageBudgetWithSummary) {
        // SUCCESS: summary fits with current row distribution
        const newPages = pages.map((p, idx) => {
          if (idx === lastPageIdx) {
            return { ...p, items: lastPageItems, usedHeight: lastPageUsed, summarySpacing: tier, showBillingSummary: true };
          }
          if (idx === lastPageIdx - 1) {
            return { ...p, items: prevPageItems, usedHeight: prevPageUsed };
          }
          return p;
        });
        return { fits: true, pages: newPages, summaryTier: tier };
      }

      // Move ONE row from last page to previous page (the FIRST row of last page)
      const movedItem = lastPageItems.shift();
      const movedHeight = densityRowHeights[lastPageStart];
      lastPageUsed -= movedHeight;
      lastPageStart++;

      // Check if previous page would overflow
      const prevPageBudget = baseContentHeight -
        (isFirstPage ? firstPageFixed : interiorPageFixed);
      // Account for summary wrapper on next page (interiorPageBudgetAdjust = 8)
      const adjustedPrevBudget = prevPageBudget - 8;

      if (prevPageUsed + movedHeight > adjustedPrevBudget) {
        // Can't move more without overflowing previous page - undo and stop
        lastPageItems.unshift(movedItem);
        lastPageUsed += movedHeight;
        lastPageStart--;
        break;
      }

      prevPageItems.unshift(movedItem);
      prevPageUsed += movedHeight;
      prevPageStart--;
    }

    // Final check after moving all possible rows for this tier
    if (lastPageUsed <= lastPageBudgetWithSummary && lastPageItems.length > 0) {
      const newPages = pages.map((p, idx) => {
        if (idx === lastPageIdx) {
          return { ...p, items: lastPageItems, usedHeight: lastPageUsed, summarySpacing: tier, showBillingSummary: true };
        }
        if (idx === lastPageIdx - 1) {
          return { ...p, items: prevPageItems, usedHeight: prevPageUsed };
        }
        return p;
      });
      return { fits: true, pages: newPages, summaryTier: tier };
    }
  }

  return { fits: false };
}

/**
 * Rendered summary height including wrapper padding for a given tier.
 */
const renderedSummaryHeight = (summarySectionHeights, tier, { withItems = true } = {}) => {
  const bsHeight = summarySectionHeights.normal;
  const sectionHeight = summarySectionHeights[tier] || bsHeight;
  if (!withItems) {
    return sectionHeight + SUMMARY_WRAPPER_PT_NO_ITEMS + SUMMARY_WRAPPER_PB_NO_ITEMS;
  }
  return sectionHeight + SUMMARY_WRAPPER_PT[tier] + SUMMARY_WRAPPER_PB[tier];
};

/**
 * Paginate a measured invoice.
 *
 * `densityMeasurements` holds ONE real measurement per table density:
 *
 *   { normal:      { rowHeights, tableOverhead },
 *     compact:     { rowHeights, tableOverhead },
 *     veryCompact: { rowHeights, tableOverhead } }
 *
 * The ladder starts at `autoDensity` — the density BillingTable already
 * renders with — and only steps denser. A less dense table is always taller,
 * so it can never make the summary fit; trying it would only risk pushing
 * items onto another page. For each density the summary spacing tiers are
 * tried least-aggressively first. The first combination that fits wins and its
 * density is what BillingTableSection prints, so the measured heights are
 * always the heights that get rendered.
 *
 * Only when NO density + spacing combination fits does the summary move to its
 * own page, and then the status-quo (auto) density is kept so existing
 * multi-page output is unchanged.
 *
 * Returns chunks: `{ items, showBillingSummary, summarySpacing, density }[]`.
 */
export function buildPagesFromMeasurements(
  items,
  contentHeight,
  headerHeight,
  billingInfoHeight,
  densityMeasurements,
  summarySectionHeights,
  notesHeight,
  autoDensity = "normal",
) {
  const bsHeight = summarySectionHeights.normal;

  /**
   * Height the Billing Summary occupies once rendered on a page.
   *
   * INVARIANT — the summary's height is counted EXACTLY ONCE:
   *
   *   `summarySectionHeights[tier]` is the offsetHeight of the
   *   `<section class="totals">` alone. It therefore already INCLUDES that
   *   section's own pt/pb for the tier, and EXCLUDES the page wrapper's
   *   pt/pb (the wrapper does not exist in the measure DOM).
   *
   *   rendered height = wrapper pt + section + wrapper pb
   *
   * This is the only place summary height may be added.
   */

  const getEffectiveBsHeight = (hasItems) =>
    renderedSummaryHeight(summarySectionHeights, "normal", { withItems: hasItems });

  if (items.length === 0) {
    return [{ items: [], showBillingSummary: true, density: autoDensity }];
  }

  // Always test all three densities from least to most compressed.
  // The density ladder no longer starts at autoDensity — we want the
  // least-compressed density that makes the summary fit.
  const densityLadder = TABLE_DENSITY_TIERS.filter(
    (density) => (densityMeasurements[density]?.rowHeights?.length || 0) > 0,
  );

  if (densityLadder.length === 0) {
    return [{ items, showBillingSummary: true, density: autoDensity }];
  }

  const attemptDensity = (density) => {
    const { rowHeights, tableOverhead } = densityMeasurements[density];
    const totalItemHeight = rowHeights.reduce((a, b) => a + b, 0);

    const baseContentHeight = contentHeight;
    const firstPageFixed = headerHeight + billingInfoHeight + tableOverhead;
    const interiorPageFixed = headerHeight + tableOverhead + 12;

    const allOnOne =
      firstPageFixed + totalItemHeight + getEffectiveBsHeight(true) + notesHeight;
    if (allOnOne <= baseContentHeight) {
      return {
        fits: true,
        chunks: [
          {
            items,
            showBillingSummary: true,
            summarySpacing: "normal",
            density,
          },
        ],
      };
    }

    // Slightly reduce budget on non-first pages to account for summary wrapper
    // pt-4 (16px) when summary moves to next page. This reduces empty gap.
    const interiorPageBudgetAdjust = 8;

    const getPageBudget = (isFirstPage, showBillingSummary, hasItemsOnPage) => {
      let budget =
        baseContentHeight - (isFirstPage ? firstPageFixed : interiorPageFixed);
      // On intermediate pages (not first, not showing summary), reduce budget
      // slightly to account for summary wrapper pt-4 on the next page.
      if (!isFirstPage && !showBillingSummary) {
        budget -= interiorPageBudgetAdjust;
      }
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

    const lastPageIdx = pages.length - 1;
    const lastPage = pages[lastPageIdx];
    const isSinglePage = pages.length === 1;
    const lastPageHasItems = lastPage.items.length > 0;
    const lastPageBudgetWithSummary = getPageBudget(
      isSinglePage,
      true,
      lastPageHasItems,
    );
    const lastPageItemsHeight = lastPage.usedHeight;

    // --- Single item page ---------------------------------------------------
    // Every item already sits on page 1. Calculate the real space left after
    // the items and test the Billing Summary tiers least-aggressively first.
    // Whatever fits renders immediately after the table — no extra spacing is
    // ever inserted around the BillingTable. The multi-page path below is
    // never entered from here.
    let singlePageSummaryTier = null;
    if (isSinglePage) {
      const availableOnPage1 =
        baseContentHeight - firstPageFixed - lastPageItemsHeight;

      singlePageSummaryTier =
        SUMMARY_SPACING_TIERS.find(
          (tier) =>
            availableOnPage1 >= renderedSummaryHeight(summarySectionHeights, tier, { withItems: true }),
        ) || null;

      if (singlePageSummaryTier) {
        lastPage.summarySpacing = singlePageSummaryTier;
      }
      // Otherwise even the tight tier genuinely cannot fit: the summary moves
      // to its own page and page 1 keeps its natural layout untouched.
    }

    const toChunk = (page) => ({
      items: page.items,
      showBillingSummary: page.showBillingSummary || false,
      summarySpacing: page.summarySpacing || "normal",
      density,
    });

    // getPageBudget(..., showBillingSummary = true, ...) already reserves the
    // summary height, so it must not be subtracted a second time here.
    const canFitSummaryOnLast = isSinglePage
      ? singlePageSummaryTier !== null
      : lastPageItemsHeight <= lastPageBudgetWithSummary;

    if (canFitSummaryOnLast) {
      lastPage.showBillingSummary = true;
      return { fits: true, chunks: pages.map(toChunk) };
    }

    // Summary doesn't fit on last page → try rebalancing by moving rows
    // from last page to previous page, checking after each move.
    if (pages.length >= 2) {
      const rebalance = rebalanceLastPageForSummary(
        pages,
        rowHeights,
        density,
        densityMeasurements,
        summarySectionHeights,
        contentHeight,
        headerHeight,
        billingInfoHeight,
        notesHeight,
        isSinglePage,
      );
      if (rebalance.fits) {
        return { fits: true, chunks: rebalance.pages.map(toChunk) };
      }
    }

    // Rebalancing failed or only one page → summary goes to its own page
    lastPage.showBillingSummary = false;
    pages.push({ items: [], showBillingSummary: true, usedHeight: 0 });

    return { fits: false, chunks: pages.map(toChunk) };
  };

  // --- Density ladder -----------------------------------------------------
  // First rung is the status-quo density, so when nothing fits the returned
  // chunks are exactly the pagination produced before density escalation
  // existed.
  let fallbackChunks = null;

  for (const density of densityLadder) {
    const attempt = attemptDensity(density);

    if (attempt.fits) return attempt.chunks;
    if (!fallbackChunks) fallbackChunks = attempt.chunks;
  }

  // No density + spacing combination fits → keep the status-quo density and
  // let the Billing Summary take its own page.
  return fallbackChunks;
}

/**
 * Row heights + table overhead for ONE rendered table. `tableOverhead` is
 * everything inside the table wrapper that is not a body row (border, header
 * row, section padding).
 */
function measureTableNode(node) {
  const table =
    node.querySelector("table") || node.querySelector("[role='table']");
  const tbody =
    table?.querySelector("tbody") || table?.querySelector("[role='rowgroup']");
  const rowElements =
    tbody?.querySelectorAll(":scope > tr, :scope > [role='row']") || [];
  const rowHeights = Array.from(rowElements).map((el) => el.offsetHeight);
  const rowSum = rowHeights.reduce((a, b) => a + b, 0);

  return {
    rowHeights,
    tableOverhead: Math.max(0, node.offsetHeight - rowSum),
  };
}

/**
 * Reads the measure DOM. Every table density is measured independently so
 * pagination can compare real heights instead of estimating the delta between
 * two paddings.
 */
export function measureHeights(container) {
  const header = container.querySelector("[data-meas-header]");
  const billingInfo = container.querySelector("[data-meas-billing]");
  const notes = container.querySelector("[data-meas-notes]");

  const headerHeight = header?.offsetHeight || 0;
  const billingInfoHeight = billingInfo?.offsetHeight || 0;
  const notesHeight = notes?.offsetHeight || 0;

  // One measurement per table density: pagination must measure exactly the
  // density it is going to print, so every candidate density is measured here
  // and the chosen one is handed back as `chunk.density`.
  const densityMeasurements = {};
  const tableNodes =
    container.querySelectorAll("[data-meas-items] [data-meas-table]") || [];
  tableNodes.forEach((node) => {
    const density = node.getAttribute("data-density");
    if (!density || densityMeasurements[density]) return;
    densityMeasurements[density] = measureTableNode(node);
  });

  // One <section class="totals"> measurement per spacing tier.
  // Each value is the section ALONE: it already includes that tier's own
  // pt/pb and excludes the page wrapper's pt/pb (the wrapper is not rendered
  // in this measure DOM). See renderedSummaryHeight() for the invariant.
  const bsNodes = container.querySelectorAll("[data-meas-bs]");
  const summarySectionHeights = { normal: 0, compact: 0, tight: 0 };
  bsNodes.forEach((node) => {
    const tier = node.getAttribute("data-spacing") || "normal";
    if (tier in summarySectionHeights) {
      summarySectionHeights[tier] = node.offsetHeight;
    }
  });

  return {
    headerHeight,
    billingInfoHeight,
    densityMeasurements,
    summarySectionHeights,
    notesHeight,
  };
}
