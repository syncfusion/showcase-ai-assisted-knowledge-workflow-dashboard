/* =====================================================================
   Syncfusion Chart wrapper.
   Uses @syncfusion/ej2-react-charts with theme=Tailwind3 (+ Dark) so the
   axis / grid / tooltip colour comes from the licensed theme stylesheet
   once it is dropped into src/styles/. Data colours are explicit.

   Every chart is keyed by the app theme, so a theme change re-creates it.
   Syncfusion 35.1.41 keeps the first theme's axis, legend and title text
   colours when `theme` changes on a live chart: the dark chart's `#FFFFFFE6`
   labels stayed on the white card after a dark → light switch, and the
   light chart's grey labels stayed on the dark card the other way
   (syncfusion-component-patterns.md, "A chart is re-created when the theme
   changes"). A fresh chart draws the new theme's frame.
   ===================================================================== */

import { useId, useMemo } from "react";
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  LineSeries,
  ColumnSeries,
  PieSeries,
  AccumulationLegend,
  AccumulationDataLabel,
  AccumulationTooltip,
  AccumulationChartComponent,
  AccumulationSeriesCollectionDirective,
  AccumulationSeriesDirective,
  Category,
  DateTime,
  Legend,
  Tooltip,
  DataLabel,
} from "@syncfusion/ej2-react-charts";
import { useTheme } from "@/components/shell/ThemeContext";
import { CHART_DATE_AXIS_FORMAT, CHART_DATE_FORMAT } from "@/core/format/format";
import { CHART_SERIES_SLOTS, readableInkOn } from "@/styles/palette";
import type { AccumulationSeriesModel, IAccTextRenderEventArgs } from "@syncfusion/ej2-charts";

export interface ChartPoint { x: string; y: number; }
export interface BarPoint  { x: string; y: number; }
export interface DonutPoint{ x: string; y: number; }

interface LineProps {
  data: ChartPoint[];
  height?: number;
  title?: string;
  secondary?: ChartPoint[];
  /**
   * Formats the x-axis labels as dates. The default (`Category`) keeps the
   * raw `x` string; `date` renders day / month / year instead.
   */
  xAxisFormat?: "category" | "date";
}

export function SfLineChart({ data, secondary, height = 240, xAxisFormat = "category" }: LineProps) {
  const reactId = useId();
  const { theme } = useTheme();
  const palette = useChartPalette(theme);
  // A DateTime axis is a different axis type from Category: it parses `x` as
  // a date, picks its own label interval so the labels fit, and formats the
  // day / month / year through the axis format below.
  const isDateAxis = xAxisFormat === "date";
  return (
    <ChartComponent
      key={theme}
      id={`sf-line-${useDomId(reactId, "line")}`}
      primaryXAxis={
        isDateAxis
          ? {
              valueType: "DateTime",
              labelFormat: CHART_DATE_AXIS_FORMAT,
              // `Hide` drops a label that would collide with its neighbour
              // instead of letting the two overlap or trimming one to "Oct…".
              labelIntersectAction: "Hide",
              // One label per day, so every point in the daily trend is named
              // rather than thinned to a few dates.
              intervalType: "Days",
              interval: 1,
            }
          : {
              valueType: "Category",
              // 24 month names do not fit on one axis, so the chart thinned
              // them and trimmed the survivors to "Mar 20…". `Hide` drops the
              // label that would collide with its neighbour instead, so every
              // label that is drawn is whole
              // (syncfusion-component-patterns.md, "Chart labels fit the chart").
              labelIntersectAction: "Hide",
            }
      }
      primaryYAxis={{ labelFormat: "${value}K", majorTickLines: { color: "transparent" } }}
      tooltip={{
        enable: true,
        shared: true,
        // `${point.x:…}` formats the x value as a date in the tooltip. The
        // plain `${point.x}` would carry the axis label's own line break, so
        // it would read "Oct 112026".
        format: isDateAxis
          ? "${series.name} ${point.x:" + CHART_DATE_FORMAT + "}: <b>${point.y}</b>"
          : "${series.name} ${point.x}: <b>${point.y}</b>",
        // A shared tooltip's header is a separate token from its content, so
        // it needs the same date format.
        header: isDateAxis ? "${point.x:" + CHART_DATE_FORMAT + "}" : "${point.x}",
      }}
      legendSettings={{ visible: true }}
      // The date labels need room past the last point, or the final one is
      // clipped by the chart's own edge.
      margin={{ left: 12, right: isDateAxis ? 28 : 12, top: 12, bottom: 8 }}
      // Syncfusion React wrappers accept `theme` at runtime; the typed surface is narrower.
      {...({ theme: theme === "dark" ? "Tailwind3Dark" : "Tailwind3" } as Record<string, unknown>)}
      height={String(height)}
      palettes={[palette.series1, palette.series2, palette.reference]}
    >
      <Inject services={isDateAxis ? [LineSeries, DateTime, Legend, Tooltip] : [LineSeries, Category, Legend, Tooltip]} />
      <SeriesCollectionDirective>
        <SeriesDirective dataSource={data} xName="x" yName="y" name="Actual" width={2.5} fill={palette.series1} type="Line" marker={{ visible: true, width: 6, height: 6, fill: palette.series1 }} />
        {secondary ? (
          <SeriesDirective dataSource={secondary} xName="x" yName="y" name="Plan" width={2} fill={palette.series2} type="Line" dashArray="4 3" marker={{ visible: false }} />
        ) : null}
      </SeriesCollectionDirective>
    </ChartComponent>
  );
}

