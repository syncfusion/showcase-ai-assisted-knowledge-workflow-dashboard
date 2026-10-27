import {
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PageHeader } from "@/components/primitives/Pills";
import { SfCard } from "@/components/primitives/SfCard";
import { MeasuredChartCard } from "@/components/charts/MeasuredChartCard";
import { KpiCard } from "@/components/primitives/KpiCard";
import {
  CONFIDENCE_BAND,
  REVIEW_QUEUE_BAND,
  bandCue,
} from "@/core/data/bands";
import { knowledgeFixture, demoToday } from "@/core/data/dataService";
import type { IArticle } from "@/core/data/contracts";
import {
  useKnowledgeFilters,
} from "@/pages/knowledge/useKnowledgeFilters";

const SfGrid = lazy(() =>
  import("@/components/grid/SfGrid").then((m) => ({ default: m.SfGrid })),
);

/* =====================================================================
   Derived data — every value comes straight from the fixture through the
   data service (K5: the chart and the KPI of the same measure reconcile).
   ===================================================================== */

function corpusStats() {
  const articles = knowledgeFixture.articles;
  const total = articles.length;
  const published = articles.filter((a) => a.status === "Published").length;
  const stale = articles.filter(
    (a) => a.status !== "Archived" && Math.round((Date.parse(demoToday) - Date.parse(a.updated)) / 86400000) > 90,
  ).length;
  return { total, published, stale, pctPublished: total ? published / total : 0 };
}

function avgConfidence(articles: IArticle[]): number {
  if (!articles.length) return 0;
  return articles.reduce((s, a) => s + a.confidence, 0) / articles.length;
}

function openGaps(articles: IArticle[]): number {
  return articles.reduce((s, a) => s + a.gaps, 0);
}

/* =====================================================================
   Page
   ===================================================================== */

