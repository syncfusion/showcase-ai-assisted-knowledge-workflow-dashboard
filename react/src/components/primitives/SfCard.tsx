/* =====================================================================
   SfCard — Syncfusion Card (CSS-only) wrapper.
   Uses the `e-card` markup from the Tailwind 3 theme; no package needed.
   ===================================================================== */

import type { ReactNode, MouseEventHandler } from "react";

interface SfCardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Optional trailing content shown in the header (chips, buttons, status). */
  trailing?: ReactNode;
  /** Optional content below the title and subtitle (e.g. caption copy). */
  caption?: ReactNode;
  /** Body content. */
  children?: ReactNode;
  /** Optional actions rendered at the bottom of the card. */
  actions?: ReactNode;
  /** Background variant — `gradient` gives the briefing surface a tinted look. */
  background?: "default" | "gradient";
  /** Removes default padding around the card content (e.g. for full-bleed grids). */
  flush?: boolean;
  /** Optional id used for CSS overrides via the `e-card` class. */
  id?: string;
  /** Extra CSS class appended to the Syncfusion `e-card` element. */
  cssClass?: string;
  /** Click handler for the whole card surface. */
  onClick?: MouseEventHandler<HTMLDivElement>;
  ariaLabel?: string;
}

/**
 * SfCard renders a Syncfusion Card with header / content / actions slots.
 * Per the design baseline, the Card component is CSS-only — we use the
 * `e-card`, `e-card-header`, `e-card-header-caption`, `e-card-header-title`,
 * `e-card-sub-title`, `e-card-content`, and `e-card-actions` class names.
 */
export function SfCard({
  title,
  subtitle,
  trailing,
  caption,
  children,
  actions,
  background = "default",
  flush = false,
  id,
  cssClass: extraCssClass,
  onClick,
  ariaLabel,
}: SfCardProps) {
  const headerClass = trailing ? "e-card-header sf-card__header" : "e-card-header";
  const titleClass = subtitle ? "e-card-header-title" : "e-card-header-title sf-card__title";
  const contentStyle: React.CSSProperties | undefined = flush ? { padding: 0 } : undefined;
  const cls = [
    "e-card",
    "sf-card",
    `sf-card--${background}`,
    extraCssClass ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      id={id}
      className={cls}
      onClick={onClick}
      aria-label={ariaLabel}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {title || subtitle || trailing || caption ? (
        <div className={headerClass}>
          <div className="e-card-header-caption">
            {title ? <div className={titleClass}>{title}</div> : null}
            {subtitle ? <div className="e-card-sub-title">{subtitle}</div> : null}
            {caption ? <div className="e-card-sub-title sf-card__caption">{caption}</div> : null}
          </div>
          {trailing ? <div className="sf-card__trailing">{trailing}</div> : null}
        </div>
      ) : null}
      <div className="e-card-content" style={contentStyle}>
        {children}
      </div>
      {actions ? <div className="e-card-actions">{actions}</div> : null}
    </div>
  );
}
