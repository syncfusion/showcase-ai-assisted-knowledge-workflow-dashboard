/* =====================================================================
   AI Insight Panel — purpose-built chips + graphs surface.
   Replaces the Syncfusion ChatUIComponent / AIAssistViewComponent with a
   single card whose contents always render inside the same window:
     header bar  →  suggestion chips  →  inline insight card  →  input
   The previous ChatUI's `footerTemplate` slot rendered the reply panel
   below the input area (outside the conversation window). This component
   keeps every piece of the assistant's reply inside one card so the
   scope, citations, charts, and actions read as one connected unit.
   ===================================================================== */

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { TextBoxComponent } from "@syncfusion/ej2-react-inputs";
import { SfButton } from "@/components/primitives/SfButton";
import { SfCard } from "@/components/primitives/SfCard";
import { createSampleAiProvider, type Snapshot } from "@/core/ai/sampleProvider";
import {
  analyticsFixture,
  knowledgeFixture,
  workflowsFixture,
} from "@/core/data/dataService";
import { fmtCompactMoney } from "@/core/format/format";
import type { AiInsight, Tone } from "@/core/data/contracts";

interface AiAssistViewProps {
  /** Short label for the AI's "target" — e.g. "Hub", "Knowledge". */
  target: string;
  /** Suggested prompts the user can click. */
  prompts: string[];
  /** Title shown in the header bar. */
  title?: string;
  /** Page-specific context label shown after "Scope:". */
  scope?: string;
  /** Optional fixed initial reply. */
  initial?: AiInsight;
  /** Optional explicit snapshot override (defaults to the global fixtures). */
  snapshot?: Snapshot;
  /** Optional explicit Syncfusion height (kept for API compatibility). */
  height?: string | number;
  /**
   * Optional content rendered inside the chat window, above the transcript
   * (e.g. the contextual "Details" panel). When omitted a default row with
   * a sparkle / scope label / copy / thumbs-up / thumbs-down is rendered.
   */
  details?: ReactNode;
}

const snapshotDefault: Snapshot = {
  analytics: analyticsFixture,
  knowledge: knowledgeFixture,
  workflows: workflowsFixture,
};

