/* =====================================================================
   SfSidebar — thin wrapper around Syncfusion SidebarComponent.
   Centralises the dock / over behaviour so call-sites stay short.
   ===================================================================== */

import { SidebarComponent } from "@syncfusion/ej2-react-navigations";
import type { ReactNode } from "react";

interface SfSidebarProps {
  id: string;
  /** "Over" (drawer) or "Push" (default app navigation). */
  type?: "Over" | "Push" | "Slide" | "Auto";
  /** "Left" (default nav) or "Right" (e.g. article drawer). */
  position?: "Left" | "Right";
  /** Expanded width in pixels. */
  width?: string | number;
  /** Dock behaviour — when true, the sidebar shrinks to `dockSize`. */
  enableDock?: boolean;
  dockSize?: string;
  mediaQuery?: string;
  isOpen?: boolean;
  closeOnDocumentClick?: boolean;
  showBackdrop?: boolean;
  /** Slide-in animation. Off for the first paint so the sidebar does not fly in. */
  animate?: boolean;
  zIndex?: string | number;
  onOpen?: () => void;
  onClose?: () => void;
  children?: ReactNode;
  ariaLabel?: string;
}

export function SfSidebar(props: SfSidebarProps) {
  // The React wrapper exposes these props at runtime but the strict TS
  // declaration file in 35.1.37 omits a few (`onOpen`, `onClose`).
  const { children, ariaLabel, ...rest } = props;
  const sidebarProps = {
    ...rest,
    "aria-label": ariaLabel,
  } as unknown as React.ComponentProps<typeof SidebarComponent>;
  return (
    <SidebarComponent {...sidebarProps} enableGestures={false}>
      {children}
    </SidebarComponent>
  );
}
