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

  const inputClass = (error) =>
    `h-10 rounded-lg border-slate-200 bg-slate-50/70 text-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus-visible:bg-white focus-visible:ring-2 ${
      error
        ? "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-500/15"
        : "focus-visible:border-blue-400 focus-visible:ring-blue-500/15"
    }`;

  return (
    <section className="px-5 py-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-7">
        {/* Customer Information */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 shadow-sm shadow-blue-100">
            <UserRound size={19} className="text-blue-600" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Customer Information
            </h3>
            <p className="text-xs text-slate-400">
              Business and contact details
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Business Name */}
          <div>
            <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Building2 size={14} className="text-blue-500" />
              Business Name
            </Label>

            <Input
              placeholder="Business Name"
              value={invoice.businessName}
              onChange={(e) =>
                handleChange("businessName", e.target.value)
              }
              className={inputClass(errors.businessName)}
            />

            {errors.businessName && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.businessName}
              </p>
            )}
          </div>

          {/* Contact Person */}
          <div>
            <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <UserRound size={14} className="text-violet-500" />
              Contact Person
            </Label>

            <Input
              placeholder="Contact Person Name"
              value={invoice.customer}
              onChange={(e) =>
                handleChange("customer", e.target.value)
              }
              className={inputClass(false)}
            />
          </div>

          {/* Business Email */}
          <div>
            <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Mail size={14} className="text-fuchsia-500" />
              Business Email
            </Label>

            <Input
              type="email"
              placeholder="business@example.com"
              value={invoice.businessEmail}
              onChange={(e) =>
                handleChange("businessEmail", e.target.value)
              }
              className={inputClass(errors.businessEmail)}
            />

            {errors.businessEmail && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.businessEmail}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Phone size={14} className="text-emerald-500" />
              Business Phone Number
            </Label>

            <Input
              type="tel"
              placeholder="03123456789"
              value={invoice.phoneNo}
              onChange={(e) =>
                handleChange("phoneNo", e.target.value)
              }
              className={inputClass(errors.phoneNo)}
            />

            {errors.phoneNo && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.phoneNo}
              </p>
            )}
          </div>

          {/* Business Address */}
          <div className="sm:col-span-2">
            <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <MapPin size={14} className="text-amber-500" />
              Business Address
            </Label>

            <Textarea
              placeholder="Street, City, Province, Postal Code"
              value={invoice.businessAddress}
              onChange={(e) =>
                handleChange("businessAddress", e.target.value)
              }
              className={`min-h-20 resize-none rounded-lg border-slate-200 bg-slate-50/70 text-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus-visible:bg-white focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-500/15 ${
                errors.businessAddress
                  ? "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-500/15"
                  : ""
              }`}
            />

            {errors.businessAddress && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.businessAddress}
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="my-7 border-t border-slate-100" />

        {/* Invoice Details */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-100 shadow-sm shadow-indigo-100">
            <FileText size={19} className="text-indigo-600" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Invoice Details
            </h3>
            <p className="text-xs text-slate-400">
              Dates and payment information
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Invoice Date */}
          <div>
            <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <CalendarDays size={14} className="text-indigo-500" />
              Invoice Date
              <span className="text-red-500">*</span>
            </Label>

            <Input
              type="date"
              value={invoice.invoiceDate}
              required
              onChange={(e) =>
                handleInvoiceDateChange(e.target.value)
              }
              className={inputClass(errors.invoiceDate)}
            />

            {errors.invoiceDate && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.invoiceDate}
              </p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <CalendarDays size={14} className="text-orange-500" />
              Due Date
            </Label>

            <Input
              type="date"
              value={invoice.dueDate}
              min={invoice.invoiceDate || undefined}
              disabled={!invoice.invoiceDate}
              onChange={(e) =>
                handleChange("dueDate", e.target.value)
              }
              className={inputClass(false)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}