/**
 * User preferences, in `chrome.storage.local` so the background can read them
 * too. Values are validated on read: storage is extension-private, but a strict
 * `=== true` keeps a malformed value from flipping a feature on.
 *
 * The light/dark choice is deliberately not here. Every surface this extension
 * renders is an extension page on one origin, so Cherry's own `localStorage`
 * persistence already carries the theme between them — mirroring it into
 * `chrome.storage` would be a second copy that can only drift.
 */

import { storageGet, storageSet, watchStorage } from "~lib/storage";

export const MATCH_INNER_HEIGHT_STORAGE_KEY = "matchInnerHeight";

/**
 * True when a requested height means the viewport, not the window: the browser
 * chrome (title bar, tab strip, toolbars, bookmarks bar) is measured and added
 * on top, so `1440 x 900` gives a 900px-tall page instead of a 900px-tall
 * window. Off by default — the plain reading of "resize to 1440 x 900" is the
 * window, and this mode needs a host permission the extension does not hold
 * out of the box.
 */
export async function readMatchInnerHeight(): Promise<boolean> {
  const stored = await storageGet(MATCH_INNER_HEIGHT_STORAGE_KEY);
  return stored[MATCH_INNER_HEIGHT_STORAGE_KEY] === true;
}

/** Resolves false when storage rejects, so the caller can roll its UI back. */
export function saveMatchInnerHeight(enabled: boolean): Promise<boolean> {
  return storageSet({ [MATCH_INNER_HEIGHT_STORAGE_KEY]: enabled });
}

export function watchMatchInnerHeight(
  onChange: (enabled: boolean) => void,
): () => void {
  return watchStorage((changes, area) => {
    if (area !== "local") return;
    const change = changes[MATCH_INNER_HEIGHT_STORAGE_KEY];
    if (change) onChange(change.newValue === true);
  });
}

/**
 * The origins the match-inner-height mode needs. Measuring a window's chrome
 * means running one expression inside a page in it, and that is the only thing
 * in this extension that requires reaching into a site at all — which is why it
 * is an optional permission, requested when the toggle is switched on and
 * revocable when it is switched off.
 */
export const MEASURE_ORIGINS = ["http://*/*", "https://*/*"];

function permissionsApi(): typeof chrome.permissions | null {
  try {
    // typeof, not truthiness: the type says `request` is always there, so a
    // plain check is a compile error even though the runtime this guards
    // against is exactly one where it is missing.
    return typeof chrome.permissions?.request === "function"
      ? chrome.permissions
      : null;
  } catch {
    return null;
  }
}

/** Whether the measuring permission has already been granted. */
export function hasMeasurePermission(): Promise<boolean> {
  const api = permissionsApi();
  if (!api) return Promise.resolve(false);

  return new Promise((resolve) => {
    try {
      api.contains({ origins: MEASURE_ORIGINS }, (granted) => {
        void chrome.runtime.lastError;
        resolve(granted === true);
      });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Asks for the measuring permission. Must be called straight from a click —
 * Chrome rejects `permissions.request` outside a user gesture — and is never
 * given a timeout, because it blocks on the browser's own dialog waiting for a
 * person to answer.
 */
export function requestMeasurePermission(): Promise<boolean> {
  const api = permissionsApi();
  if (!api) return Promise.resolve(false);

  return new Promise((resolve) => {
    try {
      api.request({ origins: MEASURE_ORIGINS }, (granted) => {
        void chrome.runtime.lastError;
        resolve(granted === true);
      });
    } catch {
      resolve(false);
    }
  });
}

/** Hands the permission back when the toggle is switched off, so the extension
 *  holds no site access it is not currently using. */
export function releaseMeasurePermission(): Promise<boolean> {
  const api = permissionsApi();
  if (!api) return Promise.resolve(false);

  return new Promise((resolve) => {
    try {
      api.remove({ origins: MEASURE_ORIGINS }, (removed) => {
        void chrome.runtime.lastError;
        resolve(removed === true);
      });
    } catch {
      resolve(false);
    }
  });
}
