/* =====================================================================
   SfButton — thin wrapper around Syncfusion ButtonComponent.
   Centralises variant + iconCss + theming so call-sites stay short.
   ===================================================================== */

import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
import type { MouseEventHandler, ReactNode } from "react";

export type SfButtonVariant = "primary" | "default" | "outline" | "flat" | "link";

interface SfButtonProps {
  variant?: SfButtonVariant;
  iconCss?: string;
  iconPosition?: "Left" | "Right" | "Top" | "Bottom";
  disabled?: boolean;
  fullWidth?: boolean;
  href?: string;
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  ariaLabel?: string;
  title?: string;
  children?: ReactNode;
  /** When true, render an icon-only circular button (e.g. theme toggle). */
  iconOnly?: boolean;
  /** Extra CSS class appended to the Syncfusion button (e.g. layout classes). */
  cssClass?: string;
  /** id of the element the button controls (paired with `ariaExpanded`). */
  ariaControls?: string;
  /** current expanded state of the controlled region. */
  ariaExpanded?: boolean;
}

/** Map our app variants to Syncfusion ButtonComponent props. */
function variantToConfig(variant: SfButtonVariant, iconOnly: boolean) {
  switch (variant) {
    case "primary":
      return { isPrimary: true as const, cssClass: "sf-btn" + (iconOnly ? " sf-btn--icon-only" : "") };
    case "outline":
      return { isPrimary: false as const, cssClass: "e-outline sf-btn" };
    case "flat":
      return { isPrimary: false as const, cssClass: "e-flat sf-btn" + (iconOnly ? " e-round sf-btn--icon-only" : "") };
    case "link":
      return { isPrimary: false as const, cssClass: "e-link sf-btn" };
    case "default":
    default:
      return { isPrimary: false as const, cssClass: "sf-btn" };
  }
}

export function SfButton({
  variant = "default",
  iconCss,
  iconPosition = "Left",
  disabled,
  fullWidth,
  href,
  type = "button",
  onClick,
  ariaLabel,
  title,
  children,
  iconOnly,
  cssClass: extraCssClass,
  ariaControls,
  ariaExpanded,
}: SfButtonProps) {
  const config = variantToConfig(variant, !!iconOnly);
  const cssClass = [
    config.cssClass,
    fullWidth ? "sf-btn--block" : "",
    extraCssClass ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  // The React wrapper exposes `cssClass` at runtime but the strict TS
  // declaration file in 35.1.37 omits it. Cast to allow the prop while
  // the public API contract is preserved through SfButton.
  const buttonProps = {
    isPrimary: config.isPrimary,
    cssClass,
    iconCss,
    iconPosition,
    disabled,
    type,
    onClick: onClick as MouseEventHandler<HTMLButtonElement>,
    "aria-label": ariaLabel,
    title,
    ...(ariaControls ? { "aria-controls": ariaControls } : {}),
    ...(ariaExpanded !== undefined ? { "aria-expanded": ariaExpanded } : {}),
    ...(href ? { href } : {}),
  } as unknown as React.ComponentProps<typeof ButtonComponent>;

  return (
    <ButtonComponent {...buttonProps}>
      {children}
    </ButtonComponent>
  );
}
