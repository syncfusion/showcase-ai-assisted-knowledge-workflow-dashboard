/* =====================================================================
   Status / priority pills + small text helpers.
   Pills render a CSS-only Syncfusion-styled chip via the `e-chip`
   class. We don't pull in a Chip React component (the chips module
   pulls its own stylesheet and the design baseline says one theme
   bundle only).
   ===================================================================== */

import type { ReactNode } from "react";
import type { Tone } from "@/core/data/contracts";

interface PillProps {
  tone: Tone;
  children: ReactNode;
  /** Optional aria-label override for the chip. */
  ariaLabel?: string;
}

const toneToCssClass: Record<Tone, string> = {
  success: "e-chip sf-chip sf-chip--success",
  warning: "e-chip sf-chip sf-chip--warning",
  danger: "e-chip sf-chip sf-chip--danger",
  info: "e-chip sf-chip sf-chip--info",
  neutral: "e-chip sf-chip sf-chip--neutral",
};

export function Pill({ tone, children, ariaLabel }: PillProps) {
  return (
    <span className={toneToCssClass[tone]} aria-label={ariaLabel}>
      {children}
    </span>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  return <span className="muted">{children}</span>;
}

export function Tiny({ children }: { children: ReactNode }) {
  return <span className="tiny muted">{children}</span>;
}

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="page-header">
      <h1 className="page-header__title">{title}</h1>
      {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
    </header>
  );
}
