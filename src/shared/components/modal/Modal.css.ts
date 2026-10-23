import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';

import { vars } from '@styles/global.css';

export const overlay = style({
  position: 'fixed',
  zIndex: 100,
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(16, 24, 40, 0.45)',
  padding: vars.space.s4,
});

export const container = recipe({
  base: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: vars.radius.xl,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
    backgroundColor: vars.color.white,
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
  },
  variants: {
    size: {
      sm: { maxWidth: '40rem' },
      md: { maxWidth: '54rem' },
      lg: { maxWidth: '72rem' },
      confirm: {
        width: 'max-content',
        minWidth: 'min(40rem, 100%)',
        maxWidth: 'min(64rem, 100%)',
      },
    },
  },
  defaultVariants: { size: 'md' },
});

// form 모달 헤더
export const header = style({
  display: 'flex',
  flexShrink: 0,
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: vars.space.s4,
  padding: `clamp(1.6rem, 4vw, 2.4rem) clamp(1.6rem, 4vw, 2.4rem) ${vars.space.s4}`,
});

export const headerText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
  minWidth: 0,
});

export const title = style({
  lineHeight: '1.4',
  letterSpacing: '-0.02em',
  color: vars.color.textHigh,
  fontSize: '2rem',
  fontWeight: '700',
});

export const description = style({
  color: vars.color.textLow,
  ...vars.typography.body14,
});

export const closeButton = style({
  display: 'flex',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.sm,
  cursor: 'pointer',
  width: '2.8rem',
  height: '2.8rem',
  color: vars.color.gray300,
  selectors: {
    '&:hover': {
      backgroundColor: vars.color.gray50,
      color: vars.color.textMid,
    },
  },
});

export const body = style({
  flex: 1,
  padding: `0 clamp(1.6rem, 4vw, 2.4rem) ${vars.space.s6}`,
  overflowY: 'auto',
  selectors: {
    '&::-webkit-scrollbar': { display: 'none' },
  },
  scrollbarWidth: 'none',
});

export const footer = style({
  display: 'grid',
  flexShrink: 0,
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 16rem), 1fr))',
  gap: vars.space.s3,
  padding: `${vars.space.s4} clamp(1.6rem, 4vw, 2.4rem) clamp(1.6rem, 4vw, 2.4rem)`,
});

// confirm 모달 (X 없음)
export const confirmBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s3,
  padding: `clamp(1.6rem, 4vw, 2.4rem) clamp(1.6rem, 4vw, 2.4rem) ${vars.space.s2}`,
  overflowWrap: 'anywhere',
  whiteSpace: 'pre-line',
  wordBreak: 'keep-all',
});

export const confirmTitle = style({
  color: vars.color.textHigh,
  ...vars.typography.h4,
});

export const confirmDescription = style({
  color: vars.color.textMid,
  ...vars.typography.body14,
});

export const warningBox = style({
  border: `1px solid ${vars.color.dangerBorder}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.dangerSurface,
  padding: vars.space.s4,
  color: vars.color.danger,
  ...vars.typography.body14,
});
