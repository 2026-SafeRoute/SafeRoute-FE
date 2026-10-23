import { style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';
import { contentBreakpoints, pageContent } from '@styles/responsive.css';

export const container = style([
  pageContent,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: vars.space.s4,
    paddingBlock: vars.layout.pageGutter,
  },
]);

export const toolbar = style({
  display: 'flex',
  justifyContent: 'flex-end',
});

export const pageState = style({
  minHeight: '32rem',
});

export const reportContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s5,
});

export const reportHeader = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: vars.space.s8,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.xl,
  boxShadow: vars.shadow.card,
  backgroundColor: vars.color.white,
  padding: vars.space.s6,
  '@container': {
    [`(max-width: ${contentBreakpoints.wide})`]: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
  },
});

export const reportTitleGroup = style({
  minWidth: 0,
});

export const reportEyebrow = style({
  marginBottom: vars.space.s1,
  color: vars.color.primary,
  ...vars.typography.captionBold,
});

export const reportTitle = style({
  color: vars.color.textHigh,
  ...vars.typography.h3,
});

export const reportMetaGrid = style({
  display: 'grid',
  flex: 1,
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 20rem), 1fr))',
  rowGap: vars.space.s4,
  width: '100%',
  minWidth: 0,
});

export const reportMetaItem = style({
  borderLeft: `1px solid ${vars.color.gray100}`,
  padding: `0 ${vars.space.s4}`,
});

export const reportMetaLabel = style({
  marginBottom: vars.space.s1,
  color: vars.color.textLow,
  ...vars.typography.caption,
});

export const reportMetaValue = style({
  wordBreak: 'keep-all',
  color: vars.color.textHigh,
  ...vars.typography.body14Bold,
});

export const topGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 38.4rem), 1fr))',
  gap: vars.space.s5,
});

export const bottomGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 43rem), 1fr))',
  gap: vars.space.s5,
});
