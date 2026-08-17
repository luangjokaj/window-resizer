/**
 * The resizer window: the whole product, in one 460px column.
 *
 * It runs as an extension page in a popup-type window rather than as a toolbar
 * popup (see background.ts for why), so it stays open while the windows it
 * resizes take and lose focus. That single fact shapes everything here: the
 * window list has to stay live, because it is watched rather than snapshotted
 * at open; and every outcome has to land in a toast, because there is no
 * closing-and-reopening moment to report anything at.
 *
 * The old extension used `alert()` for this. Nothing here may: an alert blocks
 * the page it interrupts, and this page's whole job is to survive the thing it
 * just did to another window.
 *
 * Reasons and notes come out of ~lib/resize and ~lib/presets already written
 * for a person. They are shown verbatim, never prefixed and never re-worded,
 * because a second vocabulary for the same failure is how the two drift apart.
 *
 * The order of the cards is the order of the sentence someone is composing:
 * which window, how heights are counted in it, a size to type, and the sizes
 * already saved. Everything on the page is sized against the fact that
 * scrolling to reach a preset defeats the reason this is a window and not a
 * popup, which is why the card rows are 12px rather than the 20px the design
 * originally used.
 */

import { useEffect, useState, type ChangeEvent } from "react";
import styled, { keyframes } from "styled-components";
import {
  Icon,
  ThemeToggle,
  ToastNotifications,
  ToastNotificationsProvider,
  styledSmall,
  useToastNotifications,
} from "cherry-styled-components";
import { Card, MiniAction, Numeric, pageSurface } from "~components/Card";
import { CustomSizeForm } from "~components/CustomSizeForm";
import { Logo } from "~components/Logo";
import { MatchHeightToggle } from "~components/MatchHeightToggle";
import { PresetList } from "~components/PresetList";
import { WindowPicker } from "~components/WindowPicker";
import { ThemeProvider } from "~lib/ThemeProvider";
import {
  addPreset,
  deletePreset,
  presetName,
  readPresets,
  resetPresets,
  watchPresets,
  type DeviceType,
  type Preset,
} from "~lib/presets";
import { resizeWindow, type ResizeOutcome } from "~lib/resize";
import {
  hasMeasurePermission,
  readMatchInnerHeight,
  releaseMeasurePermission,
  requestMeasurePermission,
  saveMatchInnerHeight,
  watchMatchInnerHeight,
} from "~lib/settings";
import {
  focusWindow,
  listResizableWindows,
  watchWindows,
  type BrowserWindow,
} from "~lib/windows";

import "./page.css";

/** Long enough to read a size back, short enough not to stack up while
 *  clicking through several presets in a row, which is the whole reason this
 *  is a window and not a popup, so it is the case to tune for. */
const TOAST_SUCCESS_MS = 2500;

/** Failures and clamp notes carry a sentence to read, so they get longer. */
const TOAST_ERROR_MS = 7000;

/**
 * `tabs.onUpdated` fires several times for one page load, and each event would
 * otherwise cost a full `windows.getAll`. One trailing read per burst keeps the
 * list as live as it needs to look.
 */
const WINDOW_REFRESH_DELAY_MS = 120;

function readVersion(): string {
  try {
    return chrome.runtime.getManifest().version;
  } catch {
    // Not an extension runtime. The number is decoration here, not function.
    return "1.0.0";
  }
}

const VERSION = readVersion();

/** A short rise, once, as the window opens. It is felt on every open, so it is
 *  kept under a fifth of a second: enough to make the column assemble rather
 *  than appear, not enough to be waited on. */
const riseIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: none;
  }
`;

const Shell = styled.main`
  ${pageSurface};
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.radius.lg};
  width: 100%;
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.radius.lg};
  color: ${({ theme }) => theme.colors.dark};

  > * {
    animation: ${riseIn} 180ms ease-out both;
  }

  > *:nth-child(2) {
    animation-delay: 30ms;
  }

  > *:nth-child(3) {
    animation-delay: 60ms;
  }

  > *:nth-child(4) {
    animation-delay: 90ms;
  }

  > *:nth-child(5) {
    animation-delay: 120ms;
  }

  @media (prefers-reduced-motion: reduce) {
    > * {
      animation: none;
    }
  }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.radius.xs};
