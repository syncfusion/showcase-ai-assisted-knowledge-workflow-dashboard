/* =====================================================================
   Theme provider — applies the saved theme to <html data-theme=…> and
   exposes the current theme to the Syncfusion wrappers (theme prop).

   Two attributes are set, and they do different jobs:

   - `data-theme` drives the app's own token file (`tokens.css`), so the
     shell, cards and text follow the theme.
   - the `e-dark-mode` class drives the **Syncfusion Tailwind 3 theme
     bundle**. That bundle paints the Grid, the Scheduler, the RTE and the
     other material controls from `--color-sf-*` custom properties, and it
     ships two values for every one of them: a light one in `:root` and a
     dark one in `.e-dark-mode`. A control with no `theme` property of its
     own — the Grid has none — reads those properties, so the class is the
     only thing that turns the Grid dark. Without it the Grid kept its
     white header and near-black text on the dark page.
   ===================================================================== */

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";
interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

const KEY = "copilot.theme";

/**
 * The class the Syncfusion Tailwind 3 theme bundle keys its dark palette on.
 *
 * The bundle declares every `--color-sf-*` property twice: a light value in
 * `:root` and a dark value under `.e-dark-mode` (401 properties in each,
 * 35.1.41). The controls read those properties, so the class has to be on an
 * ancestor of the control — the document element is the only one that is
 * always an ancestor.
 */
const SF_DARK_CLASS = "e-dark-mode";

function readInitial(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const t = localStorage.getItem(KEY);
    if (t === "dark" || t === "light") return t;
  } catch {
    /* ignore */
  }
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitial);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    // The Syncfusion theme bundle's dark palette is keyed on this class; the
    // Grid and the other material controls have no `theme` property of their
    // own, so without it they stay light on a dark page.
    root.classList.toggle(SF_DARK_CLASS, theme === "dark");
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const value = useMemo<ThemeCtx>(
    () => ({ theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) }),
    [theme],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme must be used inside <ThemeProvider>");
  return v;
}
