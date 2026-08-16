/**
 * How a saved size's device class is presented.
 *
 * Every preset row is otherwise two numbers and nothing else, so the glyph is
 * the only thing that lets someone find the phone sizes in a list of seven at a
 * glance. Icon and label live together because they are the same decision made
 * twice — the picker names the type, the row draws it — and splitting them is
 * how a "laptop" ends up wearing a monitor.
 *
 * Both maps are keyed by `DeviceType` rather than by string, so adding a type
 * to ~lib/presets fails to compile here instead of silently rendering nothing.
 */

import { Icon, type IconProps } from "cherry-styled-components";
import type { DeviceType } from "~lib/presets";

const DEVICE_ICONS: Record<DeviceType, IconProps> = {
  mobile: "Smartphone",
  tablet: "Tablet",
  laptop: "Laptop",
  desktop: "Monitor",
};

const DEVICE_LABELS: Record<DeviceType, string> = {
  mobile: "Mobile",
  tablet: "Tablet",
  laptop: "Laptop",
  desktop: "Desktop",
};

export function deviceLabel(type: DeviceType): string {
  return DEVICE_LABELS[type];
}

export function DeviceIcon({
  size,
  type,
}: {
  size?: number;
  type: DeviceType;
}) {
  return <Icon name={DEVICE_ICONS[type]} size={size} />;
}
