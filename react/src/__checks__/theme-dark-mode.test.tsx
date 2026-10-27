/**
 * Theme verification — the dark-theme defects reported against the Analytics
 * and Knowledge pages.
 *
 *  1. The Grid has no `theme` property of its own: the Syncfusion Tailwind 3
 *     theme bundle paints it from `--color-sf-*` custom properties, and ships
 *     its dark values under `.e-dark-mode`. Without that class the Grid kept
 *     its white header and near-black text on the dark page.
 *  2. A chart keeps the first theme's axis, legend and title text colours when
 *     `theme` changes on a live chart, so the chart is re-created on a theme
 *     change (`key={theme}`).
 *  3. A formatted Grid column draws its value through a template, so a ratio
 *     or a count is printed formatted rather than raw.
 *
 * jsdom does not load the theme bundle's stylesheet, so these assert the
 * contract the CSS and the components key off (the `e-dark-mode` class, the
 * chart's re-created element, the rendered cell text) rather than computed
 * pixel colours.
 *
 * Run with: npx vitest run src/__checks__/theme-dark-mode.test.tsx
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { SfGrid, formatGridCell, type SfColumn } from "@/components/grid/SfGrid";
import { SfLineChart } from "@/components/charts/SfChart";
import { ThemeProvider, useTheme } from "@/components/shell/ThemeContext";

const DARK_CLASS = "e-dark-mode";

/** A button that toggles the theme, so a test can drive the switch. */
function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return <button onClick={toggle}>{theme}</button>;
}

