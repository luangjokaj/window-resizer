/**
 * The About dialog.
 *
 * The panel has no menu bar and no footer, so there is nowhere else for the
 * things a person occasionally wants: which version is installed, where the
 * source is, who to write to. A dialog is the right shape for that because it
 * is entered deliberately and leaves nothing behind on the surface someone
 * came here to use.
 *
 * Cherry's Modal is used rather than a hand-rolled overlay because it already
 * closes on Escape and on a click outside, and renders through a portal so the
 * animated column underneath cannot clip it. Its `$title` is doing two jobs:
 * it is the visible heading and it is the dialog's accessible name, since the
 * component passes that same string to `aria-label`. Leaving it off to draw a
 * custom header would ship an unnamed dialog, so the heading stays and the
 * wordmark does not get repeated inside.
 */

import styled from "styled-components";
import { Icon, Modal, styledSmall } from "cherry-styled-components";
import { Numeric } from "~components/Card";

/** No windowresizer.dev exists, so the repository is the product's home. */
const HOME_URL = "https://github.com/luangjokaj/window-resizer";
const HOME_LABEL = "github.com/luangjokaj/window-resizer";
const STUDIO_URL = "https://riangle.com";
const STUDIO_LABEL = "riangle.com";
const CONTACT_EMAIL = "luan@riangle.com";

const Version = styled(Numeric)`
  ${({ theme }) => styledSmall(theme)};
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.radius.xs};
  color: ${({ theme }) => theme.colors.grayDark};
`;

const Tagline = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.radius.lg};
`;

/**
 * The one link worth making obvious. It is a row rather than an inline anchor
 * so the whole width is the target, which matters more here than it looks:
 * this dialog is read at 420px and a wrapped inline link is a small target
 * split across two lines.
 */
const PrimaryLink = styled.a`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  padding: ${({ theme }) => theme.spacing.radius.xs}
    ${({ theme }) => theme.spacing.radius.lg};
  border: solid 1px ${({ theme }) => theme.colors.grayLight};
  border-radius: ${({ theme }) => theme.spacing.radius.xs};
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  overflow-wrap: anywhere;
  transition:
    border-color 200ms ease,
    background 200ms ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:focus-visible {
    outline: solid 2px ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  svg {
    flex: 0 0 auto;
    width: 14px;
    height: 14px;
  }

  /* The trailing arrow is the "leaves this page" mark, so it belongs at the
     far edge rather than tucked against the label. */
  svg:last-of-type {
    margin-left: auto;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Footer = styled.div`
  ${({ theme }) => styledSmall(theme)};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.radius.xs};
  color: ${({ theme }) => theme.colors.grayDark};
`;

const Credit = styled.span`
  flex: 1 1 auto;
`;

const FooterLink = styled.a`
  color: ${({ theme }) => theme.colors.grayDark};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }

  &:focus-visible {
    outline: solid 2px ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const Separator = styled.span`
  color: ${({ theme }) => theme.colors.grayLight};
`;

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: string;
}

export function AboutModal({ isOpen, onClose, version }: AboutModalProps) {
  return (
    <Modal $isOpen={isOpen} $onClose={onClose} $title="Window Resizer">
      <Version>v{version}</Version>

      <Tagline>
        Resize any browser window to exact pixels. Multi-window support, custom
        presets, and an optional match-page-height mode.
      </Tagline>

      <PrimaryLink href={HOME_URL} rel="noreferrer noopener" target="_blank">
        <Icon name="Globe" size={14} />
        {HOME_LABEL}
        <Icon name="ArrowUpRight" size={14} />
      </PrimaryLink>

      <hr />

      <Footer>
        <Credit>Created by Luan Gjokaj</Credit>
        <FooterLink href={STUDIO_URL} rel="noreferrer noopener" target="_blank">
          {STUDIO_LABEL}
        </FooterLink>
        <Separator aria-hidden="true">|</Separator>
        <FooterLink href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </FooterLink>
      </Footer>
    </Modal>
  );
}
