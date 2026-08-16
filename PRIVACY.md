# Privacy Policy

**Window Resizer**
Effective 16 August 2026

## The short version

Window Resizer collects nothing, transmits nothing, and has no servers. There is
no analytics, no telemetry, no advertising, and no account to create. It resizes
windows on your machine and that is all it does.

This is a design constraint, not a current state of affairs that might quietly
change. The extension is open source under the MIT license, so every claim below
can be checked against the code, and any change to it is visible in the commit
history.

## What the extension stores

Everything lives in your browser's local extension storage
(`chrome.storage.local`), on your device. Nothing is synced to an account and
nothing is sent anywhere.

| Key                | What it holds                                                             | Written when                              |
| ------------------ | ------------------------------------------------------------------------- | ----------------------------------------- |
| `presets`          | Your saved sizes: width, height, and the device type you tagged each with | You add, delete, or reset sizes           |
| `matchInnerHeight` | One boolean: whether heights mean the page viewport or the window         | You switch the "Match page height" toggle |

Your light/dark choice is kept in the extension page's own `localStorage`. That
is the whole list. Deleting the extension removes all of it.

## What the extension can see

To list the windows you might want to resize, Window Resizer reads the open
windows and their tabs through the `tabs` permission. That includes each tab's
title and URL, which is what the picker shows you so you can tell two windows
apart. This is read in the panel, rendered on your screen, and never stored,
logged, or transmitted.

## Site access, and the one feature that uses it

Window Resizer requests **no site access by default**. The extension holds no
`host_permissions`, so on a fresh install it cannot read or run anything on any
page you visit.

One optional feature needs more than that. **Match page height** makes a
requested height mean the page viewport instead of the whole window, which
requires knowing how tall the browser's own toolbars are in the window being
resized. There is no API that reports this, so the extension runs a single
expression inside a page in that window:

```js
window.outerHeight - window.innerHeight;
```

That expression returns one number. It does not read the page's content, its
DOM, its cookies, its storage, or anything you typed. It runs only while the
toggle is on, only against the window you are resizing, and only at the moment
you resize it.

Because that requires site access, the permission is **optional**: switching the
toggle on asks for it through the browser's own prompt, and switching the toggle
off hands it back, so the extension holds no site access while the feature is
unused. Declining the prompt leaves the feature off and everything else working.

## What the extension changes

The only thing it modifies is the size and window state of browser windows you
select, through `chrome.windows.update`. It does not modify page content,
navigate tabs, or alter anything on the sites you visit.

## Third parties

There are none. No SDKs, no remote configuration, no fonts or scripts fetched at
runtime, no crash reporting. The extension makes no network requests at all —
you can confirm this in the Network panel of your browser's own DevTools with
the panel open.

## Children

The extension collects no personal information from anyone, including children.

## Changes to this policy

Any change to what the extension stores or accesses will be reflected here and
in the [changelog](CHANGELOG.md), in the same commit that changes the code.

## Contact

Questions about this policy: [luan@riangle.com](mailto:luan@riangle.com), or
open an issue at
[github.com/luangjokaj/window-resizer](https://github.com/luangjokaj/window-resizer/issues).