interface BarProps {
  data: BarPoint[];
  height?: number;
  barColors?: string[];
}

export function SfBarChart({ data, height = 240, barColors }: BarProps) {
  const reactId = useId();
  const { theme } = useTheme();
  const palette = useChartPalette(theme);
  return (
    <ChartComponent
      key={theme}
      id={`sf-bar-${useDomId(reactId, "bar")}`}
      primaryXAxis={{ valueType: "Category" }}
      primaryYAxis={{ labelFormat: "${value}K" }}
      tooltip={{ enable: true, format: "${point.x}: <b>${point.y}</b>" }}
      theme={theme === "dark" ? "Tailwind3Dark" : "Tailwind3"}
      height={String(height)}
      palettes={barColors ?? [palette.series1]}
      
    >
      <Inject services={[ColumnSeries, Category, Legend, Tooltip, DataLabel]} />
      <SeriesCollectionDirective>
        <SeriesDirective dataSource={data} xName="x" yName="y" name="Value" type="Column" cornerRadius={{ topLeft: 4, topRight: 4 }} />
      </SeriesCollectionDirective>
    </ChartComponent>
  );
}

interface DonutProps {
  data: DonutPoint[];
  height?: number;
  /**
   * The full name of each slice, keyed by the slice's `x` value. The legend
   * names the categories, and a legend on a narrow chart has no room for a
   * long name, so the short name goes in the legend and the full name goes in
   * the tooltip.
   */
  detailNames?: Record<string, string>;
}

/**
 * A donut of one categorical series.
 *
 * This is a Syncfusion **Accumulation Chart**, not the Cartesian `Chart`: a Pie
 * series is registered with the accumulation chart only, so binding one to a
 * `ChartComponent` renders an empty frame (the Cartesian chart has no Pie
 * series module). The series therefore lives on an `AccumulationSeriesDirective`.
 */
export function SfDonut({ data, height = 240, detailNames }: DonutProps) {
  const reactId = useId();
  const { theme } = useTheme();
  const palette = useChartPalette(theme);

  // The tooltip reads the full name from its own field, so the legend can keep
  // the short one.
  const tooltipData = detailNames
    ? data.map((d) => ({ ...d, detail: detailNames[d.x] ?? d.x }))
    : data;

  const series: AccumulationSeriesModel = {
    type: "Pie",
    dataSource: tooltipData,
    xName: "x",
    yName: "y",
    tooltipMappingName: "detail",
    innerRadius: "55%",
    radius: "80%",
    // The categories take chart series 1-8; never the theme palette, whose
    // later slots are orange-red, amber, red and green (status hues).
    palettes: palette.categories,
    // Every slice shows its share, so the reader never has to hover to compare.
    dataLabel: {
      visible: true,
      position: "Inside",
      maxWidth: 40,
    },
  };

  return (
    <AccumulationChartComponent
      key={theme}
      id={`sf-donut-${useDomId(reactId, "donut")}`}
      // The frame (legend text, tooltip chrome) follows the app theme.
      theme={theme === "dark" ? "Tailwind3Dark" : "Tailwind3"}
      legendSettings={{ visible: true, position: "Right", textWrap: "Wrap", maximumLabelWidth: 110 }}
      // The share, not the raw value: `${point.y}` is the number the slice is
      // sized by, and appending a % sign to it would print the raw share.
      tooltip={{ enable: true, format: "${point.tooltip}: <b>${point.percentage}%</b>" }}
      enableSmartLabels={true}
      height={String(height)}
      // The label sits inside the slice, so its ink is set per slice: the chart's
      // own choice puts white on every slice, and white on the teal slot reads
      // 3.7:1. `textRender` picks the ink that reads on the slice it lands on.
      textRender={(args: IAccTextRenderEventArgs) => {
        const slice = args.point?.color ?? "";
        args.text = `${(args.point?.percentage ?? 0).toFixed(1)}%`;
        args.font = { ...args.font, color: readableInkOn(slice) };
      }}
    >
      <Inject services={[PieSeries, AccumulationLegend, AccumulationDataLabel, AccumulationTooltip]} />
      <AccumulationSeriesCollectionDirective>
        <AccumulationSeriesDirective {...series} />
      </AccumulationSeriesCollectionDirective>
    </AccumulationChartComponent>
  );
}

/* The categorical series — non-status hues only (per design system). */
interface Palette {
  series1: string; series2: string; series3: string; series4: string; series5: string;
  series6: string; series7: string; series8: string;
  reference: string;
  /** The eight category colours, in slot order. */
  categories: string[];
}
function useChartPalette(theme: "light" | "dark"): Palette {
  return useMemo(() => {
    const cs = getComputedStyle(document.documentElement);
    const categories = CHART_SERIES_SLOTS.map((n) =>
      cs.getPropertyValue(`--sf-chart-series-${n}`).trim(),
    );
    return {
      series1: categories[0],
      series2: categories[1],
      series3: categories[2],
      series4: categories[3],
      series5: categories[4],
      series6: categories[5],
      series7: categories[6],
      series8: categories[7],
      categories,
      reference: cs.getPropertyValue("--sf-chart-reference").trim(),
    };
  }, [theme]);
}

/**
 * A DOM-safe suffix for a chart element id. `useId` returns a value containing
 * React's `:` prefix, which is legal in an id but awkward in a CSS selector, so
 * it is stripped here. Using it rather than `Math.random()` keeps the id stable
 * across re-renders, so a re-measure or a focus call can still find the chart.
 */
function useDomId(reactId: string, prefix: string): string {
  return `${prefix}-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}
