import { style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';
import { contentBreakpoints, pageContent } from '@styles/responsive.css';

export const container = style([
  pageContent,
  {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    paddingBlock: vars.layout.pageGutter,
    minHeight: '100%',
  },
]);

export const sectionCardBase = style({
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.card,
  backgroundColor: vars.color.white,
});

export const mainSectionCard = style([
  sectionCardBase,
  {
    padding: vars.space.s6,
  },
]);

export const mainSectionTitle = style({
  color: vars.color.textHigh,
  ...vars.typography.h4,
});

export const sectionTitleRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.s4,
});

export const lockBadge = style({
  borderRadius: vars.radius.pill,
  backgroundColor: vars.color.gray50,
  padding: '0.3rem 1rem',
  color: vars.color.textLow,
  ...vars.typography.caption,
});

export const fieldGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: vars.space.s4,
  marginTop: vars.space.s4,
  '@container': {
    [`(max-width: ${contentBreakpoints.compact})`]: { gridTemplateColumns: 'minmax(0, 1fr)' },
  },
});

export const sideCardTitle = style({
  color: vars.color.textHigh,
  ...vars.typography.body14Bold,
});

export const contentGrid = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 38rem',
  alignItems: 'start',
  gap: vars.space.s4,
  minWidth: 0,
  '@container': {
    [`(max-width: ${contentBreakpoints.twoPanel})`]: { gridTemplateColumns: 'minmax(0, 1fr)' },
  },
});

export const sideColumn = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s4,
  minWidth: 0,
});

export const startActionPanel = style([
  sideColumn,
  {
    '@container': {
      [`(max-width: ${contentBreakpoints.twoPanel})`]: {
        paddingBottom: vars.space.s6,
      },
    },
  },
]);

export const draftButton = style({
  borderColor: vars.color.gray100,
  backgroundColor: vars.color.gray200,
  color: vars.color.textHigh,
  selectors: {
    '&:hover:not(:disabled)': {
      borderColor: vars.color.gray200,
      backgroundColor: vars.color.gray100,
    },
  },
});

export const startRestrictionNotice = style({
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.gray50,
  padding: vars.space.s4,
  textAlign: 'center',
  color: vars.color.textLow,
  ...vars.typography.body14,
});

export const trainingDurationNotice = style({
  padding: `0 ${vars.space.s2}`,
  textAlign: 'center',
  color: vars.color.textLow,
  ...vars.typography.caption,
});

export const pageState = style({
  display: 'flex',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.space.s6,
});
