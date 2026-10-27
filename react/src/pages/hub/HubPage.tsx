/* =====================================================================
   Copilot Hub page — daily briefing, KPI strip, AI AssistView, Guided
   actions, activity stream, highlights tiles.
   All cards are Syncfusion `e-card`; buttons use `SfButton` (ButtonComponent);
   the AI surface is the Syncfusion AIAssistViewComponent wrapper.
   ===================================================================== */

import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ListViewComponent } from "@syncfusion/ej2-react-lists";
import { PageHeader } from "@/components/primitives/Pills";
import { KpiCard } from "@/components/primitives/KpiCard";
import { SfButton } from "@/components/primitives/SfButton";
import { SfCard } from "@/components/primitives/SfCard";
import { AiAssistView } from "@/components/ai/AiProvider";
import { GuidedActions, type GuidedItem } from "@/components/ai/GuidedActions";
import { analyticsFixture } from "@/core/data/dataService";
import { fmtCompactMoney } from "@/core/format/format";

type ActivityTone = "info" | "success" | "warning" | "danger";
interface ActivityItem {
  id: string;
  time: string;
  tag: string;
  tone: ActivityTone;
  text: string;
}

const ACTIVITY: ActivityItem[] = [
  { id: "a-1", time: "07:42", tag: "Authoring", tone: "info",    text: "AI drafted a customer-support runbook based on the latest 42 tickets" },
  { id: "a-2", time: "08:18", tag: "Workflow",  tone: "success", text: "Approved Q3 forecast update — closes $1.2M gap in EMEA" },
  { id: "a-3", time: "09:03", tag: "Insight",   tone: "warning", text: "ARRE-1042 renewal flagged: $320K ARR at risk in 3 days" },
  { id: "a-4", time: "09:31", tag: "Workflow",  tone: "info",    text: "Auto-routed 4 APAC billing tickets to Mei Tanaka" },
  { id: "a-5", time: "10:12", tag: "Authoring", tone: "info",    text: "Sign-off requested on Compliance v3.2 (2 reviewers queued)" },
];

const GUIDED: GuidedItem[] = [
  { id: "h-1", title: "Approve Q3 forecast update",   sub: "Adds $1.2M to EMEA, trims LATAM by 3.6%" },
  { id: "h-2", title: "Re-route 4 APAC tickets",      sub: "Billing — invoice dispute pattern" },
  { id: "h-3", title: "Schedule author for art-007", sub: "Knowledge gap in 'DACH pricing pilot'" },
];

type HighlightTag = "Insight" | "Workflow" | "Authoring";
interface HighlightItem {
  id: string;
  tag: HighlightTag;
  title: string;
  body: string;
  /** Route to open when the tile is activated. */
  route: string;
}

const HIGHLIGHTS: HighlightItem[] = [
  { id: "h-i-1", tag: "Insight",   title: "ARRE-1042 renewal at risk",      body: "$320K ARR; 3 stakeholders missed; owner notified.",   route: "/analytics" },
  { id: "h-w-1", tag: "Workflow",  title: "Re-route APAC tickets",          body: "4 tickets, billing cluster; SLA 18h.",               route: "/workflows"  },
  { id: "h-a-1", tag: "Authoring", title: "Sign-off on Compliance v3.2",    body: "2 reviewers queued; ETA Thursday.",                   route: "/knowledge"  },
  { id: "h-i-2", tag: "Insight",   title: "EMEA pricing pilot extended",    body: "Sequencing fixed; +11d impact.",                     route: "/analytics"  },
  { id: "h-w-2", tag: "Workflow",  title: "Sales-engineer coverage gap",    body: "DACH uncovered for 3 weeks.",                         route: "/workflows"  },
  { id: "h-a-2", tag: "Authoring", title: "Need runbook: invoicing dispute",body: "12 unresolved tickets cite this gap.",                route: "/knowledge"  },
];

/** Inline template rendered for each ListView row. */
function activityRowTemplate(item: ActivityItem) {
  return (
    <div className="activity__row" role="listitem">
      <span className="activity__time">{item.time}</span>
      <span className={`pill pill--${item.tone}`}>{item.tag}</span>
      <span className="activity__text">{item.text}</span>
    </div>
  );
}

