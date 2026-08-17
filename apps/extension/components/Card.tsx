/**
 * The panel's whole visual vocabulary: a card, and the rows inside it.
 *
 * Every region of both extension pages is a card. A card is a surface with a
 * centred title bar and a stack of rows under it, hairline-separated, clipped
 * to its own radius. That is the entire language, and it is declared once here
 * because the alternative is what a panel looks like after four components have
 * each re-derived "a bordered box with a heading": the paddings drift by two
 * pixels, the dividers stop lining up, and at 460px wide the drift is the first
 * thing anyone sees.
 *
 * The dividers are the one seam. `Body` draws a hairline between adjacent
 * children rather than each row drawing its own bottom edge, which means a row
 * never has to know whether it is last, and a row that is really a wrapper (a
 * window and its expanded tab list) needs no special case at all.
 *
 * Light and dark separate a card from the page by different means on purpose. A
 * white card is lifted off a tinted page by a soft shadow, which is what the
 * design has always been. Shadows do not read on a near-black ground, so the
 * dark card is instead a genuinely lighter surface than the page it sits on and
 * carries a hairline border of its own. Inverting the light treatment would
 * have produced a black card with a white glow, which reads as an error rather
 * than as an elevation.
 */

import type { ReactNode } from "react";
import styled, { css, type RuleSet } from "styled-components";
import {
  alpha,
  resetButton,
  shade,
  styledSmall,
  styledText,
} from "cherry-styled-components";

/**
 * Lets Cherry's ready-made mixins be interpolated into a plain styled element.
 *
 * Several of them (`thinScrollbar`, `interactiveStyles`) are typed as
 * `RuleSet<{ theme: Theme }>`: rules that require a theme to be present in
 * props. styled-components types a bare `styled.ul`'s props with an *optional*
 * theme, so with `strictFunctionTypes` on the two refuse to line up even though
 * the provider always supplies one. Restating them as the theme-agnostic shape
 * `resetButton` already has is the narrowest way to say "the theme is always
 * there", and keeps the alternative (hand-copying Cherry's CSS a second time)
 * off the table.
 */
export function themedRules<TProps extends object>(
  rules: RuleSet<TProps>,
): RuleSet<object> {
  return rules as unknown as RuleSet<object>;
}

/**
 * A flat film of `color` at `percent`, painted over whatever background-color
 * the element already carries.
 *
 * Cherry's color helpers all mix against white, black, or transparency, so
 * none of them can express "the surface token, tinted toward the brand blue".
 * A one-stop gradient is the cheapest thing that can, and using the same device
 * for the page and for the dark card is what keeps the two reading as one
 * material rather than as two independently chosen colors.
 */
function wash(color: string, percent: number): string {
  return `linear-gradient(${alpha(color, percent)}, ${alpha(color, percent)})`;
}

/**
 * The ground the cards sit on: the surface token, dropped a couple of percent
 * and washed with the brand blue. Derived rather than picked so it tracks
 * `colors.light` in both themes, and so the tint is the product's own blue
 * rather than a gray that happens to look cold.
 *
 * `tabs/page.css` paints the same result as a literal, because that stylesheet
 * lands before React does and an unpainted body flashes. Keep the two in step.
 */
export const pageSurface = css`
  background-color: ${({ theme }) => shade(theme.colors.light, 2)};
  background-image: ${({ theme }) => wash(theme.colors.primary, 5)};
`;

/**
 * The card itself. 6px corners and `overflow: hidden`, so the first and last
 * rows are clipped by the card rather than each having to round two of its own
 * corners, and so a row's hover tint can run edge to edge without escaping.
 */
const Surface = styled.section`
  overflow: hidden;
  box-sizing: border-box;
  min-width: 0;
  border: solid 1px
    ${({ theme }) => (theme.isDark ? theme.colors.grayLight : "transparent")};
  border-radius: ${({ theme }) => theme.spacing.radius.xs};
  background-color: ${({ theme }) => theme.colors.light};
  background-image: ${({ theme }) =>
    theme.isDark ? wash(theme.colors.primary, 9) : "none"};
  box-shadow: ${({ theme }) => (theme.isDark ? "none" : theme.shadows.sm)};
`;

/**
 * The card's name. Regular weight at body size, centred, hairline underneath:
 * a caption for the rows below rather than a headline over them. Making it bold
 * or larger would put it in competition with the sizes, which are the only
 * thing on the page anybody is actually reading.
 */
const Title = styled.h2`
  ${({ theme }) => styledText(theme)};
  position: relative;
  margin: 0;
  padding: ${({ theme }) => theme.spacing.radius.xs}
    ${({ theme }) => theme.spacing.radius.lg};
  border-bottom: solid 1px ${({ theme }) => theme.colors.grayLight};
  color: ${({ theme }) => theme.colors.dark};
  font-weight: 400;
  text-align: center;
`;

