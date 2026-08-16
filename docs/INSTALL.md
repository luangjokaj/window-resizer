# Install guide

The rebuilt version is not on the Chrome Web Store yet, so every path below
builds it locally first.

## Build it

Requires [Node](https://nodejs.org) 20 or newer and [pnpm](https://pnpm.io) 9 or
newer.

```bash
git clone https://github.com/luangjokaj/window-resizer.git
cd window-resizer
pnpm install
pnpm build
```

The unpacked extension lands in `apps/extension/build/chrome-mv3-prod`.

For development use `pnpm dev` instead, which builds to
`apps/extension/build/chrome-mv3-dev` and reloads as you edit.

## Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select `apps/extension/build/chrome-mv3-prod`.
5. Pin Window Resizer to the toolbar from the puzzle-piece menu, so the icon is
   one click away.

## Edge

1. Open `edge://extensions`.
2. Turn on **Developer mode** (left sidebar).
3. Click **Load unpacked** and select the same folder.

## Brave, Arc, Opera, Vivaldi, and other Chromium browsers

The same flow, at that browser's own extensions page — `brave://extensions`,
`arc://extensions`, and so on. Window Resizer uses only standard Manifest V3
APIs (`windows`, `tabs`, `storage`, `scripting`), so anything Chromium-based
that supports MV3 should run it.

## First run

Installing opens a welcome page once. After that:

- Click the toolbar icon to open the panel. It stays open until you close it.
- Clicking the icon again focuses the panel you already have, rather than
  opening a second one.
- You need at least two browser windows for the extension to be useful: one to
  resize, and the panel itself.

## Permissions you will be asked for

On install, none beyond what the manifest declares: `tabs`, `storage`, and
`scripting`. The extension holds **no** site access and cannot read any page.

The one prompt you may see comes from switching **Match page height** on. That
feature measures the target window's toolbars by running a single expression
inside a page in it, which needs access to sites. Switching the toggle off hands
the permission back. See [PRIVACY.md](../PRIVACY.md) for exactly what that
expression is and what it can see.

## Updating a local build

Pull, rebuild, and reload:

```bash
git pull
pnpm install
pnpm build
```

Then click the reload arrow on the Window Resizer card in your browser's
extensions page. Your saved sizes survive a reload; they are in local extension
storage, not in the build.

## Uninstalling

Remove it from the extensions page. That deletes its local storage with it —
your saved sizes and the one toggle. Nothing is left behind anywhere else,
because nothing was ever written anywhere else.
