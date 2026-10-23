import { style } from '@vanilla-extract/css';

import { vars } from './global.css';

// 컨테이너(사이드바와 좌우 여백을 뺀 본문) 기준
export const contentBreakpoints = {
  compact: '80rem',
  tableWithSidebar: '90rem',
  twoPanel: '96rem',
  wide: '112rem',
  threePanel: '140rem',
} as const;

// ResizeObserver로 실제 작업 영역 너비를 비교해야 하는 인터랙티브 패널용 기준
export const interactivePanelBreakpoints = {
  floorEditorCollapse: 1300,
} as const;

export const pageContent = style({
  marginInline: 'auto',
  paddingInline: vars.layout.pageGutter,
  width: '100%',
  minWidth: 0,
  maxWidth: vars.layout.contentMaxWidth,
  containerType: 'inline-size',
});

export const cardGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 24rem), 1fr))',
  gap: vars.layout.panelGap,
  minWidth: 0,
});

export const twoColumnGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: vars.layout.panelGap,
  minWidth: 0,
  '@container': {
    [`(max-width: ${contentBreakpoints.compact})`]: { gridTemplateColumns: 'minmax(0, 1fr)' },
  },
});
