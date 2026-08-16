/**
 * The resizer's visual vocabulary: one framed surface, one label style, and
 * the handful of text atoms every block is built out of.
 *
 * The page is 460px wide with no browser chrome, and the flow it exists for is
 * clicking through several sizes in a row, so anything that has to be scrolled
 * to is effectively missing. Density is therefore the constraint that shapes
 * all of this: headings are small tracked legends rather than headline type, a
 * group of controls is delimited by a hairline frame rather than by
 * whitespace, and the dimensions (which are the whole product) are the only
 * thing allowed to be loud.
 *
 * Declaring that vocabulary once is what keeps it a system. Four inline
 * variations of "a bordered box with a small label above it" is how a panel
 * stops looking designed, and at this width the drift shows immediately.
 */

import type { ReactNode } from "react";
import styled, { type RuleSet } from "styled-components";
import { alpha, resetButton, styledSmall } from "cherry-styled-components";

/**
 * Lets Cherry's ready-made interaction mixins be interpolated into a plain
 * styled element.
 *
 * `interactiveStyles` and `errorInteractiveStyles` are typed as
 * `RuleSet<{ theme: Theme }>`: rules that require a theme to be present in
 * props. styled-components types a bare `styled.button`'s props with an
 * *optional* theme, so with `strictFunctionTypes` on the two refuse to line up
 * even though the provider always supplies one. Restating them as the
 * theme-agnostic shape `resetButton` already has is the narrowest way to say
 * "the theme is always there", and keeps the alternative (hand-rolling
 * Cherry's hover, focus, and active behaviour a second time) off the table.
 */
export function themedRules<TProps extends object>(
  rules: RuleSet<TProps>,
): RuleSet<object> {
  return rules as unknown as RuleSet<object>;
}

/** Explanatory text under a label, and secondary text inside rows. */
export const Hint = styled.p`
  ${({ theme }) => styledSmall(theme)};
  margin: 0;
  color: ${({ theme }) => theme.colors.grayDark};
`;

/**
 * A size, a count, a version: anything numeric. Monospaced and tabular so a
 * column of dimensions lines up on the digit rather than on the glyph, which
 * is the difference between a list of sizes and a list of words.
 *
 * Color is deliberately inherited. The same numerals appear as the loud part
 * of a row and as the quiet part of another, and baking one in here would mean
 * fighting it at every second call site.
 */
export const Numeric = styled.span`
  ${({ theme }) => styledSmall(theme)};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
`;

/**
 * A block's name. Uppercase and tracked rather than large, because at this
 * width a 16px heading costs a control's worth of height for a word everyone
 * reads once. Weight and case carry the hierarchy that size used to.
 */
export const Eyebrow = styled.h2`
  ${({ theme }) => styledSmall(theme)};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  min-width: 0;
  margin: 0;
  color: ${({ theme }) => theme.colors.dark};
  font-weight: 600;
  /* The mixin's line-height is set for paragraphs. On a one-line all-caps
     label with no descenders it is a third of a row of air that the panel
     cannot spare four times over. */
  line-height: 1.2;
  /* Optical, not a rhythm step: uppercase at this size closes up without
     tracking, and the tracking is exactly what makes it read as a legend
     rather than as shouting. */
  letter-spacing: 0.09em;
  text-transform: uppercase;
`;

/** A count beside a label. Sits inside the Eyebrow, so it has to opt back out
 *  of the uppercasing and the tracking it would otherwise inherit. */
export const Count = styled(Numeric)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 ${({ theme }) => theme.spacing.radius.xs};
  border-radius: ${({ theme }) => theme.spacing.radius.xl};
  background: ${({ theme }) => alpha(theme.colors.primary, 14)};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
  text-transform: none;
`;

/**
 * A labelled action small enough to sit in a block's label row.
 *
 * Cherry's smallest Button is 40px tall, which is taller than the label it
 * would sit beside and would give a one-word action the same weight as
 * "Resize". An unlabelled IconButton fits, but a control that restores the
 * default sizes should say so rather than rely on a tooltip. So: button
 * semantics from `resetButton`, the label voice of a Hint, and a focus ring
 * put back by hand because `resetButton` removes the outline.
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
  transition: color 150ms ease;

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

/**
 * The framed surface a group of controls sits on.
 *
 * `grayLight` is the resting border of every Cherry control, so a wash of it
 * is the one fill that lifts a panel off the page in both themes without
 * inventing a color: barely off-white over the light page, a faint rise over
 * the near-black one. The border is the same token at full strength, which is
 * what keeps a panel and the inputs inside it looking like one material.
 *
 * `$flush` is for a panel whose children already carry their own padding and
 * dividers, which is to say a list. It clips them to the panel's radius so the
 * list reads as one object rather than as rows that happen to be stacked.
 */
export const Panel = styled.div<{ $flush?: boolean }>`
  box-sizing: border-box;
  min-width: 0;
  padding: ${({ $flush, theme }) => ($flush ? "0" : theme.spacing.radius.lg)};
  overflow: ${({ $flush }) => ($flush ? "hidden" : "visible")};
  border: solid 1px ${({ theme }) => theme.colors.grayLight};
  border-radius: ${({ theme }) => theme.spacing.radius.lg};
  background: ${({ theme }) => alpha(theme.colors.grayLight, 55)};
`;

const Frame = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  min-width: 0;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  min-width: 0;
`;

type PanelBlockProps = {
  children: ReactNode;
  /** Pinned to the far right of the label row: a control for the whole block. */
  aside?: ReactNode;
  /** Sits immediately after the title, inside the label: a count or a state. */
  badge?: ReactNode;
  title: string;
};

/**
 * A named block. Every region of the page is one of these, which is what makes
 * the page scan as a single column of labelled instruments rather than as a
 * stack of unrelated widgets.
 */
export function PanelBlock({ aside, badge, children, title }: PanelBlockProps) {
  return (
    <Frame>
      <Head>
        <Eyebrow>
          {title}
          {badge}
        </Eyebrow>
        {aside}
      </Head>
      {children}
    </Frame>
  );
}
