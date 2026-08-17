/**
 * The saved sizes, or the way back to them.
 *
 * An empty list is a real, reachable state: ~lib/presets stores "I deleted them
 * all" as an empty array and honours it, rather than quietly restoring the
 * defaults on the next read. So the empty state has to carry the only action
 * that undoes it, otherwise the list becomes permanently empty by accident.
 *
 * Full-width rows rather than a grid of tiles. A saved size is one line of a
 * list someone reads top to bottom looking for a number, and the resize control
 * belongs on the same x on every row so the pointer can travel straight down
 * the column.
 */

import styled from "styled-components";
import { Button, Icon } from "cherry-styled-components";
import { PresetRow } from "~components/PresetRow";
import { Hint, Tile, dividedRows } from "~components/Card";
import type { Preset } from "~lib/presets";

/** A real list, so the rows are announced as one. It stands between the card
 *  and its rows, so it is the thing that has to redraw the card's seam. */
const Rows = styled.ul`
  ${dividedRows};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Empty = styled(Tile)`
  flex-direction: column;
  align-items: stretch;
  gap: ${({ theme }) => theme.spacing.radius.lg};
  text-align: center;
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
        <Hint>
          No saved sizes. Add one above, or bring back the ones this extension
          ships with.
        </Hint>
        <Button
          onClick={onReset}
          type="button"
          $fullWidth
          $icon={<Icon name="RotateCcw" />}
          $size="small"
        >
          Reset defaults
        </Button>
      </Empty>
    );
  }

  return (
    <Rows>
      {presets.map((preset) => (
        <PresetRow
          key={preset.name}
          onApply={onApply}
          onDelete={onDelete}
          preset={preset}
        />
      ))}
    </Rows>
  );
}
