/**
 * One saved size: a tile that applies it, and a control that forgets it.
 *
 * The pair is two separate controls rather than one tile with a nested delete,
 * because a button inside a button is not valid HTML and the browsers that
 * tolerate it disagree about which one a click belongs to. Keeping them
 * siblings also means the delete gets its own tab stop and its own name, so it
 * can be reached and understood without sight of the tile. The delete is laid
 * over the tile rather than beside it so that two sizes still fit on a line,
 * and the tile reserves a gutter for it so a four-digit size never runs under
 * the glyph.
 *
 * A tile rather than a row: seven full-width buttons is 300px of a 460px
 * window spent on a list that is really a keypad. Two columns halve that, and
 * the size is short enough that nothing is lost to the narrower cell.
 *
 * The dimensions are re-rendered from the numbers rather than printed from
 * `preset.name`. The name is a storage key and spells its separator "x"; every
 * dimension on this page reads "×", and one of them quietly disagreeing is the
 * kind of detail that makes a panel look assembled rather than designed.
 */

import styled from "styled-components";
import {
  Icon,
  errorInteractiveStyles,
  interactiveStyles,
  resetButton,
} from "cherry-styled-components";
import { DeviceIcon } from "~components/DeviceIcon";
import { Numeric, themedRules } from "~components/Panel";
import type { Preset } from "~lib/presets";

/** The delete control's box, plus the air it needs to stay clear of a
 *  four-digit size. Reserved as padding on the tile underneath it. */
const DELETE_GUTTER_PX = 32;

const Cell = styled.li`
  position: relative;
  display: flex;
  min-width: 0;
`;

/**
 * `interactiveStyles` already carries the hover, focus, and active behaviour
 * every clickable surface in Cherry shares; only the resting border colour has
 * to be put back, because a tile with no border at rest gives no hint that it
 * can be pressed.
 */
const Apply = styled.button`
  ${resetButton};
  ${themedRules(interactiveStyles)};
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.radius.xs};
  padding-right: ${DELETE_GUTTER_PX}px;
  border-color: ${({ theme }) => theme.colors.grayLight};
  border-radius: ${({ theme }) => theme.spacing.radius.xs};
  background: ${({ theme }) => theme.colors.light};
  color: ${({ theme }) => theme.colors.dark};
  text-align: left;

  svg {
    flex: 0 0 auto;
    color: ${({ theme }) => theme.colors.grayDark};
  }

  &:hover svg {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

/**
 * Deliberately not an `$error` IconButton. That paints a red ring at rest, and
 * seven of them across a 460px column shout louder than the sizes they sit
 * beside, while the glyph already says what the control does and deleting a
 * size is one "Reset defaults" away from undone. The red arrives on hover,
 * which is the moment it is worth having.
 */
const Forget = styled.button`
  ${resetButton};
  ${themedRules(errorInteractiveStyles)};
  position: absolute;
  top: 50%;
  right: ${({ theme }) => theme.spacing.radius.xs};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  transform: translateY(-50%);
  border-radius: ${({ theme }) => theme.spacing.radius.xs};
  /* grayDark rather than gray: it is the token Cherry's own IconButton rests
     at, and it is the paler of the two on a dark ground, where gray all but
     disappears against the tile. */
  color: ${({ theme }) => theme.colors.grayDark};

  &:hover {
    color: ${({ theme }) => theme.colors.error};
  }
`;

type PresetRowProps = {
  onApply: (preset: Preset) => void;
  onDelete: (preset: Preset) => void;
  preset: Preset;
};

export function PresetRow({ onApply, onDelete, preset }: PresetRowProps) {
  const size = `${preset.width} × ${preset.height}`;

  return (
    <Cell>
      <Apply
        onClick={() => onApply(preset)}
        title={`Resize the window to ${size}`}
        type="button"
      >
        <DeviceIcon size={14} type={preset.type} />
        <Numeric>{size}</Numeric>
      </Apply>
      <Forget
        aria-label={`Delete the ${size} size`}
        onClick={() => onDelete(preset)}
        title={`Delete the ${size} size`}
        type="button"
      >
        <Icon name="X" size={14} />
      </Forget>
    </Cell>
  );
}
