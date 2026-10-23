import { style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';
import { pageContent } from '@styles/responsive.css';

export const container = style([
  pageContent,
  {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: vars.space.s5,
    paddingBlock: `${vars.space.s4} ${vars.layout.pageGutter}`,
    overflow: 'auto',
    // 스크롤은 그대로 되지만 오른쪽 스크롤바만 안 보이게 함
    scrollbarWidth: 'none',
    selectors: {
      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },
  },
]);

export const gridSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s5,
});

export const floorGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s3,
});

export const floorHeadRow = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: vars.space.s2,
});

export const floorLabel = style({
  color: vars.color.textHigh,
  ...vars.typography.body14Bold,
});

export const floorCount = style({
  color: vars.color.textLow,
  ...vars.typography.body14,
});

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 28rem), 1fr))',
  gap: vars.space.s4,
});
