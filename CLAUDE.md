# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Window Resizer: a Manifest V3 browser extension (Plasmo + React 19 + styled-components v6 + cherry-styled-components) that resizes browser windows to exact pixel dimensions, with a live picker over every open window, savable presets, and an optional viewport-matching mode. pnpm workspace monorepo with a single package: `apps/extension`.

## Commands

- `pnpm dev` / `pnpm build` — Plasmo dev/prod builds into `apps/extension/build/`
- `pnpm typecheck` — `tsc --noEmit`; requires a prior dev/build because the tsconfig includes the generated `.plasmo/index.d.ts`
- `pnpm lint` — Biome, lint rules only (Prettier owns formatting; config in `biome.json`)
- `pnpm format` / `pnpm format:check` — Prettier over the whole repo (docs included)
- `pnpm --filter @window-resizer/extension package` — build the store zip (there is no root `package` script)

Pre-land gate, in order: `pnpm typecheck` → `pnpm build` → `pnpm lint` → `pnpm format:check`.

Nothing here can be verified by reading the diff alone: a resize either moves a real window or it does not. Any user-visible change needs a pass in a real browser with the unpacked build loaded, across at least two open windows. Claude cannot do this pass; explicitly flag "needs a browser pass" in the summary of any user-visible change.

## Architecture

The service worker is deliberately thin. It owns only what nothing else can: `chrome.action.onClicked` (open or focus the resizer window) and `chrome.runtime.onInstalled` (seed the default presets, show the welcome page). Everything else — listing windows, measuring chrome, performing the resize — runs in the resizer page, which holds the same `chrome.windows`, `chrome.tabs`, and `chrome.scripting` APIs. **Do not reintroduce a message round-trip for work the page can do directly**; the previous build routed state through `chrome.storage` and the background and was a step behind as a result.

The UI is a window, not a toolbar popup, and that is load-bearing: a popup closes when focus moves, and resizing a window moves focus on some platforms. The whole point is clicking through several sizes in a row.

## Invariants

- Never `await chrome.*` APIs directly — the promise-returning forms are a Chrome extension to the WebExtensions API, so on a callback-only runtime `await` resolves `undefined` and silently drops the result. Use the callback-form wrappers in `lib/storage.ts`, `lib/windows.ts`, and `lib/resize.ts`, which resolve on whichever of callback or promise settles first and never reject.
- Read `chrome.runtime.lastError` in every callback, even when discarding it (`void chrome.runtime.lastError`). Leaving it unread logs an "Unchecked runtime.lastError" warning.
- Wrap every `chrome.*` entry point in try/catch. A runtime that relays these calls through a native bridge throws a raw `TypeError` synchronously, which no `.catch()` would see, and the raw text would surface in the UI.
- Bounds are ignored while a window is maximized, fullscreen, or minimized. Restore to `normal` in its own `windows.update` call **before** setting bounds; combining them in one call is unreliable across platforms.
- Never pre-reject a size against a hardcoded minimum. Platforms differ; ask the browser, read the window back, and report the clamp from the actual result.
- Every listener registered from a React effect must be individually guarded and must return a working cleanup. An effect that throws unmounts the tree, which would blank the panel rather than merely cost it live updates.
- Error strings are written for someone who will not open a console. They name what refused and what to do about it, and are shown verbatim in a toast. `alert()` is not used anywhere; generic "something went wrong" wording is rejected in review.

## Privacy constraint

Zero telemetry, analytics, backend, or accounts — a hard product constraint enforced in review. The extension ships with **no** `host_permissions`; site access exists only as `optional_host_permissions` for the match-page-height measurement, requested by its toggle and released when the toggle is switched off. Any new `chrome.storage` row or permission must be reflected in the PRIVACY.md storage table.

## Versioning and releases

The version in `apps/extension/package.json` is the store version; bump it only as part of an actual store release. CHANGELOG entries accumulate under `## [Unreleased]` (Keep a Changelog format) and move to a dated version heading when that release ships.

## Style

- Imports: `~`-prefixed path alias only (`~lib/...`, `~components/...`), never relative-parent imports. Inline `type` modifiers inside value imports; member lists sorted alphabetically with `type` entries after plain ones.
- Comments explain _why_, not _what_: modules open with a `/** … */` header describing the constraint that forced the design. Prose wraps at 80 columns.
- UI: Cherry components (`Button`, `IconButton`, `Input`, `Select`, `Toggle`, …) over raw HTML controls; all colors, spacing, radii, and typography come from Cherry theme tokens or the typography mixins, never hardcoded. Cherry's styling props are `$`-prefixed and fail silently when misspelled — check each against the component reference rather than trusting a green build.
- The panel is 460px wide with no browser chrome. Design for that width; it must never scroll horizontally.
- No tests by design — do not add a test harness. Verification is the pre-land gate plus a browser pass.

## Git

Conventional Commits with the established scopes (`feat(extension)`, `fix(extension)`, `docs`, `chore`, `style(extension)`). Small fixes commit straight to `main`; larger features get a branch. pnpm refuses packages published within the last 24h (`minimumReleaseAge` in `pnpm-workspace.yaml`) — a just-released dependency version will fail to install by design.
