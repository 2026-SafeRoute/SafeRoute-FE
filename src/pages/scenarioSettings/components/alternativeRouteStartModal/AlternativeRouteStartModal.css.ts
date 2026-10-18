import { globalStyle, style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';

export const modal = style({
  maxWidth: '48rem',
});

export const body = style({
  alignItems: 'center',
  gap: vars.space.s4,
  padding: `${vars.space.s8} ${vars.space.s8} ${vars.space.s2}`,
  textAlign: 'center',
});

export const icon = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.pill,
  backgroundColor: vars.color.warningLight,
  width: '5.6rem',
  height: '5.6rem',
  color: vars.color.warningStrong,
});

globalStyle(`${icon} svg`, {
  width: '2.8rem',
  height: '2.8rem',
});

export const footer = style({
  display: 'block',
  padding: `${vars.space.s2} ${vars.space.s8} ${vars.space.s7}`,
});

export const footerContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s4,
});

export const actions = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: vars.space.s3,
});

export const floorPlanLink = style({
  alignSelf: 'center',
  cursor: 'pointer',
  color: vars.color.primary,
  ...vars.typography.body14Medium,
  selectors: {
    '&:hover': { textDecoration: 'underline' },
  },
});
