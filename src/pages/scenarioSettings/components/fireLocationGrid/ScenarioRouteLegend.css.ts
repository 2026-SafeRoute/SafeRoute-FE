import { globalStyle, style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';

export const legend = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: `${vars.space.s2} ${vars.space.s4}`,
  padding: `${vars.space.s3} ${vars.space.s2} 0`,
  color: vars.color.textMid,
  ...vars.typography.caption,
});

export const item = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.6rem',
});

export const icon = style({
  display: 'inline-flex',
  width: '2.2rem',
  height: '1.4rem',
});

globalStyle(`${icon} svg`, {
  display: 'block',
  width: '2.2rem',
  height: '1.4rem',
});

export const startNode = style({ fill: vars.color.purple });
export const exitNode = style({ fill: vars.color.success });
export const initialRoute = style({
  stroke: vars.color.success,
  strokeLinecap: 'round',
  strokeWidth: 2,
});
export const recalculatedRoute = style({
  stroke: vars.color.primary,
  strokeDasharray: '4 3',
  strokeLinecap: 'round',
  strokeWidth: 2,
});
export const neutralNode = style({ fill: vars.color.gray300 });
export const unreachableMark = style({
  fill: 'none',
  stroke: vars.color.white,
  strokeLinecap: 'round',
  strokeWidth: 1.5,
});
export const undesignatedNode = style({
  fill: 'none',
  stroke: vars.color.gray300,
  strokeLinejoin: 'round',
  strokeWidth: 1.5,
});