/** Kept as the public export name so existing call sites keep compiling. */
export function AiAssistView({
  target,
  prompts,
  title = "AI AssistView",
  scope,
  initial,
  snapshot = snapshotDefault,
  details,
}: AiAssistViewProps) {
  const ai = useMemo(() => createSampleAiProvider(), []);
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState<AiInsight | null>(initial ?? null);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  // Clear reply + feedback when target changes so the scope stays honest.
  useEffect(() => {
    setReply(initial ?? null);
    setFeedback(null);
  }, [target]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const insight = ai.answer(
      trimmed,
      { region: "Global", period: "Q3 FY26", scope: scope ?? "Global · Q3 FY26" },
      snapshot,
    );
    setReply(insight);
    setFeedback(null);
    setQuery("");
  };

  const handleSubmit = () => submit(query);
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit();
  };

  // Clear the current reply + feedback so the empty state reappears.
  const clearReply = () => {
    setReply(initial ?? null);
    setFeedback(null);
  };

  const copyReply = async () => {
    if (!reply) return;
    const text = reply.blocks.find((b) => b.kind === "text")?.text ?? "";
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      /* clipboard unavailable; no-op for the local sample. */
    }
  };

  return (
    <div className="sf-assist" aria-label={`AI Insight Panel — ${target}`}>
      <SfCard
        title={
          <span className="sf-assist__title">
            <span className="sf-assist__sparkle" aria-hidden>{SPARKLE_ICON}</span>
            {title}
          </span>
        }
        flush
        id={`ai-assist-${target.replace(/\s+/g, "-").toLowerCase()}`}
      >
        {/* In-window details row: scope + feedback actions */}
        <div className="sf-chat__details sf-assist__details">
          {details ?? (
            <DefaultAssistDetails
              target={target}
              scope={scope}
              hasReply={!!reply}
              feedback={feedback}
              onCopy={copyReply}
              onClear={clearReply}
              onFeedback={setFeedback}
            />
          )}
        </div>

        {/* Suggestion chips */}
        <div className="sf-assist__suggest" role="group" aria-label="Suggested prompts">
          {prompts.map((p) => (
            <SfButton
              key={p}
              variant="flat"
              cssClass="sf-chip-btn"
              ariaLabel={`Ask: ${p}`}
              onClick={() => submit(p)}
            >
              <span className="sf-chip-btn__dot" aria-hidden />
              {p}
            </SfButton>
          ))}
        </div>

        {/* Inline insight card */}
        {reply ? (
          <div className="sf-assist__reply" role="region" aria-label="Latest insight">
            <article className="ai-msg">
              <header className="ai-msg__head">
                <span className="ai-msg__avatar" aria-hidden>{SPARKLE_ICON}</span>
                <span className="ai-msg__role">AI</span>
              </header>
              <div className="ai-msg__body">
                {reply.blocks.map((b, i) => {
                  if (b.kind === "text") return <p key={i}>{b.text}</p>;
                  if (b.kind === "bullets")
                    return (
                      <div key={i} className="ai-msg__section">
                        {b.title ? <div className="ai-msg__section-title">{b.title}</div> : null}
                        <ul className="ai-msg__list">
                          {b.items.map((it, j) => <li key={j}>{it}</li>)}
                        </ul>
                      </div>
                    );
                  if (b.kind === "bars")
                    return <Bars key={i} title={b.title} unit={b.unit} items={b.items} />;
                  return null;
                })}
              </div>
              {reply.citations.length ? (
                <div className="ai-msg__cite" aria-label="Citations">
                  <span className="ai-msg__cite-label">Citations</span>
                  {reply.citations.map((c) => (
                    <span key={c.id} className="ai-msg__cite-chip" title={c.label}>{c.id}</span>
                  ))}
                </div>
              ) : null}
              {reply.actions?.length ? (
                <div className="ai-msg__actions">
                  {reply.actions!.map((a) => (
                    <SfButton
                      key={a}
                      variant="outline"
                      onClick={() => submit(actionToPrompt(a))}
                      ariaLabel={`Ask: ${a}`}
                      title={`Ask: ${a}`}
                    >
                      {a}
                    </SfButton>
                  ))}
                </div>
              ) : null}
              <footer className="ai-msg__foot">
                <span>Scope: {scope ?? "Q3 FY26"}</span>
              </footer>
            </article>
          </div>
        ) : (
          <div className="sf-assist__empty" role="status">
            <div className="sf-assist__empty-eyebrow">Try a prompt</div>
            <p className="sf-assist__empty-title">Ask anything about your workspace</p>
            <p className="sf-assist__empty-sub">
              Pick one of the chips above, or type your own question. Answers are grounded
              in the active fixtures and cite the source ids they touch.
            </p>
          </div>
        )}

        {/* Input row — wraps the textbox in a form so Enter submits natively */}
        <form className="sf-assist__input" onSubmit={handleFormSubmit}>
          <TextBoxComponent
            placeholder="Ask anything about your workspace…"
            value={query}
            floatLabelType="Never"
            showClearButton={false}
            cssClass="sf-assist__input-box"
            input={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            aria-label="Ask the assistant"
          />
          <SfButton
            type="submit"
            variant="primary"
            ariaLabel="Send prompt"
            disabled={!query.trim()}
            cssClass="sf-assist__send"
          >
            <span aria-hidden>{SEND_ICON}</span>
            <span className="sf-assist__send-label">Send</span>
          </SfButton>
        </form>
      </SfCard>
    </div>
  );
}

