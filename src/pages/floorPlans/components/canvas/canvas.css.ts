import { keyframes, style } from '@vanilla-extract/css';

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
