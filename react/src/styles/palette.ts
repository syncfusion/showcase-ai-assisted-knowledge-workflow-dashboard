/* =====================================================================
   Palette — the colour values Syncfusion Charts and Maps draw in SVG.

   Charts draw SVG, so they take colour values rather than CSS variables.
   The category colours mirror the token file (`--sf-chart-series-1` … `-8`),
   read from the document at runtime so the component carries no hex literal
   (design-system.md, "Colour semantics": colour values live in one palette
   module, never as hex literals in components).

   The label inks are the only colours here that are not in the token file:
   they are the ink a slice's own label is drawn in, and which ink reads
   depends on the slice it lands on.
   ===================================================================== */

/** The eight category colours, in slot order. */
export const CHART_SERIES_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/**
 * The inks a chart label may be drawn in, as [light, dark].
 *
 * A label inside a slice has to clear 4.5:1 against that slice's fill
 * (WCAG 1.4.6). White and black are the two inks that can: for the eight
 * category slots, white or black always clears 4.5:1 against the other, and
 * a near-black does not (white on the teal slot reads 3.7:1, near-black on
 * the indigo slot 4.5:1).
 */
export const CHART_LABEL_INKS = {
  /** Drawn on a dark or saturated slice. */
  onDark: "#ffffff",
  /** Drawn on a light or pale slice. */
  onLight: "#000000",
} as const;

export type ChartLabelInk = (typeof CHART_LABEL_INKS)[keyof typeof CHART_LABEL_INKS];

/**
 * The ink that reads on a slice: the one with the higher contrast against the
 * slice's own colour.
 *
 * The chart's own choice is based on perceived brightness, which puts white
 * on the teal slot at 3.7:1, so the ink is chosen here instead.
 */
export function readableInkOn(fill: string): ChartLabelInk {
  const hex = fill.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return CHART_LABEL_INKS.onDark;
  const channels = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  const contrastWith = (ink: number) =>
    (Math.max(luminance, ink) + 0.05) / (Math.min(luminance, ink) + 0.05);
  return contrastWith(1) >= contrastWith(0)
    ? CHART_LABEL_INKS.onDark
    : CHART_LABEL_INKS.onLight;
}
