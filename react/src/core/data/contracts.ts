/* =====================================================================
   Data contracts — AI-Assisted Knowledge & Workflow Copilot
   Every fixture shape is declared here once. Fixtures live in
   src/fixtures/*.json and are validated by core/data/dataService.
   ===================================================================== */

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";
export type ISODate = string; // YYYY-MM-DD
export type ISODateTime = string; // YYYY-MM-DDTHH:mm:ssZ

/* ---------- Analytics ---------- */
export type ValueFormat = "money-compact" | "money" | "count" | "pct";

export interface IKpi {
  id: string;
  title: string;
  value: number;
  format: ValueFormat;
  deltaPct: number;
  tone: Tone;
  target: number;
  unit: string;
}

export interface IRegion {
  id: string;
  name: string;
  arr: number;
  plan: number;
  deltaPct: number;
  tone: Tone;
}

/* ---------- Knowledge ---------- */
export type ArticleStatus = "Draft" | "Needs review" | "Published" | "Archived";

/** Who the content is authoritative over — drives the drawer's source block. */
export type SourceOfTruth = "internal" | "vendor" | "regulation";

export interface IArticle {
  id: string;
  title: string;
  topic: string;
  status: ArticleStatus;
  owner: string;
  updated: ISODate;
  reads: number;
  gaps: number;
  /** 0–1 ratio, not a percentage. Formatted with `ratio`, never `pct`. */
  confidence: number;
  /** Editor-written summary, at most 240 characters (data-contract.md §1). */
  summary: string;
  /** Markdown, rendered in the read drawer and seeded into the RTE. */
  body: string;
  created: ISODate;
  lastEditor: string;
  version: number;
  reviewers: string[];
  dueReview: ISODate;
  viewsLast30: number;
  /** 8–12 daily points, oldest first, ending on `updated`. */
  viewsTrend: { x: string; y: number }[];
  tags: string[];
  relatedIds: string[];
  citations: ICitation[];
  sourceOfTruth: SourceOfTruth;
}

/** One article awaiting review, with its reviewer and the date it is due. */
export interface IReviewQueueEntry {
  articleId: string;
  reviewer: string;
  dueReview: ISODate;
  /** Why the article is in the queue — shown on the row, not derived in a component. */
  reason: string;
}

/** Where a change was made — the reviewer's evidence trail. */
export type ActivitySurface = "Knowledge" | "Workflows" | "Analytics" | "Copilot Hub";

/** One entry in the recent-activity stream. */
export interface IActivityEvent {
  id: string;
  at: ISODateTime;
  actor: string;
  /** Past-tense verb, so the row reads "Nadia Farouk published art-014". */
  verb: string;
  /** The article or object the event is about. */
  target: string;
  targetId: string;
  surface: ActivitySurface;
}

/* ---------- Workflows ---------- */
export type WorkflowStatus = "Scheduled" | "In progress" | "Blocked" | "Done";

export interface IWorkflow {
  id: string;
  title: string;
  owner: string;
  status: WorkflowStatus;
  start: ISODateTime;
  end: ISODateTime;
  tone: Tone;
  /** Meeting room or system of record; rendered as the appointment's location line. */
  location: string;
}

export interface ISlaTeam {
  team: string;
  onTrack: number;
  breach: number;
  tone: Tone;
}

export interface ITicketRisk {
  bucket: string;
  count: number;
  tone: Tone;
}

/* ---------- AI layer ---------- */
export interface ICitation {
  id: string;
  label: string;
  /** Where the citation points. Optional: an internal article may have no URL. */
  url?: string;
  /** Badge text in the read drawer's citations list — what kind of source it is. */
  kind?: "article" | "runbook" | "external" | "regulation" | "vendor" | "internal";
}

/** One rendered block inside an AI reply. */
export type AiBlock =
  | { kind: "text"; text: string }
  | { kind: "bullets"; title?: string; items: string[] }
  | { kind: "bars"; title: string; unit: string; items: { label: string; value: number; tone: Tone }[] };

export interface AiInsight {
  /** Plain-text answer, used for the aria-label and the copy action. */
  text: string;
  blocks: AiBlock[];
  citations: ICitation[];
  actions?: string[];
}

export interface AiTurn {
  id: string;
  role: "user" | "assistant";
  prompt?: string;
  insight?: AiInsight;
  at: ISODateTime;
}

export interface AiContext {
  region: string;
  period: string;
  scope?: string;
}

/* ---------- Fixtures ---------- */
export interface IAnalyticsFixture {
  schemaVersion: number;
  asOf: ISODate;
  periodLabel: string;
  kpis: IKpi[];
  regions: IRegion[];
}

export interface IKnowledgeFixture {
  schemaVersion: number;
  asOf: ISODate;
  articles: IArticle[];
  topics: string[];
  reviewQueue: IReviewQueueEntry[];
  activity: IActivityEvent[];
}

export interface IWorkflowsFixture {
  schemaVersion: number;
  asOf: ISODate;
  workWeek: { start: ISODate; end: ISODate };
  workflows: IWorkflow[];
  /**
   * Early-shift workflows, drawn only by the Scheduler. The Scheduler shows
   * 06:00–22:00, so the 06:00–11:00 band needs its own events to read as a
   * working day rather than an empty grid. They are kept out of `workflows`
   * so the action queue list stays the set of tracked work items.
   */
  earlyShift: IWorkflow[];
  slaTeams: ISlaTeam[];
  ticketRisk: ITicketRisk[];
}