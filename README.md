<p align="center">
  <a href="https://github.com/luangjokaj/window-resizer"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/header/grid.svg?title=Window+Resizer&amp;subtitle=Resize+any+browser+window+to+exact+pixels.&amp;size=wide&amp;mode=dark&amp;font=geist" /><img alt="Window Resizer" src="https://shieldcn.dev/header/grid.svg?title=Window+Resizer&amp;subtitle=Resize+any+browser+window+to+exact+pixels.&amp;size=wide&amp;mode=light&amp;font=geist" /></picture></a>
</p>

<p align="center">
  <a href="https://github.com/luangjokaj/window-resizer"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/github/luangjokaj/window-resizer/stars.svg" /><img alt="badge" src="https://shieldcn.dev/github/luangjokaj/window-resizer/stars.svg?mode=light" /></picture></a>
</p>

# Window Resizer

Resize browser windows to exact pixel dimensions, so a layout can be checked at
the size it will actually be used at. Manifest V3, open source under the MIT
license.

**[What it does and why it was rebuilt →](docs/ABOUT.md)**

## Features

Window Resizer opens a small always-there panel next to your work: pick any open
browser window, click a size, and it snaps to those exact dimensions. Sizes are
yours to add and delete, an optional mode makes the numbers mean the page
viewport instead of the window, and the whole thing is themed light and dark.

**[Read the full feature tour →](docs/FEATURES.md)**

Highlights:

- Resizes **any** open window, not just the one in front — pick the target from a
  live list showing each window's current size and its tabs.
- Ships with the common breakpoints and takes custom sizes, tagged by device
  type, saved locally and reorderable by re-adding.
- **Match page height** measures the browser's own toolbars in the target window
  and adds them on top, so `1440 x 900` gives a 900px-tall _page_ rather than a
  900px-tall window. It is off by default and needs a permission you grant with
  the toggle and can revoke by switching it off.
- Restores a maximized or fullscreen window before resizing it, because bounds
  are ignored otherwise — and reports back when the browser clamps the result to
  what the display allows.
- No telemetry, no analytics, no accounts, no network calls of any kind.

## Installation

Until the rebuilt version reaches the Chrome Web Store, install it from a local
build:

```bash
pnpm install
pnpm build
```

Then open `chrome://extensions`, turn on **Developer mode**, choose **Load
unpacked**, and select `apps/extension/build/chrome-mv3-prod`.

Full steps for every supported browser are in
**[the install guide →](docs/INSTALL.md)**.

## Usage

Click the Window Resizer icon in the toolbar. A panel opens and stays open —
that is deliberate, because a toolbar popup closes the moment focus moves, and
resizing a window is exactly the kind of thing that moves focus. Clicking the
icon again focuses the panel you already have rather than opening a second one.

## Development

Requires Node 20+ and pnpm 9+.

```bash
pnpm install
pnpm dev
```

Load `apps/extension/build/chrome-mv3-dev` from `chrome://extensions` using
**Load unpacked**. The dev build reloads as you edit.

Before opening a pull request, run the pre-land gate in order:

```bash
pnpm typecheck
pnpm build
pnpm lint
pnpm format:check
```

`pnpm typecheck` needs a prior `pnpm dev` or `pnpm build`: the tsconfig includes
the `.plasmo/index.d.ts` those generate.

### Layout

```
apps/extension/
  background.ts     service worker: toolbar click, first-run setup
  tabs/             the resizer panel and the welcome page
  components/       UI split out of the panel
  lib/              windows, presets, settings, storage, resize
  assets/           extension icon
```

Built with [Plasmo](https://www.plasmo.com/), React 19, styled-components v6,
and [Cherry](https://cherry.al) for theming and components.

## Privacy

Window Resizer collects nothing and transmits nothing. It has no server, no
analytics, and no account. Everything it stores — your saved sizes and one
toggle — stays in your browser's local extension storage.

**[Read the privacy policy →](PRIVACY.md)**

## Contributing

Issues and pull requests are welcome. Please read the
[Code of Conduct](CODE_OF_CONDUCT.md) first, and report security
vulnerabilities privately via
[GitHub security advisories](https://github.com/luangjokaj/window-resizer/security/advisories/new)
rather than as public issues.

## License

MIT © [Luan Gjokaj](https://github.com/luangjokaj)
