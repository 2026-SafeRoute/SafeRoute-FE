import { keyframes, style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';

import { DEVICE_COLOR } from '../constants/deviceColors';

/* ── 노드·구역 표시 안내(범례) 팝오버 ── */
export const zoneLegendTitle = style({
  color: vars.color.textHigh,
  ...vars.typography.body14Medium,
});

export const zoneLegendItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.s2,
});

export const zoneLegendLabel = style({
  flex: 1,
  color: vars.color.textMid,
  ...vars.typography.caption,
});

/* ── 마크 설명(노드/구역 종류) 안내 — 인포 아이콘을 누르면 팝오버로 뜨고 바깥을 클릭하면
   닫힘(지도 툴에서 흔한 on-demand 패턴). "+ 추가" 메뉴(addMenuContainer/Panel)와 같은
   click-outside 구조를 그대로 따름 ── */
export const legendInfoContainer = style({
  position: 'relative',
});

// 테두리 없이 동그란 i 아이콘만 보이게 — 아이콘 자체가 이미 원형(ic-info.svg)이라 버튼은
// 클릭 영역만 잡아주고 시각적으로는 드러나지 않음(hover/열림 상태는 아이콘 색으로만 표시)
export const legendInfoButton = style({
  display: 'flex',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  width: '3.4rem',
  height: '3.4rem',
  color: vars.color.textLow,
  selectors: {
    '&:hover': { color: vars.color.primary },
    '&[aria-expanded="true"]': {
      color: vars.color.primary,
    },
  },
});

// 아이콘이 이제 캔버스 우하단(줌 컨트롤 바로 위)에 있어서, 아래로 펼치면 화면 밖으로
// 잘려나감 — 위로 펼치게 함(translateY 방향도 아래→위로 뒤집음)
const legendPopoverIn = keyframes({
  from: { transform: 'translateY(0.4rem)', opacity: 0 },
  to: { transform: 'translateY(0)', opacity: 1 },
});

export const legendPopover = style({
  position: 'absolute',
  zIndex: 20,
  right: 0,
  // 아이콘이 캔버스 오른쪽 끝 가까이 있어서 왼쪽 기준(left:0)으로 오른쪽으로 펼치면
  // 캔버스 밖으로 잘려나감 — "+ 추가" 드롭다운(addMenuPanel)과 같은 방식으로 오른쪽
  // 기준으로 왼쪽으로 펼치게 함
  bottom: 'calc(100% + 0.4rem)',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s4,
  transformOrigin: 'bottom right',
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.lg,
  backgroundColor: vars.color.white,
  padding: vars.space.s5,
  width: '16rem',
  animation: `${legendPopoverIn} 0.15s ease`,
});

export const nodeTypeLegendSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s2,
});

export const nodeTypeLegendDivider = style({
  borderTop: `1px solid ${vars.color.gray100}`,
});

export const nodeTypeDot = style({
  flexShrink: 0,
  borderRadius: '50%',
  width: '0.8rem',
  height: '0.8rem',
});

export const nodeTypeDotDoor = style({ backgroundColor: DEVICE_COLOR.door });
export const nodeTypeDotStair = style({ backgroundColor: DEVICE_COLOR.stair });
export const nodeTypeDotHallway = style({ backgroundColor: DEVICE_COLOR.hallway });
export const nodeTypeDotStart = style({ backgroundColor: DEVICE_COLOR.start });
export const nodeTypeDotLight = style({ backgroundColor: DEVICE_COLOR.light });

export const nodeTypeAreaSwatch = style({
  flexShrink: 0,
  border: '1px solid',
  // vars.radius.sm(6px)은 1.2rem(12px) 박스에서 정확히 50%라 원으로 보였음 — 모서리만
  // 둥근 사각형이 되도록 더 작은 값으로 낮춤(테두리·채운색 규칙은 그대로 유지)
  borderRadius: '0.3rem',
  width: '1.2rem',
  height: '1.2rem',
});

export const nodeTypeAreaSwatchGeneral = style({
  borderColor: vars.color.gray500,
  backgroundColor: 'rgba(107,114,128,0.15)',
});
export const nodeTypeAreaSwatchCamera = style({
  borderColor: vars.color.purple,
  backgroundColor: 'rgba(139,92,246,0.18)',
});

export const nodeTypeCctvBadge = style({
  display: 'flex',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.sm,
  backgroundColor: vars.color.purple,
  width: '1.6rem',
  height: '1.6rem',
  color: vars.color.white,
  fontSize: '0.9rem',
  fontWeight: 700,
});

export const diagnosisLegendMarker = style({
  boxSizing: 'border-box',
  display: 'flex',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid',
  borderRadius: '50%',
  width: '1.8rem',
  height: '1.8rem',
});

export const diagnosisLegendMarkerDanger = style({
  borderColor: vars.color.danger,
});

export const diagnosisLegendMarkerWarning = style({
  borderColor: vars.color.warning,
});

export const diagnosisLegendMarkerNeutral = style({
  borderStyle: 'dashed',
  borderColor: vars.color.gray300,
});

export const diagnosisLegendNode = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  width: '0.8rem',
  height: '0.8rem',
});

export const diagnosisLegendNodeDanger = style({
  backgroundColor: vars.color.danger,
});

export const diagnosisLegendNodeStart = style({
  backgroundColor: DEVICE_COLOR.start,
});

export const diagnosisLegendNodeStair = style({
  color: vars.color.gray300,
});
