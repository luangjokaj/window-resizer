/**
 * Choosing which window gets resized.
 *
 * Three states, deliberately distinct. A `null` list means this runtime never
 * gave the extension its windows API at all: nothing here will ever work, so
 * it gets a warning rather than the empty state's quiet "nothing yet". An empty
 * array is the ordinary case of every window being closed or being one of ours,
 * which is not a failure and must not look like one.
 *
 * Selection is a real radio group instead of clickable rows. That buys arrow-key
 * navigation, the roving tab stop, and the label/control association for free,
 * all of which a `<div onClick>` would have to reimplement, and usually doesn't.
 *
 * The rows are one line each and share a single frame, because this list is
 * read as a column: the ordinal on one x, the size on another, so the eye finds
 * the target by position rather than by re-reading each row. Everything that
 * would push a second line (window state, incognito) is a fixed-width glyph
 * with the word in its tooltip and its accessible name. Two badges spelled out
 * is wider than the 460px column they sit in.
 *
 * Only one window's tabs are expanded at a time. Two open tab lists push the
 * resize controls off-screen, which is the one thing someone came here to reach.
 */

import { useState } from "react";
import styled from "styled-components";
import {
  Callout,
  Icon,
  IconButton,
  Input,
  alpha,
  styledSmall,
  type IconProps,
} from "cherry-styled-components";
import { Hint, Numeric, Panel } from "~components/Panel";
import type { BrowserTab, BrowserWindow } from "~lib/windows";

/** One group name for the whole list, which is what makes the arrow keys move
 *  between rows instead of within one. */
const RADIO_GROUP = "resize-target";

/** A window that is not `normal` cannot take bounds until it is restored, so
 *  the state is worth showing. Anything outside this map gets no glyph rather
 *  than a generic one: a marker nobody can read is worse than no marker. */
const STATE_ICONS: Partial<Record<string, IconProps>> = {
  fullscreen: "Expand",
  maximized: "Maximize2",
  minimized: "Minimize2",
};

/**
 * A radiogroup rather than a list. The rows *are* the options: announcing them
 * as "list, 3 items" and then again as three loose radios is the worse of the
 * two readings, and `role="radiogroup"` on a `<ul>` would strip the list item
 * semantics anyway.
 */
const List = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

/**
 * The selected row is marked twice over: a tint, and a bar down its leading
 * edge. The bar is an inset shadow rather than a border so that turning it on
 * cannot shift the row's contents by two pixels, which at this density reads as
 * the list twitching every time the target changes.
 */
const Row = styled.div<{ $selected: boolean }>`
  min-width: 0;
  background: ${({ $selected, theme }) =>
    $selected ? alpha(theme.colors.primary, 10) : "transparent"};
  box-shadow: ${({ $selected, theme }) =>
    $selected ? `inset 2px 0 0 ${theme.colors.primary}` : "none"};
  transition: background 150ms ease;

  &:not(:first-child) {
    border-top: solid 1px ${({ theme }) => theme.colors.grayLight};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const RowHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.radius.xs};
`;

/**
 * The clickable body of the row. A real `<label>` so the whole thing selects
 * the radio, which makes the hit target the size the row looks rather than the
 * size of the 18px dot.
 */
const RowLabel = styled.label`
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  min-width: 0;
  cursor: pointer;
`;

const RowName = styled.span`
  ${({ theme }) => styledSmall(theme)};
  overflow: hidden;
  min-width: 0;
  color: ${({ theme }) => theme.colors.dark};
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * Pushed to the trailing edge, and last in the row, so that every window's
 * size ends on the same x no matter how much identifying text precedes it.
 * With the tab count after it instead, "1 tab" and "12 tabs" moved the digits
 * from row to row, which is exactly what a column of numbers must not do.
 */
const RowSize = styled(Numeric)`
  flex: 0 0 auto;
  margin-left: auto;
  padding-left: ${({ theme }) => theme.spacing.radius.xs};
  color: ${({ theme }) => theme.colors.dark};
`;

const RowTabs = styled.span`
  ${({ theme }) => styledSmall(theme)};
  flex: 0 0 auto;
  color: ${({ theme }) => theme.colors.grayDark};
  white-space: nowrap;
`;

/** The ordinal and the tab count are both identifiers sitting six pixels
 *  apart, which is close enough to read as one phrase. The dot is cheaper than
 *  the gap it would otherwise take to separate them. */
const Dot = styled.span`
  flex: 0 0 auto;
  color: ${({ theme }) => theme.colors.gray};
`;

/** A fixed box, so a window that picks up a badge does not become a taller row
 *  than the one above it. */
const Badge = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: ${({ theme }) => theme.spacing.radius.xs};
  background: ${({ theme }) => alpha(theme.colors.grayDark, 15)};
  color: ${({ theme }) => theme.colors.grayDark};
`;

const Chevron = styled.span<{ $open: boolean }>`
  display: inline-flex;
  transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});
  transition: transform 150ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const TabList = styled.ul`
  display: flex;
  flex-direction: column;
  margin: 0;
  /* Indented past the radio so the tabs read as belonging to the row above
     rather than as more rows in the same list. */
  padding: 0 ${({ theme }) => theme.spacing.radius.xs}
    ${({ theme }) => theme.spacing.radius.xs}
    ${({ theme }) => theme.spacing.radius.lg};
  list-style: none;
`;

const TabRow = styled.li`
  ${({ theme }) => styledSmall(theme)};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  min-width: 0;
  /* Optical: a tab is one line of 12px text, so it wants less air around it
     than any padding step in the theme's scale would give. */
  padding: 2px 0;
  color: ${({ theme }) => theme.colors.grayDark};