export function HubPage() {
  const total = useMemo(() => analyticsFixture.regions.reduce((s, r) => s + r.arr, 0), []);
  const navigate = useNavigate();
  const smoothScrollToAiAssist = () => {
    const element = document.getElementById("ai-assist-hub");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <PageHeader title="Copilot Hub" subtitle="Your AI-prepared day at a glance" />

      <SfCard
        title="Your AI briefing"
        subtitle="Daily briefing · Oct 15, 2026"
        background="gradient"
        ariaLabel="Daily briefing"
        cssClass="sf-card-briefing"
      >
        <div className="briefing">
          <div className="briefing__body">
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
              Q3 closed at <strong>{fmtCompactMoney(analyticsFixture.kpis[0].value)}</strong> net new pipeline (+
              {analyticsFixture.kpis[0].deltaPct}%). EMEA is <strong>4.6%</strong> below plan and APAC accelerating.
              Eleven tickets sit in the next-24h SLA-risk band. The recommended next decision is to
              <strong> approve the Q3 forecast update</strong>.
            </p>
            <div className="row" style={{ marginTop: 14 }}>
              <SfButton variant="primary" onClick={() => navigate("analytics")}>
                Open in Analytics
              </SfButton>
              <SfButton variant="outline" onClick={() => smoothScrollToAiAssist()}>
                Ask AI a follow-up
              </SfButton>
            </div>
          </div>
          <div className="briefing__signals">
            <div className="tiny muted">Today's signals</div>
            <ul className="briefing__list">
              <li><span className="pill pill--danger">Insight</span> ARRE-1042 renewal at risk ($320K)</li>
              <li><span className="pill pill--info">Workflow</span> Re-route 4 APAC tickets</li>
              <li><span className="pill pill--warning">Authoring</span> Sign-off on Compliance v3.2</li>
            </ul>
            <div className="tiny muted" style={{ marginTop: 12 }}>Total ARR this period</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{fmtCompactMoney(total)}</div>
          </div>
        </div>
      </SfCard>

      <section className="grid grid-4" style={{ marginBottom: 16, marginTop: 16 }}>
        {analyticsFixture.kpis.map((k) => (
          <KpiCard
            key={k.id}
            label={k.title}
            value={k.value}
            format={k.format}
            deltaPct={k.deltaPct}
            tone={k.tone}
            target={k.target}
            unit={k.unit}
          />
        ))}
      </section>

      <section className="grid grid-row-2-1" style={{ marginBottom: 16 }}>
        <AiAssistView
          target="Hub"
          title="Daily briefing assistant"
          scope="Q3 FY26"
          prompts={[
            "Why did EMEA underperform?",
            "Show top 3 risks this week",
            "Summarise Q3 actuals vs plan",
            "Who should review the forecast?",
          ]}
        />
        <GuidedActions items={GUIDED} storageKey="copilot.guided.hub" />
      </section>

      <SfCard title="Highlights" subtitle="6 items · click a tile to open it" ariaLabel="Highlights">
        <div className="tile-grid">
          {HIGHLIGHTS.map((h) => (
            <Link
              to={h.route}
              key={h.id}
              className="tile tile--clickable"
              aria-label={`${h.tag}: ${h.title} — open in ${routeLabel(h.route)}`}
            >
              <span className="tile__tag">{h.tag}</span>
              <h4>{h.title}</h4>
              <p>{h.body}</p>
            </Link>
          ))}
        </div>
      </SfCard>

      <SfCard title="Activity stream" subtitle={`Last ${ACTIVITY.length} events`} ariaLabel="Activity stream">
        <ListViewComponent
          id="hub-activity-list"
          className="activity-list"
          dataSource={ACTIVITY as unknown as { [key: string]: object }[]}
          fields={{ id: "id" }}
          template={activityRowTemplate as never}
          showHeader={false}
          showCheckBox={false}
        />
      </SfCard>
    </>
  );
}

/** Human-friendly destination label for highlight tile aria text. */
function routeLabel(route: string): string {
  switch (route) {
    case "/analytics":
      return "Analytics";
    case "/workflows":
      return "Workflows";
    case "/knowledge":
      return "Knowledge";
    default:
      return route.replace(/^\//, "");
  }
}
