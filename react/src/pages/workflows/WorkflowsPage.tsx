/* =====================================================================
   Workflows page — Syncfusion Scheduler, AI recommendations, SLA strip,
   action queue ListView, Guided actions.
   All cards are Syncfusion `e-card`; buttons use `SfButton`; the AI
   surface is the Syncfusion AIAssistView (wrapped by our component);
   the action queue is the Syncfusion `ListViewComponent`.

   Styling refactored to a premium Enterprise SaaS aesthetic:
   - generous, deliberate whitespace (16–20px card padding)
   - thin slate borders with subtle micro-shadows
   - tight, crisp typography (Inter/Geist-like stack, -0.02em headings)
   - small-to-medium corner radii (8–10px) on every surface
   ===================================================================== */

import { lazy, Suspense, useMemo } from "react";
import { ListViewComponent } from "@syncfusion/ej2-react-lists";
import { PageHeader } from "@/components/primitives/Pills";
import { SfCard } from "@/components/primitives/SfCard";
import { AiAssistView } from "@/components/ai/AiProvider";
import { GuidedActions, type GuidedItem } from "@/components/ai/GuidedActions";
import { workflowsFixture } from "@/core/data/dataService";
import { fmtNumber, fmtTime } from "@/core/format/format";
import type { IWorkflow, WorkflowStatus, Tone } from "@/core/data/contracts";

const SfSchedule = lazy(() =>
  import("@/components/scheduler/SfSchedule").then((m) => ({ default: m.SfSchedule })),
);

const GUIDED: GuidedItem[] = [
  { id: "w-1", title: "Move ARRE-1042 review earlier", sub: "Risk of missed renewal — owner notified" },
  { id: "w-2", title: "Reassign DACH coverage gap",    sub: "Sales engineer on PTO 3 weeks" },
  { id: "w-3", title: "Run 'Invoicing dispute' playbook", sub: "Triggered by 12 tickets in 24h" },
];

/** Map a workflow status to a status-tone for the list-view pill. */
function workflowStatusTone(status: WorkflowStatus): Tone {
  switch (status) {
    case "Done":        return "success";
    case "In progress": return "info";
    case "Blocked":     return "danger";
    case "Scheduled":   return "neutral";
  }
}

/** Inline template rendered for each Syncfusion ListView row in the Action queue. */
function actionQueueRowTemplate(item: IWorkflow) {
  return (
    <div className="wf-action-row" role="listitem">
      <div className="wf-action-row__body">
        <div className="wf-action-row__head">
          <span className={`e-chip sf-chip sf-chip--${workflowStatusTone(item.status)} wf-action-row__status`}>
            {item.status}
          </span>
          <span className="wf-action-row__id">{item.id}</span>
          <span className="wf-action-row__title">{item.title}</span>
        </div>
        <div className="wf-action-row__sub">
          <span className="muted">Owner ·</span> {item.owner}
        </div>
      </div>
      <div className="wf-action-row__meta">
        <span className="wf-action-row__time">{fmtTime(item.start)}</span>
        <span className="wf-action-row__sep" aria-hidden>→</span>
        <span className="wf-action-row__time">{fmtTime(item.end)}</span>
      </div>
      {/* <div className="wf-action-row__actions">
        <SfButton variant="default" ariaLabel={`Open ${item.id}`}>Open</SfButton>
      </div> */}
    </div>
  );
}


export function WorkflowsPage() {
  const { workflows, earlyShift, slaTeams, workWeek } = workflowsFixture;
  const breachTotal = slaTeams.reduce((s, t) => s + t.breach, 0);

  // The Scheduler's grid runs 06:00–22:00, so it also draws the early-shift
  // events. The action queue below keeps the tracked work items only.
  const scheduledWorkflows = useMemo(
    () => [...workflows, ...earlyShift],
    [workflows, earlyShift],
  );

  return (
    <div className="workflows-page">
      {/* Page header — premium enterprise feel: eyebrow, title, subtitle, action group */}
      <div className="wf-page-head">
        <div className="wf-page-head__intro">
          <span className="wf-eyebrow">Operations</span>
          <PageHeader title="Operational Planning" subtitle="Scheduler, AI-recommended actions, and SLA exposure" />
        </div>
      </div>

      {/* SLA exposure strip — generous padding, crisp micro-shadow, thin borders */}
      <div className="wf-stack">
        <SfCard
          title="SLA exposure"
          subtitle={`${fmtNumber(breachTotal)} breaches across ${slaTeams.length} teams this week`}
          ariaLabel="SLA exposure"
        >
          <div className="wf-sla-grid">
            {slaTeams.map((t) => {
              const tone =
                t.onTrack >= 95 ? "success" :
                t.onTrack >= 85 ? "warning" :
                "danger";
              return (
                <div key={t.team} className={`wf-sla-tile wf-sla-tile--${tone}`}>
                  <div className="wf-sla-tile__head">
                    <span className="wf-sla-tile__label">{t.team}</span>
                    {/* <span className={`wf-sla-tile__indicator wf-sla-tile__indicator--${tone}`} aria-hidden /> */}
                  </div>
                  <div className="wf-sla-tile__value">{t.onTrack}%</div>
                  <div className="wf-sla-tile__meta">
                    <span className="wf-sla-tile__delta">{t.breach} breaches</span>
                    <span className="wf-sla-tile__period">this week</span>
                  </div>
                </div>
              );
            })}
          </div>
        </SfCard>
      </div>

      {/* Scheduler — now full-width; Quick actions card removed */}
      <section className="wf-grid wf-grid--solo">
        <SfCard
          title="Week at a glance"
          subtitle="Syncfusion Scheduler"
          trailing={
            <div className="wf-card-trailing">
              <span className="wf-pill wf-pill--neutral">{workWeek.start} → {workWeek.end}</span>
              {/* <SfButton variant="outline">Switch view</SfButton> */}
            </div>
          }
          ariaLabel="Week at a glance"
        >
          <Suspense fallback={<div className="skeleton" style={{ height: 540 }} />}>
            <SfSchedule workflows={scheduledWorkflows} workStart={workWeek.start} workEnd={workWeek.end} height={620} />
          </Suspense>
        </SfCard>
      </section>

      {/* AI Recommendations */}
      <div className="wf-stack">
        <AiAssistView
          target="Workflows"
          title="Recommendations"
          scope="Q3 FY26 · work week"
          height={400}
          prompts={[
            "Which workflows are at risk this week?",
            "Show me blocked items",
            "Suggest the next thing to do",
            "Who is overloaded?",
          ]}
        />
      </div>

      {/* Guided actions + Action queue share a horizontal grid row */}
      <section style={{display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: 16,}}>
        <div className="wf-stack" style={{height: '440px', overflowY: 'auto'}}>
          <SfCard
            title="Action queue"
            subtitle={`${workflows.length} workflows · ${fmtNumber(workflows.filter((w) => w.status === "In progress").length)} active`}
            ariaLabel="Action queue"
          >
            <div style={{height: '100%', overflowY: 'auto'}}>
            <ListViewComponent
              id="workflows-action-queue"
              className="wf-action-list"
              dataSource={workflows as unknown as { [key: string]: object }[]}
              fields={{ id: "id" }}
              template={actionQueueRowTemplate as never}
              showHeader={false}
              showCheckBox={false}
              height="auto"
            /></div>
          </SfCard>
        </div>
        <div className="wf-stack">
          <GuidedActions items={GUIDED} storageKey="copilot.guided.workflows" />
        </div>
      </section>
    </div>
  );
}