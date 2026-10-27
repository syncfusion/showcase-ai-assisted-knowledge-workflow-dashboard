/* =====================================================================
   MeasuredChartCard — lazy-loaded chart that knows its width before it
   mounts. Renders the active theme's chart palette, the chart itself, and
   a sized skeleton fallback so the container does not collapse while the
   chunk downloads. Sized from the card's bounding rect (no
   `chart.refresh()` from a ResizeObserver, per the standards).
   ===================================================================== */

import { Suspense, lazy, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SfCard } from "@/components/primitives/SfCard";
import { useTheme } from "@/components/shell/ThemeContext";

const SfLineChart = lazy(() =>
  import("@/components/charts/SfChart").then((m) => ({ default: m.SfLineChart })),
);
const SfBarChart = lazy(() =>
  import("@/components/charts/SfChart").then((m) => ({ default: m.SfBarChart })),
);
const SfDonut = lazy(() =>
  import("@/components/charts/SfChart").then((m) => ({ default: m.SfDonut })),
);

/** A skeleton that matches the card's expected height and gives the chart time to load. */
function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="skeleton measured-chart__skeleton"
      style={{ height: `${height}px` }}
      role="status"
      aria-label="Loading chart"
    />
  );
}

/**
 * Hook: measure a container's floored pixel width. A ResizeObserver writes
 * new state only when the floored width differs from the previous one — that
 * avoids the page-jump caused by every observer tick redrawing the chart.
 */
function useMeasuredWidth(deps: unknown[]) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const w = Math.floor(node.getBoundingClientRect().width);
      if (w > 0) setWidth((prev) => (prev === w ? prev : w));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { ref, width };
}

interface Props {
  title: string;
  subtitle?: ReactNode;
  /** Pixel height of the chart's drawing area; the card reserves it so layout does not shift. */
  height?: number;
  /** Trailing slot for the card header (chips, dropdowns, …). */
  trailing?: ReactNode;
  /** The chart kind, plus its data. */
  chart:
    | { kind: "line"; data: { x: string; y: number }[]; secondary?: { x: string; y: number }[]; xAxisFormat?: "category" | "date" }
    | { kind: "bar"; data: { x: string; y: number }[]; barColors?: string[] }
    | { kind: "donut"; data: { x: string; y: number }[] };
  ariaLabel?: string;
}

/**
 * The chart is rendered only once the container has been measured, then
 * keyed to the active theme so a `theme` change recreates the chart
 * (syncfusion-component-patterns.md, "Charts: a chart is re-created when
 * the theme changes").
 */
export function MeasuredChartCard({ title, subtitle, trailing, height = 260, chart, ariaLabel }: Props) {
  const { theme } = useTheme();
  const { ref, width } = useMeasuredWidth([theme]);
  const themedKey = useMemo(() => `chart-${theme}-${chart.kind}`, [theme, chart.kind]);

  return (
    <SfCard title={title} subtitle={subtitle} trailing={trailing} ariaLabel={ariaLabel}>
      <div ref={ref} className="measured-chart" style={{ minHeight: height }}>
        {width === null ? (
          <ChartSkeleton height={height} />
        ) : (
          <Suspense fallback={<ChartSkeleton height={height} />}>
            <div key={themedKey} style={{ width }}>
              {chart.kind === "line" ? (
                <SfLineChart data={chart.data} secondary={chart.secondary} height={height} xAxisFormat={chart.xAxisFormat} />
              ) : chart.kind === "bar" ? (
                <SfBarChart data={chart.data} height={height} barColors={chart.barColors} />
              ) : (
                <SfDonut data={chart.data} height={height} />
              )}
            </div>
          </Suspense>
        )}
      </div>
    </SfCard>
  );
}