import { style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';
import { pageContent } from '@styles/responsive.css';

export const container = style([
  pageContent,
  {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: vars.space.s3,
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
