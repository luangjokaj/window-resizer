/**
 * The saved sizes, or the way back to them.
 *
 * An empty list is a real, reachable state — ~lib/presets stores "I deleted
 * them all" as an empty array and honours it, rather than quietly restoring the
 * defaults on the next read. So the empty state has to carry the only action
 * that undoes it, otherwise the list becomes permanently empty by accident.
 */

import styled from "styled-components";
import { Button, Callout, Icon } from "cherry-styled-components";
import { PresetRow } from "~components/PresetRow";
import type { Preset } from "~lib/presets";

const List = styled.ul`
  display: flex;
  flex-direction: column;
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
    <List>
      {presets.map((preset) => (
        <PresetRow
          key={preset.name}
          onApply={onApply}
          onDelete={onDelete}
          preset={preset}
        />
      ))}
    </List>
  );
}
