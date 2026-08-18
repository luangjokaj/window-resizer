/**
 * The saved sizes, and the only code that reads or writes them.
 *
 * Presets live in `chrome.storage.local` so they survive a browser restart and
 * stay readable from any of the extension's pages. Every read validates what
 * comes back: storage is extension-private, but a row written by an older
 * version — or half-written when the browser quit — must not be able to crash
 * the list it renders into.
 *
 * A preset is identified by its `name`, which is always derived from its
 * dimensions (`"1440 x 900"`). That is what makes "add" idempotent: the same
 * width and height cannot be saved twice, and deleting by name needs no
 * separate id to keep in sync.
 */

import { storageGet, storageSet, watchStorage } from "~lib/storage";

export const PRESETS_STORAGE_KEY = "presets";

export const DEVICE_TYPES = ["mobile", "tablet", "laptop", "desktop"] as const;

export type DeviceType = (typeof DEVICE_TYPES)[number];

export type Preset = {
  /** Always `${width} x ${height}` — see the module header. */
  name: string;
  width: number;
  height: number;
  type: DeviceType;
};

/** What a fresh install starts with, and what "Reset defaults" restores. */
export const DEFAULT_PRESETS: readonly Preset[] = [
  { name: "540 x 950", width: 540, height: 950, type: "mobile" },
  { name: "800 x 600", width: 800, height: 600, type: "mobile" },
  { name: "1024 x 768", width: 1024, height: 768, type: "tablet" },
  { name: "1152 x 700", width: 1152, height: 700, type: "laptop" },
  { name: "1440 x 900", width: 1440, height: 900, type: "laptop" },
  { name: "1920 x 1080", width: 1920, height: 1080, type: "desktop" },
  { name: "2560 x 1440", width: 2560, height: 1440, type: "desktop" },
];

export function presetName(width: number, height: number): string {
  return `${width} x ${height}`;
}

function isDeviceType(value: unknown): value is DeviceType {
  return DEVICE_TYPES.includes(value as DeviceType);
}

/**
 * Accepts one stored row, or rejects it. Dimensions must be finite positive
 * integers; the name is re-derived rather than trusted, so a row saved before
 * the naming rule existed still renders correctly.
 */
function toPreset(value: unknown): Preset | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Record<string, unknown>;

  const width = Number(row.width);
  const height = Number(row.height);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  if (width <= 0 || height <= 0) return null;

  const type = isDeviceType(row.type) ? row.type : "desktop";
  const rounded = { width: Math.round(width), height: Math.round(height) };

  return {
    name: presetName(rounded.width, rounded.height),
    width: rounded.width,
    height: rounded.height,
    type,
  };
}

/** Drops duplicates, keeping the first — the order the list is rendered in. */
function dedupe(presets: Preset[]): Preset[] {
  const seen = new Set<string>();
  return presets.filter((preset) => {
    if (seen.has(preset.name)) return false;
    seen.add(preset.name);
    return true;
  });
}

/**
 * The saved sizes. An install that has never written any gets the defaults —
 * distinct from having deliberately deleted them all, which is stored as an
 * empty array and stays empty.
 */
export async function readPresets(): Promise<Preset[]> {
  const stored = await storageGet(PRESETS_STORAGE_KEY);
  const raw = stored[PRESETS_STORAGE_KEY];
  if (!Array.isArray(raw)) return [...DEFAULT_PRESETS];

  return dedupe(
    raw.map(toPreset).filter((preset): preset is Preset => preset !== null),
  );
}

/** Resolves false when storage rejects, so the caller can say so and roll back. */
export function savePresets(presets: Preset[]): Promise<boolean> {
  return storageSet({ [PRESETS_STORAGE_KEY]: dedupe(presets) });
}

export type AddPresetResult =
  { ok: true; presets: Preset[] } | { ok: false; reason: string };

/**
 * Adds a size to the front of the list, where it is visible without scrolling.
 * A size already saved is reported rather than silently ignored — otherwise the
 * button looks broken.
 */
export async function addPreset(
  type: DeviceType,
  width: number,
  height: number,
): Promise<AddPresetResult> {
  const candidate = toPreset({ type, width, height });
  if (!candidate) {
    return { ok: false, reason: "Enter a width and a height first." };
  }

  const presets = await readPresets();
  if (presets.some((preset) => preset.name === candidate.name)) {
    return { ok: false, reason: `${candidate.name} is already saved.` };
  }

  const updated = [candidate, ...presets];
  if (!(await savePresets(updated))) {
    return { ok: false, reason: "Could not save the size: storage refused." };
  }
  return { ok: true, presets: updated };
}

export async function deletePreset(name: string): Promise<boolean> {
  const presets = await readPresets();
  return savePresets(presets.filter((preset) => preset.name !== name));
}

export function resetPresets(): Promise<boolean> {
  return savePresets([...DEFAULT_PRESETS]);
}

/** Calls `onChange` whenever any of the extension's pages edits the list. */
export function watchPresets(
  onChange: (presets: Preset[]) => void,
): () => void {
  return watchStorage((changes, area) => {
    if (area !== "local" || !changes[PRESETS_STORAGE_KEY]) return;
    void readPresets().then(onChange);
  });
}
