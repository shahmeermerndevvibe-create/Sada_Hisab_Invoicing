export function getDateRange(preset, customFrom, customTo) {
  const now = new Date();
  const start = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const end = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  switch (preset) {
    case "today":
      return { dateFrom: start(now), dateTo: end(now) };
    case "last7": {
      const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { dateFrom: start(from), dateTo: null };
    }
    case "last30": {
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { dateFrom: start(from), dateTo: null };
    }
    case "custom": {
      if (!customFrom && !customTo) return { dateFrom: null, dateTo: null };
      return {
        dateFrom: customFrom ? new Date(`${customFrom}T00:00:00`) : null,
        dateTo: customTo ? new Date(`${customTo}T23:59:59.999`) : null,
      };
    }
    default:
      return { dateFrom: null, dateTo: null };
  }
}

export function formatInvoiceDate(value) {
  if (!value) return "-";
  const d = value?.toDate ? value.toDate() : new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
