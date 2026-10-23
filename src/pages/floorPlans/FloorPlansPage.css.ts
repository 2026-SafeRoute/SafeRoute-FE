import { style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';
import { pageContent } from '@styles/responsive.css';

export const container = style([
  pageContent,
  {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: vars.space.s8,
    paddingBlock: vars.layout.pageGutter,
    minHeight: '100%',
    overflowY: 'auto',
    // 스크롤은 그대로 되지만 막대는 안 보이게(도면 관리 상세 페이지와 동일한 처리)
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    selectors: {
      '&::-webkit-scrollbar': { display: 'none' },
    },
  },
]);

export const emptyState = style({
  flex: 1,
  border: `1px dashed ${vars.color.gray200}`,
  borderRadius: vars.radius.lg,
  backgroundColor: vars.color.white,
  minHeight: '36rem',
});

export const buildingSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s4,
});

export const buildingHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.s2,
});

export const buildingDot = style({
  flexShrink: 0,
  borderRadius: vars.radius.sm,
  backgroundColor: vars.color.primary,
  width: '1.2rem',
  height: '1.2rem',
});

export const buildingName = style({
  color: vars.color.textHigh,
  ...vars.typography.body14Medium,
});

export const buildingCount = style({
  color: vars.color.textLow,
  ...vars.typography.caption,
});

export const editingLockBadge = style({
  borderRadius: vars.radius.pill,
  backgroundColor: vars.color.warningLight,
  padding: `0.2rem ${vars.space.s2}`,
  color: vars.color.warningText,
  ...vars.typography.caption,
});

export const floorGrid = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.layout.panelGap,
});

export const floorCard = style({
  display: 'flex',
  flex: '0 1 36rem',
  flexDirection: 'column',
  gap: vars.space.s3,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.lg,
  backgroundColor: vars.color.white,
  padding: vars.space.s4,
  maxWidth: '100%',
});

export const cardTop = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
});

export const cardIcon = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.primaryLight,
  width: '3.6rem',
  height: '3.6rem',
  color: vars.color.primary,
});

export const floorLabel = style({
  color: vars.color.textHigh,
  ...vars.typography.body14Medium,
  fontSize: '1.8rem',
  fontWeight: vars.fontWeight.semibold,
});

export const divider = style({
  borderTop: `1px solid ${vars.color.gray100}`,
});

export const cardMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s1,
});

export const metaRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const metaKey = style({
  flexShrink: 0,
  whiteSpace: 'nowrap',
  color: vars.color.textLow,
  ...vars.typography.caption,
});

export const metaValue = style({
  color: vars.color.textMid,
  ...vars.typography.caption,
});

export const metaValueDone = style({
  color: vars.color.success,
  ...vars.typography.caption,
});

export const metaValuePending = style({
  color: vars.color.warning,
  ...vars.typography.caption,
});

export const metaValueFailed = style({
  color: vars.color.danger,
  ...vars.typography.caption,
});

// 등록 요건 진행바 — "등록 요건" 라벨이 잘리지 않을 만큼 폭을 더 좁게 고정
export const readinessProgressBar = style({
  flexShrink: 0,
  width: '4rem',
});

export const uploadButton = style({
  border: `1px solid ${vars.color.primary}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.primary,
  cursor: 'pointer',
  padding: `${vars.space.s2} 0`,
  width: '100%',
  textAlign: 'center',
  color: vars.color.white,
  ...vars.typography.body14,
  selectors: {
    '&:hover:not(:disabled)': {
      borderColor: vars.color.primaryHover,
      backgroundColor: vars.color.primaryHover,
    },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});

export const cardActionRow = style({
  display: 'flex',
  gap: vars.space.s2,
});

export const detailButton = style({
  display: 'flex',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.s1,
  border: `1px solid ${vars.color.gray200}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.gray50,
  cursor: 'pointer',
  height: '3.6rem',
  color: vars.color.textHigh,
  ...vars.typography.body14Medium,
  selectors: {
    '&:hover': {
      borderColor: vars.color.gray300,
      backgroundColor: vars.color.gray100,
    },
  },
});

export const reuploadButton = style({
  display: 'flex',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.s1,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.white,
  cursor: 'pointer',
  padding: `0 ${vars.space.s3}`,
  height: '3.6rem',
  color: vars.color.textMid,
  ...vars.typography.caption,
  selectors: {
    '&:hover:not(:disabled)': {
      borderColor: vars.color.gray300,
      backgroundColor: vars.color.gray25,
    },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});
