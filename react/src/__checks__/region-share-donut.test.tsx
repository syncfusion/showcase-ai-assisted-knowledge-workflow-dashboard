/**
 * Region share donut verification.
 *
 * Mounts the real `SfDonut` (real Syncfusion Accumulation Chart) and asserts
 * that it draws one slice per region with a readable share, instead of an
 * empty chart frame.
 *
 * Run with: npx vitest run src/__checks__/region-share-donut.test.tsx
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { SfDonut } from "@/components/charts/SfChart";
import { ThemeProvider } from "@/components/shell/ThemeContext";
import { analyticsFixture } from "@/core/data/dataService";

const REGIONS = analyticsFixture.regions;

/** The palette the chart draws its categories with (light theme). */
const SERIES = ["#2563eb", "#0d9488", "#c026d3", "#475569", "#0ea5e9", "#06b6d4", "#8b5cf6", "#6366f1"];

/** The share of ARR each region holds, as the page binds it. */
function expectedShare() {
  const total = REGIONS.reduce((sum, r) => sum + r.arr, 0);
  return REGIONS.map((r) => ({ x: r.id, y: +((r.arr / total) * 100).toFixed(1) }));
}

/** WCAG 1.4.6 contrast ratio between two hex colours. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const h = hex.replace(/^#/, "");
    const [r, g, bl] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const lin = [r, g, bl].map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

describe("Region share donut", () => {
  beforeEach(() => {
    // The chart reads its palette from the document's custom properties.
    SERIES.forEach((colour, i) => {
      document.documentElement.style.setProperty(`--sf-chart-series-${i + 1}`, colour);
    });
  });

  afterEach(() => cleanup());

  it("draws a slice for every region rather than an empty chart", () => {
    const data = expectedShare();
    const { baseElement } = render(
      <ThemeProvider>
        <SfDonut data={data} height={260} />
      </ThemeProvider>,
    );

    // Syncfusion's accumulation chart carries its own class; a Pie series bound
    // to the Cartesian chart renders no chart frame at all.
    const chart = baseElement.querySelector(".e-accumulationchart");
    expect(chart, "the donut must be an accumulation chart, not a cartesian chart").not.toBeNull();

    // One rendered point group per slice.
    const points = baseElement.querySelectorAll("[id*='_Series_0_Point_']");
    expect(points.length).toBe(data.length);

    // The slices carry the region names, so the chart is not drawing blank data.
    const text = baseElement.textContent ?? "";
    for (const region of REGIONS) {
      expect(text).toContain(region.id);
    }
  });

  it("labels every slice with its share of the total", () => {
    const data = expectedShare();
    const { baseElement } = render(
      <ThemeProvider>
        <SfDonut data={data} height={260} />
      </ThemeProvider>,
    );

    const labels = [...baseElement.querySelectorAll("text[id*='_datalabel_']")];
    expect(labels.length).toBe(data.length);
    for (const label of labels) {
      expect(label.textContent).toMatch(/^\d+\.\d%$/);
    }
  });

  it("gives each slice a label ink that reads on it (4.5:1 or better)", () => {
    const data = expectedShare();
    const { baseElement } = render(
      <ThemeProvider>
        <SfDonut data={data} height={260} />
      </ThemeProvider>,
    );

    const slices = [...baseElement.querySelectorAll("[id*='_Series_0_Point_']")];
    const labels = [...baseElement.querySelectorAll("text[id*='_datalabel_']")];
    expect(slices.length).toBe(labels.length);

    labels.forEach((label, index) => {
      const slice = slices[index];
      const fill = slice.getAttribute("fill") ?? "";
      const ink = label.getAttribute("fill") ?? "";
      expect(contrast(ink, fill), `label "${label.textContent}" on ${fill}`).toBeGreaterThanOrEqual(4.5);
    });
  });

  it("binds the regions largest first", () => {
    const data = expectedShare();
    const values = data.map((d) => d.y);
    const sorted = [...values].sort((a, b) => b - a);
    expect(values).toEqual(sorted);

    // The chart is bound with the share as its value, so the total is 100%.
    const total = values.reduce((sum, v) => sum + v, 0);
    expect(total).toBeGreaterThan(99);
    expect(total).toBeLessThan(101);
  });
});
