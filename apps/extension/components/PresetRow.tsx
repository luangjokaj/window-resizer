/**
 * One saved size: a button that applies it, and a control that forgets it.
 *
 * The pair is two separate controls rather than one row with a nested delete,
 * because a button inside a button is not valid HTML and the browsers that
 * tolerate it disagree about which one a click belongs to. Keeping them
 * siblings also means the delete gets its own tab stop and its own name, so it
 * can be reached and understood without sight of the row.
 */

import styled from "styled-components";
import { Button, Icon, IconButton } from "cherry-styled-components";
import { DeviceIcon } from "~components/DeviceIcon";
import type { Preset } from "~lib/presets";

const Row = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.radius.xs};

  /* The size button takes the slack; without this its $fullWidth would wrap
     the delete control onto its own line. Its label starts at the left edge
     rather than Cherry's centre, because seven of these stacked are a list to
     scan down, and a centred label puts every size at a different x. */
  > *:first-child {
    flex: 1 1 auto;
    justify-content: flex-start;
    min-width: 0;
  }
`;

type PresetRowProps = {
  onApply: (preset: Preset) => void;
  onDelete: (preset: Preset) => void;
  preset: Preset;
};

export function PresetRow({ onApply, onDelete, preset }: PresetRowProps) {
  return (
    <Row>
      <Button
        onClick={() => onApply(preset)}
        type="button"
        $fullWidth
        $icon={<DeviceIcon type={preset.type} />}
        $outline
        $size="small"
        $variant="tertiary"
      >
        {preset.name}
      </Button>
      {/* Deliberately not $error. That paints a red ring at rest, and seven
          of them down a 460px column shout louder than the sizes they sit
          beside — while the trash glyph already says what the control does,
          and deleting a size is one "Reset defaults" away from undone. */}
      <IconButton
        aria-label={`Delete the ${preset.name} size`}
        onClick={() => onDelete(preset)}
        title={`Delete the ${preset.name} size`}
        $size="small"
      >
        <Icon name="Trash2" />
      </IconButton>
    </Row>
  );
}
