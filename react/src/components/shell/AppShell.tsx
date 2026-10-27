/* =====================================================================
   App shell — Syncfusion Sidebar (left navigation) + SfButton in the
   header, wrapping the routed page outlet.
   ===================================================================== */

import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { TooltipComponent } from "@syncfusion/ej2-react-popups";
import type { Position } from "@syncfusion/ej2-react-popups";
import { SfSidebar } from "@/components/primitives/SfSidebar";
import { SfButton } from "@/components/primitives/SfButton";
import { useTheme } from "@/components/shell/ThemeContext";

const NARROW_QUERY = "(max-width: 1023.98px)";

/** The collapsed choice is remembered per app (syncfusion-component-patterns.md). */
const STORAGE_KEY = "ai-assisted-knowledge-workflow.nav-collapsed";

function readCollapsed(key: string) {
  try { return localStorage.getItem(key) === "true"; } catch { return false; }
}

/** Narrow = the sidebar becomes an off-canvas drawer; wide = it pushes the content. */
function useNarrow() {
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia(NARROW_QUERY).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(NARROW_QUERY);
    const sync = () => setNarrow(media.matches);
    // Some engines skip the media-query change event under size emulation or zoom;
    // the resize listener keeps the shell in step either way.
    media.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);
  return narrow;
}

const NAV: Array<{ to: string; label: string; icon: React.ReactNode; route: string; index: boolean }> = [
  {
    to: "/",
    index: true,
    label: "Copilot Hub",
    route: "/",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" />
      </svg>
    ),
  },
  {
    to: "/knowledge",
    index: false,
    label: "Knowledge",
    route: "/knowledge",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z" /><path d="M4 16a4 4 0 0 1 4-4h10" />
      </svg>
    ),
  },
  {
    to: "/workflows",
    index: false,
    label: "Workflows",
    route: "/workflows",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    to: "/analytics",
    index: false,
    label: "Analytics",
    route: "/analytics",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 15v-4M12 15V8M16 15v-7" />
      </svg>
    ),
  },
];

const PANEL_LEFT_CLOSE_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /><path d="M16 9l-3 3 3 3" />
  </svg>
);
const PANEL_LEFT_OPEN_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /><path d="M13 9l3 3-3 3" />
  </svg>
);
const MENU_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16M4 12h16M4 18h16"/>
  </svg>
);

const SUN_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
  </svg>
);
const MOON_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
  </svg>
);

export function AppShell() {
  const { theme, toggle } = useTheme();
  const narrow = useNarrow();
  const [collapsed, setCollapsed] = useState(() => readCollapsed(STORAGE_KEY));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [animate, setAnimate] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // No slide-in animation on first paint; animate user toggles only.
  useEffect(() => { setAnimate(true); }, []);
  useEffect(() => { if (!narrow) setDrawerOpen(false); }, [narrow]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(collapsed)); } catch { /* optional */ }
  }, [collapsed]);

  function toggleNavigation() {
    if (narrow) {
      setDrawerOpen(open => !open);
      document.body.classList.toggle("menu-open");
    } else {
      setCollapsed(value => !value);
    }
  }

  // Docking changes the content width without a window resize, which is the only signal
  // Syncfusion charts re-measure on — announce it once the width transition has finished.
  useEffect(() => {
    if (narrow || !animate) return;
    const main = mainRef.current;
    let done = false;
    const announce = () => {
      if (done) return;
      done = true;
      window.dispatchEvent(new Event("resize"));
    };
    const onEnd = (event: TransitionEvent) => {
      if (event.target === main && event.propertyName === "margin-left") announce();
    };
    main?.addEventListener("transitionend", onEnd);
    // Reduced motion: no transition fires, so fall back to a timer.
    const fallback = window.setTimeout(announce, 400);
    return () => {
      main?.removeEventListener("transitionend", onEnd);
      window.clearTimeout(fallback);
    };
  }, [collapsed, narrow, animate]);

  const navExpanded = narrow ? drawerOpen : !collapsed;
  const toggleLabel = narrow
    ? drawerOpen ? "Close navigation" : "Open navigation"
    : collapsed ? "Expand navigation" : "Collapse navigation";
  const toggleIcon = narrow ? MENU_ICON : collapsed ? PANEL_LEFT_OPEN_ICON : PANEL_LEFT_CLOSE_ICON;

  return (
    <div className="app-frame" data-nav={narrow ? "drawer" : collapsed ? "docked" : "expanded"}>
      {/*
        No `target`: Syncfusion would take `targetEle` from `element.nextElementSibling`,
        which is `.main`, and then write the push offset itself. Leaving `target` unset
        keeps that single owner, so the content offset and the docked width always agree.
        Dock only on wide screens — `type="Over"` + `enableDock` pins a 64px `margin-left`
        onto `.main` even while the drawer is closed.
      */}
      <SfSidebar
        id="app-sidebar"
        type={narrow ? "Over" : "Push"}
        position="Left"
        width="200px"
        enableDock={!narrow}
        dockSize="64px"
        isOpen={narrow ? drawerOpen : !collapsed}
        closeOnDocumentClick={false}
        showBackdrop={narrow}
        animate={animate}
        zIndex={1001}
        ariaLabel="Primary"
      >
        <div className="sidebar__brand">
          <span className="sidebar__brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6z" />
            </svg>
          </span>
          <span className="sidebar__brand-text">
            <strong>Northwind</strong>
            <span>Copilot Suite</span>
          </span>
        </div>

        <nav className="sidebar__nav" aria-label="Primary">
          {NAV.map((n) => (
            <TooltipComponent key={n.to} content={n.label} position={"Right" as Position} target={`#app-sidebar a[data-route="${n.route}"]`} windowCollision={true}>
              <NavLink
                to={n.to}
                end={n.index}
                data-route={n.route}
                className={({ isActive }) => "sidebar__link" + (isActive ? " is-active" : "")}
              >
                <span className="sidebar__icon" aria-hidden="true">{n.icon}</span>
                {/* Visually hidden when docked, never removed: it is the link's accessible name. */}
                <span className="sidebar__label">{n.label}</span>
              </NavLink>
            </TooltipComponent>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <span className="sidebar__avatar">EM</span>
            <span className="sidebar__user-meta">
              <strong>Elena Marsh</strong>
              <span>VP, Revenue Operations</span>
            </span>
          </div>
          <SfButton
            variant="flat"
            iconOnly
            ariaLabel="Toggle theme"
            title="Toggle theme"
            onClick={toggle}
          >
            {theme === "dark" ? SUN_ICON : MOON_ICON}
          </SfButton>
        </div>
      </SfSidebar>

      <div className="main" ref={mainRef}>
        <header className="header">
          <SfButton
            variant="flat"
            iconOnly
            cssClass="header__menu"
            ariaLabel={toggleLabel}
            title={toggleLabel}
            ariaControls="app-sidebar"
            ariaExpanded={navExpanded}
            onClick={toggleNavigation}
          >
            {toggleIcon}
          </SfButton>
        </header>
        <main className="view" role="main" aria-live="polite">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
