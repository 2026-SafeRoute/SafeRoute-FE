import { style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';

/* ── 우측 장비 목록 패널 ── */
export const devicePanel = style({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  borderLeft: `1px solid ${vars.color.gray100}`,
  backgroundColor: vars.color.white,
  width: '32rem',
  overflowY: 'auto',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  selectors: {
    '&::-webkit-scrollbar': { display: 'none' },
  },
});

export const devicePanelCollapsed = style({
  width: '4.8rem',
});

export const devicePanelHeader = style({
  position: 'sticky',
  zIndex: 3,
  top: 0,
  display: 'flex',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${vars.color.gray100}`,
  backgroundColor: vars.color.white,
  padding: vars.space.s2,
  minHeight: '4.8rem',
});

export const devicePanelHeading = style({
  paddingLeft: vars.space.s2,
  color: vars.color.textHigh,
  ...vars.typography.body14Medium,
});

export const devicePanelToggleExpand = style({
  transform: 'rotate(180deg)',
});

export const devicePanelInner = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s3,
  paddingRight: vars.space.s5,
  paddingBottom: vars.space.s5,
  paddingLeft: vars.space.s5,
});

export const devicePanelInnerHidden = style({
  display: 'none',
});

export const devicePanelSticky = style({
  position: 'sticky',
  zIndex: 2,
  top: '4.8rem',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s3,
  backgroundColor: vars.color.white,
  paddingTop: vars.space.s5,
  paddingBottom: vars.space.s3,
});

export const devicePanelList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s3,
});

export const filterTabs = style({
  display: 'flex',
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.md,
  overflow: 'hidden',
});

export const filterTab = style({
  display: 'flex',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  backgroundColor: vars.color.white,
  cursor: 'pointer',
  padding: vars.space.s2,
  color: vars.color.textMid,
  ...vars.typography.caption,
  selectors: {
    '&:hover': { backgroundColor: vars.color.gray25 },
  },
});

export const filterTabActive = style({
  backgroundColor: vars.color.primaryLight2,
  color: vars.color.primary,
  fontWeight: vars.fontWeight.semibold,
});

export const subFilterChips = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.s1,
});

export const subFilterChip = style({
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.pill,
  backgroundColor: vars.color.white,
  cursor: 'pointer',
  padding: '0.4rem 1rem',
  color: vars.color.textMid,
  ...vars.typography.caption,
  selectors: {
    '&:hover': { backgroundColor: vars.color.gray25 },
  },
});

export const subFilterChipActive = style({
  borderColor: vars.color.primary,
  backgroundColor: vars.color.primaryLight2,
  color: vars.color.primary,
});
