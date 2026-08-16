# About Window Resizer

## The problem

Responsive design is checked at sizes, and the browser is bad at giving you
exact ones. Device toolbars in DevTools simulate a viewport inside a desktop
window: useful, but it is an emulation. The page is laid out in a frame, not in
a window, and the things that differ from a real window at that size — how the
OS lays out the scrollbar, how media queries interact with the actual device
pixel ratio, how a fixed header behaves against real browser chrome — are
exactly the things that were worth checking.

Dragging a window edge to 1440 pixels is not a thing anyone can do accurately.

Window Resizer sets the window itself, to the number you asked for.

## Why it works the way it does

**It is a window, not a toolbar popup.** A browser action popup closes the
moment focus moves, and resizing a window is exactly the kind of thing that
moves focus on some platforms. The workflow this extension exists for is
clicking through four sizes in a row and watching each one, which a popup cannot
survive. So the toolbar opens a small panel that stays put, and clicking the
icon again focuses the panel you already have.

**It resizes any window, not the current one.** The window you are testing and
the panel you are clicking in cannot be the same window, so "resize the active
window" would be useless. The panel lists every open window with its current
size and its tabs, and you pick the target. That is also why the picker shows
tab titles: with three windows open, the size alone does not tell you which is
which.

**It reports what the browser actually did.** Window managers clamp to the
display. Chrome enforces its own minimum window size, and that minimum is
different on macOS, Windows, and Linux. The previous version hardcoded a 500x300
floor and rejected anything below it, which was wrong in both directions — it
refused sizes that some platforms allow, and it still could not promise the ones
it accepted. Now the request goes to the browser, the window is read back, and
if the result is not what you asked for the panel says so and names the size you
got.

## The rebuild

The original Window Resizer was a Create React App project with Emotion,
React 17, `react-router-dom`, and a hand-rolled translation layer that shipped
exactly one language. It worked, and the parts of it that were good ideas are
still here: the device-tagged presets, the panel-as-a-window shape, the inner
height mode.

What changed is everything underneath, and three behaviors that were quietly
wrong:

- **Maximized windows did nothing.** Chrome documents that `left`, `top`,
  `width`, and `height` are ignored when a window's state is anything but
  normal. The old code sent bounds and `state: "normal"` in a single call, which
  is unreliable across platforms; now the window is restored in its own call
  first, and only then given its bounds.
- **The inner height offset was global.** One number was measured from whatever
  page you last visited and reused for every window. But two windows on one
  machine genuinely differ — only one of them may be showing the bookmarks bar —
  so the offset is now measured in the window being resized, at the moment of
  the resize.
- **It had access to every site, permanently.** The old manifest declared
  `host_permissions` for all of `http://*/*` and `https://*/*` and injected a
  content script into every tab you opened, all to keep that one number up to
  date. The measurement is now a single expression, run only when the feature is
  on, against only the window being resized — so the site access it needs is an
  optional permission you grant with the toggle and get back when you switch it
  off. On a fresh install, the extension can reach no page at all.

The stack is now Plasmo, React 19, styled-components v6, and
[Cherry](https://cherry.al) for theming and components, in a pnpm workspace with
a typecheck, build, lint, and format gate.

## What it will not become

No telemetry, no analytics, no account, no backend, no network calls. Not
because none has been added yet, but because the extension is small enough that
a person can read all of it and confirm there is nothing else in there — and
that is worth more than any feature that would cost it.
