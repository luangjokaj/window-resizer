/**
 * Typing a size, then either keeping it or using it.
 *
 * One line: what kind of device this size describes, the two numbers, and the
 * two things that can be done with them. The device type sits with the numbers
 * because it belongs to the size being described rather than to either action;
 * it decides which glyph a saved size wears in the list below and nothing else.
 *
 * It is a button that opens a row of device glyphs rather than a Select. A
 * Select would need a visible label to be understood, and a label above the
 * control breaks the single line the row exists to be. The glyphs are the same
 * ones the saved sizes wear, so picking one is choosing the icon you will see,
 * which no dropdown of four words can say as directly.
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
 */

import { useState, type FormEvent } from "react";
import styled from "styled-components";
import { Icon, IconButton, Input, resetButton } from "cherry-styled-components";
import { DeviceIcon, deviceLabel } from "~components/DeviceIcon";
import { tileStyles } from "~components/Card";
import { DEVICE_TYPES, type DeviceType } from "~lib/presets";
import { validateDimension } from "~lib/resize";

/** Cherry's `big` IconButton: the round 32px control used for every action in
 *  the panel, and the size the device glyphs are drawn at here too. */
const ACTION_PX = 32;

const Form = styled.form`
  min-width: 0;
`;

const Fields = styled.div`
  ${tileStyles};
  gap: ${({ theme }) => theme.spacing.radius.xs};
`;

/** Both numbers share the row's slack equally, so the pair stays visibly a
 *  pair however wide the panel is. */
const Field = styled.div`
  flex: 1 1 0;
  min-width: 0;
`;

/**
 * The device glyph, and the chevron that says it can be changed. Not a Cherry
 * control: it is a glyph plus a chevron rather than an icon-only button, and
 * an IconButton's circle would read as one of the two actions on the far side
 * of the row.
 */
const TypeButton = styled.button<{ $open: boolean }>`
  ${resetButton};
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 2px;
  padding: 0;
  border-radius: ${({ theme }) => theme.spacing.radius.xs};
  color: ${({ theme }) => theme.colors.grayDark};
  transition: color 200ms ease;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }

  &:focus-visible {
    outline: solid 2px ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  .chevron {
    display: inline-flex;
    transform: rotate(${({ $open }) => ($open ? "-180deg" : "0deg")});
    transition: transform 300ms ease;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    .chevron {
      transition: none;
    }
  }
`;

/**
 * The four device glyphs, revealed under the row that summons them.
 *
 * Collapsed by height rather than unmounted, so the row grows and shrinks
 * instead of appearing. `visibility` rides along with the height: a
 * zero-height overflow-hidden box still holds focusable children, and a
 * keyboard would otherwise tab into four buttons nobody can see.
 */
const TypePicker = styled.div<{ $open: boolean }>`
  display: flex;
  overflow: hidden;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  max-height: ${({ $open }) => ($open ? `${ACTION_PX * 2}px` : "0")};
  padding: 0 ${({ theme }) => theme.spacing.radius.lg}
    ${({ $open, theme }) => ($open ? theme.spacing.radius.lg : "0")};
  opacity: ${({ $open }) => ($open ? "1" : "0")};
  transition: all 300ms ease;
  visibility: ${({ $open }) => ($open ? "visible" : "hidden")};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
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
  const [pickingType, setPickingType] = useState(false);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [widthError, setWidthError] = useState(false);
  const [heightError, setHeightError] = useState(false);

  const heightLabel = matchInnerHeight ? "Page height" : "Height";

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
    setPickingType(false);
    const dimensions = readDimensions();
    if (dimensions) onResize(dimensions);
  }

  function handleSave() {
    setPickingType(false);
    const dimensions = readDimensions();
    if (dimensions) onSave(dimensions);
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Fields>
        <TypeButton
          aria-expanded={pickingType}
          onClick={() => setPickingType(!pickingType)}
          title={`Device type: ${deviceLabel(type)}. Click to change it.`}
          type="button"
          $open={pickingType}
        >
          <DeviceIcon size={20} type={type} />
          <span className="chevron">
            <Icon name="ChevronDown" size={14} />
          </span>
        </TypeButton>

        <Field>
          <Input
            aria-label="Width"
            id="custom-width"
            inputMode="numeric"
            onChange={(event) => {
              setWidth(event.target.value);
              setWidthError(false);
            }}
            onFocus={() => setPickingType(false)}
            placeholder="Width"
            type="number"
            value={width}
            $error={widthError}
            $fullWidth
            $size="small"
          />
        </Field>

        <Field>
          <Input
            aria-label={heightLabel}
            id="custom-height"
            inputMode="numeric"
            onChange={(event) => {
              setHeight(event.target.value);
              setHeightError(false);
            }}
            onFocus={() => setPickingType(false)}
            placeholder={heightLabel}
            type="number"
            value={height}
            $error={heightError}
            $fullWidth
            $size="small"
          />
        </Field>

        <IconButton
          aria-label="Save this size"
          onClick={handleSave}
          title="Keep this size in the list below"
          type="button"
          $size="big"
        >
          <Icon name="Plus" />
        </IconButton>
        <IconButton
          aria-label="Resize the window to this size"
          title="Resize the window to this size"
          type="submit"
          $size="big"
        >
          <Icon name="Scaling" />
        </IconButton>
      </Fields>

      <TypePicker $open={pickingType}>
        {DEVICE_TYPES.map((deviceType) => (
          <IconButton
            key={deviceType}
            aria-label={deviceLabel(deviceType)}
            onClick={() => {
              setType(deviceType);
              setPickingType(false);
            }}
            title={deviceLabel(deviceType)}
            $active={deviceType === type}
            $size="big"
          >
            <DeviceIcon type={deviceType} />
          </IconButton>
        ))}
      </TypePicker>
    </Form>
  );
}
