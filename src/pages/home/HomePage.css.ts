import { style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';
import { contentBreakpoints, pageContent } from '@styles/responsive.css';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100%',
});

export const sectionContainer = style([
  pageContent,
  {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: vars.space.s6,
    paddingBlock: vars.layout.pageGutter,
  },
]);

export const sectionCardBase = style({
  border: `1px solid ${vars.color.gray100}`,
  boxShadow: vars.shadow.card,
  backgroundColor: vars.color.white,
});

export const contentGrid = style({
  display: 'grid',
  gridTemplateAreas: '"records schedule"',
  gridTemplateColumns: 'minmax(0, 1fr) 35rem',
  alignItems: 'start',
  gap: vars.space.s4,
  minWidth: 0,
  '@container': {
    [`(max-width: ${contentBreakpoints.tableWithSidebar})`]: {
      gridTemplateAreas: '"schedule" "records"',
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
});

export const sideColumn = style({
  gridArea: 'schedule',
  minWidth: 0,
});
