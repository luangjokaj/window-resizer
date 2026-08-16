# Changelog

All notable changes to Window Resizer are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **The panel is redesigned for density.** One shared visual vocabulary
  (`components/Panel.tsx`: `Eyebrow`, `Hint`, `Numeric`, `Count`,
  `MiniAction`, `Panel`, `PanelBlock`) replaces the old `Section.tsx`.
  Saved sizes are a two-column tile grid, the custom size form
  collapsed to one row, headings became tracked legends, window rows
  read as one line instead of two, and the footer merged into the
  header. With one window open the panel drops from roughly 1050px
  tall to 612px.
- **Match page height is now a single row** (`MatchHeightToggle.tsx`)
  instead of a full section, and moved to the bottom of the panel
  below the sizes it modifies.
- `RESIZER_WINDOW_HEIGHT` dropped from 820 to 720 so the shorter panel
  does not open with dead space underneath it.
- The welcome page picked up the same vocabulary as the panel.

## [0.1.0] - 2026-08-16

A full rebuild. The extension keeps what it always did — pick a window, click a
size — and replaces everything underneath it: Create React App and Emotion give
way to Plasmo, React 19, styled-components v6, and the Cherry design system,
with a pnpm workspace and a typecheck / build / lint / format gate around it.

### Added

- **Live window list with real detail.** The picker reads
  `chrome.windows.getAll` directly and stays subscribed to window and tab
  events, so it shows each window's current outer size and its tabs as they
  change. Previously the background mirrored a tab snapshot into
  `chrome.storage` and the UI read it back a step behind.
- **Match page height is measured, not assumed.** Turning it on measures the
  target window's own chrome — title bar, tab strip, toolbars, and any bookmarks
  bar — inside that window, at the moment of the resize. Two windows on one
  machine genuinely differ when only one is showing the bookmarks bar, and the
  old single global value could not represent that.
- **Honest reporting of what the browser granted.** The window is read back
  after the resize, and a result the window manager clamped to the display is
  named in a toast rather than passing silently as success.
- **Light and dark theming** throughout, via Cherry, with the choice persisted.
- **Restore-then-resize.** A maximized or fullscreen window is returned to the
  normal state in its own call before its bounds are set. Chrome documents that
  bounds are ignored in any other state, and doing both in one call is
  unreliable across platforms — so the old code silently did nothing on a
  maximized window.

### Changed

- **Site access is now optional and scoped to one feature.** The extension no
  longer declares `host_permissions` for every site. Match page height is the
  only thing that needs to reach into a page, so its origins are an
  `optional_host_permissions` entry requested by the toggle and released when
  the toggle is switched off. Everything else runs on `tabs`, `storage`, and
  `scripting`.
- **No more measuring content script.** The old build injected a script into
  every tab you visited, kept a viewport difference in storage, and recomputed
  it on every resize event. It is replaced by a single one-shot measurement of
  the target window, taken only when the feature is on.
- **Errors are toasts written for a person**, not `alert()` dialogs. Every
  failure names what refused and what to do about it.
- **Minimum sizes are the browser's, not ours.** The old hardcoded 500x300 floor
  rejected sizes some platforms accept. Input is now sanity-checked only, the
  request goes to the browser, and any clamping is reported from the result.
- Presets are validated on read, deduplicated, and named from their own
  dimensions, so a malformed or legacy row cannot break the list it renders in.

### Removed

- The unused runtime translation layer, and the `_locales` message bundle behind
  it. It advertised seven languages while only English was ever shipped, so
  `t()` was a pass-through returning its own key and the manifest resolved
  `__MSG_appName__` against a single English file. Real translations can come
  back as data when there are any.
- `react-router-dom` and the separate options and privacy routes. Reset lives in
  the panel it belongs to, and the privacy policy lives in the repository.
