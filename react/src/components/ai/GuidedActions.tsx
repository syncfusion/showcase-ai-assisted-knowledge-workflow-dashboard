/* =====================================================================
   Guided Actions — Syncfusion Card surface with SfButton actions.
   Each action: title + sub + Apply / Dismiss. Apply keeps the stamp;
   Dismiss hides the row for this session.
   ===================================================================== */

import { useEffect, useState } from "react";
import { SfButton } from "@/components/primitives/SfButton";
import { SfCard } from "@/components/primitives/SfCard";
import { Pill } from "@/components/primitives/Pills";

export interface GuidedItem {
  id: string;
  title: string;
  sub?: string;
  cta?: string;
}

interface Props {
  items: GuidedItem[];
  storageKey?: string;
}

interface StoredState {
  applied: Record<string, true>;
  dismissed: Record<string, true>;
}

const empty: StoredState = { applied: {}, dismissed: {} };

export function GuidedActions({ items, storageKey = "copilot.guided" }: Props) {
  const [state, setState] = useState<StoredState>(empty);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setState(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const persist = (next: StoredState) => {
    setState(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const apply = (id: string) =>
    persist({ ...state, applied: { ...state.applied, [id]: true } });
  const dismiss = (id: string) =>
    persist({ ...state, dismissed: { ...state.dismissed, [id]: true } });
  const reset = () => persist(empty);

  return (
    <SfCard
      title="Guided actions"
      trailing={
        <SfButton variant="outline" onClick={reset}>
          Reset
        </SfButton>
      }
      ariaLabel="Guided actions"
    >
      <div className="guided">
        {items.length === 0 ? (
          <div className="guided__empty">No guided actions right now.</div>
        ) : null}
        {items.length > 0 && items.every((it) => state.dismissed[it.id]) ? (
          <div className="guided__empty">All guided actions are taken care of.</div>
        ) : null}
        {items.map((it) => {
          const isApplied = !!state.applied[it.id];
          const isDismissed = !!state.dismissed[it.id];
          return (
            <div
              key={it.id}
              className={`guided__row ${isApplied ? "is-done" : ""} ${isDismissed ? "is-dismissed" : ""}`}
            >
              <div>
                <div className="guided__title">
                  {it.title}{" "}
                  {isApplied ? <Pill tone="success">Applied</Pill> : null}
                </div>
                {it.sub ? <div className="guided__sub">{it.sub}</div> : null}
              </div>
              <div className="guided__actions">
                <SfButton variant="primary" onClick={() => apply(it.id)}>
                  {isApplied ? "Re-apply" : (it.cta ?? "Apply")}
                </SfButton>
                <SfButton variant="default" onClick={() => dismiss(it.id)}>
                  Dismiss
                </SfButton>
              </div>
            </div>
          );
        })}
      </div>
    </SfCard>
  );
}
