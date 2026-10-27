/* =====================================================================
   Number / date / currency formatting — en-US everywhere.
   Compact values for KPI cards, full values for tables and tooltips.
   ===================================================================== */

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat("en-US");
const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const fmtMoney = (n: number) => money.format(n);
export const fmtNumber = (n: number) => number.format(n);
export const fmtPct = (n: number) => percent.format(n / 100);
export const fmtSignedPct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
export const fmtCompactMoney = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (a >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
  if (a >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
  return "$" + Math.round(n).toLocaleString("en-US");
};

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
export const fmtDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/* ---------- Chart date axes ---------- */

/**
 * Syncfusion's own date-pattern syntax for a chart's date axis and tooltip.
 *
 * `MMM d, y` is the short month, the day and the year on one line —
 * "Oct 6, 2026". The axis label uses the two-line form `MMM d<br>y`
 * ("Oct 6" over "2026"): the axis has ~48 px per label, and one line long
 * enough to hold the year is cut off by the chart's edge. The tooltip uses
 * the one-line form, so the date reads on a single line there.
 */
export const CHART_DATE_FORMAT = "dd/MM/y";
export const CHART_DATE_AXIS_FORMAT = "dd/MM/y";

/* ---------- Relative dates, anchored to the demo day ---------- */

/** ISO date (YYYY-MM-DD) parsed as UTC midnight so it never slips a day. */
export const parseISODate = (iso: string) => new Date(`${iso}T00:00:00Z`);

/**
 * Whole days between an ISO date and the demo anchor, as a signed integer.
 * Positive is in the future, negative in the past. The whole-day step is what
 * keeps "3d ago" stable: a raw millisecond difference floors to 0 for any
 * elapsed time under 24 hours, which would read as "today" for something
 * edited this morning.
 */
export const daysFrom = (iso: string, asOf: string): number =>
    Math.round((parseISODate(iso).getTime() - parseISODate(asOf).getTime()) / 86400000);

/**
 * Short relative form of an ISO date against the demo anchor: "today",
 * "3d ago", "in 12d", "5mo ago". Past and future carry the word, so the
 * direction survives without colour.
 */
export const fmtRelative = (iso: string, asOf: string): string => {
  const days = daysFrom(iso, asOf);
  if (days === 0) return "today";
  if (days === -1) return "yesterday";
  if (days === 1) return "tomorrow";
  const mag = Math.abs(days);
  const unit = mag >= 60 ? `${Math.round(mag / 30)}mo` : `${mag}d`;
  return days < 0 ? `${unit} ago` : `in ${unit}`;
};

/** Compact count for a KPI strip: 1,187 stays full, 12,500 reads "12.5K". */
export const fmtCompactCount = (n: number) => {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e4) return `${(n / 1e3).toFixed(1)}K`;
  return fmtNumber(n);
};
