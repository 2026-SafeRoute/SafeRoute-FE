import { style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';
import { pageContent, twoColumnGrid } from '@styles/responsive.css';

export const container = style([
  pageContent,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: vars.space.s6,
    paddingBlock: vars.layout.pageGutter,
  },
]);

export const listHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const listCount = style({
  color: vars.color.textMid,
  ...vars.typography.body14,
});

export const grid = twoColumnGrid;

export const emptyState = style({
  border: `1px dashed ${vars.color.gray200}`,
  borderRadius: vars.radius.lg,
  backgroundColor: vars.color.white,
  minHeight: '36rem',
});
