/**
 * The one setting on the page, as a single row rather than as a section.
 *
 * It used to be a full block: a heading, a five-line explanation, and a switch
 * underneath. That is roughly 150px of a 460px-wide window spent on a control
 * most people set once, and it sat second from the top, above the sizes it
 * modifies. Here it is last and one row tall, which is the weight a persistent
 * mode deserves next to the actions it qualifies.
 *
 * The explanation keeps its worked example. Shortening the copy to "matches the
 * page height" would fit on one line and tell nobody what changes, and the
 * whole point of the setting is that 900 stops meaning one thing and starts
 * meaning another.
 *
 * The glyph carries the state as well as the label does: brand-coloured while
 * the mode is on, gray while it is off, so a glance at the bottom of the panel
 * answers "are my heights viewport heights right now".
 */

import type { ChangeEvent } from "react";
import styled from "styled-components";
import { Icon, Toggle, styledSmall } from "cherry-styled-components";
import { Hint } from "~components/Panel";

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.radius.lg};
`;

const Copy = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  /* Optical, not a rhythm step: the title and its explanation are one block of
     text, so they sit closer than any gap in the theme's scale. */
  gap: 2px;
  min-width: 0;
`;

const TitleLine = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  min-width: 0;
`;

const Glyph = styled.span<{ $on: boolean }>`
  display: inline-flex;
  flex: 0 0 auto;
  color: ${({ $on, theme }) =>
    $on ? theme.colors.primary : theme.colors.grayDark};
  transition: color 150ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Title = styled.label`
  ${({ theme }) => styledSmall(theme)};
  color: ${({ theme }) => theme.colors.dark};
  font-weight: 600;
  cursor: pointer;
`;

/** Cherry's global reset gives every element `min-width: 0`, which lets a flex
 *  item shrink past its own contents. The switch is a fixed-width graphic and
 *  has to opt out, or a long explanation beside it squashes the track. */
const Switch = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
`;

/** Shared with the resizer page, which needs the same id to report the setting
 *  being refused after the permission prompt comes back. */
const TOGGLE_ID = "match-inner-height";

type MatchHeightToggleProps = {
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function MatchHeightToggle({
  checked,
  onChange,
}: MatchHeightToggleProps) {
  return (
    <Row>
      <Copy>
        <TitleLine>
          <Glyph $on={checked}>
            <Icon name="PanelTop" size={14} />
          </Glyph>
          <Title htmlFor={TOGGLE_ID}>Match page height</Title>
        </TitleLine>
        <Hint>
          Adds this window's measured toolbars on top, so 1440 × 900 becomes a
          900px page, not a 900px window.
        </Hint>
      </Copy>
      <Switch>
        <Toggle
          aria-label="Match page height"
          checked={checked}
          id={TOGGLE_ID}
          onChange={onChange}
          $size="small"
        />
      </Switch>
    </Row>
  );
}
