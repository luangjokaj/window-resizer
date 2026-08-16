/**
 * Resilient chrome.storage.local access, shared by presets and settings.
 *
 * Uses the callback form, for the same reason ~lib/runtime-message does: the
 * promise-returning form is a Chrome extension to the WebExtensions API, and on
 * a callback-only runtime `await chrome.storage.local.get(key)` resolves to
 * undefined. Reading a key off that throws.
 *
 * Both helpers resolve on whichever of callback or returned promise settles
 * first, and never reject: every caller treats storage as best-effort and has a
 * defined fallback (the bundled presets, or the setting's default).
 */

export function storageGet(
  key: string | string[] | null,
): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let settled = false;
    const accept = (items: unknown) => {
      if (settled) return;
      settled = true;
      resolve((items as Record<string, unknown>) ?? {});
    };

    try {
      const returned = chrome.storage.local.get(key, (items) => {
        // Reading lastError marks it handled; leaving it logs a warning.
        void chrome.runtime.lastError;
        accept(items);
      });
      if (
        typeof (returned as unknown as Promise<unknown>)?.then === "function"
      ) {
        (returned as unknown as Promise<unknown>).then(accept, () =>
          accept({}),
        );
      }
    } catch {
      accept({});
    }
  });
}

export function storageSet(items: Record<string, unknown>): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const accept = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };

    try {
      const returned = chrome.storage.local.set(items, () => {
        accept(!chrome.runtime.lastError);
      });
      if (
        typeof (returned as unknown as Promise<unknown>)?.then === "function"
      ) {
        (returned as unknown as Promise<unknown>).then(
          () => accept(true),
          () => accept(false),
        );
      }
    } catch {
      accept(false);
    }
  });
}

/**
 * Subscribes to storage changes, tolerating a browser that does not implement
 * chrome.storage.onChanged. The preset and settings watchers are called from
 * React effects, and an effect that throws takes the whole tree down with it —
 * React unmounts the root when no error boundary catches — so an absent
 * namespace here would blank the window rather than merely cost it live
 * updates. Returns a cleanup function in every case.
 */
export function watchStorage(
  listener: (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ) => void,
): () => void {
  try {
    chrome.storage.onChanged.addListener(listener);
  } catch {
    return () => undefined;
  }
  return () => {
    try {
      chrome.storage.onChanged.removeListener(listener);
    } catch {
      /* Nothing was ever registered. */
    }
  };
}
