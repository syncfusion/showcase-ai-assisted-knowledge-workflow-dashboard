# AI-Assisted Knowledge & Workflow Copilot Dashboard

A React and Syncfusion showcase for reviewing knowledge health, planning operational work, and exploring business metrics in one browser-based workspace. The app combines a Copilot Hub with knowledge, workflow, and analytics pages, using local sample data and a bounded sample AI provider.

> This is a demonstration app, not a production knowledge or workflow system. It does not connect to a backend, external AI service, or live business data. Sample responses and records are not operational advice, and actions do not update shared systems.

## Features

- **Copilot Hub (`/`)**: briefing, KPI summaries, guided actions, highlights, and recent activity.
- **Knowledge (`/knowledge`)**: knowledge-corpus metrics, article and topic exploration, readership signals, and content gaps. This page is for corpus review; it is not a full article-authoring workflow.
- **Workflows (`/workflows`)**: scheduled work, an action queue, SLA exposure, and sample recommendations.
- **Analytics (`/analytics`)**: performance trends, regional breakdowns, drill-down records, and sample conversational prompts.
- Light and dark themes, responsive layouts, and browser-local state for supported demo interactions.

## Technology

| Area | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Navigation | React Router |
| UI | Syncfusion EJ2 React components |
| Data | Bundled JSON fixtures |
| AI experience | Local sample provider; no remote model or API call |
| Tests | Vitest and Testing Library |

## Run locally

Prerequisites: Node.js LTS and npm.

```bash
npm install
npm run dev
```

Vite serves the development app on port `5173` by default. Use the URL printed in the terminal.

To build and preview the production bundle:

```bash
npm run build
npm run preview
```

The production build is configured for `/ai-assisted-knowledge-workflow/react/`. The React router uses the same base path so in-app navigation works when hosted there.

## Configuration

Syncfusion license registration reads `VITE_SYNCFUSION_LICENSE_KEY` at build time. For a licensed local run, place the key in an untracked `.env.local` file in this directory:

```dotenv
VITE_SYNCFUSION_LICENSE_KEY=your-license-key
```

Without a license key, Syncfusion components may display trial status. Do not commit license keys or other credentials.

## Repository structure

```text
apps/
+-- ai-assisted-knowledge-workflow/
    +-- frontend/
        +-- react/
            +-- src/
            |   +-- components/
            |   |   +-- ai/
            |   |   +-- charts/
            |   |   +-- filterbar/
            |   |   +-- grid/
            |   |   +-- primitives/
            |   |   +-- rte/
            |   |   +-- scheduler/
            |   |   +-- shell/
            |   +-- core/
            |   |   +-- ai/
            |   |   |   +-- sampleProvider.ts
            |   |   +-- data/
            |   |   |   +-- bands.ts
            |   |   |   +-- contracts.ts
            |   |   |   +-- dataService.ts
            |   |   +-- format/
            |   |       +-- format.ts
            |   +-- fixtures/
            |   |   +-- analytics.json
            |   |   +-- knowledge.json
            |   |   +-- workflows.json
            |   +-- pages/
            |   |   +-- analytics/AnalyticsPage.tsx
            |   |   +-- hub/HubPage.tsx
            |   |   +-- knowledge/KnowledgePage.tsx
            |   |   +-- workflows/WorkflowsPage.tsx
            |   +-- styles/
            |   |   +-- layout.css
            |   |   +-- palette.ts
            |   |   +-- theme.css
            |   |   +-- tokens.css
            |   +-- __checks__/
            |   +-- App.tsx
            |   +-- basePath.ts
            |   +-- main.tsx
            |   +-- vite-env.d.ts
            +-- index.html
            +-- package.json
            +-- server.mjs
            +-- tsconfig.json
            +-- vite.config.ts
            +-- README.md
            +-- details.md
```

## Checks

```bash
npm run typecheck
npm test
npm run build
```

The sample provider returns local, bounded responses based on the demo content. Browser-local changes are limited to supported demo state; they are not saved to a shared service. Authentication, authorization, audit history, live integrations, and production-grade AI grounding are outside this showcase's scope.