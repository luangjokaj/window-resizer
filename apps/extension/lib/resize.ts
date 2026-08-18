/**
 * Resizing a window, and the two things that make it harder than one API call.
 *
 * First, a maximized or fullscreen window ignores bounds: Chrome documents that
 * `left`, `top`, `width`, and `height` are dropped when `state` is anything but
 * normal, and restoring *and* resizing in a single `windows.update` is
 * unreliable across platforms. So a window that is not already normal is
 * restored first, in its own call, and only then given its new bounds.
 *
 * Second, the browser is free to refuse. Window managers clamp to the display,
 * and Chrome enforces its own minimum window size, so the size that comes back
 * is not always the size that was asked for. Rather than pre-guessing those
 * limits with hardcoded numbers that differ per platform, this module asks for
 * what was requested and then reports what it actually got — the person sees
 * the truth instead of a validation error the browser never would have raised.
 *
 * Everything here runs from an extension page. `chrome.scripting` and
 * `chrome.windows` are as available there as they are in the service worker,
 * so there is no message round-trip in the path of a resize.
 */

import { hasMeasurePermission } from "~lib/settings";

/**
 * Below these, a request is a typo rather than an intent — a two-digit width is
 * not a viewport anyone is testing. Everything above is passed to the browser,
 * which applies its own, platform-specific floor.
 */
export const MIN_DIMENSION = 100;

/** Guards against a pasted number that would make the window unrecoverable. */
export const MAX_DIMENSION = 20_000;

/** How far off the granted size may be before it is worth mentioning. Window
 *  managers routinely round by a pixel or two on fractional-scaling displays. */
const CLAMP_TOLERANCE_PX = 2;

export type ResizeOutcome =
  | {
      ok: true;
      /** The outer size the window actually ended up at. */
      width: number;
      height: number;
      /** Browser chrome folded into the height, or 0 when inner-height
       *  matching was off or could not be measured. */
      chromeHeight: number;
      /** Set when the result is worth a word: the browser clamped the size, or
       *  the chrome could not be measured and the height is the window's
       *  rather than the viewport's. Phrased for a toast. */
      note?: string;
    }
  | { ok: false; reason: string };

export type DimensionError = { reason: string } | null;

/** Validates one typed dimension. Returns null when it is usable. */
export function validateDimension(
  label: "Width" | "Height",
  value: number,
): DimensionError {
  if (!Number.isFinite(value) || value <= 0) {
    return { reason: `${label} must be a number.` };
  }
  if (value < MIN_DIMENSION) {
    return { reason: `${label} must be at least ${MIN_DIMENSION}px.` };
  }
  if (value > MAX_DIMENSION) {
    return { reason: `${label} must be ${MAX_DIMENSION}px or less.` };
  }
  return null;
}

function getWindow(windowId: number): Promise<chrome.windows.Window | null> {
  return new Promise((resolve) => {
    let settled = false;
    const accept = (window: unknown) => {
      if (settled) return;
      settled = true;
      resolve(
        window && typeof window === "object"
          ? (window as chrome.windows.Window)
          : null,
      );
    };

    try {
      const returned = chrome.windows.get(windowId, (window) => {
        void chrome.runtime.lastError;
        accept(window);
      });
      if (
        typeof (returned as unknown as Promise<unknown>)?.then === "function"
      ) {
        (returned as unknown as Promise<unknown>).then(accept, () =>
          accept(null),
        );
      }
    } catch {
      accept(null);
    }
  });
}

type UpdateResult =
  | { ok: true; window: chrome.windows.Window | null }
  | { ok: false; reason: string };

/**
 * One `windows.update`, with `lastError` turned into a reason string. The
 * error Chrome raises for a closed window is "No window with id: N", which is
 * true but unhelpful, so it is replaced with something actionable.
 */
function updateWindow(
  windowId: number,
  info: chrome.windows.UpdateInfo,
): Promise<UpdateResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: UpdateResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const describe = (message: string) =>
      /no window with id/i.test(message)
        ? "That window is no longer open. Pick another one."
        : message;

    try {
      const returned = chrome.windows.update(windowId, info, (window) => {
        const error = chrome.runtime.lastError?.message;
        if (error) {
          finish({ ok: false, reason: describe(error) });
          return;
        }
        finish({ ok: true, window: window ?? null });
      });
      if (
        typeof (returned as unknown as Promise<unknown>)?.then === "function"
      ) {
        (returned as unknown as Promise<unknown>).then(
          (window) =>
            finish({
              ok: true,
              window: (window ?? null) as chrome.windows.Window | null,
            }),
          (error: unknown) =>
            finish({
              ok: false,
              reason: describe(
                error instanceof Error
                  ? error.message
                  : "The browser refused the resize.",
              ),
            }),
        );
      }
    } catch (error) {
      // A runtime without a windows API throws synchronously, which no
      // `.catch()` would ever see.
      finish({
        ok: false,
        reason:
          error instanceof Error
            ? describe(error.message)
            : "This browser does not allow resizing windows from an extension.",
      });
    }
  });
}

function queryTabs(query: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
  return new Promise((resolve) => {
    let settled = false;
    const accept = (tabs: unknown) => {
      if (settled) return;
      settled = true;
      resolve(Array.isArray(tabs) ? (tabs as chrome.tabs.Tab[]) : []);
    };

    try {
      const returned = chrome.tabs.query(query, (tabs) => {
        void chrome.runtime.lastError;
        accept(tabs);
      });
      if (
        typeof (returned as unknown as Promise<unknown>)?.then === "function"
      ) {
        (returned as unknown as Promise<unknown>).then(accept, () =>
          accept([]),
        );
      }
    } catch {
      accept([]);
    }
  });
}

