/**
 * Reading the browser's open windows, and staying subscribed to them.
 *
 * The resizer runs as an extension page with the `tabs` permission, so it reads
 * `chrome.windows.getAll` directly rather than having the background mirror the
 * list into storage. One less copy to keep in sync, and the list is never stale
 * by a storage round-trip.
 *
 * Every call goes through the callback form, for the same reason ~lib/storage
 * does: the promise-returning form is a Chrome extension to the API, and on a
 * callback-only runtime `await chrome.windows.getAll(...)` resolves to
 * undefined. The try/catch matters too — a runtime that relays `chrome.*`
 * through a native bridge throws a raw TypeError when the bridge lacks a
 * handler, and that text would otherwise surface in the UI verbatim. Resolving
 * `null` instead lets the caller phrase it: null means "the API is unavailable
 * here", which is a different message from a genuinely empty list.
 */

export type BrowserTab = {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
  active: boolean;
};

export type BrowserWindow = {
  id: number;
  /** Outer bounds, as the browser reports them. */
  width: number;
  height: number;
  state: `${chrome.windows.WindowState}`;
  focused: boolean;
  incognito: boolean;
  tabs: BrowserTab[];
};

/** Our own pages, so the resizer never offers to resize itself. */
function isOwnPage(url: string | undefined): boolean {
  if (!url) return false;
  try {
    return url.startsWith(chrome.runtime.getURL(""));
  } catch {
    return false;
  }
}

/**
 * A window is hidden only when every tab in it is one of ours — the resizer
 * window itself, and nothing else. A normal browsing window that happens to
 * have the welcome page open in one tab is still a window someone may want to
 * resize, so it stays.
 */
function isOwnWindow(tabs: chrome.tabs.Tab[] | undefined): boolean {
  if (!tabs || tabs.length === 0) return false;
  return tabs.every((tab) => isOwnPage(tab.url ?? tab.pendingUrl));
}

function toBrowserTab(tab: chrome.tabs.Tab): BrowserTab {
  const url = tab.url || tab.pendingUrl || "";
  return {
    id: tab.id ?? -1,
    // A tab that has not finished loading has no title yet; its URL is the
    // only thing left to identify it by.
    title: tab.title?.trim() || url || "Untitled",
    url,
    favIconUrl: tab.favIconUrl,
    active: tab.active === true,
  };
}

function getAllWindows(): Promise<chrome.windows.Window[] | null> {
  return new Promise((resolve) => {
    let settled = false;
    const accept = (windows: unknown) => {
      if (settled) return;
      settled = true;
      resolve(
        Array.isArray(windows) ? (windows as chrome.windows.Window[]) : null,
      );
    };

    try {
      const returned = chrome.windows.getAll(
        { populate: true, windowTypes: ["normal", "popup"] },
        (windows) => {
          // Reading lastError marks it handled; leaving it logs a warning.
          void chrome.runtime.lastError;
          accept(windows);
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
 * Every window worth offering, newest-first ordering left as the browser gives
 * it. Resolves `null` when the windows API is unavailable in this runtime,
 * which the UI reports differently from "no windows open".
 */
export async function listResizableWindows(): Promise<BrowserWindow[] | null> {
  const windows = await getAllWindows();
  if (windows === null) return null;

  return windows
    .filter((window) => window.id !== undefined && !isOwnWindow(window.tabs))
    .map((window) => ({
      id: window.id as number,
      width: window.width ?? 0,
      height: window.height ?? 0,
      state: window.state ?? "normal",
      focused: window.focused === true,
      incognito: window.incognito === true,
      tabs: (window.tabs ?? []).map(toBrowserTab),
    }));
}

/** Brings a window to the front, so picking it from the list can be checked
 *  against the real thing. Best-effort: a window that just closed is not an
 *  error worth reporting. */
export function focusWindow(windowId: number): void {
  try {
    chrome.windows.update(windowId, { focused: true }, () => {
      void chrome.runtime.lastError;
    });
  } catch {
    /* The window is gone, or the runtime has no windows API. */
  }
}

type Unsubscribe = () => void;

/**
 * Calls `onChange` whenever the window or tab landscape shifts. Each listener
 * is registered defensively: a runtime missing one event namespace still gets
 * live updates from the others, instead of throwing during a React effect and
 * unmounting the tree.
 */
export function watchWindows(onChange: () => void): Unsubscribe {
  const cleanups: Unsubscribe[] = [];

  const subscribe = <TListener extends (...args: unknown[]) => void>(
    event: chrome.events.Event<TListener> | undefined,
    listener: TListener,
  ) => {
    try {
      event?.addListener(listener);
      cleanups.push(() => {
        try {
          event?.removeListener(listener);
        } catch {
          /* Never registered. */
        }
      });
    } catch {
      /* This runtime does not implement the event; the others still fire. */
    }
  };

  const handler = () => onChange();

  subscribe(chrome.windows?.onCreated, handler);
  subscribe(chrome.windows?.onRemoved, handler);
  subscribe(chrome.windows?.onFocusChanged, handler);
  // Bounds changes keep the "current size" readout honest when someone drags a
  // window edge by hand. Not implemented everywhere, hence the guard above.
  subscribe(chrome.windows?.onBoundsChanged, handler);
  subscribe(chrome.tabs?.onCreated, handler);
  subscribe(chrome.tabs?.onRemoved, handler);
  subscribe(chrome.tabs?.onUpdated, handler);
  subscribe(chrome.tabs?.onAttached, handler);
  subscribe(chrome.tabs?.onDetached, handler);

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