/** Taken out of the flow so a control in the title bar cannot pull the title
 *  off centre. */
const Aside = styled.span`
  position: absolute;
  top: 50%;
  right: ${({ theme }) => theme.spacing.radius.xs};
  display: flex;
  align-items: center;
  transform: translateY(-50%);
`;

/**
 * The card's one seam: a hairline between adjacent rows, drawn by the container
 * so that no row has to know whether it is last, and a row that is really a
 * wrapper (a window and its expanded tab list) needs no special case.
 *
 * Exported because a card whose rows are a real `<ul>` has to redraw it one
 * level down, inside the list. That is the only reason it is ever repeated, and
 * repeating the declaration rather than the rule is the point.
 */
export const dividedRows = css`
  > * + * {
    border-top: solid 1px ${({ theme }) => theme.colors.grayLight};
  }
`;

const Body = styled.div`
  ${dividedRows};
  min-width: 0;
`;

type CardProps = {
  children: ReactNode;
  /** Pinned to the right of the title bar: a control for the whole card. */
  aside?: ReactNode;
  title: string;
};

export function Card({ aside, children, title }: CardProps) {
  return (
    <Surface>
      <Title>
        {title}
        {aside ? <Aside>{aside}</Aside> : null}
      </Title>
      <Body>{children}</Body>
    </Surface>
  );
}

/**
 * One row. The original spent 20px on every edge of these; at 460px with seven
 * saved sizes that is most of a window's height given over to air, so the step
 * here is 12px and the panel comes out about a quarter shorter while reading
 * the same.
 */
export const tileStyles = css`
  ${({ theme }) => styledText(theme)};
  display: flex;
  box-sizing: border-box;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.radius.lg};
  width: 100%;
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.radius.lg};
  color: ${({ theme }) => theme.colors.dark};
  text-align: left;
`;

/** A row that is not itself clickable: a setting, a form, a message. */
export const Tile = styled.div`
  ${tileStyles};
`;

/**
 * A row that is. The resting state is bare on purpose: a list of seven
 * outlined rows is a list of seven buttons, and the point of the card is that
 * it reads as one object. The tint arrives on hover, and the keyboard gets an
 * inset ring rather than an outline so that focusing a row cannot nudge the
 * row below it by two pixels.
 */
export const TileButton = styled.button`
  ${resetButton};
  ${tileStyles};
  transition: background 200ms ease;

  &:hover {
    background: ${({ theme }) => alpha(theme.colors.primary, 8)};
  }

  &:focus-visible {
    outline: none;
    background: ${({ theme }) => alpha(theme.colors.primary, 8)};
    box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colors.primary};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/** The row's own name, and the thing that gets ellipsised when a row runs out
 *  of width. */
export const TileName = styled.span`
  overflow: hidden;
  min-width: 0;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * A row that says why there is nothing here.
 *
 * `grayDark`, not `gray`. The original leaned on `gray` for every piece of
 * secondary text, and on this theme's dark ground that token is a whisper
 * against the card. `grayDark` is the paler of the two there, which is the
 * inversion that catches people out.
 */
export const TileNote = styled.div`
  ${tileStyles};
  ${({ theme }) => styledSmall(theme)};
  justify-content: center;
  color: ${({ theme }) => theme.colors.grayDark};
  text-align: center;
`;

/** Explanatory text under a row's title. */
export const Hint = styled.p`
  ${({ theme }) => styledSmall(theme)};
  margin: 0;
  color: ${({ theme }) => theme.colors.grayDark};
`;

/**
 * A size, a count, a version: anything numeric. Monospaced and tabular so a
 * column of dimensions lines up on the digit rather than on the glyph, which is
 * the difference between a list of sizes and a list of words. Color is
 * inherited on purpose; the same numerals are the loud part of one row and the
 * quiet part of another.
 */
export const Numeric = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
`;

/**
 * A labelled action small enough to sit in a title bar.
 *
 * Cherry's smallest Button is 40px tall, which is taller than the bar it would
 * sit in. An IconButton fits, but a control that restores the default sizes
 * should say so rather than rely on a tooltip. So: button semantics from
 * `resetButton`, the voice of a Hint, and a focus ring put back by hand because
 * `resetButton` takes the outline away.
 */
export const MiniAction = styled.button`
  ${resetButton};
  ${({ theme }) => styledSmall(theme)};
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  /* Optical: an icon this small sits closer to its label than any gap in the
     theme's scale. */
  gap: 4px;
  padding: 0 ${({ theme }) => theme.spacing.radius.xs};
  border-radius: ${({ theme }) => theme.spacing.radius.xs};
  color: ${({ theme }) => theme.colors.grayDark};
  transition: color 200ms ease;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }

  &:focus-visible {
    outline: solid 2px ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  svg {
    flex: 0 0 auto;
    width: 12px;
    height: 12px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
