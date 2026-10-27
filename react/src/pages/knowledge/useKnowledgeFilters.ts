/* =====================================================================
   useKnowledgeFilters — the single hook that owns the Knowledge page's
   shared filter state. The grid, both drawers, every KPI, every chart and
   the AI panel all read it (Step 3.4 of the rebuild). Changing a filter
   updates all of them in one render, and the AI panel's scope string is
   built from the same state so its answer states the scope it describes.
   ===================================================================== */

import { useCallback, useMemo, useState } from "react";
import { knowledgeFixture } from "@/core/data/dataService";

export type ArticleStatusFilter = "all" | "Draft" | "Needs review" | "Published" | "Archived";

export interface KnowledgeFilters {
  search: string;
  topic: string;          // "all" or a topic from the fixture
  status: ArticleStatusFilter;
  owner: string;          // "all" or an owner name
  /** [start, end] as ISO strings; inclusive. */
  range: { start: string; end: string };
  /** Floor on the 0–1 confidence ratio. */
  minConfidence: number;
}

export interface FilterPill {
  /** Stable id used by the React key and the chip's remove handler. */
  id: string;
  /** The label that names the chip ("Topic", "Status", …). */
  label: string;
  /** The user-readable value ("Compliance", "Needs review", …). */
  value: string;
  /** What setting this pill removes. */
  reset: Partial<KnowledgeFilters>;
}

/** Minimum confidence value (the floor the slider can sit on). */
export const MIN_CONFIDENCE = 0;
export const MAX_CONFIDENCE = 1;

/** A default range that covers the fixture's whole date extent. */
export function defaultRange(): { start: string; end: string } {
  const dates = knowledgeFixture.articles.map((a) => a.updated).sort();
  return { start: dates[0] ?? "2026-07-18", end: dates[dates.length - 1] ?? "2026-10-15" };
}

export const DEFAULT_FILTERS: KnowledgeFilters = {
  search: "",
  topic: "all",
  status: "all",
  owner: "all",
  range: defaultRange(),
  minConfidence: 0,
};

/** True when the current filters differ from defaults — drives Reset's disabled state (F4). */
export function filtersAreDefault(f: KnowledgeFilters): boolean {
  return (
    f.search === "" &&
    f.topic === "all" &&
    f.status === "all" &&
    f.owner === "all" &&
    f.minConfidence === 0 &&
    f.range.start === DEFAULT_FILTERS.range.start &&
    f.range.end === DEFAULT_FILTERS.range.end
  );
}

/** Distinct owners across the corpus — for the owner DropDownList. */
export function distinctOwners(): string[] {
  return Array.from(new Set(knowledgeFixture.articles.map((a) => a.owner))).sort();
}

/** Build the list of removable pills from the current filters (F5). */
export function buildPills(f: KnowledgeFilters): FilterPill[] {
  const pills: FilterPill[] = [];
  if (f.search) {
    pills.push({
      id: "search",
      label: "Search",
      value: `"${f.search}"`,
      reset: { search: "" },
    });
  }
  if (f.topic !== "all") {
    pills.push({
      id: "topic",
      label: "Topic",
      value: f.topic,
      reset: { topic: "all" },
    });
  }
  if (f.status !== "all") {
    pills.push({
      id: "status",
      label: "Status",
      value: f.status,
      reset: { status: "all" },
    });
  }
  if (f.owner !== "all") {
    pills.push({
      id: "owner",
      label: "Owner",
      value: f.owner,
      reset: { owner: "all" },
    });
  }
  if (f.range.start !== DEFAULT_FILTERS.range.start || f.range.end !== DEFAULT_FILTERS.range.end) {
    pills.push({
      id: "range",
      label: "Updated",
      value: `${f.range.start} → ${f.range.end}`,
      reset: { range: { ...DEFAULT_FILTERS.range } },
    });
  }
  if (f.minConfidence > 0) {
    pills.push({
      id: "confidence",
      label: "Confidence",
      value: `≥ ${Math.round(f.minConfidence * 100)}%`,
      reset: { minConfidence: 0 },
    });
  }
  return pills;
}

export function useKnowledgeFilters() {
  const [filters, setFilters] = useState<KnowledgeFilters>(DEFAULT_FILTERS);

  const set = useCallback(<K extends keyof KnowledgeFilters>(key: K, value: KnowledgeFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const removePill = useCallback((pill: FilterPill) => {
    setFilters((prev) => ({ ...prev, ...pill.reset }));
  }, []);

  /** The articles that pass the current filters. */
  const articles = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return knowledgeFixture.articles.filter((a) => {
      if (filters.topic !== "all" && a.topic !== filters.topic) return false;
      if (filters.status !== "all" && a.status !== filters.status) return false;
      if (filters.owner !== "all" && a.owner !== filters.owner) return false;
      if (a.confidence < filters.minConfidence) return false;
      if (a.updated < filters.range.start || a.updated > filters.range.end) return false;
      if (q) {
        const hay =
          `${a.title} ${a.summary} ${a.id} ${a.owner} ${a.lastEditor} ${a.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filters]);

  const pills = useMemo(() => buildPills(filters), [filters]);

  /** Human-readable scope line for the AI panel (A2: "says which scope"). */
  const scope = useMemo(() => {
    const parts: string[] = [];
    if (filters.topic !== "all") parts.push(`Topic: ${filters.topic}`);
    if (filters.status !== "all") parts.push(`Status: ${filters.status}`);
    if (filters.owner !== "all") parts.push(`Owner: ${filters.owner}`);
    parts.push(`${filters.range.start} → ${filters.range.end}`);
    if (filters.minConfidence > 0) parts.push(`≥ ${Math.round(filters.minConfidence * 100)}% confidence`);
    if (filters.search) parts.push(`Search: "${filters.search}"`);
    return parts.join(" · ");
  }, [filters]);

  return {
    filters,
    set,
    reset,
    removePill,
    articles,
    pills,
    scope,
    isDefault: filtersAreDefault(filters),
  };
}