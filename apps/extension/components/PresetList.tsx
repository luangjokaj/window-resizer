/**
 * The saved sizes, or the way back to them.
 *
 * An empty list is a real, reachable state: ~lib/presets stores "I deleted them
 * all" as an empty array and honours it, rather than quietly restoring the
 * defaults on the next read. So the empty state has to carry the only action
 * that undoes it, otherwise the list becomes permanently empty by accident.
 *
 * Two columns, and no frame around them. Each tile already carries its own
 * border, and a panel around a grid of bordered tiles is a frame inside a
 * frame; the grid is legible as one object without it.
 */

import styled from "styled-components";
import { Button, Callout, Icon } from "cherry-styled-components";
import { PresetRow } from "~components/PresetRow";
import type { Preset } from "~lib/presets";

const Grid = styled.ul`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Empty = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.radius.xs};
`;

type PresetListProps = {
  onApply: (preset: Preset) => void;
  onDelete: (preset: Preset) => void;
  onReset: () => void;
  presets: Preset[];
};

export function PresetList({
  onApply,
  onDelete,
  onReset,
  presets,
}: PresetListProps) {
  if (presets.length === 0) {
    return (
      <Empty>
        <Callout $type="note">
          No saved sizes. Add one above, or bring back the ones this extension
          ships with.
        </Callout>
        <Button
          onClick={onReset}
          type="button"
          $fullWidth
          $icon={<Icon name="RotateCcw" />}
          $outline
          $size="small"
          $variant="secondary"
        >
          Reset defaults
        </Button>
      </Empty>
    );
  }

  return (
    <Grid>
      {presets.map((preset) => (
        <PresetRow
          key={preset.name}
          onApply={onApply}
          onDelete={onDelete}
          preset={preset}
        />
      ))}
    </Grid>
  );
}
