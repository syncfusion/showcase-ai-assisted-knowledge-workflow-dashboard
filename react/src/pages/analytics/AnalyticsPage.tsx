/* =====================================================================
   Analytics page — chart trio, insights tiles, drilldown DataGrid,
   compact Chat UI, Guided actions.
   All cards are Syncfusion `e-card`; KPI tiles mount the shared
   `KpiCard` primitive so they get Card + ProgressBar; the AI surface
   is the Syncfusion ChatUIComponent via `InteractiveChat`.
   ===================================================================== */

import { lazy, Suspense } from "react";
import { PageHeader } from "@/components/primitives/Pills";
import { SfCard } from "@/components/primitives/SfCard";
import { InteractiveChat } from "@/components/ai/InteractiveChat";
import { GuidedActions, type GuidedItem } from "@/components/ai/GuidedActions";
import { analyticsFixture } from "@/core/data/dataService";

const SfLineChart = lazy(() => import("@/components/charts/SfChart").then((m) => ({ default: m.SfLineChart })));
const SfDonut     = lazy(() => import("@/components/charts/SfChart").then((m) => ({ default: m.SfDonut })));
const SfBarChart  = lazy(() => import("@/components/charts/SfChart").then((m) => ({ default: m.SfBarChart })));
const SfGrid      = lazy(() => import("@/components/grid/SfGrid").then((m) => ({ default: m.SfGrid })));

const GUIDED: GuidedItem[] = [
  { id: "a-1", title: "Lock Q3 forecast",            sub: "Freeze EMEA + APAC assumptions for the board" },
  { id: "a-2", title: "Open ticket-sweep playbook", sub: "11 tickets in next-24h SLA risk band" },
];

const INSIGHTS = [
  { tag: "Insight",   title: "EMEA 4.6% below plan",      body: "Pricing pilot delayed 11 days; 2 renewals slipped to Q4." },
  { tag: "Insight",   title: "APAC accelerating",         body: "+14.2% vs plan; sole over-driver this quarter." },
  { tag: "Insight",   title: "LATAM contracting",        body: "-3.6% delta; ARRE-1042 risk concentrated here." },
  { tag: "Workflow",  title: "Forecast freeze pending",  body: "1 owner queued; 2-day SLA before close." },
  { tag: "Authoring", title: "Pricing pilot runbook",    body: "0.62 confidence; needs 2 reviewers before Friday." },
];

// Trend (24 months, synthetic) — actuals through 2026-06, plan always.
const trend = (() => {
  const start = new Date(2024, 0, 1);
  return Array.from({ length: 24 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const seasonal = 1 + 0.06 * Math.sin((i / 12) * 2 * Math.PI);
    const t = 1 + i * 0.012;
    const base = 1350 * seasonal * t;
    return {
      x: label,
      y: Math.round(base * (1 + 0.07 * Math.sin(i * 0.9)) * (i > 9 ? 1.05 : 1.02)),
      yPlan: Math.round(base * (1 + 0.04 * Math.sin(i * 0.7))),
    };
  });
})();

/**
 * The region share of ARR.
 *
 * The chart draws its slices in data order, so the regions are sorted largest
 * first (syncfusion-component-patterns.md, "Charts: pie and donut slices run
 * largest first"). The value is the ARR share in percent; the chart computes
 * the same share itself for its labels and tooltips.
 *
 * The slice is named by the region's short code, as the prototype's donut does:
 * a legend on a narrow chart has no room for "Middle East & Africa", and a
 * long name that wraps drops the space at the break. The full name goes in the
 * tooltip, and the drilldown grid below carries it too.
 */
const regionShare = (() => {
  const total = analyticsFixture.regions.reduce((sum, r) => sum + r.arr, 0);
  return analyticsFixture.regions
    .map((r) => ({ x: r.id, y: +((r.arr / total) * 100).toFixed(1) }))
    .sort((a, b) => b.y - a.y);
})();

/** The full region name for each slice, for the tooltip. */
const regionFullNames = Object.fromEntries(
  analyticsFixture.regions.map((r) => [r.id, r.name]),
);

const dealSizeBySegment = [
  { x: "Enterprise",   y: 184 },
  { x: "Mid-market",   y: 96 },
  { x: "SMB",          y: 32 },
  { x: "Self-serve",   y: 12 },
];

export function AnalyticsPage() {
  const drilldown = analyticsFixture.regions.map((r) => ({
    region: r.name,
    arr: r.arr,
    plan: r.plan,
    deltaPct: r.deltaPct,
    tone: r.tone,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader title="Analytics insights" subtitle="Conversational analytics over Q3 data" />
      <SfCard title="Revenue vs Plan · 24 months" subtitle="USD millions" ariaLabel="Revenue vs Plan">
        <Suspense fallback={<div className="skeleton" style={{ height: 240 }} />}>
          <SfLineChart
            data={trend.map((p) => ({ x: p.x, y: Math.round(p.y / 1000) }))}
            secondary={trend.map((p) => ({ x: p.x, y: Math.round(p.yPlan / 1000) }))}
            height={260}
          />
        </Suspense>
      </SfCard>
      <InteractiveChat
        title="Ask"
        scope="Global · Q3 FY26"
        height={420}
        suggestions={[
          "Show EMEA pipeline by stage",
          "Why did LATAM miss Q3?",
          "Forecast Q4 with current pipeline",
        ]}
      />

      <section className="grid grid-2" style={{ marginBottom: 16 }}>
        <SfCard title="Region share" subtitle="ARR %" ariaLabel="Region share">
          <Suspense fallback={<div className="skeleton" style={{ height: 240 }} />}>
            <SfDonut data={regionShare} height={260} detailNames={regionFullNames} />
          </Suspense>
        </SfCard>
        <SfCard title="Avg deal size by segment" subtitle="USD thousands" ariaLabel="Avg deal size by segment">
          <Suspense fallback={<div className="skeleton" style={{ height: 240 }} />}>
            <SfBarChart data={dealSizeBySegment} height={260} />
          </Suspense>
        </SfCard>
      </section>

      <SfCard title="Insights" subtitle="5 tiles" ariaLabel="Insights">
        <div className="tile-grid">
          {INSIGHTS.map((i) => (
            <div className="tile" key={i.title}>
              <span className="tile__tag">{i.tag}</span>
              <h4>{i.title}</h4>
              <p>{i.body}</p>
            </div>
          ))}
        </div>
      </SfCard>

      <section className="grid grid-row-2-1" style={{ marginBottom: 16 }}>
        <SfCard title="Drilldown · regions" ariaLabel="Drilldown regions">
          <Suspense fallback={<div className="skeleton" style={{ height: 280 }} />}>
            <SfGrid
              data={drilldown}
              columns={[
                { header: "Region", field: "region", width: 200 },
                { header: "ARR", field: "arr", width: 130, format: "money", align: "right" },
                { header: "Plan", field: "plan", width: 130, format: "money", align: "right" },
                { header: "Δ%", field: "deltaPct", width: 90, format: "pct", align: "right" },
                { header: "Status", field: "tone", width: 110, format: "pill-tone" },
              ]}
            />
          </Suspense>
        </SfCard>
        <GuidedActions items={GUIDED} storageKey="copilot.guided.analytics" />
      </section>
    </div>
  );
}
