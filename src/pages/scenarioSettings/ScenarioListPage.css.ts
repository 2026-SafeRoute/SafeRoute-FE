import { style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';
import { pageContent } from '@styles/responsive.css';

export const container = style([
  pageContent,
  {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: vars.space.s6,
    paddingBlock: vars.layout.pageGutter,
    minHeight: '100%',
  },
]);

export const toolbar = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.s3,
});

export const addButton = style({
  marginLeft: 'auto',
});

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s3,
});

export const emptyState = style({
  flex: 1,
  border: `1px dashed ${vars.color.gray200}`,
  borderRadius: vars.radius.lg,
  backgroundColor: vars.color.white,
  minHeight: '36rem',
});
