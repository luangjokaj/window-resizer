/**
 * Typing a size, then either using it or keeping it.
 *
 * The fields hold strings, not numbers. A number-typed state has no way to
 * represent a half-typed "14", so it either fights the caret or forces a 0 into
 * the box between keystrokes; parsing at submit time is the only version where
 * clearing a field is allowed to look like a cleared field.
 *
 * Validation is ~lib/resize's, not this component's. Both actions run
 * `validateDimension` before doing anything, and the reason it returns is
 * already written for a person — so it is shown verbatim rather than being
 * re-worded here into a second, slightly different vocabulary.
 */

import { useState, type FormEvent } from "react";
import styled from "styled-components";
import { Button, Icon, Input, Select } from "cherry-styled-components";
import { deviceLabel } from "~components/DeviceIcon";
import { DEVICE_TYPES, type DeviceType } from "~lib/presets";
import { validateDimension } from "~lib/resize";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.radius.lg};
`;

/** Two equal columns at 460px: wide enough for a four-digit field with its
 *  label, narrow enough that both dimensions stay on one line. */
const Fields = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.radius.xs};
`;

const Actions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.radius.xs};
`;

type Dimensions = { height: number; type: DeviceType; width: number };

type CustomSizeFormProps = {
  /** Reports a validation failure with the reason string ~lib/resize wrote. */
  onInvalid: (reason: string) => void;
  onResize: (dimensions: Dimensions) => void;
  onSave: (dimensions: Dimensions) => void;
};

export function CustomSizeForm({
  onInvalid,
  onResize,
  onSave,
}: CustomSizeFormProps) {
  const [type, setType] = useState<DeviceType>("laptop");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [widthError, setWidthError] = useState(false);
  const [heightError, setHeightError] = useState(false);

  /** Returns the parsed size, or null after reporting why it is unusable. */
  function readDimensions(): Dimensions | null {
    const parsedWidth = Number(width.trim());
    const parsedHeight = Number(height.trim());

    const widthProblem = validateDimension("Width", parsedWidth);
    setWidthError(widthProblem !== null);
    if (widthProblem) {
      onInvalid(widthProblem.reason);
      return null;
    }

    const heightProblem = validateDimension("Height", parsedHeight);
    setHeightError(heightProblem !== null);
    if (heightProblem) {
      onInvalid(heightProblem.reason);
      return null;
    }

    return { height: parsedHeight, type, width: parsedWidth };
  }

  /** Submitting the form is the resize: it is the action someone is here for,
   *  so Enter in either field performs it. */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const dimensions = readDimensions();
    if (dimensions) onResize(dimensions);
  }

  function handleSave() {
    const dimensions = readDimensions();
    if (dimensions) onSave(dimensions);
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Select
        id="custom-device-type"
        onChange={(event) => setType(event.target.value as DeviceType)}
        value={type}
        $fullWidth
        $label="Device type"
        $size="small"
      >
        {DEVICE_TYPES.map((deviceType) => (
          <option key={deviceType} value={deviceType}>
            {deviceLabel(deviceType)}
          </option>
        ))}
      </Select>

      <Fields>
        <Input
          id="custom-width"
          inputMode="numeric"
          onChange={(event) => {
            setWidth(event.target.value);
            setWidthError(false);
          }}
          placeholder="1440"
          type="number"
          value={width}
          $error={widthError}
          $fullWidth
          $label="Width"
          $size="small"
        />
        <Input
          id="custom-height"
          inputMode="numeric"
          onChange={(event) => {
            setHeight(event.target.value);
            setHeightError(false);
          }}
          placeholder="900"
          type="number"
          value={height}
          $error={heightError}
          $fullWidth
          $label="Height"
          $size="small"
        />
      </Fields>

      <Actions>
        <Button
          type="submit"
          $fullWidth
          $icon={<Icon name="Scaling" />}
          $size="small"
        >
          Resize
        </Button>
        <Button
          onClick={handleSave}
          type="button"
          $fullWidth
          $icon={<Icon name="Plus" />}
          $outline
          $size="small"
          $variant="secondary"
        >
          Save size
        </Button>
      </Actions>
    </Form>
  );
}