function renderWithTheme(node: React.ReactNode) {
  return render(
    <ThemeProvider>
      {node}
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe("theme switching", () => {
  beforeEach(() => {
    // The Syncfusion wrappers defer work to timers; the timers are driven
    // explicitly so none of them outlive the test.
    vi.useFakeTimers();
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.classList.remove(DARK_CLASS);
    // jsdom has no SVG geometry, so the chart's series animation cannot
    // measure its path. The animation is not what these tests check.
    (SVGElement.prototype as unknown as { getTotalLength: () => number }).getTotalLength = () => 0;
  });

  afterEach(async () => {
    // The Syncfusion wrappers defer some of their work to a timer, which would
    // then fire after the environment is torn down. The timers are run and
    // cleared here so nothing outlives the test.
    await act(async () => {
      vi.runOnlyPendingTimers();
      await Promise.resolve();
    });
    cleanup();
    vi.useRealTimers();
  });

  it("marks the document with the Syncfusion dark-mode class in dark theme", () => {
    localStorage.setItem("copilot.theme", "dark");
    renderWithTheme(<span />);

    // The class is the only thing that turns the Grid and the other material
    // controls dark: the bundle ships every `--color-sf-*` value twice, a light
    // one in `:root` and a dark one under `.e-dark-mode`.
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(true);
  });

  it("removes the Syncfusion dark-mode class when the theme goes back to light", () => {
    localStorage.setItem("copilot.theme", "dark");
    const { getByText } = renderWithTheme(<span />);
    expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(true);

    act(() => {
      getByText("dark").click();
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(false);
  });

  it("re-creates a chart when the theme changes, so it draws the new theme's frame", async () => {
    localStorage.setItem("copilot.theme", "dark");
    const { baseElement, getByText } = renderWithTheme(
      <SfLineChart data={[{ x: "Jan 2024", y: 12 }]} height={200} />,
    );

    // The chart element itself: a live chart keeps its first theme's ink, so
    // the chart is re-created on a theme change. The re-creation is keyed on
    // the theme, so the DOM node is a different one.
    const chartNode = () => baseElement.querySelector(".e-chart");
    const before = chartNode();
    expect(before, "the chart must be drawn").toBeTruthy();

    await act(async () => {
      getByText("dark").click();
      // Let the re-created chart finish its own render pass before the
      // assertion, and before the environment is torn down.
      vi.runOnlyPendingTimers();
      await Promise.resolve();
    });

    const after = chartNode();
    expect(after, "the chart must be drawn after the switch").toBeTruthy();
    expect(after, "the chart must be re-created on a theme change").not.toBe(before);
    // The old chart is gone, not left behind beside the new one.
    expect(baseElement.querySelectorAll(".e-chart")).toHaveLength(1);
  });

  it("keeps the chart's own id stable across the re-creation", async () => {
    // The re-creation is keyed on the theme, so the chart's own id — which the
    // page and the browser check address it by — must not drift.
    localStorage.setItem("copilot.theme", "dark");
    const { baseElement, getByText } = renderWithTheme(
      <SfLineChart data={[{ x: "Jan 2024", y: 12 }]} height={200} />,
    );
    const before = baseElement.querySelector(".e-chart")?.id;

    await act(async () => {
      getByText("dark").click();
      vi.runOnlyPendingTimers();
      await Promise.resolve();
    });

    expect(baseElement.querySelector(".e-chart")?.id).toBe(before);
  });
});

describe("grid columns", () => {
  beforeEach(() => {
    // The Syncfusion wrappers defer some of their work to a timer.
    vi.useFakeTimers();
    (SVGElement.prototype as unknown as { getTotalLength: () => number }).getTotalLength = () => 0;
  });

  afterEach(async () => {
    await act(async () => {
      vi.runOnlyPendingTimers();
      await Promise.resolve();
    });
    cleanup();
    vi.useRealTimers();
  });

  it("formats a ratio column as a percentage", () => {
    const col: SfColumn = { header: "Confidence", field: "confidence", format: "ratio", align: "right" };
    expect(formatGridCell(col, 0.93)).toBe("93.0%");
  });

  it("formats a count column with thousands separators", () => {
    const col: SfColumn = { header: "Reads", field: "reads", format: "count", align: "right" };
    expect(formatGridCell(col, 2410)).toBe("2,410");
  });

  it("formats a money column compactly", () => {
    const col: SfColumn = { header: "ARR", field: "arr", format: "money", align: "right" };
    expect(formatGridCell(col, 12000000)).toBe("$12.00M");
  });

  it("prints the formatted value in the cell, not the raw number", () => {
    const columns: SfColumn[] = [
      { header: "Confidence", field: "confidence", format: "ratio", align: "right" },
      { header: "Reads", field: "reads", format: "count", align: "right" },
    ];
    const data = [{ confidence: 0.93, reads: 2410 }];
    const { baseElement } = renderWithTheme(
      <SfGrid data={data} columns={columns} />,
    );

    // jsdom does not lay the Grid's rows out (the Syncfusion Grid renders its
    // body in a measure pass jsdom cannot do), so the columns' own templates
    // are asserted: they are what draws the cell.
    const grid = baseElement.querySelector(".e-grid") as unknown as {
      ej2_instances?: Array<{ columns: Array<{ headerText: string; template?: (row: unknown) => unknown }> }>;
    };
    const rendered = grid.ej2_instances?.[0]?.columns.map((column) => ({
      header: column.headerText,
      value: column.template?.(data[0]),
    }));

    expect(rendered?.map((c) => c.value)).toEqual(["93.0%", "2,410"]);
  });

  it("paints a pill-tone column with the tone its value carries", () => {
    // The Analytics drilldown's `tone` field holds the tone name itself, so a
    // column with no `toneMap` reads the tone from the value.
    const columns: SfColumn[] = [{ header: "Status", field: "tone", format: "pill-tone" }];
    const data = [{ tone: "success" }, { tone: "warning" }, { tone: "danger" }];
    const { baseElement } = renderWithTheme(<SfGrid data={data} columns={columns} />);

    const grid = baseElement.querySelector(".e-grid") as unknown as {
      ej2_instances?: Array<{ columns: Array<{ template?: (row: unknown) => { props: { className: string } } }> }>;
    };
    const classes = grid.ej2_instances?.[0]?.columns.map((column) =>
      (column.template?.(data[0]) as { props: { className: string } }).props.className,
    );

    expect(classes?.[0]).toContain("sf-chip--success");
  });

  it("paints a pill-tone column from its tone map when it has one", () => {
    // The Knowledge page's Status column maps each status name to a tone.
    const columns: SfColumn[] = [
      {
        header: "Status",
        field: "status",
        format: "pill-tone",
        toneMap: { Published: "success", "Needs review": "warning" },
      },
    ];
    const data = [{ status: "Published" }, { status: "Needs review" }];
    const { baseElement } = renderWithTheme(<SfGrid data={data} columns={columns} />);

    const grid = baseElement.querySelector(".e-grid") as unknown as {
      ej2_instances?: Array<{ columns: Array<{ template?: (row: unknown) => { props: { className: string } } }> }>;
    };
    const template = grid.ej2_instances?.[0]?.columns[0]?.template;
    const className = (row: unknown) => (template?.(row) as { props: { className: string } }).props.className;

    expect(className(data[0])).toContain("sf-chip--success");
    expect(className(data[1])).toContain("sf-chip--warning");
  });

  it("hands the clicked row's data to the row callback", async () => {
    // Syncfusion's `recordClick` carries the row in `rowData`, not `data`.
    const columns: SfColumn[] = [{ header: "Title", field: "title" }];
    const data = [{ title: "Zero-trust access review checklist" }];
    const seen: unknown[] = [];
    const { baseElement } = renderWithTheme(
      <SfGrid data={data} columns={columns} rowClicked={(row) => seen.push(row)} />,
    );

    // The React wrapper applies the prop on its own pass, so the grid's
    // handlers are only in place once that pass has run.
    vi.runOnlyPendingTimers();
    await act(async () => {
      await Promise.resolve();
    });

    const grid = baseElement.querySelector(".e-grid") as unknown as {
      ej2_instances?: Array<{ recordClick: (args: { rowData: unknown }) => void }>;
    };
    const handler = grid.ej2_instances?.[0]?.recordClick;
    expect(handler, "the grid must carry a row click handler").toBeTypeOf("function");

    handler!({ rowData: data[0] });
    expect(seen).toEqual([data[0]]);
  });
});
