import { useMemo } from "react";

import { useInvoiceStore } from "@/store/invoiceStore";

import { calculateInvoiceTotals } from "@/utils/invoiceUtils";

export const useInvoiceTotals = () => {
    const invoice = useInvoiceStore(
        (state)=>state.invoice
    );

    const items = useInvoiceStore(
        (state)=>state.items
    );

    return useMemo(
        ()=>calculateInvoiceTotals(items,invoice),
        [items,invoice]
    );
};