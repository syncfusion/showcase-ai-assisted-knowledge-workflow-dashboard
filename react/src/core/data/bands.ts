/* =====================================================================
   Status bands — every threshold in the app lives here.

   DESIGN.md §3: bands come from this app's own targets, and the same band
   renders identically in the KPI card icon, the grid status badge and the
   chart's `pointColorMapping`. A threshold re-tuned in one place moves all
   three, so the page cannot show a KPI and a chart disagreeing about the
   same measure (checklist K5).

   A band is never colour alone: `bandCue` returns the label and the glyph
   that sit beside the tone (DESIGN.md §3, "Second cue beside colour").
   ===================================================================== */

import type { Tone } from "./contracts";

export type Band = "good" | "watch" | "bad" | "none";

export interface BandSpec {
  /** Good at or above this value (lower-is-better measures invert it). */
  good: number;
  /** Watch at or above this value; below `good` is bad. */
  watch: number;
  /** Whether a larger number is better. */
  higherIsBetter: boolean;
  /** Short label for the band, used as the second cue beside the tone. */
  label: Record<Exclude<Band, "none">, string>;
  /** Where the threshold came from — shown in the app's evidence, not the UI. */
  source: string;
}

/**
 * Knowledge-corpus bands. Thresholds are the knowledge lead's review policy:
 * an article is safe to send to a customer above 0.85, and anything under
 * 0.70 with open gaps is a candidate for rewrite rather than review.
 */
export const CONFIDENCE_BAND: BandSpec = {
  good: 0.85,
  watch: 0.7,
  higherIsBetter: true,
  label: { good: "High", watch: "Medium", bad: "Low" },
  source: "Knowledge lead review policy",
};

/** Open knowledge gaps per article. Zero is clean; three or more blocks review. */
export const GAPS_BAND: BandSpec = {
  good: 0,
  watch: 2,
  higherIsBetter: false,
  label: { good: "None", watch: "Some", bad: "Many" },
  source: "Knowledge lead review policy",
};

/** Articles sitting in the review queue. Zero is clean; three or more is a backlog. */
export const REVIEW_QUEUE_BAND: BandSpec = {
  good: 0,
  watch: 2,
  higherIsBetter: false,
  label: { good: "Clear", watch: "Building", bad: "Backlog" },
  source: "Knowledge lead OKR",
};

/** Average corpus confidence. Same scale as CONFIDENCE_BAND. */
export const AVG_CONFIDENCE_BAND: BandSpec = {
  good: 0.85,
  watch: 0.7,
  higherIsBetter: true,
  label: { good: "High", watch: "Medium", bad: "Low" },
  source: "Knowledge lead review policy",
};

/** Days since an article was last edited. Fresh under 30 days. */
export const FRESHNESS_BAND: BandSpec = {
  good: 30,
  watch: 90,
  higherIsBetter: false,
  label: { good: "Fresh", watch: "Ageing", bad: "Stale" },
  source: "Knowledge lead OKR",
};

/** Classify a raw value against a band spec. */
export function bandOf(spec: BandSpec, value: number): Band {
  if (spec.higherIsBetter) {
    if (value >= spec.good) return "good";
    if (value >= spec.watch) return "watch";
    return "bad";
  }
  if (value <= spec.good) return "good";
  if (value <= spec.watch) return "watch";
  return "bad";
}

/** Band to the app's status tone. `none` is for values that judge nothing. */
export const bandTone: Record<Band, Tone> = {
  good: "success",
  watch: "warning",
  bad: "danger",
  none: "neutral",
};

/**
 * The non-colour second cue: a glyph plus the band's label. Returned
 * together so a caller cannot render the tone without the cue beside it.
 */
export const bandCue = (spec: BandSpec, value: number): { glyph: string; label: string; tone: Tone } => {
  const band = bandOf(spec, value);
  const glyph = band === "good" ? "●" : band === "watch" ? "◆" : band === "bad" ? "▲" : "—";
  return {
    glyph,
    label: band === "none" ? "Unrated" : spec.label[band],
    tone: bandTone[band],
  };
};

/**
 * Map an article status to its tone. Modelled on `workflowStatusTone()` in
 * WorkflowsPage: the grid's `pill-tone` template resolves a tone from the
 * cell value through this, so a status never falls through to `info`
 * because its raw text is not a tone name.
 */
export function articleStatusTone(status: string): Tone {
  switch (status) {
    case "Published":    return "success";
    case "Needs review": return "warning";
    case "Draft":        return "info";
    case "Archived":     return "neutral";
    default:             return "neutral";
  }
}

/** The shape that carries a status tone in a pill, so status is never colour alone. */
export const articleStatusGlyph: Record<string, string> = {
  Published: "●",
  "Needs review": "◆",
  Draft: "▲",
  Archived: "—",
};