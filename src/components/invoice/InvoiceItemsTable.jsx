import { useState, useCallback } from "react";
import { Package } from "lucide-react";
import InvoiceItemRow from "./InvoiceItemRow";
import ActionButtons from "@/components/invoice/ActionButtons";
import InvoiceSummary from "@/components/invoice/InvoiceSummary";
import NoteEditor from "@/components/invoice/NoteEditor";

import { useInvoiceStore } from "@/store/invoiceStore";
import PaymentEditior from "./PaymentEditior";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency, calculateItemRow } from "@/utils/invoiceUtils";

function MobileItemCard({ index, item, invoice }) {
  const updateItem = useInvoiceStore((s) => s.updateItem);
  const deleteItem = useInvoiceStore((s) => s.deleteItem);
  const errors = useInvoiceStore((s) => s.errors);
  const clearItemError = useInvoiceStore((s) => s.clearItemError);
  const itemErrors = errors.itemErrors?.[index] || {};
  const { netTotal } = calculateItemRow(item, invoice.discountType);

  const handleChange = (field, value) => {
    updateItem(index, field, value);
    if (itemErrors[field]) clearItemError(index, field);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Item {index + 1}
        </span>
        <button
          onClick={() => deleteItem(index)}
          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="space-y-3 p-4">
        <textarea
          rows={2}
          placeholder="Title"
          value={item.product}
          onChange={(e) => handleChange("product", e.target.value)}
          className={`w-full resize-y rounded-lg border bg-slate-50 p-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20
            ${itemErrors.product ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200"}`}
        />
        {itemErrors.product && <p className="text-xs text-red-500">{itemErrors.product}</p>}

        <textarea
          rows={2}
          maxLength={200}
          placeholder="Enter description..."
          value={item.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className="min-h-[60px] w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Quantity</label>
            <Input
              type="number"
              min={1}
              max={9999999}
              placeholder="0"
              value={item.qty}
              onChange={(e) => {
                const value = e.target.value;
                handleChange("qty", value === "" ? 1 : Math.min(9999999, Number(value)));
              }}
              className={`h-9 text-right ${itemErrors.qty ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20" : ""}`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Unit Price ({invoice.currency.code})
            </label>
            <Input
              type="number"
              min={1}
              max={9999999}
              placeholder="0"
              value={item.rate === 0 ? "" : item.rate}
              onChange={(e) => {
                const value = e.target.value;
                handleChange("rate", value === "" ? 0 : Math.min(9999999, Number(value)));
              }}
              className={`h-9 text-right ${itemErrors.rate ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20" : ""}`}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Total Price</label>
          <div className="flex h-9 items-center justify-end rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900">
            {formatCurrency(netTotal)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvoiceItemsTable({ onPrint }) {
  const [dragIndex, setDragIndex] = useState(null);

  const items = useInvoiceStore((state) => state.items);
  const addItem = useInvoiceStore((state) => state.addItem);
  const clearItems = useInvoiceStore((state) => state.clearItems);
  const reorderItems = useInvoiceStore((state) => state.reorderItems);
  const invoice = useInvoiceStore((state) => state.invoice);

  const thClass =
    "border-b border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap";

  const handleDragStart = useCallback((index) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((index) => {
    if (dragIndex === null || dragIndex === index) return;
    reorderItems(dragIndex, index);
    setDragIndex(null);
  }, [dragIndex, items, reorderItems]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  return (
    <div className="space-y-6 px-5 lg:px-8">
      {/* ── Invoice Items Card ── */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50">
              <Package size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Invoice Items</h2>
              <p className="text-xs text-slate-400">Add line items for this invoice</p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>

        {/* Mobile card layout */}
        <div className="space-y-3 p-4 md:hidden">
          {items.map((item, index) => (
            <MobileItemCard
              key={`${index}-${invoice.contractType}`}
              index={index}
              item={item}
              invoice={invoice}
            />
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-10 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400"></th>
                <th className="w-10 px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">#</th>
                <th className="w-45 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Title</th>
                <th className="w-84 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Description</th>
                <th className="w-30 px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Quantity</th>
                <th className="w-30 px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Unit Price ({invoice.currency.code})</th>
                <th className="w-45 px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Price</th>
                <th className="w-12 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => (
                <InvoiceItemRow
                  key={`${index}-${invoice.contractType}`}
                  index={index}
                  item={item}
                  dragIndex={dragIndex}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Card Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3">
          <ActionButtons onAddRow={addItem} onClearAllRows={clearItems} />
        </div>
      </div>

      {/* ── Invoice Details: 3-Column Layout ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Notes & Terms */}
        <div className="flex flex-col">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Notes & Terms</h3>
            <p className="text-xs text-slate-400">Add any notes or payment terms</p>
          </div>
          <div className="flex-1">
            <NoteEditor />
          </div>
        </div>

        {/* Payment */}
        <div className="flex flex-col">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Payment Method</h3>
            <p className="text-xs text-slate-400">Bank details or payment instructions</p>
          </div>
          <div className="flex-1">
            <PaymentEditior />
          </div>
        </div>

        {/* Summary */}
        <div className="flex flex-col">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Invoice Summary</h3>
            <p className="text-xs text-slate-400">Totals and discounts breakdown</p>
          </div>
          <div className="flex-1">
            <InvoiceSummary onPrint={onPrint} />
          </div>
        </div>
      </div>
    </div>
  );
}
