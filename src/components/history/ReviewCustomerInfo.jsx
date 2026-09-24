import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock3,
  Globe,
  Building2,
  Landmark,
} from "lucide-react";

import { formatInvoiceDate } from "@/utils/historyUtils";

export default function ReviewCustomerInfo({ invoice }) {
  const DetailRow = ({ icon: Icon, label, value }) => {
    if (!value) return null;

    return (
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-md bg-slate-100 p-2">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>

          <p className="break-words text-sm font-medium text-slate-900">
            {value}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="shrink-0 px-6 pt-2">
      <div className="grid gap-5 md:grid-cols-2">
        {/* Customer Card */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Customer Information
          </h3>

          <div className="space-y-4">
            <DetailRow
              icon={User}
              label="Customer"
              value={invoice.businessName}
            />

            <DetailRow
              icon={Mail}
              label="Email"
              value={invoice.businessEmail}
            />

            <DetailRow
              icon={Phone}
              label="Phone"
              value={invoice.phoneNo}
            />

            <DetailRow
              icon={MapPin}
              label="Billing Address"
              value={invoice.businessAddress}
            />
          </div>
        </div>

        {/* Invoice Card */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Invoice Details
          </h3>

          <div className="space-y-4">
            <DetailRow
              icon={Calendar}
              label="Invoice Date"
              value={
                invoice.invoiceDate
                  ? formatInvoiceDate(invoice.invoiceDate)
                  : null
              }
            />

            <DetailRow
              icon={Clock3}
              label="Due Date"
              value={
                invoice.dueDate
                  ? formatInvoiceDate(invoice.dueDate)
                  : null
              }
            />

            <DetailRow
              icon={Globe}
              label="Currency"
              value={
                invoice.currency
                  ? `${invoice.currency.code} (${invoice.currency.symbol})`
                  : null
              }
            />

            <DetailRow
              icon={Landmark}
              label="Country"
              value={invoice.country}
            />

            <DetailRow
              icon={Building2}
              label="Business Number"
              value={invoice.businessNumber}
            />
          </div>
        </div>
      </div>
    </div>
  );
}