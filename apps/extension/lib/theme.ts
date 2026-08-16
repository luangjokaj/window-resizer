/**
 * The Cherry theme, wearing Window Resizer's colors.
 *
 * The palette is the logo's rather than a designer's afterthought: the mark is
 * #0076FF, so the light theme takes that blue verbatim and every button, focus
 * ring, and link in the extension inherits the product's identity for free.
 *
 * Dark mode cannot reuse those values. #0076FF is dim against a near-black
 * surface and #003B80 is unreadable on one, so the dark set is re-derived —
 * lighter and slightly desaturated — and the Light/Dark poles change meaning
 * with the ground: on a dark surface hover *brightens*, so `primaryDark` is
 * the brighter blue there, the same inversion Cherry's own dark palette makes.
 *
 * Nothing here fetches a font. An extension page has to render with no network
 * at all, so the stack names Inter first — the face the original product used,
 * and one many machines already have — and falls through to the platform's own
 * UI face rather than to a download that may never arrive.
 */

import {
  theme as base,
  themeDark as baseDark,
  type Theme,
} from "cherry-styled-components";

/**
 * The mark's blue, held apart from the palette on purpose: the logo is one
 * fixed artwork in both color schemes, so it must not follow `colors.primary`
 * when that shifts for dark mode.
 */
export const BRAND_BLUE = "#0076FF";

/**
 * The dark-mode surface. Named because the page shells (`tabs/page.css`) paint
 * it too: that stylesheet lands before React does, and a body left white would
 * flash before the first paint of a dark theme. Keep the two in step.
 */
const DARK_SURFACE = "#080C14";

const brandColorsLight: Theme["colors"] = {
  ...base.colors,
  primaryLight: "#82BCFF",
  primary: BRAND_BLUE,
  primaryDark: "#003B80",
  secondaryLight: "#7DD3FC",
  secondary: "#4656DA",
  secondaryDark: "#075985",
  // The brand supplies two families; Cherry's `tertiary` variant needs a
  // third, and its stock value is a warm taupe that reads as a mistake among
  // blues. A cool slate is the quiet end of the same palette, which is
  // exactly the role tertiary plays here: the repeated preset rows and the
  // footer's reset, present but never competing with the blue.
  tertiaryLight: "#CBD5E1",
  tertiary: "#475569",
  tertiaryDark: "#1E293B",
};

/**
 * The same three families lifted onto a near-black ground. Grays are tinted
 * toward the brand blue instead of neutral, so a hairline border reads as part
 * of the product rather than as a stray gray line, and `light` — the surface —
 * carries the same tint at almost no lightness.
 */
const brandColorsDark: Theme["colors"] = {
  ...baseDark.colors,
  primaryLight: "#A8D0FF",
  primary: "#4D9EFF",
  primaryDark: "#7CB8FF",
  secondaryLight: "#BAE6FD",
  secondary: "#8B9CF7",
  secondaryDark: "#38BDF8",
  // The slate inverts with everything else: `tertiaryDark` is the brighter
  // hover, and `tertiaryLight` is the focus ring, which has to stay visible
  // against near-black rather than merely being the palest value.
  tertiaryLight: "#475569",
  tertiary: "#94A3B8",
  tertiaryDark: "#CBD5E1",
  grayLight: "#18202E",
  gray: "#3F4B60",
  grayDark: "#93A1BC",
  light: DARK_SURFACE,
};

const brandFonts: Theme["fonts"] = {
  head: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  text: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  mono: '"SFMono-Regular", Menlo, Consolas, "Liberation Mono", "Courier New", monospace',
};

export const theme: Theme = {
  ...base,
  colors: brandColorsLight,
  fonts: brandFonts,
};

export const themeDark: Theme = {
  ...baseDark,
  colors: brandColorsDark,
  fonts: brandFonts,
};