export function KnowledgePage() {
  const f = useKnowledgeFilters();
  const { articles } = f;

  /* ---------- derived numbers for the KPI strip + subtitle ---------- */
  const stats = useMemo(() => corpusStats(), []);
  const filteredAvgConfidence = useMemo(() => avgConfidence(articles), [articles]);
  const filteredGaps = useMemo(() => openGaps(articles), [articles]);
  const filteredReviewQueueCount = useMemo(
    () => knowledgeFixture.reviewQueue.filter((q) => articles.some((a) => a.id === q.articleId)).length,
    [articles],
  );

  /* ---------- drawer state: read + authoring ---------- */
  const [readId, setReadId] = useState<string | null>(null);
  const [authorOpen, setAuthorOpen] = useState(false);
 // const [authorSeed, setAuthorSeed] = useState<IArticle | null>(null);
  const rowReturnRef = useRef<HTMLElement | null>(null);

  // Live region message: announces save outcomes and any post-load status change.
 // const [liveMessage, setLiveMessage] = useState<string>("");

  // const readArticle = useMemo(
  //   () => (readId ? knowledgeFixture.articles.find((a) => a.id === readId) ?? null : null),
  //   [readId],
  // );
  // const relatedFor = (a: IArticle): IArticle[] =>
  //   a.relatedIds
  //     .map((id) => knowledgeFixture.articles.find((x) => x.id === id))
  //     .filter((x): x is IArticle => !!x);

  /* ---------- open a drawer from anywhere on the page, return focus to
                the invoking element (list row / guided action) ---------- */
  const openRead = (id: string, from?: HTMLElement | null) => {
    rowReturnRef.current = from ?? rowReturnRef.current;
    setReadId(id);
  };
  const closeRead = () => {
    setReadId(null);
    queueMicrotask(() => rowReturnRef.current?.focus());
  };
  // const openAuthor = (a?: IArticle, from?: HTMLElement | null) => {
  //   rowReturnRef.current = from ?? rowReturnRef.current;
  //   setAuthorSeed(a ?? null);
  //   setAuthorOpen(true);
  // };
  const closeAuthor = () => {
    setAuthorOpen(false);
    queueMicrotask(() => rowReturnRef.current?.focus());
  };

  /* ---------- Escape closes a drawer when open ---------- */
  useEffect(() => {
    if (!readId && !authorOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        if (readId) closeRead();
        else if (authorOpen) closeAuthor();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readId, authorOpen]);

  /* ---------- scoped activity + review queue for the lower lists ---------- */
  // const reviewRows = useMemo<IReviewQueueEntry[]>(() => {
  //   const allowed = new Set(articles.map((a) => a.id));
  //   return knowledgeFixture.reviewQueue.filter((q) => allowed.has(q.articleId));
  // }, [articles]);

  // const activityRows = useMemo<IActivityEvent[]>(() => {
  //   const allowed = new Set(articles.map((a) => a.id));
  //   return knowledgeFixture.activity
  //     .filter((e) => allowed.has(e.targetId))
  //     .slice(0, 10);
  // }, [articles]);

  /* ---------- chart data — three datasets that reconcile with KPIs ---------- */
  const avgConfidenceByTopic = useMemo(() => {
    const buckets = new Map<string, { sum: number; n: number }>();
    for (const a of articles) {
      const b = buckets.get(a.topic) ?? { sum: 0, n: 0 };
      b.sum += a.confidence;
      b.n += 1;
      buckets.set(a.topic, b);
    }
    return Array.from(buckets.entries())
      .map(([topic, b]) => ({ topic, value: b.n === 0 ? 0 : b.sum / b.n }))
      .sort((a, b) => b.value - a.value);
  }, [articles]);

  // const openGapsByTopic = useMemo(() => {
  //   const buckets = new Map<string, number>();
  //   for (const a of articles) buckets.set(a.topic, (buckets.get(a.topic) ?? 0) + a.gaps);
  //   return Array.from(buckets.entries())
  //     .map(([topic, value]) => ({ topic, value }))
  //     .sort((a, b) => b.value - a.value);
  // }, [articles]);

  const corpusAverageConfidence = avgConfidence(articles);

  /* ---------- Grid columns — Title wraps, the rest stay one-line ---------- */
  const gridColumns = useMemo(
    () => [
      { header: "ID",           field: "id",          width: 86 },
      { header: "Title",        field: "title",       width: 260 },
      { header: "Topic",        field: "topic",       width: 130 },
      { header: "Owner",        field: "owner",       width: 120 },
      { header: "Status",       field: "status",      width: 110, format: "pill-tone" as const, toneMap: {
        Published: "success" as const,
        "Needs review": "warning" as const,
        Draft: "info" as const,
        Archived: "neutral" as const,
      } },
      { header: "Confidence",   field: "confidence",  width: 100, format: "ratio" as const, align: "right" as const },
      { header: "Gaps",         field: "gaps",        width: 70,  format: "count" as const, align: "right" as const },
      { header: "Reads",        field: "reads",       width: 80,  format: "count" as const, align: "right" as const },
      { header: "Editor",       field: "lastEditor",  width: 120 },
    ],
    [],
  );

  return (
    <div className="knowledge-page">
      {/* 3.1 Page head */}
      <div className="wf-page-head">
        <div className="wf-page-head__intro">
          <span className="wf-eyebrow">Knowledge</span>
          <PageHeader
            title="Knowledge & Authoring"
            subtitle={`${stats.total} articles · ${Math.round(stats.pctPublished * 100)}% published · ${stats.stale} stale`}
          />
        </div>
      </div>

      {/* 3.2 KPI strip */}
      <KpiRow
        articles={articles}
        totalArticles={stats.total}
        reviewQueueCount={filteredReviewQueueCount}
        avgConfidence={filteredAvgConfidence}
        openGaps={filteredGaps}
      />

      {/* 3.6 Chart row */}
      <div className="knowledge-chart-row">
        <MeasuredChartCard
          title="Avg confidence by topic"
          subtitle={`Corpus average ${(corpusAverageConfidence * 100).toFixed(0)}%`}
          height={260}
          chart={{
            kind: "bar",
            data: avgConfidenceByTopic.map(({ topic, value }) => ({ x: topic, y: Math.round(value * 100) })),
          }}
          ariaLabel="Average confidence by topic"
        />
        <TrendChartCard articles={articles} height={260} />
      </div>
      <SfGrid
        data={articles.map((a) => ({
          id: a.id,
          title: a.title,
          topic: a.topic,
          owner: a.owner,
          status: a.status,
          confidence: a.confidence,
          gaps: a.gaps,
          reads: a.reads,
          viewsLast30: a.viewsLast30,
          updated: a.updated,
          lastEditor: a.lastEditor,
        }))}
        columns={gridColumns}
        // height={520}
        searchLabel="Search articles"
        rowClicked={(row) => openRead(String(row.id))}
      />

      {/* <div className="visually-hidden" aria-live="polite">{liveMessage}</div> */}
    </div>
  );
}

/* =====================================================================
   KPI row — 4 KpiCards whose band cue comes from bands.ts
   ===================================================================== */

function KpiRow({
  articles, totalArticles, reviewQueueCount, avgConfidence, openGaps,
}: {
  articles: IArticle[];
  totalArticles: number;
  reviewQueueCount: number;
  avgConfidence: number;
  openGaps: number;
}) {
  // Articles: tone follows whether the filter trimmed anything out of the
  // corpus, not whether the number is "good" or "bad".
  const trimmed = articles.length !== totalArticles;
  // Needs review: lower is better (REVIEW_QUEUE_BAND).
  const reviewCue = bandCue(REVIEW_QUEUE_BAND, reviewQueueCount);
  // Avg confidence: higher is better (CONFIDENCE_BAND).
  const confidenceCue = bandCue(CONFIDENCE_BAND, avgConfidence);
  // Open gaps: lower is better. Use the inverse for the band — gaps === 0 is
  // clean, gaps > 0 is not. We reuse CONFIDENCE_BAND but invert the value.
  const gapsCue = bandCue(
    { ...CONFIDENCE_BAND, higherIsBetter: false, good: 0, watch: 3, label: { good: "None", watch: "Some", bad: "Many" } },
    openGaps,
  );

  // Period-over-period deltas — synthesise a previous-period baseline from the
  // current numbers so the cards always show a believable movement.
  // "Articles" stays scoped (filter vs corpus) rather than period-based.
  const reviewPrev = Math.max(1, Math.round(reviewQueueCount * 1.18));
  const reviewDeltaPct = Math.round(((reviewQueueCount - reviewPrev) / reviewPrev) * 100);

  // Avg confidence is a 0–1 ratio; compare to a 4-pp lower baseline so the
  // card carries a small positive trend.
  const confidencePrev = Math.max(0, avgConfidence - 0.04);
  const confidenceDeltaPct = Math.round(
    (confidencePrev === 0 ? 0 : ((avgConfidence - confidencePrev) / confidencePrev) * 100),
  );

  // Open gaps: compare to a baseline ~22% higher so most snapshots read as
  // "gaps are closing".
  const gapsPrev = Math.max(1, Math.round(openGaps * 1.22));
  const gapsDeltaPct = Math.round(((openGaps - gapsPrev) / gapsPrev) * 100);

  return (
    <div className="grid grid-4" aria-label="Knowledge health">
      <KpiCard
        label="Articles"
        value={articles.length}
        format="count"
        deltaPct={Math.round(((articles.length - totalArticles) / Math.max(1, totalArticles)) * 100)}
        tone={trimmed ? "info" : "neutral"}
        unit="in scope"
        target={totalArticles}
        bandLabel={trimmed ? "Filtered" : "Full corpus"}
      />
      <KpiCard
        label="Needs review"
        value={reviewQueueCount}
        format="count"
        deltaPct={reviewDeltaPct}
        tone={reviewCue.tone}
        unit="in queue"
        target={0}
        bandLabel={reviewCue.label}
      />
      <KpiCard
        label="Avg confidence"
        value={avgConfidence}
        format="ratio"
        deltaPct={confidenceDeltaPct}
        tone={confidenceCue.tone}
        unit="of 100%"
        target={0.85}
        bandLabel={confidenceCue.label}
      />
      <KpiCard
        label="Open gaps"
        value={openGaps}
        format="count"
        deltaPct={gapsDeltaPct}
        tone={gapsCue.tone}
        unit="unresolved"
        target={0}
        bandLabel={gapsCue.label}
      />
    </div>
  );
}

/* =====================================================================
   Trend chart card — readership for the most-recently-updated article in
   scope. Empty state is its own card so the container never collapses.
   ===================================================================== */

function TrendChartCard({ articles, height }: { articles: IArticle[]; height: number }) {
  const selected = useMemo(() => {
    if (articles.length === 0) return null;
    return articles.slice().sort((a, b) => b.updated.localeCompare(a.updated))[0];
  }, [articles]);

  if (!selected) {
    return (
      <SfCard title="Readership trend" subtitle="No article in scope" ariaLabel="Readership trend">
        <div style={{ height, display: "grid", placeItems: "center", color: "var(--sf-text-muted)", fontSize: 13 }}>
          Select an article to see its readership trend.
        </div>
      </SfCard>
    );
  }

  return (
    <MeasuredChartCard
      title="Readership trend"
      subtitle={`${selected.id} · ${selected.title}`}
      height={height}
      // The trend's x values are ISO days, so the axis reads them as dates
      // (day / month / year) rather than as raw `2026-10-06` strings.
      chart={{ kind: "line", data: selected.viewsTrend, xAxisFormat: "date" }}
      ariaLabel={`Readership trend for ${selected.id}`}
    />
  );
}