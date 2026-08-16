/**
 * The page the browser opens once, on install.
 *
 * It exists to answer the one question a freshly installed extension cannot
 * answer for itself: where did it go. Window Resizer has no toolbar popup and
 * no options page, so without this someone would install it and see nothing
 * happen, hence the "click the toolbar icon" line sitting above everything
 * else on the page.
 *
 * It opens in an ordinary tab rather than the 460px resizer window, so it is
 * the one surface here with room to breathe. It still borrows the resizer's
 * vocabulary wholesale: the same tracked legends, the same framed panels, the
 * same wordmark and version chip. The first thing someone sees should already
 * look like the thing they are about to use, and the way to guarantee that is
 * to build it out of the same parts rather than out of parts that resemble
 * them.
 */

import styled from "styled-components";
import {
  Callout,
  Container,
  Icon,
  MaxWidth,
  ThemeToggle,
  alpha,
  buttonStyles,
  styledH2,
  styledText,
} from "cherry-styled-components";
import { Logo } from "~components/Logo";
import { Numeric, Panel, PanelBlock } from "~components/Panel";
import { ThemeProvider } from "~lib/ThemeProvider";

import "./page.css";

const REPO_URL = "https://github.com/luangjokaj/window-resizer";

/** The width the wash is drawn into. A tab is as wide as the display, and a
 *  percentage stop would put the glow somewhere different on every monitor. */
const WASH_WIDTH_PX = 900;

function readVersion(): string {
  try {
    return chrome.runtime.getManifest().version;
  } catch {
    // Not an extension runtime. The number is decoration here, not function.
    return "1.0.0";
  }
}

const VERSION = readVersion();

const Shell = styled.main`
  min-height: 100vh;
  padding-bottom: ${({ theme }) => theme.spacing.padding.lg};
  color: ${({ theme }) => theme.colors.dark};
  background:
    radial-gradient(
      ${WASH_WIDTH_PX}px 420px at 20% 0%,
      ${({ theme }) => alpha(theme.colors.primary, 16)},
      transparent 70%
    ),
    linear-gradient(
      180deg,
      ${({ theme }) => alpha(theme.colors.primary, 7)},
      transparent 420px
    ),
    ${({ theme }) => theme.colors.light};
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.gridGap.xs};
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  padding: ${({ theme }) => theme.spacing.padding.xs} 0;
`;

const VersionChip = styled(Numeric)`
  flex: 0 0 auto;
  margin-right: auto;
  padding: 0 ${({ theme }) => theme.spacing.radius.xs};
  border: solid 1px ${({ theme }) => theme.colors.grayLight};
  border-radius: ${({ theme }) => theme.spacing.radius.xl};
  color: ${({ theme }) => theme.colors.grayDark};
`;

const Tagline = styled.h1`
  ${({ theme }) => styledH2(theme)};
  margin: 0;
  color: ${({ theme }) => theme.colors.dark};
`;

const Lead = styled.p`
  ${({ theme }) => styledText(theme)};
  margin: 0;
  color: ${({ theme }) => theme.colors.grayDark};
`;

const FeatureList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.radius.lg};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Feature = styled.li`
  ${({ theme }) => styledText(theme)};
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.radius.lg};
  color: ${({ theme }) => theme.colors.grayDark};

  svg {
    flex: 0 0 auto;
    /* Optical: drops the glyph onto the first line's baseline instead of its
       box top, which sits noticeably high against 16px text. */
    margin-top: 3px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

/**
 * Cherry's Button renders a `<button>`, and this has to be a real anchor:
 * navigating to an external site from an extension page is something only a
 * link does reliably. `buttonStyles` gives it the identical treatment, with
 * box-sizing pinned because buttons are border-box by UA default and anchors
 * are not.
 */
const ButtonLink = styled.a`
  ${({ theme }) => buttonStyles(theme, "primary", "default", true)};
  box-sizing: border-box;
  align-self: flex-start;
`;

function Welcome() {
  return (
    <ThemeProvider>
      <Shell>
        <Container>
          <MaxWidth $size={680}>
            <Header>
              <Logo width={240} />
              <VersionChip>{VERSION}</VersionChip>
              <ThemeToggle aria-label="Switch between the light and dark theme" />
            </Header>

            <Stack>
              <Tagline>Resize any window to an exact size.</Tagline>
              <Lead>
                Window Resizer sets a browser window to precise pixel
                dimensions, so a layout can be checked at the size it will
                actually be seen at: phone, tablet, laptop, or a number you type
                yourself.
              </Lead>

              <Callout $type="info" $icon="MousePointerClick">
                Click the Window Resizer icon in your browser's toolbar to open
                it. It opens in its own small window rather than a dropdown, so
                it stays put while the windows it resizes take and lose focus. A
                newly installed extension is usually tucked behind the
                puzzle-piece menu: open that menu and pin Window Resizer to keep
                it one click away.
              </Callout>

              <PanelBlock title="What it does">
                <Panel>
                  <FeatureList>
                    <Feature>
                      <Icon name="AppWindow" size={20} />
                      Resize any open window, not just the one in front. The
                      list stays live as windows open, close, and change size.
                    </Feature>
                    <Feature>
                      <Icon name="Bookmark" size={20} />
                      Seven common sizes to start with, plus any you save. Click
                      one to apply it.
                    </Feature>
                    <Feature>
                      <Icon name="Ruler" size={20} />
                      Type an exact width and height for a one-off size, and
                      resize on the spot.
                    </Feature>
                    <Feature>
                      <Icon name="PanelTop" size={20} />
                      Optionally match the page height: the browser's toolbars
                      are measured in that window and added on top, so the
                      viewport ends up the size you asked for.
                    </Feature>
                    <Feature>
                      <Icon name="Check" size={20} />
                      Reports what the browser actually granted. Window managers
                      clamp sizes to the display, and you are told when that
                      happens instead of being left guessing.
                    </Feature>
                  </FeatureList>
                </Panel>
              </PanelBlock>

              <PanelBlock title="Your data">
                <Panel>
                  <Lead>
                    No telemetry, no accounts, nothing leaves your machine. The
                    sizes you save live in the browser's own extension storage,
                    and the one permission that reaches into a page, measuring
                    toolbar height, is optional, asked for only when you switch
                    it on, and handed straight back when you switch it off.
                  </Lead>
                </Panel>
              </PanelBlock>

              <ButtonLink
                href={REPO_URL}
                rel="noreferrer noopener"
                target="_blank"
              >
                <Icon name="ExternalLink" size={20} />
                Source on GitHub
              </ButtonLink>
            </Stack>
          </MaxWidth>
        </Container>
      </Shell>
    </ThemeProvider>
  );
}

export default Welcome;
