import { keyframes, style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';

import { vars } from '@styles/global.css';

/* ── 도면 캔버스(배율 프레임·장비 마커·빈 상태) ── */
// 확대된 도면의 실제 점유 크기를 스크롤 영역에 반영한다. 여유 공간이 있을 때는 가운데에 두고,
// 확대 폭이 스크롤 영역보다 커지면 auto margin이 0으로 줄어 왼쪽 끝까지 접근할 수 있다.
export const mapScaleFrame = style({
  position: 'relative',
  flexShrink: 0,
  marginInline: 'auto',
});

export const mapWrap = style({
  position: 'relative',
  display: 'inline-block',
  flexShrink: 0,
  transformOrigin: 'top left',
  transition: 'transform 0.15s ease',
  overflow: 'visible',
});

/* ── 마커 공통 ── */
// 마커 위치의 기준점(0,0)만 잡음 — 크기가 없는 점이라 자식(원 아이콘·라벨)이 뭘 보여주든
// 이 기준점 자체는 흔들리지 않음
export const markerWrap = style({
  position: 'absolute',
  zIndex: 1,
  cursor: 'pointer',
});

// 원 아이콘은 markerWrap의 (0,0)을 기준으로 항상 자기 자신의 고정 크기(2.4rem)만으로
// -50%/-50% 이동해 중앙 정렬함 — 라벨(선택 시에만 나타남)과 같은 flex 박스에 있지 않아서,
// 수정 모드 진입으로 라벨이 나타나거나 사라져도 원 아이콘 위치는 안 바뀜(전엔 라벨 유무로
// markerWrap 전체 높이가 바뀌어 translate(-50%,-50%) 기준도 같이 바뀌면서 수정 시작하자마자
// 마커가 위로 튀어 보이던 버그의 원인이었음)
export const markerPin = style({
  position: 'absolute',
  top: 0,
  left: 0,
  transform: 'translate(-50%, -50%)',
});

// 라벨도 markerWrap의 (0,0) 기준으로 원 아이콘 반지름(1.2rem) + 기존 간격(0.3rem)만큼
// 아래로 고정 오프셋 — 원 아이콘 쪽 레이아웃과 완전히 분리돼 있어 서로 영향을 안 줌
export const markerLabelPin = style({
  position: 'absolute',
  top: '1.5rem',
  left: 0,
  transform: 'translateX(-50%)',
});

export const markerCircle = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.1s',
  border: '2px solid white',
  borderRadius: '50%',
  boxShadow: vars.shadow.md,
  width: '2.4rem',
  height: '2.4rem',
  selectors: {
    '&:hover': { transform: 'scale(1.15)' },
  },
});

export const markerSelected = style({
  transform: 'scale(1.2)',
  outline: `3px solid ${vars.color.primary}`,
  outlineOffset: '2px',
});

export const markerLabel = style({
  borderRadius: vars.radius.sm,
  backgroundColor: 'rgba(0,0,0,0.65)',
  pointerEvents: 'none',
  padding: `0.2rem ${vars.space.s2}`,
  whiteSpace: 'nowrap',
  color: vars.color.white,
  ...vars.typography.caption,
});

export const markerCctv = style({ backgroundColor: vars.color.purple, color: vars.color.white });
export const markerCctvOffline = style({
  backgroundColor: vars.color.gray300,
  color: vars.color.white,
});
export const markerIot = style({ backgroundColor: vars.color.success, color: vars.color.white });

const pulse = keyframes({
  '0%, 100%': { opacity: 1 },
  '50%': { opacity: 0.4 },
});

export const stagedCameraMarker = style({
  position: 'absolute',
  zIndex: 2,
  transform: 'translate(-50%, -50%)',
  border: `2px dashed ${vars.color.purple}`,
  borderRadius: '50%',
  backgroundColor: 'rgba(139,92,246,0.25)',
  pointerEvents: 'none',
  width: '2.4rem',
  height: '2.4rem',
  animation: `${pulse} 1.4s ease-in-out infinite`,
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
});

/* ── Canvase placeholder ── */
export const canvasPlaceholder = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.s3,
  width: '100%',
  height: '100%',
  color: vars.color.textLow,
  ...vars.typography.body14,
});

export const canvasPlaceholderText = style({
  margin: 0,
  color: 'inherit',
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
