import { useLayoutEffect, useRef } from "react";
import { formatFirestoreDate } from "@/utils/dateUtils";
import ColorAlternatingText from "./ColorAlternatingText";

/**
 * Adjustable "knobs" used to balance the left column against the right
 * reference column, identified by data attributes on the left-side elements.
 *
 *  - data-sec-gap → section spacing  (Business heading top margin)
 *  - data-mb-gap  → paragraph/heading bottom margins
 *  - data-lh      → line-height (text lines and headings)
 *
 * Each knob starts at its natural computed base and can grow up to
 * base + maxAdd px. Higher weight = absorbs more of the delta.
 */
const TUNING_KNOBS = [
  { attr: "data-sec-gap", prop: "marginTop", weight: 3, maxAdd: 20 },
  { attr: "data-mb-gap", prop: "marginBottom", weight: 1, maxAdd: 6 },
  { attr: "data-lh", prop: "lineHeight", weight: 1, maxAdd: 6 },
];

/** Stop once within this many px of the reference height. */
const TOLERANCE = 3;
/** Max each knob may grow per iteration (keeps the adjustment gradual). */
const MAX_STEP = 2;
/** Hard ceiling so the loop can never run away. */
const MAX_ITERS = 24;

export default function BillingInfo({ invoice = {} }) {
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const appliedRef = useRef(null);

  const hasPayment = Boolean(invoice.payment);

  useLayoutEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;

    if (!left || !right) {
      // Clean up any previously applied inline styles
      if (appliedRef.current) {
        appliedRef.current.forEach(({ el, prop }) => {
          el.style[prop] = "";
        });
        appliedRef.current = null;
      }
      return;
    }

    // --- Step 1: Discover adjustable knobs in the left column ---
    const knobs = [];
    for (const cfg of TUNING_KNOBS) {
      left.querySelectorAll(`[${cfg.attr}]`).forEach((el) => {
        knobs.push({
          el,
          prop: cfg.prop,
          weight: cfg.weight,
          maxAdd: cfg.maxAdd,
        });
      });
    }

    if (knobs.length === 0) return;

    const touched = new Map(); // el -> Set of applied props
    const mark = (el, prop) => {
      if (!touched.has(el)) touched.set(el, new Set());
      touched.get(el).add(prop);
    };
    const reset = () => {
      for (const [el, props] of touched) {
        props.forEach((p) => {
          el.style[p] = "";
        });
      }
      touched.clear();
    };

    // Clear any previous adjustments so we measure natural heights
    reset();

    // Read each knob's natural base from the computed style (its Tailwind class)
    for (const k of knobs) {
      k.base = parseFloat(getComputedStyle(k.el)[k.prop]) || 0;
    }

    const currentAdd = new Map(knobs.map((k) => [k, 0]));

    // --- Step 2: Iteratively nudge knobs until the left column matches the
    // right reference column, re-measuring after every adjustment ---
    const rightHeight = right.getBoundingClientRect().height;
    let iterations = 0;

    for (;;) {
      const leftHeight = left.getBoundingClientRect().height;
      const delta = rightHeight - leftHeight;

      // Close enough (or left already matches/exceeds right)
      if (Math.abs(delta) <= TOLERANCE) break;
      if (iterations >= MAX_ITERS) break;
      iterations += 1;

      // Only knobs that still have budget can grow this round
      const eligible = knobs.filter((k) => currentAdd.get(k) < k.maxAdd - 0.5);
      if (eligible.length === 0) break;

      const totalWeight = eligible.reduce((sum, k) => sum + k.weight, 0);

      // This iteration's budget — a small gradual step toward the goal
      let budget = Math.min(MAX_STEP, delta);

      for (const k of eligible) {
        if (budget <= 0) break;
        const room = k.maxAdd - currentAdd.get(k);
        const share = Math.min(
          (k.weight / totalWeight) * MAX_STEP,
          room,
          budget,
        );

        k.el.style[k.prop] = `${k.base + currentAdd.get(k) + share}px`;
        mark(k.el, k.prop);
        currentAdd.set(k, currentAdd.get(k) + share);
        budget -= share;
      }
    }

    // Record everything we touched so styles can be reset on cleanup
    appliedRef.current = [...touched.entries()].flatMap(([el, props]) =>
      [...props].map((prop) => ({ el, prop })),
    );

    // Cleanup function
    return () => {
      if (appliedRef.current) {
        appliedRef.current.forEach(({ el, prop }) => {
          el.style[prop] = "";
        });
        appliedRef.current = null;
      }
    };
  }, [hasPayment, invoice]);

  return (
    <section className="px-8 py-2 md:px-14">
      {/* Date sits above both columns */}
      <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-800">
        Date:
        <span className="ml-2 text-[12px] font-bold normal-case">
          {formatFirestoreDate(invoice.invoiceDate)}
        </span>
      </h3>

      <div className="mt-2 flex items-start justify-between gap-8">
        <div ref={leftRef} className="flex min-w-0 flex-1 flex-col">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[1px] text-black">
              Invoice To:
            </h4>

            <h2
              data-mb-gap
              data-lh
              className="mb-0.5 mt-1 text-lg font-bold leading-6 text-slate-900"
            >
              {invoice.businessName && (
                <ColorAlternatingText text={invoice.businessName} />
              )}
            </h2>

            {invoice.phoneNo && (
              <p data-mb-gap data-lh className="mb-0 text-xs text-black">
                <span className="font-bold">Phone No:</span> {invoice.phoneNo}
              </p>
            )}

            {invoice.businessAddress && (
              <p data-mb-gap data-lh className="mb-0 text-xs text-black">
                <span className="font-bold">Address:</span>{" "}
                {invoice.businessAddress}
              </p>
            )}

            {invoice.businessEmail && (
              <p data-mb-gap data-lh className="mb-0 text-xs text-black">
                <span className="font-bold">Email:</span> {invoice.businessEmail}
              </p>
            )}
          </div>

          {invoice.customer && (
            <div>
              <h2
                data-mb-gap
                data-lh
                className="mb-0 mt-2 text-xs leading-4 text-slate-900"
              >
                <span className="font-bold">Contact Person:</span>{" "}
                {invoice.customer}
              </h2>
            </div>
          )}
        </div>

        {/* Right — Payment Information (DO NOT MODIFY) */}
        {invoice.payment && (
          <div ref={rightRef} className="shrink-0 text-right">
            <div className="max-w-[380px]">
              <h4 className="mb-.5 text-sm font-bold uppercase tracking-widest text-black">
                Payment Method
              </h4>
              {invoice.payment.startsWith("http://") ||
              invoice.payment.startsWith("https://") ? (
                <a
                  href={invoice.payment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 underline hover:text-blue-800"
                >
                  {invoice.payment}
                </a>
              ) : (
                <div
                  className="
    text-sm
    text-black
    // leading-6

    [&_p]:m-0
    [&_p]:mb-0
    [&_p]:break-words

    [&_strong]:font-semibold
    [&_a]:text-blue-600
    [&_a]:underline

    [&_ul]:list-disc
    [&_ul]:pl-5
    [&_ol]:list-decimal
    [&_ol]:pl-5
    [&_li]:mb-1
    [&_*]:!font-[inherit]
  "
                  dangerouslySetInnerHTML={{
                    __html: invoice.payment,
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
