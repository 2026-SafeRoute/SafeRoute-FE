import { style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s4,
});

export const floorRow = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: vars.space.s4,
});

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s2,
});

export const fieldLabel = style({
  color: vars.color.textHigh,
  ...vars.typography.body14Medium,
});

export const chipRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.s2,
});
