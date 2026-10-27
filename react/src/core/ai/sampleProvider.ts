/* =====================================================================
   Sample AI provider — the seam a live model would replace.

   There is no network call, no credential and no external API here.
   The provider derives every answer from the local JSON fixtures, so
   the same numbers the charts and grids render are the numbers the
   assistant quotes. Output is labelled as simulated in the UI.
   ===================================================================== */

import type {
  AiContext,
  AiInsight,
  IAnalyticsFixture,
  IKnowledgeFixture,
  IWorkflowsFixture,
  Tone,
} from "../data/contracts";

/** Replaceable seam. A live provider implements the same interface. */
export interface ISampleAiProvider {
  readonly id: string;
  readonly label: string;
  answer(prompt: string, ctx: AiContext, snapshot: Snapshot): AiInsight;
}

export interface Snapshot {
  analytics: IAnalyticsFixture;
  knowledge: IKnowledgeFixture;
  workflows: IWorkflowsFixture;
}

const scopeEcho = (ctx: AiContext) => `Scope: ${ctx.region} · ${ctx.period}${ctx.scope ? ` (${ctx.scope})` : ""}`;

export function createSampleAiProvider(): ISampleAiProvider {
  return {
    id: "sample-local-v1",
    label: "Sample response — generated from local data",

    answer(prompt: string, ctx: AiContext, s: Snapshot): AiInsight {
      const q = prompt.trim().toLowerCase();
      const regions = s.analytics.regions;
      const scope = scopeEcho(ctx);

      /* --- Natural-language insight: pipeline by stage --------------- */
      if (/pipeline/.test(q) && /stage/.test(q)) {
        const items = [
          { label: "Discovery", value: 4_820_000, tone: "info" as Tone },
          { label: "Evaluation", value: 6_140_000, tone: "info" as Tone },
          { label: "Proposal", value: 4_190_000, tone: "warning" as Tone },
          { label: "Negotiation", value: 2_380_000, tone: "warning" as Tone },
          { label: "Commit", value: 890_000, tone: "success" as Tone },
        ];
        const total = items.reduce((a, r) => a + r.value, 0);
        return {
          text:
            `Pipeline by stage for ${ctx.region}: $${(total / 1e6).toFixed(2)}M across ` +
            `${items.length} stages. Proposal and Negotiation together hold ` +
            `$${((items[2].value + items[3].value) / 1e6).toFixed(2)}M — the widest gap ` +
            `against plan, and the slowest stage this quarter.`,
          blocks: [
            { kind: "text", text: scope },
            { kind: "bars", title: "Pipeline by stage", unit: "money-compact", items },
          ],
          citations: [
            { id: "fx-analytics", label: "analytics.json · regions" },
            { id: "fx-workflows", label: "workflows.json · workflows" },
          ],
          actions: [],
        };
      }

      /* --- Natural-language insight: region comparison ---------------- */
      if (/region/.test(q) || /emea|apac|latam/.test(q)) {
        const items = regions.map((r) => ({
          label: r.id,
          value: r.arr,
          tone: r.tone,
        }));
        const worst = [...regions].sort((a, b) => a.deltaPct - b.deltaPct)[0];
        return {
          text:
            `ARR by region for ${ctx.region}. ${worst.name} (${worst.id}) is the weakest at ` +
            `${worst.deltaPct.toFixed(1)}% against plan, closing $${Math.abs(worst.arr - worst.plan).toLocaleString("en-US")} ` +
            `below its plan line. ${regions.find((r) => r.deltaPct > 10)?.name ?? "APAC"} is leading.`,
          blocks: [
            { kind: "text", text: scope },
            { kind: "bars", title: "ARR by region", unit: "money-compact", items },
          ],
          citations: [{ id: "fx-analytics", label: "analytics.json · regions" }],
          actions: ["Open in Analytics", "Compare to plan", "Share with owner"],
        };
      }

      /* --- Natural-language insight: SLA exposure -------------------- */
      if (/sla|ticket|breach|risk/.test(q)) {
        const total = s.workflows.ticketRisk.reduce((a, b) => a + b.count, 0);
        const breached = s.workflows.ticketRisk.find((b) => b.bucket === "Breached") ?? {
          count: 0,
        };
        const teams = [...s.workflows.slaTeams].sort((a, b) => b.breach - a.breach);
        return {
          text:
            `${total} tickets in the open window; ${breached.count} have already breached. ` +
            `Onboarding carries the most breaches (${teams[0].breach}), followed by ` +
            `${teams[1].team} (${teams[1].breach}). Re-routing those two queues is the ` +
            `cheapest first move.`,
          blocks: [
            { kind: "text", text: scope },
            {
              kind: "bars",
              title: "Tickets by risk bucket",
              unit: "count",
              items: s.workflows.ticketRisk.map((t) => ({
                label: t.bucket,
                value: t.count,
                tone: t.tone,
              })),
            },
          ],
          citations: [{ id: "fx-workflows", label: "workflows.json · ticketRisk" }],
          actions: ["Re-route queue", "Open in Workflows", "Assign owner"],
        };
      }

      /* --- Natural-language insight: next-best-action ---------------- */
      if (/next|suggest|recommend|do next|first move/.test(q)) {
        const breached = s.workflows.slaTeams
          .slice()
          .sort((a, b) => b.breach - a.breach);
        const top = breached[0];
        const blockers = s.workflows.workflows.filter((w) => w.status === "Blocked");
        const wip = s.workflows.workflows.filter((w) => w.status === "In progress");
        const suggestions = [
          `Re-route the ${top.team} queue first — ${top.breach} breaches this week is the largest exposure.`,
          blockers.length
            ? `Clear ${blockers.length} blocked workflow${blockers.length === 1 ? "" : "s"} — pick the one with the latest end time.`
            : `No workflows are blocked; lean into the ${wip.length} in-flight to keep momentum.`,
          `Schedule a 30-minute review for the oldest in-progress item with its owner to pre-empt renewal risk.`,
        ];
        return {
          text:
            `Three moves that close the most exposure in the next hour: ` +
            suggestions.join(" "),
          blocks: [
            { kind: "text", text: scope },
            {
              kind: "bullets",
              title: "Recommended next actions",
              items: suggestions,
            },
          ],
          citations: [{ id: "fx-workflows", label: "workflows.json · slaTeams, workflows" }],
          actions: ["Open in Workflows", "Add to brief", "Schedule review"],
        };
      }

      /* --- Natural-language insight: overload ------------------------- */
      if (/overload|overloaded|capacity|busy|bandwidth/.test(q)) {
        const inFlight = s.workflows.workflows.filter((w) => w.status === "In progress");
        const byOwner = new Map<string, number>();
        for (const w of inFlight) byOwner.set(w.owner, (byOwner.get(w.owner) ?? 0) + 1);
        const ranked = [...byOwner.entries()]
          .map(([owner, count]) => ({ owner, count }))
          .sort((a, b) => b.count - a.count);
        const heaviest = ranked[0];
        const avg = ranked.length ? ranked.reduce((a, r) => a + r.count, 0) / ranked.length : 0;
        const items = ranked.slice(0, 6).map((r) => ({
          label: r.owner,
          value: r.count,
          tone: (r.count >= avg + 1 ? "danger" : r.count >= avg ? "warning" : "success") as Tone,
        }));
        return {
          text:
            heaviest
              ? `${heaviest.owner} is carrying ${heaviest.count} active workflows — the most on the team ` +
                `and ${(heaviest.count - avg).toFixed(1)} above the ${avg.toFixed(1)} average. ` +
                `Rebalancing one of those items frees the most capacity.`
              : `No team members are currently overloaded — workload is evenly distributed.`,
          blocks: [
            { kind: "text", text: scope },
            {
              kind: "bars",
              title: "Active workflows per owner",
              unit: "count",
              items: items.length ? items : [{ label: "—", value: 0, tone: "neutral" as Tone }],
            },
          ],
          citations: [{ id: "fx-workflows", label: "workflows.json · workflows" }],
          actions: ["Rebalance workload", "Open in Workflows", "Notify owner"],
        };
      }

      /* --- Natural-language insight: knowledge gaps ------------------ */
      if (/knowledge|article|doc|gap/.test(q)) {
        const gapped = s.knowledge.articles
          .filter((a) => a.gaps > 0)
          .sort((a, b) => b.gaps - a.gaps);
        const stale = gapped[0];
        return {
          text:
            `${gapped.length} articles carry open knowledge gaps. "${stale.title}" is the ` +
            `worst with ${stale.gaps} gaps and a confidence of ${(stale.confidence * 100).toFixed(0)}%. ` +
            `Reading it ${stale.reads.toLocaleString("en-US")} times a month means the gap is ` +
            `reaching people who need it.`,
          blocks: [
            { kind: "text", text: scope },
            {
              kind: "bars",
              title: "Open gaps by article",
              unit: "count",
              items: gapped.map((a) => ({
                label: a.id,
                value: a.gaps,
                tone: a.gaps >= 3 ? ("danger" as Tone) : ("warning" as Tone),
              })),
            },
          ],
          citations: [{ id: "fx-knowledge", label: "knowledge.json · articles" }],
          actions: ["Open in Knowledge", "Assign author", "Draft an update"],
        };
      }

      /* --- Default: KPI summary over the shared fixtures -------------- */
      const k = s.analytics.kpis;
      const best = [...k].sort((a, b) => b.deltaPct - a.deltaPct)[0];
      return {
        text:
          `Across ${ctx.region} for ${ctx.period}: net new pipeline is ` +
          `$${(s.analytics.regions.reduce((a, r) => a + r.arr, 0) / 1e6).toFixed(2)}M ARR across ` +
          `${s.analytics.regions.length} regions. Strongest mover is ${best.title} at ` +
          `${best.deltaPct.toFixed(1)}%. ${s.knowledge.articles.length} articles and ` +
          `${s.workflows.workflows.length} workflows are in the window.`,
        blocks: [
          { kind: "text", text: scope },
          {
            kind: "bars",
            title: "ARR share by region (bars)",
            unit: "USD",
            items: s.analytics.regions.map((r) => ({
              label: r.id,
              value: r.arr,
              tone: "info" as Tone,
            })),
          },
        ],
        citations: [
          { id: "fx-analytics", label: "analytics.json · kpis, regions" },
          { id: "fx-knowledge", label: "knowledge.json · articles" },
        ],
        actions: ["Open in Analytics", "Add to brief", "Export as note"],
      };
    },
  };
}