/** Default in-panel header: scope chip on the left, copy / clear / thumbs-up / thumbs-down on the right. */
function DefaultAssistDetails({
  target,
  scope,
  hasReply,
  feedback,
  onCopy,
  onClear,
  onFeedback,
}: {
  target: string;
  scope?: string;
  hasReply: boolean;
  feedback: "up" | "down" | null;
  onCopy: () => void;
  onClear: () => void;
  onFeedback: (v: "up" | "down") => void;
}) {
  return (
    <>
      <div className="sf-chat__details-label">
        {/* <span className="sf-chat__details-sparkle" aria-hidden>{SPARKLE_ICON}</span> */}
        <span>
          <span className="muted">Scope:</span>{" "}
          <strong>{scope ?? `Target: ${target}`}</strong>
        </span>
      </div>
      <div className="sf-chat__actions">
        <SfButton
          variant="flat"
          iconOnly
          ariaLabel="Copy reply"
          title="Copy reply"
          disabled={!hasReply}
          onClick={onCopy}
        >
          {COPY_ICON}
        </SfButton>
        <SfButton
          variant="flat"
          iconOnly
          ariaLabel="Clear reply"
          title="Clear reply"
          disabled={!hasReply}
          cssClass="sf-assist__clear"
          onClick={onClear}
        >
          {CLEAR_ICON}
        </SfButton>
        <SfButton
          variant="flat"
          iconOnly
          ariaLabel="Helpful"
          title="Helpful"
          disabled={!hasReply}
          cssClass={feedback === "up" ? "sf-btn--tone-success" : ""}
          onClick={() => onFeedback("up")}
        >
          {THUMBS_UP_ICON}
        </SfButton>
        <SfButton
          variant="flat"
          iconOnly
          ariaLabel="Not helpful"
          title="Not helpful"
          disabled={!hasReply}
          cssClass={feedback === "down" ? "sf-btn--tone-danger" : ""}
          onClick={() => onFeedback("down")}
        >
          {THUMBS_DOWN_ICON}
        </SfButton>
      </div>
    </>
  );
}

function Bars({
  title,
  unit,
  items,
}: {
  title: string;
  unit: string;
  items: { label: string; value: number; tone: Tone }[];
}) {
  const max = Math.max(...items.map((x) => x.value), 1);
  return (
    <section className="ai-bars" aria-label={title}>
      <header className="ai-bars__title">{title}</header>
      <div className="ai-bars__grid">
        {items.map((it) => {
          const pct = Math.max(6, Math.round((it.value / max) * 100));
          return (
            <div key={it.label} className={`ai-bars__row ai-bars__row--${it.tone}`}>
              <div className="ai-bars__label">{it.label}</div>
              <div className="ai-bars__track">
                <div className="ai-bars__fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="ai-bars__val">
                {unit === "USD" ? fmtCompactMoney(it.value) : Number(it.value).toLocaleString("en-US")}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Decorative SVG glyphs (aria-hidden on each) ---------- */

const SPARKLE_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const COPY_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const THUMBS_UP_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 10v12" />
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
  </svg>
);

const THUMBS_DOWN_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 14V2" />
    <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
  </svg>
);

const SEND_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
  </svg>
);

const CLEAR_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6 18 20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

/** Map an action button label to a follow-up prompt the provider can answer. */
function actionToPrompt(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("open in analytics")) return "Show me analytics by region";
  if (a.includes("open in workflows")) return "Which workflows are at risk this week?";
  if (a.includes("open in knowledge")) return "Show me knowledge gaps";
  if (a.includes("add to brief") || a.includes("add to forecast")) return "Show me analytics by region";
  if (a.includes("export")) return "Suggest the next thing to do";
  if (a.includes("rebalance") || a.includes("notify")) return "Who is overloaded?";
  if (a.includes("re-route") || a.includes("assign")) return "Suggest the next thing to do";
  if (a.includes("share") || a.includes("compare")) return "Show me analytics by region";
  if (a.includes("draft") || a.includes("author")) return "Show me knowledge gaps";
  if (a.includes("schedule")) return "Suggest the next thing to do";
  return action;
}
