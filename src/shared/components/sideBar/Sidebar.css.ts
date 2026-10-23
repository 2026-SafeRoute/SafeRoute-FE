import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';

import { vars } from '@styles/global.css';

const menuText = {
  color: vars.color.textMid,
  ...vars.typography.body14Medium,
};

export const container = recipe({
  base: {
    position: 'sticky',
    zIndex: 1,
    top: 0,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    transition: 'width 240ms ease, padding 240ms ease',
    boxShadow: vars.shadow.card,
    backgroundColor: vars.color.white,
    padding: '2rem 1.6rem',
    width: vars.layout.sidebarWidth,
    height: '100vh',
    '@media': {
      '(prefers-reduced-motion: reduce)': { transition: 'none' },
    },
  },
  variants: {
    collapsed: {
      false: {},
      true: { padding: '2rem 1.2rem', width: vars.layout.sidebarCollapsedWidth },
    },
  },
});

export const header = recipe({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.6rem',
    minHeight: '4.4rem',
  },
  variants: {
    collapsed: {
      false: {},
      true: { justifyContent: 'center' },
    },
  },
});

export const brandLink = style({
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '0.8rem',
  minWidth: 0,
});

export const collapseButton = style({
  display: 'grid',
  flexShrink: 0,
  placeItems: 'center',
  transition: 'background-color 160ms ease',
  borderRadius: vars.radius.md,
  width: '3.2rem',
  height: '3.2rem',
  color: vars.color.textMid,
  selectors: {
    '&:hover': { backgroundColor: vars.color.gray25 },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': { transition: 'none' },
  },
});

export const logo = style({
  flexShrink: 0,
  width: '2.8rem',
  height: '2.8rem',
});

export const toggleLogo = style([
  logo,
  {
    gridArea: '1 / 1',
    transition: 'opacity 160ms ease',
    selectors: {
      [`${collapseButton}:hover &`]: { opacity: 0 },
      [`${collapseButton}:focus-visible &`]: { opacity: 0 },
    },
    '@media': {
      '(prefers-reduced-motion: reduce)': { transition: 'none' },
    },
  },
]);

export const togglePanelIcon = style({
  gridArea: '1 / 1',
  transition: 'opacity 160ms ease',
  opacity: 0,
  selectors: {
    [`${collapseButton}:hover &`]: { opacity: 1 },
    [`${collapseButton}:focus-visible &`]: { opacity: 1 },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': { transition: 'none' },
  },
});

export const brand = style({
  whiteSpace: 'nowrap',
  color: vars.color.textHigh,
  ...vars.typography.titleBold,
});

export const navigation = style({
  flex: 1,
});

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
});

export const group = recipe({
  base: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
    transition: 'gap 240ms ease',
    '@media': {
      '(prefers-reduced-motion: reduce)': { transition: 'none' },
    },
  },
  variants: {
    collapsed: {
      false: {},
      true: { gap: 0 },
    },
  },
});

export const groupList = recipe({
  base: {
    display: 'flex',
    flexDirection: 'column',
    transition: 'margin-left 240ms ease',
    marginLeft: '1rem',
    '@media': {
      '(prefers-reduced-motion: reduce)': { transition: 'none' },
    },
  },
  variants: {
    collapsed: {
      false: {},
      true: { marginLeft: 0 },
    },
  },
});

export const groupLabel = recipe({
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.2rem',
    transition: 'max-height 240ms ease, padding 240ms ease, opacity 160ms ease',
    opacity: 1,
    padding: '1rem 1.2rem',
    maxHeight: '4rem',
    overflow: 'hidden',
    ...menuText,
    '@media': {
      '(prefers-reduced-motion: reduce)': { transition: 'none' },
    },
  },
  variants: {
    collapsed: {
      false: {},
      true: { opacity: 0, padding: 0, maxHeight: 0 },
    },
  },
});

export const item = recipe({
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.2rem',
    borderRadius: vars.radius.md,
    backgroundColor: vars.color.white,
    padding: '1rem 1.2rem',
    width: '100%',
    ...menuText,

    selectors: {
      '&:hover': {
        backgroundColor: vars.color.gray25,
      },
    },
  },
  variants: {
    active: {
      false: {},
      true: {
        backgroundColor: vars.color.primaryLight2,
        color: vars.color.primary,
        fontWeight: vars.fontWeight.bold,

        selectors: {
          '&:hover': {
            backgroundColor: vars.color.primaryLight2,
          },
        },
      },
    },
    collapsed: {
      false: {},
      true: { justifyContent: 'center', gap: 0 },
    },
  },
});

export const icon = style({
  flexShrink: 0,
  width: '2rem',
  height: '2rem',
});

export const footer = recipe({
  base: {
    marginTop: 'auto',
    padding: '7.2rem 1.2rem 1.2rem',
  },
  variants: {
    collapsed: {
      false: {},
      true: { padding: '7.2rem 0 1.2rem' },
    },
  },
});
