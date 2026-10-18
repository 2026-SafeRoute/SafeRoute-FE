import { style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';

/* ── 툴바 "+ 추가" 메뉴 ── */
export const canvasActionButton = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.s1,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.sm,
  backgroundColor: vars.color.white,
  cursor: 'pointer',
  padding: `${vars.space.s2} ${vars.space.s3}`,
  color: vars.color.textMid,
  ...vars.typography.body14Medium,
  selectors: {
    '&:hover:not(:disabled)': { backgroundColor: vars.color.gray25 },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});

export const addMenuContainer = style({
  position: 'relative',
});

export const addMenuChevron = style({
  color: vars.color.textLow,
});

export const addMenuPanel = style({
  position: 'absolute',
  zIndex: 20,
  top: 'calc(100% + 0.4rem)',
  right: 0,
  display: 'flex',
  flexDirection: 'column',
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.lg,
  backgroundColor: vars.color.white,
  padding: vars.space.s2,
  width: '12rem',
});

export const addMenuItem = style({
  border: 'none',
  borderRadius: vars.radius.sm,
  backgroundColor: 'transparent',
  cursor: 'pointer',
  padding: `${vars.space.s2} ${vars.space.s3}`,
  width: '100%',
  textAlign: 'left',
  color: vars.color.textHigh,
  ...vars.typography.body14,
  selectors: {
    '&:hover': { backgroundColor: vars.color.gray25 },
  },
});
