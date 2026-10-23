import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';

import { vars } from '@styles/global.css';

export const container = style({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: vars.space.s2,
  minWidth: 0,
});

export const label = style({
  color: vars.color.textHigh,
  ...vars.typography.body14Medium,
});

export const controls = recipe({
  base: {
    display: 'flex',
    alignItems: 'center',
    border: `1px solid ${vars.color.gray100}`,
    borderRadius: vars.radius.md,
    width: '100%',
    overflow: 'hidden',
    selectors: {
      '&:focus-within': { borderColor: vars.color.primary },
    },
  },
  variants: {
    isError: {
      true: { borderColor: vars.color.danger },
      false: {},
    },
  },
});

export const stepButton = style({
  display: 'flex',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  backgroundColor: vars.color.gray50,
  cursor: 'pointer',
  width: 'clamp(2.8rem, 8vw, 3.6rem)',
  height: '4.4rem',
  color: vars.color.textMid,
  fontSize: '1.8rem',
  selectors: {
    '&:hover:not(:disabled)': { backgroundColor: vars.color.gray100 },
    '&:disabled': { cursor: 'not-allowed', color: vars.color.textLow },
  },
});

export const input = style({
  flex: 1,
  outline: 'none',
  border: 'none',
  backgroundColor: vars.color.white,
  minWidth: 0,
  height: '4.4rem',
  textAlign: 'center',
  ...vars.typography.body14,
  color: vars.color.textHigh,
  selectors: {
    '&:focus-visible': {
      outline: `2px solid ${vars.color.primary}`,
      outlineOffset: '-2px',
    },
  },
});

export const errorText = style({
  color: vars.color.danger,
  ...vars.typography.caption,
});
