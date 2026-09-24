import { Search } from "lucide-react";

const DATE_OPTIONS = [
  { label: "All Time", value: "" },
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "last7" },
  { label: "Last 30 Days", value: "last30" },
  { label: "Custom", value: "custom" },
];

const TYPE_OPTIONS = [
  { label: "All", value: "" },
  { label: "Invoices", value: "Invoice" },
  { label: "Quotations", value: "Quotation" },
];

const DRAFT_OPTIONS = [
  { label: "All", value: "" },
  { label: "Saved Drafts", value: "saved" },
  { label: "Copy Drafts", value: "copy" },
];

export default function InvoiceHistoryFilters({
  search,
  preset,
  customFrom,
  customTo,
  documentType,
  draftFilter,
  onSearchChange,
  onPresetChange,
  onCustomDateChange,
  onTypeChange,
  onDraftFilterChange,
}) {
  return (
    <div className="flex flex-col gap-2 border-b px-3 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by number, customer, or email..."
          value={search}
          onChange={onSearchChange}
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
        <select
          value={documentType}
          onChange={onTypeChange}
          className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs text-gray-700 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:px-3 sm:text-sm"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={draftFilter}
          onChange={onDraftFilterChange}
          className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs text-gray-700 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:px-3 sm:text-sm"
        >
          {DRAFT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={preset}
          onChange={onPresetChange}
          className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs text-gray-700 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:px-3 sm:text-sm"
        >
          {DATE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {preset === "custom" && (
          <div className="flex w-full items-center gap-1 sm:w-auto sm:gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => onCustomDateChange("from", e.target.value)}
              className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-xs sm:flex-none"
            />
            <span className="text-xs text-gray-500">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => onCustomDateChange("to", e.target.value)}
              className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-xs sm:flex-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}