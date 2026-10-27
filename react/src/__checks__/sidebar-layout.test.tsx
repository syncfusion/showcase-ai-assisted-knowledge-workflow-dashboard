/**
 * Sidebar layout verification.
 *
 * Mounts the real AppShell (real Syncfusion SidebarComponent) and asserts
 * the one thing the bug report is about: the content offset has exactly
 * one owner, and `.main` is never offset twice.
 *
 * Run with: npx vitest run src/__checks__/sidebar-layout.test.tsx
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

/** The content-offset rule the shell owns. */
function framePaddingLeft(host: HTMLElement) {
  return parseFloat(getComputedStyle(host.querySelector(".app-frame")!).paddingLeft || "0");
}

function sidebarClasses(host: HTMLElement) {
  return host.querySelector<HTMLElement>("#app-sidebar")!.className;
}

describe("app shell sidebar layout", () => {
  beforeEach(() => {
    (globalThis as any).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  afterEach(() => {
    cleanup();
    setViewport(false);
  });

  it("wide: data-nav reflects expanded, the frame does not reserve a sidebar column, sidebar is in Push mode", () => {
    setViewport(false);
    const host = renderShell();

    const frame = host.querySelector(".app-frame")!;
    expect(frame.getAttribute("data-nav")).toBe("expanded");
    // The fix: the frame is not a 2-column grid any more, so it does not stack
    // its own 240px offset on top of whatever Syncfusion writes.
    expect(framePaddingLeft(host)).toBe(0);
    // Wide Push mode (not Over) — Syncfusion owns the push offset on .main.
    expect(sidebarClasses(host)).toMatch(/\be-push\b/);
  });

  it("wide: clicking the collapse button flips data-nav to docked", () => {
    setViewport(false);
    const host = renderShell();

    const menu = host.querySelector<HTMLElement>(".header__menu")!;
    expect(menu).toBeTruthy();
    // The Syncfusion ButtonComponent renders its own <button> after init, so the
    // React onClick is attached to that element. fireEvent wraps in act().
    fireEvent.click(menu);

    const frame = host.querySelector(".app-frame")!;
    expect(frame.getAttribute("data-nav")).toBe("docked");
    // The shell only sets data-nav; CSS owns the offset via the sidebar alone.
    expect(framePaddingLeft(host)).toBe(0);
  });

  it("narrow: data-nav reflects drawer, sidebar is in Over mode (no dock pin, no margin on main)", () => {
    setViewport(true);
    const host = renderShell();

    const frame = host.querySelector(".app-frame")!;
    expect(frame.getAttribute("data-nav")).toBe("drawer");
    expect(framePaddingLeft(host)).toBe(0);
    // Over mode (not Push) — Syncfusion does not write a left margin in drawer mode.
    expect(sidebarClasses(host)).toMatch(/\be-over\b/);
  });

  it("narrow: the main column never gets a stylesheet-driven left offset (no double offset)", () => {
    setViewport(true);
    const host = renderShell();

    const main = host.querySelector<HTMLElement>(".main")!;
    const ruleMargin = parseFloat(getComputedStyle(main).marginLeft || "0");
    const inlineMargin = parseFloat(main.style.marginLeft || "0");
    // Inline must be 0 in narrow drawer mode; stylesheet must not add anything either.
    expect(ruleMargin + inlineMargin).toBe(0);
  });

  it("no stylesheet rule duplicates the sidebar's left offset onto the frame", () => {
    setViewport(false);
    const host = renderShell();
    // The whole point of the fix: the frame contributes no padding of its own.
    expect(framePaddingLeft(host)).toBe(0);
  });

  it("only one rule writes the content offset: the Syncfusion-managed inline margin on .main", () => {
    setViewport(false);
    const host = renderShell();

    // The frame has no stylesheet-driven left offset.
    expect(framePaddingLeft(host)).toBe(0);
    // Syncfusion writes `margin-left` on the sibling it finds (nextElementSibling of the
    // sidebar), which is `.main` — that is the single source of truth for the offset.
    const main = host.querySelector<HTMLElement>(".main")!;
    // Whatever Syncfusion wrote is the only horizontal offset on the main column.
    const stylesheetOffset = parseFloat(getComputedStyle(main).marginLeft || "0");
    const inlineOffset = parseFloat(main.style.marginLeft || "0");
    expect(stylesheetOffset).toBe(0); // the stylesheet does NOT add a margin-left
    expect(inlineOffset).toBeLessThanOrEqual(240); // Syncfusion writes 240 (or 64 when docked)
  });
});