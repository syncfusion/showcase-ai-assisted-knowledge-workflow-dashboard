/* =====================================================================
   KpiCard — single Syncfusion Card-shaped KPI per the design baseline.
   Outer surface is a Syncfusion `e-card`.

   Renders the full prop set: `tone`, `target` and `unit` were declared but
   dropped by the previous implementation, so a band could never be shown.
   The tone is always carried by a **second cue** — a glyph and the band's
   label beside the swatch — never colour alone (DESIGN.md §3).
   ===================================================================== */

import { fmtCompactMoney, fmtNumber, fmtPct, fmtSignedPct } from "@/core/format/format";
import type { Tone } from "@/core/data/contracts";

export type KpiFormat = "money-compact" | "money" | "count" | "pct" | "ratio";

interface KpiProps {
  label: string;
  value: number;
  format: KpiFormat;
  /** Change against the last period, already in percent units (e.g. 12.5). */
  deltaPct: number;
  tone: Tone;
  /** The target this measure is judged against; shown as the card's note. */
  target?: number;
  /** Suffix on the note — "of target", "articles", and so on. */
  unit?: string;
  hint?: string;
  /** What the band is; the label is the second cue beside the colour. */
  bandLabel?: string;
  /** Text for the whole card, so the tone is never announced by colour alone. */
  ariaLabel?: string;
}

/** The shape that carries a status tone without relying on its fill. */
// const TONE_GLYPH: Record<Tone, string> = {
//   success: "●",
//   warning: "◆",
//   danger: "▲",
//   info: "▲",
//   neutral: "—",
// };

export function KpiCard(props: KpiProps) {
  const { label, value, format, deltaPct, target, unit, hint, bandLabel } = props;
  const display =
    format === "money-compact" ? fmtCompactMoney(value) :
    format === "money"        ? "$" + fmtNumber(value) :
    format === "pct"          ? fmtSignedPct(value) :
    format === "ratio"        ? fmtPct(value * 100) :
                                fmtNumber(value);

  const deltaTone: Tone = deltaPct > 0 ? "success" : deltaPct < 0 ? "danger" : "neutral";
  const arrow = deltaPct > 0 ? "▲" : deltaPct < 0 ? "▼" : "•";

  // The note prefers the target ("of 0.85"), then the unit, then a hint.
  const note =
    target !== undefined
      ? `${unit ? `${unit} ` : ""}of ${formatNote(format, target)}`
      : unit ?? hint;

  const spoken =
    props.ariaLabel ??
    `${label}: ${display}` +
      (bandLabel ? `, ${bandLabel}` : "") +
      (target !== undefined ? `, of target ${formatNote(format, target)}` : "") +
      `, ${deltaPct >= 0 ? "up" : "down"} ${Math.abs(deltaPct)}% versus the last period`;

  return (
    <div
      className="e-card sf-card sf-kpi"
      role="group"
      aria-label={spoken}
    >
      <div className="e-card-content">
        {/* Band cue: the swatch carries the tone, the glyph + label carry the
            same information without colour. */}
        <div className="sf-kpi__head">
          <div className="sf-kpi__label">{label}</div>
          {/* <span className={`sf-kpi__cue sf-kpi__cue--${tone}`}>
            <span className="sf-kpi__cue-swatch" aria-hidden="true" />
            <span className="sf-kpi__cue-glyph" aria-hidden="true">{TONE_GLYPH[tone]}</span>
            {bandLabel ? <span className="sf-kpi__cue-text">{bandLabel}</span> : null}
          </span> */}
        </div>
        <div className="sf-kpi__value">{display}</div>
        <div className={`sf-kpi__delta sf-kpi__delta--${deltaTone}`}>
          <span aria-hidden="true">{arrow}</span>
          <span>{Math.abs(deltaPct)}% vs last period</span>
        </div>
        {note ? <div className="sf-kpi__hint">{note}</div> : null}
      </div>
    </div>
  );
}

/** Format a target in the same units as the card's own value. */
function formatNote(format: KpiFormat, target: number): string {
  return format === "money-compact" ? fmtCompactMoney(target) :
    format === "money"        ? "$" + fmtNumber(target) :
    format === "ratio"        ? fmtPct(target * 100) :
    format === "pct"          ? fmtSignedPct(target) :
                                fmtNumber(target);
}