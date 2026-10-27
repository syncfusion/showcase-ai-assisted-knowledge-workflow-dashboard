/* =====================================================================
   App router. Five pages, lazy-loaded; each page is its own chunk.
   ===================================================================== */

import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/shell/AppShell";
import { ThemeProvider } from "@/components/shell/ThemeContext";
import { getPublicBasePath } from "@/basePath";
import "@/styles/layout.css";

const HubPage       = lazy(() => import("@/pages/hub/HubPage").then((m) => ({ default: m.HubPage })));
const KnowledgePage = lazy(() => import("@/pages/knowledge/KnowledgePage").then((m) => ({ default: m.KnowledgePage })));
const WorkflowsPage = lazy(() => import("@/pages/workflows/WorkflowsPage").then((m) => ({ default: m.WorkflowsPage })));
const AnalyticsPage = lazy(() => import("@/pages/analytics/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })));

function PageFallback() {
  return <div className="skeleton" style={{ height: 320, marginTop: 24 }} />;
}

export function App() {
  // The build ships under a sub-path (vite `base`), so the router needs the same
  // prefix. Without it every NavLink would resolve to `/knowledge` and leave the
  // app's mount path instead of appending to it. getPublicBasePath() returns the
  // mount path when the page is served under it, else `/` for a root-served run.
  const basename = getPublicBasePath();

  return (
    <ThemeProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Suspense fallback={<PageFallback />}><HubPage /></Suspense>} />
            <Route path="/knowledge" element={<Suspense fallback={<PageFallback />}><KnowledgePage /></Suspense>} />
            <Route path="/workflows" element={<Suspense fallback={<PageFallback />}><WorkflowsPage /></Suspense>} />
            <Route path="/analytics" element={<Suspense fallback={<PageFallback />}><AnalyticsPage /></Suspense>} />
            <Route path="*" element={<Suspense fallback={<PageFallback />}><HubPage /></Suspense>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
