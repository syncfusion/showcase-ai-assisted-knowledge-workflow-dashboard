/* =====================================================================
   Entry. Register the Syncfusion license from the build environment
   (per app-source-baseline.md), wire the AI provider, render <App/>.
   ===================================================================== */

import { registerLicense } from "@syncfusion/ej2-base";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/theme.css";
import "./styles/tokens.css";

// License registration: if the env var is set, activate; otherwise the
// app runs in trial mode (banner-free on the dashboard for the
// unlicensed component set, but Syncfusion still flags the trial).
const licenseKey = import.meta.env.VITE_SYNCFUSION_LICENSE_KEY;
if (licenseKey) registerLicense(licenseKey);

const container = document.getElementById("root");
if (!container) throw new Error("Root container missing");
createRoot(container).render(<App />);
