/**
 * Choosing which window gets resized.
 *
 * Three states, deliberately distinct. A `null` list means this runtime never
 * gave the extension its windows API at all — nothing here will ever work, so
 * it gets an alert rather than the empty state's quiet "nothing yet". An empty
 * array is the ordinary case of every window being closed or being one of ours,
 * which is not a failure and must not look like one.
 *
 * Selection is a real radio group instead of clickable rows. That buys arrow-key
 * navigation, the roving tab stop, and the label/control association for free —
 * all of which a `<div onClick>` would have to reimplement, and usually doesn't.
 *
 * Only one window's tabs are expanded at a time. The page is 460px wide inside a
 * 820px-tall window; two open tab lists push the resize controls off-screen,
 * which is the one thing someone came here to reach.
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
} from "cherry-styled-components";
import { Hint, Numeric } from "~components/Section";
import type { BrowserTab, BrowserWindow } from "~lib/windows";

/** One group name for the whole list, which is what makes the arrow keys move
 *  between rows instead of within one. */
const RADIO_GROUP = "resize-target";

/**
 * A radiogroup rather than a list. The rows *are* the options — announcing
 * them as "list, 3 items" and then again as three loose radios is the worse of
 * the two readings, and `role="radiogroup"` on a `<ul>` would strip the list
 * item semantics anyway.
 */
const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.radius.xs};
`;

const Row = styled.div<{ $selected: boolean }>`
  border: solid 1px
    ${({ $selected, theme }) =>
      $selected ? theme.colors.primary : theme.colors.grayLight};
  border-radius: ${({ theme }) => theme.spacing.radius.xs};
  background: ${({ $selected, theme }) =>
    $selected ? alpha(theme.colors.primary, 8) : theme.colors.light};
`;

const RowHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  padding: ${({ theme }) => theme.spacing.radius.xs};
`;

/**
 * The clickable body of the row. A real `<label>` so the whole thing selects
 * the radio, which makes the hit target the size the row looks rather than the
 * size of the 24px dot.
 */
const RowLabel = styled.label`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  /* Optical, not a rhythm step: the two lines are one label, so they sit
     closer than any gap in the theme's scale. */
  gap: 2px;
  min-width: 0;
  cursor: pointer;
`;

/* Both title and meta wrap: a window that is incognito *and* maximized carries
   two badges, and at 460px that is wider than the column they sit in. */
const RowTitle = styled.span`
  ${({ theme }) => styledSmall(theme)};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  color: ${({ theme }) => theme.colors.dark};
  font-weight: 600;
`;

const RowMeta = styled.span`
  ${({ theme }) => styledSmall(theme)};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  color: ${({ theme }) => theme.colors.grayDark};
`;

const Badge = styled.span`
  ${({ theme }) => styledSmall(theme)};
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  padding: 0 ${({ theme }) => theme.spacing.radius.xs};
  border-radius: ${({ theme }) => theme.spacing.radius.xl};
  background: ${({ theme }) => alpha(theme.colors.grayDark, 15)};
  color: ${({ theme }) => theme.colors.grayDark};
  font-weight: 400;
  text-transform: capitalize;
  white-space: nowrap;
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
  padding: 0;
  border-top: solid 1px ${({ theme }) => theme.colors.grayLight};
  list-style: none;
`;

const TabRow = styled.li`
  ${({ theme }) => styledSmall(theme)};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  padding: ${({ theme }) => theme.spacing.radius.xs};
  color: ${({ theme }) => theme.colors.grayDark};

  &:not(:last-child) {
    border-bottom: solid 1px ${({ theme }) => theme.colors.grayLight};
  }
`;

/** Fixed box so a missing or slow favicon does not shift the title. */
const Favicon = styled.img`
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
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
  padding: ${({ theme }) => theme.spacing.radius.xs};
  border: dashed 1px ${({ theme }) => theme.colors.grayLight};
  border-radius: ${({ theme }) => theme.spacing.radius.xs};
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
          <Icon name="Globe" size={16} />
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
      <Placeholder>
        <Hint>Looking for open windows…</Hint>
      </Placeholder>
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
      <Placeholder>
        <Hint>No browser windows are open yet.</Hint>
      </Placeholder>
    );
  }

  return (
    <List aria-label="Target window" role="radiogroup">
      {windows.map((browserWindow, index) => {
        const position = index + 1;
        const radioId = `window-${browserWindow.id}`;
        const expanded = expandedId === browserWindow.id;

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
              />
              <RowLabel htmlFor={radioId}>
                <RowTitle>
                  Window {position}
                  {browserWindow.incognito ? (
                    <Badge>
                      <Icon name="VenetianMask" size={12} /> Incognito
                    </Badge>
                  ) : null}
                  {browserWindow.state !== "normal" ? (
                    <Badge>{browserWindow.state}</Badge>
                  ) : null}
                </RowTitle>
                <RowMeta>
                  <Numeric>
                    {browserWindow.width} × {browserWindow.height}
                  </Numeric>
                  <span aria-hidden="true">·</span>
                  <span>{tabCountLabel(browserWindow.tabs.length)}</span>
                </RowMeta>
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
  );
}
