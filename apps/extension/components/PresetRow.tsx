/**
 * One saved size: a row that applies it, and a control that forgets it.
 *
 * The row is a single button, and the circle on its right is an ornament rather
 * than a second control. The original shipped both as real buttons, which gave
 * every saved size two tab stops and two identical accessible names for one
 * action; drawn instead as a `pointer-events: none` span wearing Cherry's own
 * IconButton treatment, it looks identical, clicks fall through to the row
 * underneath, and the keyboard sees one thing because there is one thing.
 *
 * The delete is a real button, because it is a different action. It is hidden
 * until the row is pointed at and slides in from under the resize glyph, which
 * is worth keeping for a reason beyond looks: seven permanently visible delete
 * controls in a 460px column read as a list of things to remove rather than a
 * list of sizes to apply. Being hidden by default is exactly why the keyboard
 * path is spelled out, since `:hover` alone would leave it unreachable without
 * a mouse: focus anywhere in the row reveals it and rings the resize glyph.
 *
 * The dimensions are re-rendered from the numbers rather than printed from
 * `preset.name`. The name is a storage key and spells its separator "x"; every
 * dimension on this page reads "×", and one of them quietly disagreeing is the
 * kind of detail that makes a panel look assembled rather than designed.
 */

import styled, { css } from "styled-components";
import { Icon, IconButton, iconButtonStyles } from "cherry-styled-components";
import { DeviceIcon } from "~components/DeviceIcon";
import { Numeric, TileButton, TileName } from "~components/Card";
import type { Preset } from "~lib/presets";

/** Cherry's `big` IconButton, which is the round 32px control the original
 *  drew by hand. Both slots are laid over the row, so the row has to reserve
 *  the width of the pair plus the air around them. */
const ACTION_PX = 32;

/** Absolutely placed rather than laid out beside the row: the delete has to be
 *  able to arrive and leave without the resize glyph moving, and the resize
 *  glyph is what the eye is aiming at. */
const slotStyles = css`
  position: absolute;
  top: 50%;
  display: flex;
  align-items: center;
  transform: translateY(-50%);
`;

const Row = styled.li`
  position: relative;
  display: flex;
  min-width: 0;
`;

/* `iconButtonStyles` comes first because it declares `position: relative` for
   the button it usually dresses; the slot has to be the one that wins. */
const ResizeGlyph = styled.span`
  ${({ theme }) => iconButtonStyles(theme, "big")};
  ${slotStyles};
  right: ${({ theme }) => theme.spacing.radius.lg};
  /* The row beneath is the control. Letting clicks through is what allows the
     affordance to sit on top of it without becoming a second button. */
  pointer-events: none;
`;

const ForgetSlot = styled.span`
  ${slotStyles};
  right: calc(
    ${({ theme }) => theme.spacing.radius.lg} + ${ACTION_PX}px +
      ${({ theme }) => theme.spacing.radius.xs}
  );
  transform: translateY(-50%) translateX(-15px);
  opacity: 0;
  pointer-events: none;
  transition: all 300ms ease;

  /* Keeps itself alive while the pointer is on the control rather than on the
     row underneath it, which is otherwise the moment it disappears. */
  &:hover,
  &:focus-within {
    transform: translateY(-50%) translateX(0);
    opacity: 1;
    pointer-events: all;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * The row proper. It runs the full width and sits under both controls, so it
 * reserves a gutter wide enough for the pair; without it a four-digit size
 * would slide under the glyphs at the moment the delete appears.
 */
const Apply = styled(TileButton)`
  padding-right: calc(
    ${({ theme }) => theme.spacing.radius.lg} + ${2 * ACTION_PX}px +
      ${({ theme }) => theme.spacing.radius.lg}
  );

  svg {
    flex: 0 0 auto;
    color: ${({ theme }) => theme.colors.grayDark};
  }

  &:hover svg,
  &:focus-visible svg {
    color: ${({ theme }) => theme.colors.primary};
  }

  &:hover ~ ${ForgetSlot}, &:focus-visible ~ ${ForgetSlot} {
    transform: translateY(-50%) translateX(0);
    opacity: 1;
    pointer-events: all;
  }

  &:hover ~ ${ResizeGlyph} {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:focus-visible ~ ${ResizeGlyph} {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.primaryLight};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:active ~ ${ResizeGlyph} {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryLight};
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
    <Row>
      <Apply
        onClick={() => onApply(preset)}
        title={`Resize the window to ${size}`}
        type="button"
      >
        <DeviceIcon size={20} type={preset.type} />
        <TileName>
          <Numeric>{size}</Numeric>
        </TileName>
      </Apply>
      <ForgetSlot>
        <IconButton
          aria-label={`Delete the ${size} size`}
          onClick={() => onDelete(preset)}
          title={`Delete the ${size} size`}
          $error
          $size="big"
        >
          <Icon name="Trash2" />
        </IconButton>
      </ForgetSlot>
      <ResizeGlyph aria-hidden="true">
        <Icon name="Scaling" />
      </ResizeGlyph>
    </Row>
  );
}
