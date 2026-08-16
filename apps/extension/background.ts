/**
 * The service worker exists for the two jobs only it can do: answering the
 * toolbar click, and running once on install. Everything else — reading the
 * open windows, measuring chrome, performing the resize — happens in the
 * resizer page, which holds the same `chrome.windows`, `chrome.tabs`, and
 * `chrome.scripting` APIs and needs no round-trip to reach them.
 *
 * Why a window and not a popup: a toolbar popup closes the moment focus moves,
 * and resizing another window is exactly the kind of thing that moves focus on
 * some platforms. The point of this extension is clicking through several sizes
 * in a row and watching the result, which a popup cannot survive. So the
 * toolbar opens a small always-there window instead, and a second click focuses
 * the one already open rather than piling up duplicates.
 */

import { DEFAULT_PRESETS, PRESETS_STORAGE_KEY } from "~lib/presets";
import { storageGet, storageSet } from "~lib/storage";

const RESIZER_PAGE = "tabs/resizer.html";
const WELCOME_PAGE = "tabs/welcome.html";

/**
 * Roughly a phone-shaped panel: wide enough for two dimension fields side by
 * side, tall enough to show the presets without scrolling on most displays.
 *
 * The height tracks what the page actually measures. With the default seven
 * saved sizes the column is a little over 600px tall and grows by one row per
 * open window, so this covers the ordinary case of two or three windows with
 * nothing to scroll to and nothing left empty underneath. Someone running many
 * windows at once scrolls the list, which is the same trade the panel has
 * always made; sizing for that case instead would leave everyone else looking
 * at 200px of blank surface.
 */
const RESIZER_WINDOW_WIDTH = 460;
const RESIZER_WINDOW_HEIGHT = 720;

function pageUrl(page: string): string {
  return chrome.runtime.getURL(page);
}

/**
 * The resizer window, if one is already open.
 *
 * Found by scanning for the page rather than by remembering an id: a service
 * worker is torn down whenever it goes idle, so any id held in module scope is
 * gone by the next toolbar click. The scan is cheap and cannot go stale.
 */
async function findResizerWindow(): Promise<number | null> {
  const url = pageUrl(RESIZER_PAGE);
  const tabs = await new Promise<chrome.tabs.Tab[]>((resolve) => {
    try {
      chrome.tabs.query({ url }, (found) => {
        void chrome.runtime.lastError;
        resolve(Array.isArray(found) ? found : []);
      });
    } catch {
      resolve([]);
    }
  });

  const existing = tabs.find((tab) => tab.windowId !== undefined);
  return existing?.windowId ?? null;
}

async function openResizer(): Promise<void> {
  const existing = await findResizerWindow();
  if (existing !== null) {
    try {
      chrome.windows.update(
        existing,
        { focused: true, drawAttention: true },
        () => {
          void chrome.runtime.lastError;
        },
      );
      return;
    } catch {
      // The window went away between the scan and the focus; fall through and
      // open a fresh one.
    }
  }

  try {
    chrome.windows.create(
      {
        url: pageUrl(RESIZER_PAGE),
        type: "popup",
        width: RESIZER_WINDOW_WIDTH,
        height: RESIZER_WINDOW_HEIGHT,
        top: 0,
        left: 0,
      },
      () => {
        void chrome.runtime.lastError;
      },
    );
  } catch {
    /* No windows API in this runtime; there is nothing left to fall back to. */
  }
}

chrome.action.onClicked.addListener(() => {
  void openResizer();
});

/**
 * Seeds the default sizes on a fresh install so the list is never empty on
 * first open, and shows the welcome page once. An update runs neither: the
 * presets are already there, possibly edited, and a release note is not worth
 * a hijacked tab.
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason !== "install") return;

  void (async () => {
    const stored = await storageGet(PRESETS_STORAGE_KEY);
    if (!Array.isArray(stored[PRESETS_STORAGE_KEY])) {
      await storageSet({ [PRESETS_STORAGE_KEY]: [...DEFAULT_PRESETS] });
    }

    try {
      chrome.tabs.create({ url: pageUrl(WELCOME_PAGE) }, () => {
        void chrome.runtime.lastError;
      });
    } catch {
      /* Nothing to show the welcome page in. */
    }
  })();
});
