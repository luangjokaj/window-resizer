/**
 * The block shell every section of the resizer page wears.
 *
 * The page renders in a 460px window with no browser chrome, which rules out a
 * card grid and leaves one column of labelled blocks. That makes the rhythm —
 * heading, optional hint, controls — the only thing holding the page together,
 * so it is declared once here instead of five times inline, where it drifts.
 *
 * The shared text styles live here too: a section's hint and a row's secondary
 * text are the same voice, and having one definition is what keeps them from
 * becoming two slightly different grays.
 */

import type { ReactNode } from "react";
import styled from "styled-components";
import { styledH6, styledSmall } from "cherry-styled-components";

const Block = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  min-width: 0;
`;

const Heading = styled.h2`
  ${({ theme }) => styledH6(theme)};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  margin: 0;
  color: ${({ theme }) => theme.colors.dark};
`;

/** Explanatory text under a heading, and secondary text inside rows. */
export const Hint = styled.p`
  ${({ theme }) => styledSmall(theme)};
  margin: 0;
  color: ${({ theme }) => theme.colors.grayDark};
`;

/** A size, a count, anything numeric: tabular so a column of them lines up. */
export const Numeric = styled.span`
  ${({ theme }) => styledSmall(theme)};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-variant-numeric: tabular-nums;
`;

type SectionProps = {
  children: ReactNode;
  /** Rendered opposite the title, for a count or a per-section control. */
  aside?: ReactNode;
  hint?: ReactNode;
  title: string;
};

export function Section({ aside, children, hint, title }: SectionProps) {
  return (
    <Block>
      <Heading>
        {title}
        {aside}
      </Heading>
      {hint ? <Hint>{hint}</Hint> : null}
      {children}
    </Block>
  );
}
