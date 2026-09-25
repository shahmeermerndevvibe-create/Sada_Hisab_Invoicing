/**
 * Table density tiers + the rule BillingTable uses when no density is passed.
 *
 * Shared by BillingTable (rendering) and the measure DOM (measurement) so
 * both agree on what "normal / compact / veryCompact" means.
 *
 * NOTE: Print pagination (InvoicePrint / buildPagesFromMeasurements) NO LONGER
 * uses this count-based rule. It now tests all three densities from actual
 * measured row heights and picks the least-compressed one where the summary fits.
 * This function is kept ONLY as a fallback for BillingTable when no explicit
 * density prop is provided (e.g., in InvoicePrintPage.jsx or other previews).
 */

/** Table density tiers, least dense first. */
export const TABLE_DENSITY_TIERS = ["normal", "compact", "veryCompact"];

/**
 * Count-based density fallback for NON-PRINT usage only.
 * Used by BillingTable when no explicit density prop is provided.
 * Print pagination uses measured heights and ignores this.
 */
export function resolveTableDensity(totalRows) {
  if (totalRows >= 8) return "veryCompact";
  if (totalRows >= 5) return "compact";
  return "normal";
}
