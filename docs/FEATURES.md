# Features

## The panel

Clicking the toolbar icon opens Window Resizer as its own small window, 460
pixels wide, and leaves it open. Clicking the icon again focuses that window
rather than opening a second one.

It is a window rather than a toolbar popup on purpose: a popup closes as soon as
focus moves, and resizing a window moves focus on some platforms. See
[ABOUT.md](ABOUT.md) for the longer version.

## Window picker

Every open browser window, live:

- **Current size**, so you can confirm a resize landed without measuring
  anything.
- **Tabs**, expandable per window with favicons and titles, so three windows
  showing the same site are still tellable apart.
- **Focus**, to bring a window forward and check you picked the right one.
- **Incognito windows** are marked.

The list subscribes to window and tab events, so opening a tab, closing a
window, or dragging a window edge by hand is reflected without a refresh. If the
selected window closes, the selection moves to another one rather than leaving
the resize buttons pointed at nothing.

Window Resizer's own panel is excluded from the list. A normal browsing window
that happens to have the welcome page open in one tab is not — it is still a
window you may want to resize.

## Sizes

Ships with the sizes worth having by default:

| Size        | Tagged as |
| ----------- | --------- |
| 540 x 950   | mobile    |
| 800 x 600   | mobile    |
| 1024 x 768  | tablet    |
| 1152 x 700  | laptop    |
| 1440 x 900  | laptop    |
| 1920 x 1080 | desktop   |
| 2560 x 1440 | desktop   |

Add your own with a width, a height, and a device type; new sizes go to the top
of the list where they are visible without scrolling. Delete any of them. Reset
returns the defaults.

Sizes are stored locally and validated when read, so a row written by an older
version — or half-written when the browser quit — cannot break the list. Each is
identified by its own dimensions, which is what makes adding the same size twice
impossible rather than merely discouraged.

## Match page height

Off by default. With it on, a height means the **page viewport** rather than the
window: the browser's own chrome in the target window — title bar, tab strip,
toolbars, and any bookmarks bar — is measured and added on top, so `1440 x 900`
gives you a 900-pixel-tall page.

The measurement is taken in the window being resized, at the moment of the
resize, because two windows on one machine genuinely differ when only one of
them is showing the bookmarks bar. It is a single expression —
`window.outerHeight - window.innerHeight` — and reads nothing else about the
page.

Because that requires site access, it is an **optional permission**: switching
the toggle on asks for it through the browser's own prompt, and switching it off
hands it back. Decline, and the feature stays off with everything else working.

If the target window has no ordinary web page open in it — a `chrome://` page is
closed to extensions — the measurement is not possible, and the panel says so
and resizes the window rather than the viewport instead of failing.

## Honest results

Two things the browser can do that a naive resize would report as success:

- **Clamping.** Window managers restrict windows to the display, and Chrome has
  its own minimum window size that differs per platform. The window is read back
  after every resize, and a result that differs from the request is named:
  you are told the size you actually got.
- **Maximized and fullscreen windows.** Bounds are ignored in those states. The
  window is returned to the normal state in its own call first, and only then
  resized.

Nothing is rejected against a hardcoded minimum. Input is sanity-checked, the
request goes to the browser, and the browser's answer is reported.

## Theming

Light and dark, built on [Cherry](https://cherry.al), with the choice persisted.
Every color, space, radius, and type size comes from the theme, so the two modes
cannot drift apart.

## Privacy

No telemetry, no analytics, no accounts, no backend, no network requests. Local
storage holds your saved sizes and one boolean. Full details in
[PRIVACY.md](../PRIVACY.md).