/** Pages the browser will not let an extension script into, whatever
 *  permissions it holds. */
function isInjectable(url: string | undefined): boolean {
  if (!url) return false;
  return /^https?:\/\//i.test(url);
}

/**
 * `scripting.executeScript` in the callback form, for the same reason every
 * other call here uses it: the promise-returning form is a Chrome extension to
 * the API. Resolves the injected function's return value, or null for any
 * failure — a refused injection is an expected outcome here, not an error.
 */
function executeInTab<TResult>(
  tabId: number,
  func: () => TResult,
): Promise<TResult | null> {
  return new Promise((resolve) => {
    let settled = false;
    const accept = (results: unknown) => {
      if (settled) return;
      settled = true;
      const first = Array.isArray(results)
        ? (results[0] as chrome.scripting.InjectionResult<TResult> | undefined)
        : undefined;
      resolve((first?.result ?? null) as TResult | null);
    };

    try {
      const returned = chrome.scripting.executeScript(
        { target: { tabId }, func },
        (results) => {
          void chrome.runtime.lastError;
          accept(results);
        },
      );
      if (
        typeof (returned as unknown as Promise<unknown>)?.then === "function"
      ) {
        (returned as unknown as Promise<unknown>).then(accept, () =>
          accept(null),
        );
      }
    } catch {
      accept(null);
    }
  });
}

/**
 * The height of a window's browser chrome — title bar, tab strip, toolbars, and
 * any bookmarks bar — measured inside a page in that window rather than
 * assumed. Two windows on one machine genuinely differ: only one of them may be
 * showing the bookmarks bar, and a popup window has almost no chrome at all.
 *
 * Resolves null when it cannot be measured: no http(s) tab in the window (a
 * `chrome://` page is closed to extensions), the permission was not granted, or
 * the injection was refused. Callers fall back to resizing the window rather
 * than the viewport, and say so.
 */
export async function measureWindowChrome(
  windowId: number,
): Promise<number | null> {
  if (!(await hasMeasurePermission())) return null;

  const tabs = await queryTabs({ windowId });
  // Prefer the active tab — it is the one already rendered, so the measurement
  // costs nothing and cannot be thrown off by a background tab that the
  // browser has discarded.
  const target =
    tabs.find((tab) => tab.active && isInjectable(tab.url)) ??
    tabs.find((tab) => isInjectable(tab.url));
  if (!target?.id) return null;

  const measured = await executeInTab(
    target.id,
    () => window.outerHeight - window.innerHeight,
  );
  // Null is a refused injection, which must not collapse into a 0px chrome
  // height — that would silently resize the window instead of the viewport
  // while reporting success.
  if (measured === null) return null;
  // A negative or absurd value means the frame was mid-layout, or the page is
  // not laid out the way a top-level window is; either way it is not something
  // to add to a height.
  if (!Number.isFinite(measured) || measured < 0 || measured > 400) {
    return null;
  }
  return Math.round(measured);
}

/**
 * Resizes `windowId` to `width` x `height`.
 *
 * With `matchInnerHeight`, `height` is the viewport height wanted and the
 * measured chrome is added on top; without it, `height` is the window's own
 * outer height. Either way the outcome reports the size that was actually
 * granted, and carries a note when that differs from what was asked.
 */
export async function resizeWindow(
  windowId: number,
  width: number,
  height: number,
  matchInnerHeight: boolean,
): Promise<ResizeOutcome> {
  const widthError = validateDimension("Width", width);
  if (widthError) return { ok: false, reason: widthError.reason };
  const heightError = validateDimension("Height", height);
  if (heightError) return { ok: false, reason: heightError.reason };

  const current = await getWindow(windowId);
  if (!current) {
    return {
      ok: false,
      reason: "That window is no longer open. Pick another one.",
    };
  }

  // Bounds are ignored while a window is maximized, fullscreen, or minimized,
  // and restoring in the same call is unreliable — so restore first, alone.
  if (current.state && current.state !== "normal") {
    const restored = await updateWindow(windowId, { state: "normal" });
    if (!restored.ok) return { ok: false, reason: restored.reason };
  }

  let chromeHeight = 0;
  let measureNote: string | undefined;
  if (matchInnerHeight) {
    const measured = await measureWindowChrome(windowId);
    if (measured === null) {
      measureNote =
        "Could not measure this window's toolbars, so the height is the window's, not the page's. Open a regular http(s) page in it and try again.";
    } else {
      chromeHeight = measured;
    }
  }

  const requestedOuterHeight = Math.round(height + chromeHeight);
  const requestedWidth = Math.round(width);

  const result = await updateWindow(windowId, {
    width: requestedWidth,
    height: requestedOuterHeight,
    state: "normal",
  });
  if (!result.ok) return { ok: false, reason: result.reason };

  // Read the window back rather than trusting the update's echo: on some
  // platforms the callback returns the requested bounds and the window manager
  // clamps a moment later.
  const settled = (await getWindow(windowId)) ?? result.window;
  const actualWidth = settled?.width ?? requestedWidth;
  const actualHeight = settled?.height ?? requestedOuterHeight;

  const clamped =
    Math.abs(actualWidth - requestedWidth) > CLAMP_TOLERANCE_PX ||
    Math.abs(actualHeight - requestedOuterHeight) > CLAMP_TOLERANCE_PX;

  const clampNote = clamped
    ? `The browser clamped this to ${actualWidth} x ${actualHeight}. That is as close as it allows on this display.`
    : undefined;

  return {
    ok: true,
    width: actualWidth,
    height: actualHeight,
    chromeHeight,
    // A clamp is the more surprising of the two, so it wins when both apply.
    note: clampNote ?? measureNote,
  };
}
