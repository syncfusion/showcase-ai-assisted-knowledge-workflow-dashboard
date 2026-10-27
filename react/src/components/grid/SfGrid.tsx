/* =====================================================================
   Syncfusion Grid wrapper.

   The Grid has no `theme` property of its own (35.1.41): its look comes
   from the Tailwind 3 theme bundle, which paints every material control
   from `--color-sf-*` custom properties and ships a light value in
   `:root` and a dark value in `.e-dark-mode`. The theme provider puts
   that class on the document element, so the Grid follows the app theme
   without any prop of its own.
   ===================================================================== */

import { useMemo } from "react";
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  Page,
  Sort,
  Filter,
  Toolbar,
  ExcelExport,
  Search,
} from "@syncfusion/ej2-react-grids";
import { fmtCompactMoney, fmtNumber, fmtPct, fmtSignedPct } from "@/core/format/format";

/** The tone a pill-tone column paints its value in. */
export type SfTone = "success" | "warning" | "danger" | "info" | "neutral";

/** The tone names a pill-tone value may carry on its own. */
const TONES: readonly SfTone[] = ["success", "warning", "danger", "info", "neutral"];

export type SfColumn =
  | { header: string; field: string; width?: number; format?: "text" }
  | { header: string; field: string; width?: number; format: "money"; align?: "right" }
  | { header: string; field: string; width?: number; format: "count"; align?: "right" }
  | { header: string; field: string; width?: number; format: "pct"; align?: "right" }
  /** A 0–1 ratio (confidence), shown as a percentage. */
  | { header: string; field: string; width?: number; format: "ratio"; align?: "right" }
  | {
      header: string;
      field: string;
      width?: number;
      format: "pill-tone";
      /**
       * The tone per value. Without one, the value carries the tone name
       * itself ("success", "warning", …) and is read as the tone.
       */
      toneMap?: Record<string, SfTone>;
    };

interface Props<T extends Record<string, unknown>> {
  data: T[];
  columns: SfColumn[];
  height?: number | string;
  allowSearch?: boolean;
  /** The accessible name for the toolbar's search input. */
  searchLabel?: string;
  /** Called with the row's data when a row is clicked. */
  rowClicked?: (row: T) => void;
}

// Re-exported formatter used by callers and tests that render column
// values outside the Syncfusion template path (e.g. csv exports).
export const formatGridCell = (col: SfColumn, v: unknown): string => {
  if (v == null) return "";
  if (col.format === "money") return fmtCompactMoney(Number(v));
  if (col.format === "count") return fmtNumber(Number(v));
  if (col.format === "pct")   return fmtSignedPct(Number(v));
  if (col.format === "ratio") return fmtPct(Number(v) * 100);
  return String(v);
};

/**
 * The tone a pill-tone column paints its value in.
 *
 * A column's `toneMap` names the tone per value. Without one, the value is
 * itself the tone name (the Analytics drilldown's `tone` field holds
 * "success", "warning" and so on), so it is read as the tone.
 */
function pillTone(col: SfColumn, value: unknown): SfTone {
  if (col.format !== "pill-tone") return "info";
  const text = String(value ?? "");
  const mapped = col.toneMap?.[text];
  if (mapped) return mapped;
  return (TONES as readonly string[]).includes(text) ? (text as SfTone) : "info";
}

export function SfGrid<T extends Record<string, unknown>>({
  data,
  columns,
  height = '100%',
  allowSearch = false,
  searchLabel = "Search",
  rowClicked,
}: Props<T>) {
  const gridId = useMemo(() => `sf-grid-${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <div className="sf-host sf-host--grid">
      <GridComponent
        id={gridId}
        dataSource={data}
        height={height}
        allowPaging
        allowSorting
        allowFiltering
        allowTextWrap
        pageSettings={{ pageSize: 8, pageSizes: [8, 16, 32] }}
        toolbar={allowSearch ? ["Search"] : undefined}
        // Syncfusion's `recordClick` carries the row's data in `rowData`.
        recordClick={rowClicked ? (args: { rowData: T }) => rowClicked(args.rowData) : undefined}
        created={() => {
          // The Syncfusion built-in Search item has no accessible name by
          // default; set one so the input satisfies the accessibility rule.
          const input = document.querySelector(`#${gridId} .e-toolbar input.e-input`) as HTMLInputElement | null;
          if (input && !input.getAttribute("aria-label")) input.setAttribute("aria-label", searchLabel);
        }}
      >
        <ColumnsDirective>
          {columns.map((c, i) =>
            c.format === "pill-tone" ? (
              <ColumnDirective
                key={i}
                headerText={c.header}
                template={(row: Record<string, unknown>) => {
                  const tone = pillTone(c, row[c.field]);
                  return (
                    <span className={`e-chip sf-chip sf-chip--${tone}`}>
                      {String(row[c.field] ?? "")}
                    </span>
                  );
                }}
                width={c.width}
                textAlign="Center"
              />
            ) : c.format ? (
              // A formatted column draws its value through a template: the Grid
              // has no formatter of its own, so a `field` alone would print the
              // raw number (an ARR of 12000000 rather than "$12.0M").
              <ColumnDirective
                key={i}
                headerText={c.header}
                template={(row: Record<string, unknown>) => formatGridCell(c, row[c.field])}
                width={c.width}
                textAlign={(c as { align?: string }).align === "right" ? "Right" : "Left"}
              />
            ) : (
              <ColumnDirective
                key={i}
                headerText={c.header}
                field={c.field}
                // Use template for the column customizations
                width={c.width}
                textAlign={(c as { align?: string }).align === "right" ? "Right" : "Left"}
              />
            ),
          )}
        </ColumnsDirective>
        <Inject services={[Page, Sort, Filter, Toolbar, ExcelExport, Search]} />
      </GridComponent>
    </div>
  );
}
