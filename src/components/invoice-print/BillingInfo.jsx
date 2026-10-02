import { useLayoutEffect, useRef } from "react";
import { formatFirestoreDate } from "@/utils/dateUtils";
import ColorAlternatingText from "./ColorAlternatingText";

/**
 * Adjustable "knobs" used to balance the left column against the
 * right payment column.
 */
const TUNING_KNOBS = [
  { attr: "data-sec-gap", prop: "marginTop", weight: 3, maxAdd: 20 },
  { attr: "data-mb-gap", prop: "marginBottom", weight: 1, maxAdd: 6 },
  { attr: "data-lh", prop: "lineHeight", weight: 1, maxAdd: 6 },
];

/** Stop once within this many px of the reference height. */
const TOLERANCE = 3;

/** Max each knob may grow per iteration. */
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
      if (appliedRef.current) {
        appliedRef.current.forEach(({ el, prop }) => {
          el.style[prop] = "";
        });

        appliedRef.current = null;
      }

      return;
    }

    // Find all adjustable elements in the left column.
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

    const touched = new Map();

    const mark = (el, prop) => {
      if (!touched.has(el)) {
        touched.set(el, new Set());
      }

      touched.get(el).add(prop);
    };

    const reset = () => {
      for (const [el, props] of touched) {
        props.forEach((prop) => {
          el.style[prop] = "";
        });
      }

      touched.clear();
    };

    // Reset previous adjustments before measuring natural height.
    reset();

    // Read the natural values from the computed styles.
    for (const knob of knobs) {
      knob.base = parseFloat(getComputedStyle(knob.el)[knob.prop]) || 0;
    }

    const currentAdd = new Map(knobs.map((knob) => [knob, 0]));

    const rightHeight = right.getBoundingClientRect().height;

    let iterations = 0;

    for (;;) {
      const leftHeight = left.getBoundingClientRect().height;
      const delta = rightHeight - leftHeight;

      // Already close enough.
      if (Math.abs(delta) <= TOLERANCE) break;

      // Safety limit.
      if (iterations >= MAX_ITERS) break;

      iterations += 1;

      // Only use knobs that still have available budget.
      const eligible = knobs.filter(
        (knob) => currentAdd.get(knob) < knob.maxAdd - 0.5,
      );

      if (eligible.length === 0) break;

      const totalWeight = eligible.reduce(
        (sum, knob) => sum + knob.weight,
        0,
      );

      let budget = Math.min(MAX_STEP, delta);

      for (const knob of eligible) {
        if (budget <= 0) break;

        const room = knob.maxAdd - currentAdd.get(knob);

        const share = Math.min(
          (knob.weight / totalWeight) * MAX_STEP,
          room,
          budget,
        );

        knob.el.style[knob.prop] = `${
          knob.base + currentAdd.get(knob) + share
        }px`;

        mark(knob.el, knob.prop);

        currentAdd.set(
          knob,
          currentAdd.get(knob) + share,
        );

        budget -= share;
      }
    }

    // Remember styles that were modified.
    appliedRef.current = [...touched.entries()].flatMap(
      ([el, props]) =>
        [...props].map((prop) => ({
          el,
          prop,
        })),
    );

    // Cleanup.
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
    <section className="px-8 py-3 md:px-14">
      {/* Date */}
      <h3 className="text-[13px] font-bold uppercase tracking-widest text-slate-800">
        Date:
        <span className="ml-2 text-[13px] font-bold normal-case">
          {formatFirestoreDate(invoice.invoiceDate)}
        </span>
      </h3>

      <div className="mt-3 flex items-start justify-between gap-8">
        {/* Left — Billing Information */}
        <div ref={leftRef} className="flex min-w-0 flex-1 flex-col">
          <div>
            <h4 className="text-base font-bold uppercase tracking-[1px] text-black">
              Invoice To:
            </h4>

            {/* Business Name */}
            <h2
              data-mb-gap
              data-lh
              className="mb-1 mt-1 text-xl font-bold leading-7 text-slate-900"
            >
              {invoice.businessName && (
                <ColorAlternatingText text={invoice.businessName} />
              )}
            </h2>

            {/* Contact Person */}
            {invoice.customer && (
              <div>
                <h2
                  data-mb-gap
                  data-lh
                  className="mb-0 mt-2 text-sm leading-5 text-slate-900"
                >
                  <span className="font-bold">Contact Person:</span>{" "}
                  {invoice.customer}
                </h2>
              </div>
            )}

            {/* Phone */}
            {invoice.phoneNo && (
              <p
                data-mb-gap
                data-lh
                className="mb-0 text-sm leading-5 text-black"
              >
                <span className="font-bold">
                  Business Phone No:
                </span>{" "}
                {invoice.phoneNo}
              </p>
            )}

            {/* Email */}
            {invoice.businessEmail && (
              <p
                data-mb-gap
                data-lh
                className="mb-0 text-sm leading-5 text-black"
              >
                <span className="font-bold">
                  Business Email:
                </span>{" "}
                {invoice.businessEmail}
              </p>
            )}

            {/* Address */}
            {invoice.businessAddress && (
              <p
                data-mb-gap
                data-lh
                className="mb-0 text-sm leading-5 text-black"
              >
                <span className="font-bold">
                  Business Address:
                </span>{" "}
                {invoice.businessAddress}
              </p>
            )}
          </div>
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