`;

/** Fixed box so a missing or slow favicon does not shift the title. */
const Favicon = styled.img`
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  object-fit: contain;
`;

const FaviconFallback = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  color: ${({ theme }) => theme.colors.gray};
`;

const TabTitle = styled.span`
  overflow: hidden;
  min-width: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** A dot rather than the word "active": at 460px the tab title needs every
 *  pixel, and the marker only has to be findable, not readable. */
const ActiveDot = styled.span`
  flex: 0 0 auto;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
`;

const Placeholder = styled.div`
  padding: ${({ theme }) => theme.spacing.radius.lg};
  text-align: center;
`;

function tabCountLabel(count: number): string {
  return count === 1 ? "1 tab" : `${count} tabs`;
}

function TabEntry({ tab }: { tab: BrowserTab }) {
  return (
    <TabRow>
      {tab.favIconUrl ? (
        // alt is empty on purpose: the title beside it already names the tab,
        // and a broken favicon should leave a gap rather than a URL.
        <Favicon alt="" src={tab.favIconUrl} />
      ) : (
        <FaviconFallback>
          <Icon name="Globe" size={14} />
        </FaviconFallback>
      )}
      <TabTitle title={tab.title}>{tab.title}</TabTitle>
      {tab.active ? <ActiveDot aria-label="Active tab" role="img" /> : null}
    </TabRow>
  );
}

type WindowPickerProps = {
  onFocus: (windowId: number) => void;
  onSelect: (windowId: number) => void;
  selectedId: number | null;
  /** `undefined` before the first read, `null` when the API is unavailable. */
  windows: BrowserWindow[] | null | undefined;
};

export function WindowPicker({
  onFocus,
  onSelect,
  selectedId,
  windows,
}: WindowPickerProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Held apart from the empty case on purpose: the first read resolves in
  // milliseconds, and claiming "no windows are open" for those milliseconds is
  // a statement that is both wrong and alarming.
  if (windows === undefined) {
    return (
      <Panel>
        <Placeholder>
          <Hint>Looking for open windows…</Hint>
        </Placeholder>
      </Panel>
    );
  }

  if (windows === null) {
    return (
      <Callout $type="warning">
        This browser did not give the extension access to its windows, so there
        is nothing here to resize. Restarting the browser usually restores it.
      </Callout>
    );
  }

  if (windows.length === 0) {
    return (
      <Panel>
        <Placeholder>
          <Hint>No browser windows are open yet.</Hint>
        </Placeholder>
      </Panel>
    );
  }

  return (
    <Panel $flush>
      <List aria-label="Target window" role="radiogroup">
        {windows.map((browserWindow, index) => {
          const position = index + 1;
          const radioId = `window-${browserWindow.id}`;
          const expanded = expandedId === browserWindow.id;
          const stateIcon = STATE_ICONS[browserWindow.state];

          return (
            <Row
              key={browserWindow.id}
              $selected={browserWindow.id === selectedId}
            >
              <RowHead>
                <Input
                  checked={browserWindow.id === selectedId}
                  id={radioId}
                  name={RADIO_GROUP}
                  onChange={() => onSelect(browserWindow.id)}
                  type="radio"
                  $size="small"
                />
                <RowLabel htmlFor={radioId}>
                  <RowName>Window {position}</RowName>
                  {/* The word rides on the glyph's accessible name and on the
                      tooltip rather than on visible text. "Incognito" and
                      "maximized" spelled out is wider than the column they sit
                      in, and one window can carry both at once. */}
                  {browserWindow.incognito ? (
                    <Badge title="Incognito window">
                      <Icon
                        aria-label="Incognito window"
                        name="VenetianMask"
                        size={12}
                      />
                    </Badge>
                  ) : null}
                  {stateIcon ? (
                    <Badge title={`Window is ${browserWindow.state}`}>
                      <Icon
                        aria-label={`Window is ${browserWindow.state}`}
                        name={stateIcon}
                        size={12}
                      />
                    </Badge>
                  ) : null}
                  <Dot aria-hidden="true">·</Dot>
                  <RowTabs>{tabCountLabel(browserWindow.tabs.length)}</RowTabs>
                  <RowSize>
                    {browserWindow.width} × {browserWindow.height}
                  </RowSize>
                </RowLabel>
                <IconButton
                  aria-label={`Bring window ${position} to the front`}
                  onClick={() => onFocus(browserWindow.id)}
                  title={`Bring window ${position} to the front`}
                  $size="small"
                >
                  <Icon name="Eye" />
                </IconButton>
                <IconButton
                  aria-controls={`${radioId}-tabs`}
                  aria-expanded={expanded}
                  aria-label={
                    expanded
                      ? `Hide the tabs in window ${position}`
                      : `Show the tabs in window ${position}`
                  }
                  onClick={() =>
                    setExpandedId(expanded ? null : browserWindow.id)
                  }
                  $active={expanded}
                  $size="small"
                >
                  <Chevron $open={expanded}>
                    <Icon name="ChevronDown" />
                  </Chevron>
                </IconButton>
              </RowHead>
              {expanded ? (
                <TabList id={`${radioId}-tabs`}>
                  {/* Position joins the key: a tab the browser reported without
                      an id becomes -1, and two of those would collide. */}
                  {browserWindow.tabs.map((tab, tabIndex) => (
                    <TabEntry key={`${tab.id}-${tabIndex}`} tab={tab} />
                  ))}
                </TabList>
              ) : null}
            </Row>
          );
        })}
      </List>
    </Panel>
  );
}
