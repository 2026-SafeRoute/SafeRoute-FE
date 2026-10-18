import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';

import { vars } from '@styles/global.css';

/* ── 전체 레이아웃 ── */
// 폭 상한을 뒀었는데 그러면 큰 화면에서 좌우로 회색 여백만 생기고 정작 캔버스는 안 넓어짐
// (되돌림) — 범례·팝업이 도면과 동떨어져 보이는 문제는 그 둘을 각각 접을 수 있게 하거나
// 캔버스 밖으로 옮기는 쪽으로 해결함(범례는 인포 아이콘 팝오버로, 팝업은 좌측 사이드바로 이동)
export const layout = style({
  display: 'flex',
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
});

/* ── 좌측 사이드바 ── */
export const sidebar = style({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  borderRight: `1px solid ${vars.color.gray100}`,
  backgroundColor: vars.color.white,
  width: '28rem',
  overflowY: 'auto',
  // 스크롤은 그대로 되지만 막대는 안 보이게(우측 장비 목록 패널과 동일한 처리)
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  selectors: {
    '&::-webkit-scrollbar': { display: 'none' },
  },
});

export const sidebarInner = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s4,
  minHeight: 'min-content',
});

/* ── 층 목록 ── */
export const floorNavCard = style({
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.lg,
  overflow: 'hidden',
});

export const floorNavHeader = style({
  borderBottom: `1px solid ${vars.color.gray100}`,
  padding: `${vars.space.s3} ${vars.space.s4}`,
  color: vars.color.textHigh,
  ...vars.typography.body14Medium,
});

export const floorNavList = style({
  display: 'flex',
  flexDirection: 'column',
});

export const floorNavItem = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  border: 'none',
  borderBottom: `1px solid ${vars.color.gray100}`,
  backgroundColor: 'transparent',
  cursor: 'pointer',
  padding: `${vars.space.s3} ${vars.space.s4}`,
  width: '100%',
  textAlign: 'left',
  color: vars.color.textHigh,
  ...vars.typography.body14,
  selectors: {
    '&:last-child': { borderBottom: 'none' },
    '&:hover': { backgroundColor: vars.color.gray25 },
  },
});

export const floorNavItemActive = style({
  backgroundColor: vars.color.primaryLight2,
  color: vars.color.primary,
});

// 훈련 준비 체크리스트(readiness*) 클래스는 components/ReadinessChecklist.css.ts로 옮김
// (코드래빗 리뷰 반영 — 컴포넌트 스타일을 페이지 스타일 파일에 두면 컴포넌트를 다른 위치로
// 옮길 때 스타일이 따라오지 않음)

/* ── 캔버스 우상단(장비/구역 추가) ── */
export const canvasTopRightRow = style({
  position: 'absolute',
  zIndex: 10,
  top: vars.space.s6,
  right: vars.space.s6,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.s2,
});

export const canvasDiagnosisAlert = recipe({
  base: {
    position: 'absolute',
    zIndex: 9,
    top: vars.space.s6,
    left: vars.space.s6,
    display: 'flex',
    alignItems: 'flex-start',
    gap: vars.space.s2,
    border: '1px solid',
    borderRadius: vars.radius.md,
    padding: `${vars.space.s2} ${vars.space.s3}`,
    maxWidth: 'min(58rem, calc(100% - 18rem))',
    ...vars.typography.captionMedium,
  },
  variants: {
    tone: {
      success: {
        borderColor: vars.color.success,
        backgroundColor: vars.color.successLight,
        color: vars.color.successText,
      },
      danger: {
        borderColor: vars.color.danger,
        backgroundColor: vars.color.dangerSurface,
        color: vars.color.dangerText,
      },
    },
  },
});

export const canvasDiagnosisAlertIcon = recipe({
  base: {
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    width: '1.8rem',
    height: '1.8rem',
    color: vars.color.white,
  },
  variants: {
    tone: {
      success: { backgroundColor: vars.color.success },
      danger: { backgroundColor: vars.color.danger },
    },
  },
});

export const canvasDiagnosisAlertMessage = style({
  minWidth: 0,
  lineHeight: '1.5',
});

