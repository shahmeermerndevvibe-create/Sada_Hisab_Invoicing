import { GripVertical, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useInvoiceStore } from "@/store/invoiceStore";
import { formatCurrency, calculateItemRow } from "@/utils/invoiceUtils";

export default function InvoiceItemRow({ index, item, dragIndex, onDragStart, onDragOver, onDrop, onDragEnd }) {
  const updateItem = useInvoiceStore((state) => state.updateItem);
  const deleteItem = useInvoiceStore((state) => state.deleteItem);
  const errors = useInvoiceStore((state) => state.errors);
  const clearItemError = useInvoiceStore((state) => state.clearItemError);
  const invoice = useInvoiceStore((state) => state.invoice);

  const itemErrors = errors.itemErrors?.[index] || {};
  const { netTotal } = calculateItemRow(item, invoice.discountType);

  const handleChange = (field, value) => {
    updateItem(index, field, value);
    if (itemErrors[field]) {
      clearItemError(index, field);
    }
  };

  const tdClass = "p-3 align-top";

  return (
    <tr
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(index)}
      onDragEnd={onDragEnd}
      className={`hover:bg-gray-50 ${dragIndex === index ? "opacity-50" : ""}`}
    >
      {/* Drag */}
      <td className={`${tdClass} w-10 text-center`}>
        <GripVertical
          size={16}
          className="mx-auto cursor-grab active:cursor-grabbing text-slate-400"
        />
      </td>

      {/* Sr No */}
      <td className={`${tdClass} w-10 text-right font-medium`}>{index + 1}</td>

      {/* Title */}
      <td className={tdClass}>
        <textarea
          rows={3}
          placeholder="Title"
          value={item.product}
          onChange={(e) => handleChange("product", e.target.value)}
          className={`w-full resize-y rounded-md border bg-white p-2 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
            ${itemErrors.product ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200"}`}
        />
        {itemErrors.product && (
          <p className="mt-1 text-xs text-red-500">{itemErrors.product}</p>
        )}
      </td>

      {/* Description */}
      <td className={tdClass}>
        <div className="space-y-1">
          <textarea
            rows={3}
            maxLength={200}
            placeholder="Enter description..."
            value={item.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="min-h-[90px] w-full resize-y rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <div className="flex justify-end">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
                item.description.length >= 190
                  ? "bg-red-100 text-red-700"
                  : item.description.length >= 160
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {200 - item.description.length} characters left
            </span>
          </div>
        </div>
      </td>

      {/* Quantity */}
      <td className={`${tdClass} min-w-[100px]`}>
        <Input
          type="number"
          min={1}
          max={9999999}
          step={1}
          placeholder="1"
          value={item.qty}
          onChange={(e) => {
            const value = e.target.value;
            handleChange("qty", value === "" ? 1 : Math.min(9999999, Number(value)));
          }}
          className={`h-9 rounded-md border bg-white text-right shadow-sm transition-colors
            focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20
            ${itemErrors.qty ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20" : "border-slate-200 hover:border-slate-300"}`}
        />
        {itemErrors.qty && (
          <p className="mt-1 text-xs text-red-500">{itemErrors.qty}</p>
        )}
      </td>

      {/* Unit Price */}
      <td className={`${tdClass} min-w-[140px]`}>
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
          className={`h-9 rounded-md border bg-white text-right shadow-sm transition-colors
            focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20
            ${itemErrors.rate ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20" : "border-slate-200 hover:border-slate-300"}`}
        />
        {itemErrors.rate && (
          <p className="mt-1 text-xs text-red-500">{itemErrors.rate}</p>
        )}
      </td>

      {/* Total Price */}
      <td className={`${tdClass} min-w-[170px]`}>
        <div className="flex h-9 items-center justify-end rounded-md border border-slate-200 bg-slate-50 px-3 font-semibold text-slate-900 shadow-sm">
          {formatCurrency(netTotal)}
        </div>
      </td>

      {/* Delete */}
      <td className={`${tdClass} w-12 text-center`}>
        <Trash2
          size={18}
          className="mx-auto cursor-pointer text-red-500 transition hover:text-red-600"
          onClick={() => deleteItem(index)}
        />
      </td>
    </tr>
  );
}
