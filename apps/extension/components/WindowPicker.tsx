/**
 * Choosing which window gets resized.
 *
 * Three states, deliberately distinct. A `null` list means this runtime never
 * gave the extension its windows API at all: nothing here will ever work, so it
 * gets a warning rather than the empty state's quiet "nothing yet". An empty
 * array is the ordinary case of every window being closed or being one of ours,
 * which is not a failure and must not look like one.
 *
 * Selection is a real radio group. The original drew a checkbox inside the
 * clickable row, which is invalid nesting and left the keyboard with nothing to
 * operate; a radio in a label looks the same, and buys arrow-key navigation,
 * the roving tab stop, and the label/control association for free.
 *
 * Everything that would push a row onto a second line (window state, incognito)
 * is a fixed-width glyph with the word in its tooltip and its accessible name.
 * Two badges spelled out is wider than the 460px column they sit in.
 *
 * Only one window's tabs are expanded at a time. Two open tab lists push the
 * resize controls off-screen, which is the one thing someone came here to
 * reach.
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
  thinScrollbar,
  type IconProps,
} from "cherry-styled-components";
import {
  Numeric,
  Tile,
  TileName,
  TileNote,
  dividedRows,
  themedRules,
  tileStyles,
} from "~components/Card";
import type { BrowserTab, BrowserWindow } from "~lib/windows";

/** One group name for the whole list, which is what makes the arrow keys move
 *  between rows instead of within one. */
const RADIO_GROUP = "resize-target";

/** The pair of controls laid over the right of every row: two of Cherry's
 *  `small` IconButtons (24px) and the 6px between them. The row reserves this,
 *  plus a step of air on each side, so that the radio it ends with never sits
 *  right up against the eye. */
const CONTROLS_PX = 24 + 6 + 24;

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
 * semantics anyway. It sits between the card and its rows, so it redraws the
 * card's seam.
 */
const List = styled.div`
  ${dividedRows};
  min-width: 0;
`;

const Row = styled.div<{ $selected: boolean }>`
  min-width: 0;
  background: ${({ $selected, theme }) =>
    $selected ? alpha(theme.colors.primary, 8) : "transparent"};
  transition: background 200ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const HeadWrap = styled.div`
  position: relative;
  min-width: 0;
`;

/**
 * The clickable body of the row: a real `<label>`, so the hit target is the
 * size the row looks rather than the size of the 18px dot. The gutter on the
 * right is the two controls laid over it.
 */
const Head = styled.label`
  ${tileStyles};
  gap: ${({ theme }) => theme.spacing.radius.xs};
  padding-right: calc(
    ${({ theme }) => theme.spacing.radius.lg} + ${CONTROLS_PX}px +
      ${({ theme }) => theme.spacing.radius.lg} +
      ${({ theme }) => theme.spacing.radius.lg}
  );
  cursor: pointer;
  transition: background 200ms ease;

  &:hover {
    background: ${({ theme }) => alpha(theme.colors.primary, 8)};
  }

  &:has(input:focus-visible) {
    background: ${({ theme }) => alpha(theme.colors.primary, 8)};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * The window's ordinal, drawn inside the window it names. The original did
 * this and it earns its place: the number is what the row is identified by,
 * and hanging it off the glyph saves the width a separate badge would take.
 */
const Glyph = styled.span`
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  color: ${({ theme }) => theme.colors.grayDark};

  em {
    position: absolute;
    top: 50%;
    left: 50%;
    /* Optical: the icon's title bar takes the top third, so centring on the
       box puts the numeral in it rather than in the window. */
    transform: translate(-50%, -50%) translateY(2px);
    color: ${({ theme }) => theme.colors.dark};
    /* Below the type scale's smallest step on purpose: this is a numeral
       inside a 20px glyph, not a piece of text. Kept bold, because at this
       size the weight is what carries it rather than the size. */
    font-size: 9px;
    font-style: normal;
    font-weight: 700;
    line-height: 1;
  }
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

const Tabs = styled.span`
  ${({ theme }) => styledSmall(theme)};
  flex: 0 0 auto;
  color: ${({ theme }) => theme.colors.grayDark};
  white-space: nowrap;
`;

/**
 * Pushed to the trailing edge, and last before the radio, so that every
 * window's size ends on the same x no matter how much identifying text
 * precedes it. With the tab count after it instead, "1 tab" and "12 tabs" moved
 * the digits from row to row, which is exactly what a column of numbers must
 * not do.
 */
const Size = styled(Numeric)`
  ${({ theme }) => styledSmall(theme)};
  flex: 0 0 auto;
  margin-left: auto;
  padding-left: ${({ theme }) => theme.spacing.radius.xs};
  color: ${({ theme }) => theme.colors.grayDark};
`;

const Controls = styled.div`
  position: absolute;
  top: 50%;
  right: ${({ theme }) => theme.spacing.radius.lg};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  transform: translateY(-50%);
`;

const Chevron = styled.span<{ $open: boolean }>`
  display: inline-flex;
  transform: rotate(${({ $open }) => ($open ? "-180deg" : "0deg")});
  transition: transform 300ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/** Capped and scrollable: a window with forty tabs must not be able to push
 *  the sizes below it out of the panel. */
const TabList = styled.ul`
  ${themedRules(thinScrollbar)};
  ${dividedRows};
  overflow-y: auto;
  max-height: 200px;
  margin: 0;
  padding: 0 ${({ theme }) => theme.spacing.radius.lg}
    ${({ theme }) => theme.spacing.radius.xs};
  border-top: solid 1px ${({ theme }) => theme.colors.grayLight};
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
  padding: 6px 0;
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
  color: ${({ theme }) => theme.colors.grayDark};
`;

const TabTitle = styled.span`
  overflow: hidden;
  flex: 1 1 auto;
  min-width: 0;
  color: ${({ theme }) => theme.colors.dark};
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** The address, kept to under half the row: it is here to disambiguate two
 *  tabs with the same title, not to be read in full. */
const TabUrl = styled.span`
  overflow: hidden;
  flex: 0 1 auto;
  max-width: 45%;
  text-align: right;
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
      <TabUrl title={tab.url}>{tab.url}</TabUrl>
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
    return <TileNote>Looking for open windows…</TileNote>;
  }

  if (windows === null) {
    return (
      <Tile>
        <Callout $type="warning">
          This browser did not give the extension access to its windows, so
          there is nothing here to resize. Restarting the browser usually
          restores it.
        </Callout>
      </Tile>
    );
  }

  if (windows.length === 0) {
    return <TileNote>No browser windows are open yet.</TileNote>;
  }

  return (
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
            <HeadWrap>
              <Head htmlFor={radioId}>
                <Glyph>
                  <Icon name="AppWindow" size={20} />
                  <em>{position}</em>
                </Glyph>
                <TileName>Window {position}</TileName>
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
                <Tabs>{tabCountLabel(browserWindow.tabs.length)}</Tabs>
                <Size>
                  {browserWindow.width} × {browserWindow.height}
                </Size>
                <Input
                  checked={browserWindow.id === selectedId}
                  id={radioId}
                  name={RADIO_GROUP}
                  onChange={() => onSelect(browserWindow.id)}
                  type="radio"
                  $size="small"
                />
              </Head>
              <Controls>
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
              </Controls>
            </HeadWrap>
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