`;

/** The version, reduced to the only part of it anyone reads. The wordmark
 *  beside it already says which extension this is, which is what lets the
 *  footer that used to carry both disappear. */
const VersionChip = styled(Numeric)`
  ${({ theme }) => styledSmall(theme)};
  flex: 0 0 auto;
  margin-right: auto;
  padding: 0 ${({ theme }) => theme.spacing.radius.xs};
  border: solid 1px ${({ theme }) => theme.colors.grayLight};
  border-radius: ${({ theme }) => theme.spacing.radius.xl};
  color: ${({ theme }) => theme.colors.grayDark};
`;

/**
 * Phrases a successful resize. The granted size is reported rather than the
 * requested one (~lib/resize reads the window back precisely because the two
 * differ) and the page height is spelled out separately when toolbars were
 * folded in, since that number is the one that was actually asked for.
 */
function describeResize(outcome: Extract<ResizeOutcome, { ok: true }>): string {
  const summary =
    outcome.chromeHeight > 0
      ? `Resized to ${outcome.width} × ${outcome.height}, a ${
          outcome.height - outcome.chromeHeight
        }px page.`
      : `Resized to ${outcome.width} × ${outcome.height}.`;

  return outcome.note ? `${summary} ${outcome.note}` : summary;
}

function ResizerPage() {
  const { addNotification } = useToastNotifications();
  // `undefined` until the first read lands; `null` only if this runtime has no
  // windows API at all. The picker renders all three differently.
  const [windows, setWindows] = useState<BrowserWindow[] | null | undefined>(
    undefined,
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [matchInnerHeight, setMatchInnerHeight] = useState(false);

  const notifyError = (text: string) =>
    addNotification(text, { color: "error", autoHide: TOAST_ERROR_MS });

  const notifySuccess = (text: string) =>
    addNotification(text, { color: "success", autoHide: TOAST_SUCCESS_MS });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const read = async () => {
      const list = await listResizableWindows();
      if (!cancelled) setWindows(list);
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void read();
      }, WINDOW_REFRESH_DELAY_MS);
    };

    void read();
    const unsubscribe = watchWindows(schedule);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  /** Keeps the target valid as windows come and go: a selection that just
   *  closed silently becomes another window rather than a resize that fails. */
  useEffect(() => {
    if (!windows || windows.length === 0) {
      setSelectedId(null);
      return;
    }

    setSelectedId((current) => {
      if (current !== null && windows.some(({ id }) => id === current)) {
        return current;
      }
      // The window in front is the one most likely being looked at.
      return (windows.find(({ focused }) => focused) ?? windows[0]).id;
    });
  }, [windows]);

  useEffect(() => {
    void readPresets().then(setPresets);
    return watchPresets(setPresets);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [enabled, granted] = await Promise.all([
        readMatchInnerHeight(),
        hasMeasurePermission(),
      ]);
      if (cancelled) return;

      // The permission can be revoked from the browser's own extensions page,
      // which leaves the setting claiming a capability the extension no longer
      // has. Correct the record here rather than letting every resize fail
      // with a note about it.
      if (enabled && !granted) {
        setMatchInnerHeight(false);
        void saveMatchInnerHeight(false);
        return;
      }

      setMatchInnerHeight(enabled);
    })();

    const unsubscribe = watchMatchInnerHeight(setMatchInnerHeight);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  function handleMatchInnerHeightChange(event: ChangeEvent<HTMLInputElement>) {
    const enabled = event.target.checked;

    if (!enabled) {
      setMatchInnerHeight(false);
      void saveMatchInnerHeight(false);
      // Give the site access back: the extension should hold no permission it
      // is not currently using.
      void releaseMeasurePermission();
      return;
    }

    // Nothing may be awaited before this call. Chrome only honours
    // permissions.request while the click that triggered it is still live, and
    // a single await is enough to lose the gesture.
    const request = requestMeasurePermission();
    setMatchInnerHeight(true);

    void request.then(async (granted) => {
      if (!granted) {
        setMatchInnerHeight(false);
        notifyError(
          "Matching the page height needs permission to measure a page in the window. Without it, a height stays the window's own.",
        );
        return;
      }

      if (!(await saveMatchInnerHeight(true))) {
        setMatchInnerHeight(false);
        notifyError("Could not save that setting — storage refused.");
      }
    });
  }

  async function applySize(width: number, height: number) {
    if (selectedId === null) {
      notifyError("Pick a window to resize first.");
      return;
    }

    const outcome = await resizeWindow(
      selectedId,
      width,
      height,
      matchInnerHeight,
    );

    if (!outcome.ok) {
      notifyError(outcome.reason);
      return;
    }

    // A note means the browser did something other than what was asked, which
    // is worth a warning's weight even though the resize itself succeeded.
    if (outcome.note) {
      addNotification(describeResize(outcome), {
        color: "warning",
        autoHide: TOAST_ERROR_MS,
      });
      return;
    }

    notifySuccess(describeResize(outcome));
  }

  async function savePreset(type: DeviceType, width: number, height: number) {
    const result = await addPreset(type, width, height);
    if (!result.ok) {
      notifyError(result.reason);
      return;
    }

    setPresets(result.presets);
    notifySuccess(`Saved ${presetName(width, height)}.`);
  }

  async function removePreset(preset: Preset) {
    if (!(await deletePreset(preset.name))) {
      notifyError(`Could not delete ${preset.name} — storage refused.`);
      return;
    }

    setPresets(await readPresets());
    notifySuccess(`Deleted ${preset.name}.`);
  }

  async function restoreDefaults() {
    if (!(await resetPresets())) {
      notifyError("Could not restore the default sizes — storage refused.");
      return;
    }

    setPresets(await readPresets());
    notifySuccess("Saved sizes restored to the defaults.");
  }

  return (
    <Shell>
      <Header>
        <Logo width={160} />
        <VersionChip>{VERSION}</VersionChip>
        <ThemeToggle aria-label="Switch between the light and dark theme" />
      </Header>

      <Card title="Select Window">
        <WindowPicker
          onFocus={focusWindow}
          onSelect={setSelectedId}
          selectedId={selectedId}
          windows={windows}
        />
      </Card>

      <Card title="Window Settings">
        <MatchHeightToggle
          checked={matchInnerHeight}
          onChange={handleMatchInnerHeightChange}
        />
      </Card>

      <Card title="Add New">
        <CustomSizeForm
          matchInnerHeight={matchInnerHeight}
          onInvalid={notifyError}
          onResize={({ height, width }) => {
            void applySize(width, height);
          }}
          onSave={({ height, type, width }) => {
            void savePreset(type, width, height);
          }}
        />
      </Card>

      <Card
        title="Select Size"
        /* An emptied list already offers this, right where the sizes were.
           Two identical controls a few rows apart is the smell, not the
           duplication of intent. */
        aside={
          presets.length > 0 ? (
            <MiniAction
              onClick={() => {
                void restoreDefaults();
              }}
              title="Bring back the sizes this extension ships with"
              type="button"
            >
              <Icon name="RotateCcw" />
              Reset
            </MiniAction>
          ) : null
        }
      >
        <PresetList
          onApply={({ height, width }) => {
            void applySize(width, height);
          }}
          onDelete={(preset) => {
            void removePreset(preset);
          }}
          onReset={() => {
            void restoreDefaults();
          }}
          presets={presets}
        />
      </Card>
    </Shell>
  );
}

function Resizer() {
  return (
    <ThemeProvider>
      <ToastNotificationsProvider>
        <ResizerPage />
        <ToastNotifications $align="center" $bottom />
      </ToastNotificationsProvider>
    </ThemeProvider>
  );
}

export default Resizer;
