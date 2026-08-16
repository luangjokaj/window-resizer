/**
 * The one provider both extension pages mount under.
 *
 * `ClientThemeProvider` is the SSR-aware provider, which is exactly what makes
 * it right here despite there being no server: it accepts the first-paint theme
 * as a prop instead of discovering it after mount. An extension page is opened
 * cold every time, so resolving the mode synchronously — before React renders —
 * is the only way to avoid a white flash on the way into dark mode.
 *
 * Cherry persists the choice to two places at once — a `theme` cookie and
 * `localStorage.theme` — and its own reconcile pass reads the cookie first.
 * This resolver has to read them in that same order. Reading only
 * localStorage looks equivalent, and is, right up until the two disagree:
 * then the first paint uses one answer, the provider's reconcile switches to
 * the other, and the page flashes — which is the exact thing resolving the
 * theme before mount exists to prevent. (Cookies do work on an
 * extension-page origin, which is what makes the cookie the live value rather
 * than dead weight.)
 */

import type { ReactNode } from "react";
import { ClientThemeProvider } from "cherry-styled-components";
import { theme, themeDark } from "~lib/theme";

type ColorScheme = "light" | "dark";

function asColorScheme(value: string | undefined): ColorScheme | null {
  return value === "dark" || value === "light" ? value : null;
}

function readThemeCookie(): ColorScheme | null {
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("theme="));

  return asColorScheme(entry?.slice("theme=".length));
}

function resolveInitialTheme(): ColorScheme {
  try {
    const stored = readThemeCookie() ?? asColorScheme(localStorage.theme);
    if (stored) return stored;
  } catch {
    // Cookies or storage can be denied outright; the OS preference remains.
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Resolved once at module scope: the answer cannot change before mount, and
 *  reading it during render would make the first paint depend on when React
 *  got around to it. */
const INITIAL_THEME = resolveInitialTheme();

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ClientThemeProvider
      theme={theme}
      themeDark={themeDark}
      $initial={INITIAL_THEME}
      $themeColor={false}
    >
      {children}
    </ClientThemeProvider>
  );
}