export const editingLockNotice = style({
  border: `1px solid ${vars.color.warning}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.warningLight,
  padding: vars.space.s3,
  color: vars.color.warningText,
  ...vars.typography.caption,
});

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

/* ── 캔버스 우하단(범례 정보 + 줌 컨트롤을 세로로 쌓음) ── */
export const canvasBottomRightColumn = style({
  position: 'absolute',
  zIndex: 10,
  right: vars.space.s8,
  bottom: vars.space.s8,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: vars.space.s1,
});

export const canvasZoomFloat = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.md,
  backgroundColor: vars.color.white,
  padding: `0.4rem ${vars.space.s2}`,
});

export const zoomValue = style({
  minWidth: '3.2rem',
  ...vars.typography.body14Medium,
  textAlign: 'center',
  color: vars.color.textHigh,
});

export const zoomButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.sm,
  backgroundColor: vars.color.white,
  cursor: 'pointer',
  width: '2.4rem',
  height: '2.4rem',
  color: vars.color.textMid,
  ...vars.typography.body14Medium,
  selectors: {
    '&:hover': { backgroundColor: vars.color.gray50 },
    '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
  },
});

/* ── 중앙 캔버스 영역 ── */
export const canvasArea = style({
  position: 'relative',
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  backgroundColor: vars.color.gray50,
  overflow: 'hidden',
});

export const canvasHeader = style({
  display: 'flex',
  flexShrink: 0,
  alignItems: 'center',
  gap: vars.space.s2,
  margin: vars.space.s4,
  marginBottom: 0,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: `${vars.radius.lg} ${vars.radius.lg} 0 0`,
  backgroundColor: vars.color.white,
  padding: `${vars.space.s3} ${vars.space.s4}`,
});

export const backButton = style({
  display: 'flex',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: vars.radius.sm,
  backgroundColor: 'transparent',
  cursor: 'pointer',
  width: '2.4rem',
  height: '2.4rem',
  color: vars.color.textMid,
  selectors: {
    '&:hover': { backgroundColor: vars.color.gray50 },
  },
});

export const backButtonIcon = style({
  transform: 'rotate(180deg)',
});

export const canvasHeaderText = style({
  color: vars.color.textLow,
  ...vars.typography.body14,
});

export const canvasHeaderFloor = style({
  color: vars.color.textHigh,
  ...vars.typography.body14Medium,
});

// "+ 추가" 버튼(canvasTopRightRow)이 이 박스 기준으로 절대 위치를 잡음 — 캔버스가 확대돼서
// 스크롤이 생겨도 그 스크롤은 안쪽 canvasScrollArea에서만 일어나고, 이 박스 자체는 스크롤되지
// 않아서 버튼이 항상 같은 자리에 고정됨(예전엔 이 박스 자체가 스크롤 컨테이너라 확대 후 스크롤하면
// 버튼도 같이 밀려 화면 밖으로 나가던 문제가 있었음)
export const canvasBody = style({
  position: 'relative',
  flex: 1,
  margin: vars.space.s4,
  marginTop: 0,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: `0 0 ${vars.radius.lg} ${vars.radius.lg}`,
  backgroundColor: vars.color.white,
  padding: vars.space.s6,
});

export const canvasBodyWithActions = style({
  paddingTop: '8rem',
});

// 실제 스크롤이 일어나는 안쪽 영역 — canvasBody의 패딩 박스를 그대로 채움
export const canvasScrollArea = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  width: '100%',
  height: '100%',
  overflow: 'auto',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  selectors: {
    '&::-webkit-scrollbar': { display: 'none' },
  },
});

/* ── 줌 리셋 ── */
export const zoomValueClickable = style({
  borderRadius: vars.radius.sm,
  ...vars.typography.body14Medium,
  cursor: 'pointer',
  padding: '0.1rem 0.4rem',
  minWidth: '3.2rem',
  textAlign: 'center',
  color: vars.color.primary,
  selectors: {
    '&:hover': { backgroundColor: vars.color.primaryLight2 },
  },
});
