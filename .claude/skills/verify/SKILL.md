---
name: verify
description: Run this repo's pre-land gate (pnpm typecheck → pnpm build → pnpm lint → pnpm format:check, in that order) and report whether the change needs a real-browser pass with the unpacked build. Use before committing, before declaring a task done, or when the user asks to verify changes.
---

Run the pre-land gate from the repo root, in this exact order, stopping at the
first failure:

1. `pnpm typecheck` — if it fails with missing `.plasmo/index.d.ts`, run
   `pnpm build` first (the tsconfig includes that generated file), then retry.
2. `pnpm build`
3. `pnpm lint` — Biome; fix errors, report (do not mass-fix) pre-existing
   warnings.
4. `pnpm format:check` — if it fails, run `pnpm format` and re-check.

Report each step's result plainly. If a step fails, show the actual error output
and fix the root cause; do not skip ahead.

A green gate proves less here than it does in most repos, for two reasons worth
checking by hand:

- **Cherry's styling props are transient `$`-props.** A misspelled `$variant`,
  or a value outside its allowed union, does not error — it silently renders an
  unstyled element. Re-read changed JSX against the Cherry component reference
  and confirm every prop name and value is real.
- **`chrome.*` failures are runtime-only.** Nothing in the gate exercises a
  single browser API.

Then inspect the changed files (`git diff --name-only` plus staged/untracked)
and flag whether a **real-browser pass** is required before landing. It is
required for any user-visible change, and especially these:

- `lib/resize.ts` — window state handling, chrome measurement, clamp reporting
- `lib/windows.ts` — the window list and its event subscriptions
- `lib/settings.ts` — the optional host permission request and release
- `background.ts` — toolbar click, service worker lifecycle, first-run setup
- `lib/storage.ts` or anything else touching `chrome.*`
- The manifest block in `apps/extension/package.json` (permissions, action)

The pass itself: load `apps/extension/build/chrome-mv3-dev` unpacked, open at
least two browser windows, and confirm the picker lists them with correct sizes,
a preset resizes the _selected_ window rather than the frontmost one, a
maximized window is restored and resized, and the match-page-height toggle both
requests and releases its permission.

End the report with one of:

- "Gate passed. Needs a browser pass (touches: <areas>)." — Claude cannot
  perform this pass; it is on the user.
- "Gate passed. No browser pass needed (docs/tooling-only change)."
