# Changelog

All notable changes to Window Resizer are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **The panel returns to the card design, in both themes.** One shared
  visual vocabulary (`components/Card.tsx`: `Card`, `Tile`,
  `TileButton`, `TileName`, `TileNote`, `Hint`, `Numeric`,
  `MiniAction`, `dividedRows`, `pageSurface`) replaces the previous
  `Panel.tsx` and the `Section.tsx` before it. Cards sit on a tinted
  page, each with a centred title bar and hairline-separated rows:
  Select Window, Window Settings, Add New, Select Size. Row padding is
  12px rather than the original design's 20px, which makes the column
  about a quarter shorter while reading the same.
- **Saved sizes are full-width rows again**, with the device glyph on
  the left, a round resize control pinned right, and a delete that
  slides in when the row is pointed at or focused.
- **Device type is picked from glyphs, not a dropdown.** The Add New
  row's device button expands a row of the same four icons a saved
  size wears.
- **Dark mode.** The card separates from the page by being a genuinely
  lighter surface with a hairline border, rather than by a shadow;
  shadows are light-theme only. The dark gray family was re-pitched
  against the card instead of against the page (`grayLight`
  `#18202E` → `#232D42`, `gray` `#3F4B60` → `#5C6A85`) so hairlines,
  input borders, and placeholder text all survive on it.
- **Match page height is a single row** (`MatchHeightToggle.tsx`)
  inside the Window Settings card rather than a full section.
- `RESIZER_WINDOW_HEIGHT` moved from 720 to 800, matching what the
  card design measures with one other window open and the seven
  default sizes.
- The welcome page is built from the same cards as the panel.

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
