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
 * already written for a person, so it is shown verbatim rather than being
 * re-worded here into a second, slightly different vocabulary.
 *
 * The three fields share one line, separated by a real multiplication sign, so
 * the row reads as the dimension it is rather than as a form. Device type sits
 * with them because it belongs to the size being described, not to either
 * action: it decides which glyph a saved size wears in the list below and
 * nothing else.
 */

import { useState, type FormEvent } from "react";
import styled from "styled-components";
import {
  Button,
  Icon,
  Input,
  Select,
  formElementHeightStyles,
  styledSmall,
} from "cherry-styled-components";
import { deviceLabel } from "~components/DeviceIcon";
import { DEVICE_TYPES, type DeviceType } from "~lib/presets";
import { validateDimension } from "~lib/resize";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.radius.xs};
`;

/**
 * Width, height, and device on one line. The two dimensions share a ratio so
 * they stay visibly a pair; the select takes slightly more because "Desktop"
 * plus a chevron needs it, and a wrapped word there would break the row.
 *
 * Aligned to the bottom rather than the top: Cherry stacks a field's label
 * above its control, and the separator between the two numbers has to sit on
 * the controls' centre line, not on the labels'.
 */
const Fields = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr 1.15fr;
  align-items: end;
  gap: ${({ theme }) => theme.spacing.radius.xs};
`;

const Times = styled.span`
  ${({ theme }) => styledSmall(theme)};
  ${formElementHeightStyles("small")};
  display: flex;
  align-items: center;
  /* grayDark, not gray: the separator is what makes the row read as one
     dimension rather than two fields, and gray is invisible against the dark
     theme's surface. */
  color: ${({ theme }) => theme.colors.grayDark};
`;

/** Resize takes the slack, because it is the action someone opened the window
 *  for. Save is sized by its own label and reads as the secondary of the two. */
const Actions = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: ${({ theme }) => theme.spacing.radius.xs};
`;

type Dimensions = { height: number; type: DeviceType; width: number };

type CustomSizeFormProps = {
  /**
   * Only relabels the height field. Heights mean the page viewport while it is
   * on, and a field that still says "Height" is the one place that difference
   * would go unmentioned at the moment it matters.
   */
  matchInnerHeight: boolean;
  /** Reports a validation failure with the reason string ~lib/resize wrote. */
  onInvalid: (reason: string) => void;
  onResize: (dimensions: Dimensions) => void;
  onSave: (dimensions: Dimensions) => void;
};

export function CustomSizeForm({
  matchInnerHeight,
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
        <Times aria-hidden="true">×</Times>
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
          $label={matchInnerHeight ? "Page height" : "Height"}
          $size="small"
        />
        <Select
          id="custom-device-type"
          onChange={(event) => setType(event.target.value as DeviceType)}
          value={type}
          $fullWidth
          $label="Device"
          $size="small"
        >
          {DEVICE_TYPES.map((deviceType) => (
            <option key={deviceType} value={deviceType}>
              {deviceLabel(deviceType)}
            </option>
          ))}
        </Select>
      </Fields>

      <Actions>
        <Button
          type="submit"
          $fullWidth
          $icon={<Icon name="Scaling" />}
          $size="small"
        >
          Resize window
        </Button>
        <Button
          onClick={handleSave}
          title="Keep this size in the list below"
          type="button"
          $icon={<Icon name="Plus" />}
          $outline
          $size="small"
          $variant="secondary"
        >
          Save
        </Button>
      </Actions>
    </Form>
  );
}
