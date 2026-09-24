import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  UserRound,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  CalendarDays,
} from "lucide-react";

import { useInvoiceStore } from "@/store/invoiceStore";
import { syncInvoiceDateNote } from "@/utils/invoiceDateNotes";

export default function CustomerSection() {
  const invoice = useInvoiceStore((state) => state.invoice);
  const errors = useInvoiceStore((state) => state.errors);
  const clearInvoiceSectionError = useInvoiceStore(
    (state) => state.clearInvoiceSectionError,
  );

  const updateInvoice = useInvoiceStore((state) => state.updateInvoice);

  const handleChange = (field, value) => {
    updateInvoice(field, value);
    clearInvoiceSectionError(field);
  };

  const handleInvoiceDateChange = (value) => {
    const current = useInvoiceStore.getState().invoice;

    updateInvoice("invoiceDate", value);
    updateInvoice("notes", syncInvoiceDateNote(current.notes, value));

    clearInvoiceSectionError("invoiceDate");
  };

  return (
    <section className="px-5 py-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:p-7">

        {/* ── Customer Information ── */}
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50">
              <UserRound size={16} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Customer Information</h3>
              <p className="text-xs text-slate-400">Business and contact details</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* Business Name */}
          <div>
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Building2 size={13} className="text-slate-400" />
              Business Name
            </Label>
            <Input
              placeholder="Business Name"
              value={invoice.businessName}
              onChange={(e) => handleChange("businessName", e.target.value)}
              className={`h-9 text-sm ${errors.businessName ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20" : ""}`}
            />
            {errors.businessName && (
              <p className="mt-1 text-xs text-red-500">{errors.businessName}</p>
            )}
          </div>

          {/* Contact Person */}
          <div>
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <UserRound size={13} className="text-slate-400" />
              Contact Person
            </Label>
            <Input
              placeholder="Contact Person Name"
              value={invoice.customer}
              onChange={(e) => handleChange("customer", e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Business Email */}
          <div>
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Mail size={13} className="text-slate-400" />
              Business Email
            </Label>
            <Input
              placeholder="business@example.com"
              value={invoice.businessEmail}
              onChange={(e) => handleChange("businessEmail", e.target.value)}
              className={`h-9 text-sm ${errors.businessEmail ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20" : ""}`}
            />
            {errors.businessEmail && (
              <p className="mt-1 text-xs text-red-500">{errors.businessEmail}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Phone size={13} className="text-slate-400" />
              Phone Number
            </Label>
            <Input
              type="tel"
              placeholder="03123456789"
              value={invoice.phoneNo}
              onChange={(e) => handleChange("phoneNo", e.target.value)}
              className={`h-9 text-sm ${errors.phoneNo ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20" : ""}`}
            />
            {errors.phoneNo && (
              <p className="mt-1 text-xs text-red-500">{errors.phoneNo}</p>
            )}
          </div>

          {/* Business Address — full width */}
          <div className="sm:col-span-2">
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <MapPin size={13} className="text-slate-400" />
              Business Address
            </Label>
            <Textarea
              placeholder="Street, City, Province, Postal Code"
              value={invoice.businessAddress}
              onChange={(e) => handleChange("businessAddress", e.target.value)}
              className={`min-h-20 resize-none text-sm ${errors.businessAddress ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20" : ""}`}
            />
            {errors.businessAddress && (
              <p className="mt-1 text-xs text-red-500">{errors.businessAddress}</p>
            )}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="my-5 border-t border-slate-100" />

        {/* ── Invoice Details ── */}
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50">
              <FileText size={16} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Invoice Details</h3>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* Invoice Date */}
          <div>
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <CalendarDays size={13} className="text-slate-400" />
              Invoice Date
              <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={invoice.invoiceDate}
              required
              onChange={(e) => handleInvoiceDateChange(e.target.value)}
              className={`h-9 text-sm ${errors.invoiceDate ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20" : ""}`}
            />
            {errors.invoiceDate && (
              <p className="mt-1 text-xs text-red-500">{errors.invoiceDate}</p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <CalendarDays size={13} className="text-slate-400" />
              Due Date
            </Label>
            <Input
              type="date"
              value={invoice.dueDate}
              min={invoice.invoiceDate || undefined}
              disabled={!invoice.invoiceDate}
              onChange={(e) => handleChange("dueDate", e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
