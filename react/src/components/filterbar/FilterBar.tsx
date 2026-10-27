/* =====================================================================
   Filter bar — period presets, region, team, reset.
   Per the plan: range-presets (short list of recent quarters / YTD / FY).
   ===================================================================== */

import { fmtDateShort } from "@/core/format/format";

export interface PeriodPreset { label: string; from: string; to: string; }
export interface FilterValue { period: PeriodPreset; region: string; team: string; }

interface Props {
  value: FilterValue;
  presets: PeriodPreset[];
  regions: string[];
  teams: string[];
  onChange: (next: FilterValue) => void;
}

export function FilterBar({ value, presets, regions, teams, onChange }: Props) {
  const setPeriod = (p: PeriodPreset) => onChange({ ...value, period: p });
  const isDefault = presets[0]?.label === value.period.label;

  return (
    <div className="filterbar" role="region" aria-label="Filters">
      <div className="filterbar__field">
        <label htmlFor="period">Period</label>
        <select
          id="period"
          className="btn"
          value={value.period.label}
          onChange={(e) => {
            const next = presets.find((p) => p.label === e.currentTarget.value) ?? presets[0];
            if (next) setPeriod(next);
          }}
        >
          {presets.map((p) => (
            <option key={p.label} value={p.label}>
              {p.label} · {fmtDateShort(p.from)} – {fmtDateShort(p.to)}
            </option>
          ))}
        </select>
      </div>

      <div className="filterbar__field">
        <label htmlFor="region">Region</label>
        <select id="region" className="btn" value={value.region} onChange={(e) => onChange({ ...value, region: e.currentTarget.value })}>
          {regions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="filterbar__field">
        <label htmlFor="team">Team</label>
        <select id="team" className="btn" value={value.team} onChange={(e) => onChange({ ...value, team: e.currentTarget.value })}>
          {teams.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="spacer" />

      <button
        type="button"
        className="btn"
        disabled={isDefault && value.region === "Global" && value.team === "Revenue operations"}
        onClick={() => onChange({ period: presets[0], region: "Global", team: "Revenue operations" })}
      >
        Reset
      </button>
    </div>
  );
}

export function buildPresets(): PeriodPreset[] {
  return [
    { label: "Q3 FY26 (Jul–Sep)", from: "2026-07-01", to: "2026-09-30" },
    { label: "Q2 FY26 (Apr–Jun)", from: "2026-04-01", to: "2026-06-30" },
    { label: "Q1 FY26 (Jan–Mar)", from: "2026-01-01", to: "2026-03-31" },
    { label: "FY26 YTD",          from: "2026-01-01", to: "2026-10-15" },
    { label: "Last 90 days",      from: "2026-07-17", to: "2026-10-15" },
    { label: "Full data",         from: "2024-01-01", to: "2026-10-15" },
  ];
}
