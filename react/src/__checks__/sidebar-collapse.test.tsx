/**
 * Sidebar collapse behaviour.
 *
 * Locks in the three defects fixed in this change:
 *  1. the expand/collapse toggle must be reachable from the <header> on wide
 *     screens, not only below the drawer breakpoint;
 *  2. docking must not remove a link's accessible name — the label stays in the
 *     DOM (hidden by CSS, not removed), so each collapsed icon-only link still
 *     has a name;
 *  3. the toggle must report what it controls.
 *
 * jsdom does not apply the layout stylesheet, so these assert the DOM contract
 * the CSS keys off (the `data-nav` attribute), not computed pixel widths.
 *
 * Run with: npx vitest run src/__checks__/sidebar-collapse.test.tsx
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppShell } from "@/components/shell/AppShell";
import { ThemeProvider } from "@/components/shell/ThemeContext";

function setViewport(narrow: boolean) {
  window.matchMedia = ((query: string) => ({
    media: query,
    matches: query.includes("1023.98") ? narrow : false,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

function renderShell(): HTMLElement {
  const result = render(
    <ThemeProvider>
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    </ThemeProvider>,
  );
  return result.baseElement as HTMLElement;
}

/** The button Syncfusion's ButtonComponent replaces on init. */
function toggleButton(host: HTMLElement) {
  return host.querySelector<HTMLButtonElement>("button.header__menu")!;
}

describe("sidebar collapse control", () => {
  beforeEach(() => {
    (globalThis as any).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    // The collapsed choice is remembered in localStorage; isolate each test so
    // a previous test's value cannot leak into the next one.
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    setViewport(false);
  });

  it("wide: the toggle is rendered inside the <header>, not only in the drawer breakpoint", () => {
    setViewport(false);
    const host = renderShell();

    const button = toggleButton(host);
    expect(button).toBeTruthy();
    expect(button.closest("header.header")).toBeTruthy();
  });

  it("wide: the toggle names its action and what it controls, and starts expanded", () => {
    setViewport(false);
    const host = renderShell();

    const button = toggleButton(host);
    expect(button.getAttribute("aria-label")).toBe("Collapse navigation");
    expect(button.getAttribute("aria-controls")).toBe("app-sidebar");
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(host.querySelector(".app-frame")!.getAttribute("data-nav")).toBe("expanded");
  });

  it("wide: clicking the toggle docks the nav and flips the button to its expand state", () => {
    setViewport(false);
    const host = renderShell();

    const button = toggleButton(host);
    fireEvent.click(button);

    expect(host.querySelector(".app-frame")!.getAttribute("data-nav")).toBe("docked");
    const after = toggleButton(host);
    expect(after.getAttribute("aria-label")).toBe("Expand navigation");
    expect(after.getAttribute("aria-expanded")).toBe("false");
  });

  it("collapsed: every link keeps its accessible name (labels stay in the DOM)", () => {
    setViewport(false);
    const host = renderShell();

    fireEvent.click(toggleButton(host));

    const links = [...host.querySelectorAll(".sidebar__link")];
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      // One navigation list: the icon is decorative, the label carries the name,
      // so hiding the label visually must not remove it from the DOM.
      expect(link.querySelector(".sidebar__icon")).toBeTruthy();
      const label = link.querySelector(".sidebar__label");
      expect(label).toBeTruthy();
      expect(label!.textContent?.trim().length).toBeGreaterThan(0);
      expect(link.textContent ?? "").toContain(label!.textContent ?? "@@");
    }
  });

  it("collapsed: the icon is the only visible part of each link, and it is marked decorative", () => {
    setViewport(false);
    const host = renderShell();

    fireEvent.click(toggleButton(host));

    for (const link of host.querySelectorAll(".sidebar__link")) {
      const icon = link.querySelector(".sidebar__icon")!;
      // The icon must not double up the link's accessible name; the label does that.
      expect(icon.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("the collapsed choice is remembered and restored on the next mount", () => {
    setViewport(false);
    const first = renderShell();
    fireEvent.click(toggleButton(first));
    expect(first.querySelector(".app-frame")!.getAttribute("data-nav")).toBe("docked");
    cleanup();

    setViewport(false);
    const second = renderShell();
    expect(second.querySelector(".app-frame")!.getAttribute("data-nav")).toBe("docked");
    expect(toggleButton(second).getAttribute("aria-label")).toBe("Expand navigation");
  });

  it("narrow: the toggle is a drawer control (open/close), independent of the collapsed rail", () => {
    setViewport(true);
    const host = renderShell();

    const button = toggleButton(host);
    expect(host.querySelector(".app-frame")!.getAttribute("data-nav")).toBe("drawer");
    expect(button.getAttribute("aria-label")).toBe("Open navigation");

    fireEvent.click(button);
    expect(toggleButton(host).getAttribute("aria-label")).toBe("Close navigation");
  });
});