/* =====================================================================
   Data service — typed JSON loader.
   All fixtures live under src/fixtures/*.json and are imported statically
   so the bundle has no runtime fetch and no external dependency.
   ===================================================================== */

import analytics from "../../fixtures/analytics.json";
import knowledge from "../../fixtures/knowledge.json";
import workflows from "../../fixtures/workflows.json";

import type {
  IAnalyticsFixture,
  IKnowledgeFixture,
  IWorkflowsFixture,
} from "./contracts";

export const analyticsFixture = analytics as IAnalyticsFixture;
export const knowledgeFixture = knowledge as IKnowledgeFixture;
export const workflowsFixture = workflows as IWorkflowsFixture;

export const demoToday = "2026-10-15";
export const periodLabel = "Q3 FY26 (Jul–Sep)";
