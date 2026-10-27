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

interface InteractiveChatProps {
  title?: string;
  suggestions: string[];
  scope?: string;
  initial?: AiInsight;
  snapshot?: Snapshot;
  /** Optional explicit Syncfusion height (kept for API compatibility). */
  height?: string | number;
  /**
   * Optional content rendered inside the panel, above the suggestion chips
   * (e.g. a custom "Context" block). When omitted a default row with the
   * sparkle, scope label, and feedback actions is rendered.
   */
  details?: ReactNode;
}

const snapshotDefault: Snapshot = {
  analytics: analyticsFixture,
  knowledge: knowledgeFixture,
  workflows: workflowsFixture,
};

export function InteractiveChat({
  title = "Copilot Chat",
  suggestions,
  scope = "Q3 FY26",
  initial,
  snapshot = snapshotDefault,
}: InteractiveChatProps) {
  const ai = useMemo(() => createSampleAiProvider(), []);
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState<AiInsight | null>(initial ?? null);
 // const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    setReply(initial ?? null);
   // setFeedback(null);
  }, [initial]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const insight = ai.answer(
      trimmed,
      { region: "Global", period: "Q3 FY26", scope },
      snapshot,
    );
    setReply(insight);
   // setFeedback(null);
    setQuery("");
  };

  const handleSubmit = () => submit(query);
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit();
  };

  // const copyReply = async () => {
  //   if (!reply) return;
  //   const text = reply.blocks.find((b) => b.kind === "text")?.text ?? "";
  //   try {
  //     await navigator.clipboard?.writeText(text);
  //   } catch {
  //     /* clipboard unavailable; no-op for the local sample. */
  //   }
  // };

  return (
    <div className="sf-chat" aria-label={title}>
      <SfCard
        title={
          <span className="sf-assist__title">
            <span className="sf-assist__sparkle" aria-hidden>{SPARKLE_ICON}</span>
            {title}
          </span>
        }
        flush
        id={`chat-${title.replace(/\s+/g, "-").toLowerCase()}`}
      >

        {/* Suggestion chips */}
        <div className="sf-assist__suggest" role="group" aria-label="Suggested prompts">
          {suggestions.map((s) => (
            <SfButton
              key={s}
              variant="flat"
              cssClass="sf-chip-btn"
              ariaLabel={`Ask: ${s}`}
              onClick={() => submit(s)}
            >
              <span className="sf-chip-btn__dot" aria-hidden />
              {s}
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
                <span className="ai-msg__sep">·</span>
                <span className="ai-msg__sample">Sample response — generated from local data</span>
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
                    <SfButton key={a} variant="outline">{a}</SfButton>
                  ))}
                </div>
              ) : null}
              <footer className="ai-msg__foot">
                <span>Scope: {scope}</span>
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
            placeholder="Ask anything…"
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

const SEND_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
  </svg>
);
