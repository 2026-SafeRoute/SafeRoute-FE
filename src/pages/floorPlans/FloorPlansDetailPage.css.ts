import { keyframes, style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';

import { vars } from '@styles/global.css';

import { DEVICE_COLOR } from './constants/deviceColors';

/* 도면 상 구역 의미 색상 — 문·출입구/계단/시작 후보 표시에서 반복 사용되므로 한 곳에서만 정의.
   FloorPlansDetailPage.tsx의 DEVICE_PLACE_CONFIG/STRUCTURE_NODE_COLOR와 값이 어긋나지 않도록
   같은 공용 상수(deviceColors.ts)를 가져다 씀(코드래빗 리뷰 반영 — 값 중복 제거) */
const zoneDoorColor = DEVICE_COLOR.door;
const zoneStairColor = DEVICE_COLOR.stair;
const zoneStartColor = DEVICE_COLOR.start;
const zoneHallwayColor = DEVICE_COLOR.hallway;
const zoneLightColor = DEVICE_COLOR.light;

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

export const canvasActionButton = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.s1,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.sm,
  backgroundColor: vars.color.white,
  cursor: 'pointer',
  padding: `${vars.space.s2} ${vars.space.s3}`,
  color: vars.color.textMid,
  ...vars.typography.body14Medium,
  selectors: {
    '&:hover:not(:disabled)': { backgroundColor: vars.color.gray25 },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});

export const editingLockNotice = style({
  border: `1px solid ${vars.color.warning}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.warningLight,
  padding: vars.space.s3,
  color: vars.color.warningText,
  ...vars.typography.caption,
});

/* ── 툴바 "+ 추가" 메뉴 ── */
export const addMenuContainer = style({
  position: 'relative',
});

export const addMenuChevron = style({
  color: vars.color.textLow,
});

export const addMenuPanel = style({
  position: 'absolute',
  zIndex: 20,
  top: 'calc(100% + 0.4rem)',
  right: 0,
  display: 'flex',
  flexDirection: 'column',
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.lg,
  backgroundColor: vars.color.white,
  padding: vars.space.s2,
  width: '12rem',
});

export const addMenuItem = style({
  border: 'none',
  borderRadius: vars.radius.sm,
  backgroundColor: 'transparent',
  cursor: 'pointer',
  padding: `${vars.space.s2} ${vars.space.s3}`,
  width: '100%',
  textAlign: 'left',
  color: vars.color.textHigh,
  ...vars.typography.body14,
  selectors: {
    '&:hover': { backgroundColor: vars.color.gray25 },
  },
});

export const gridSizeLabelRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const gridSizeValue = style({
  color: vars.color.primary,
  ...vars.typography.body14Medium,
});

export const gridSizeSlider = style({
  appearance: 'none',
  borderRadius: vars.radius.pill,
  backgroundColor: vars.color.gray100,
  cursor: 'pointer',
  width: '100%',
  height: '0.6rem',
  selectors: {
    '&::-webkit-slider-thumb': {
      appearance: 'none',
      borderRadius: '50%',
      backgroundColor: vars.color.primary,
      cursor: 'pointer',
      width: '1.6rem',
      height: '1.6rem',
    },
    '&::-moz-range-thumb': {
      border: 'none',
      borderRadius: '50%',
      backgroundColor: vars.color.primary,
      cursor: 'pointer',
      width: '1.6rem',
      height: '1.6rem',
    },
  },
});

// 예전엔 캔버스 위에 절대 위치로 떠서 도면을 가려 그 밑을 클릭할 수 없었음 — 좌측 사이드바
// 안 일반 흐름으로 옮겨서, 도면은 항상 그대로 보이고 클릭도 가능하게 함
export const gridSetupPopup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s3,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.md,
  backgroundColor: vars.color.white,
  padding: vars.space.s4,
});

/* ── 카메라 시야 구역 지정 안내 ── */
/* ── 장비 추가 팝업 ── */
export const nodeAddPopup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s3,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.md,
  backgroundColor: vars.color.white,
  padding: vars.space.s4,
});

export const nodeAddHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.s2,
});

export const nodeAddTitle = style({
  color: vars.color.textHigh,
  ...vars.typography.body14Medium,
});

export const nodeAddStepBadge = style({
  flexShrink: 0,
  borderRadius: vars.radius.pill,
  backgroundColor: vars.color.gray50,
  padding: `0.2rem ${vars.space.s2}`,
  color: vars.color.textLow,
  ...vars.typography.caption,
});

export const nodeAddHint = style({
  marginTop: `calc(-1 * ${vars.space.s2})`,
  color: vars.color.textLow,
  ...vars.typography.caption,
});

// 그냥 안내 문구가 아니라 "지금 이대로는 진행이 안 된다"는 경고(예: 연결된 엣지가 없음) — 색으로
// 구분되게 함
export const nodeAddHintWarning = style({
  color: vars.color.danger,
});

export const nodeAddField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s1,
});

export const nodeAddLabel = style({
  color: vars.color.textLow,
  ...vars.typography.caption,
});

// 갈림길 위치·좌우 통로 라벨 옆에 "캔버스에서 선택" 버튼을 나란히 두기 위함 — 드롭다운에서
// 같은 이름 노드가 많아 고르기 혼란스럽다는 피드백으로, 도면에서 직접 클릭해 고르는 대안 제공
export const nodeAddLabelRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.s2,
});

export const nodeAddPickBtn = style({
  flexShrink: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  padding: 0,
  color: vars.color.primary,
  ...vars.typography.caption,
  selectors: {
    '&:hover': { textDecoration: 'underline' },
    '&:disabled': { cursor: 'not-allowed', color: vars.color.gray300 },
  },
});

// 갈림길 위치·좌우 통로는 드롭다운을 없애고 캔버스 클릭으로만 고르게 함(같은 이름의 노드가
// 많아 드롭다운으로는 뭐가 뭔지 구분이 안 된다는 피드백) — 이 박스는 클릭 대상이 아니라
// 현재 고른 값을 보여주기만 하는 정적 표시 영역
export const nodeAddPickDisplay = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.s2,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.white,
  padding: `${vars.space.s2} ${vars.space.s3} ${vars.space.s2} ${vars.space.s4}`,
  color: vars.color.textHigh,
  ...vars.typography.body14Medium,
});

export const nodeAddPickDisplayEmpty = style({
  color: vars.color.textLow,
});

// 지금 이 필드가 "캔버스에서 선택" 중임을 표시 — 드롭다운의 aria-expanded 강조 테두리와 같은 색
export const nodeAddPickDisplayActive = style({
  borderColor: vars.color.primary,
});

export const nodeAddPickClearBtn = style({
  display: 'inline-flex',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: vars.radius.pill,
  background: 'none',
  cursor: 'pointer',
  padding: 0,
  color: vars.color.textMid,
  selectors: {
    '&:hover': { backgroundColor: vars.color.gray50, color: vars.color.textHigh },
  },
});

export const edgeBidirectionalField = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.s2,
  cursor: 'pointer',
  color: vars.color.textMid,
  ...vars.typography.body14,
});

// 순서대로 클릭해 쌓은 경로를 "A → B → C"로 미리 보여주는 텍스트
export const edgeChainPath = style({
  wordBreak: 'break-word',
  color: vars.color.textMid,
  ...vars.typography.caption,
});

// 엣지 체인 검토 화면 — 구간이 많아질 수 있어 스크롤 가능한 목록으로 둠
export const edgeChainList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s2,
  maxHeight: '24rem',
  overflowY: 'auto',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  selectors: {
    '&::-webkit-scrollbar': { display: 'none' },
  },
});

export const edgeChainRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.s2,
});

export const edgeChainRowLabel = style({
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: vars.color.textHigh,
  ...vars.typography.body14,
});

export const edgeChainDistanceInput = style({
  flexShrink: 0,
  outline: 'none',
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.md,
  padding: `${vars.space.s2} ${vars.space.s3}`,
  width: '6.4rem',
  color: vars.color.textHigh,
  ...vars.typography.body14,
  selectors: {
    '&:focus': { borderColor: vars.color.primary },
  },
});

// 다른 경로와 겹쳐 이미 존재하는 구간 표시 — 입력창 대신 이 태그만 보여줌
export const edgeChainExistingTag = style({
  flexShrink: 0,
  borderRadius: vars.radius.pill,
  backgroundColor: vars.color.gray50,
  padding: `0.2rem ${vars.space.s2}`,
  color: vars.color.textLow,
  ...vars.typography.caption,
});

export const deviceTypeChips = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.s2,
});

export const deviceTypeChip = style({
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.pill,
  backgroundColor: vars.color.white,
  cursor: 'pointer',
  padding: `${vars.space.s2} ${vars.space.s3}`,
  color: vars.color.textMid,
  ...vars.typography.body14,
  selectors: {
    '&:hover': { backgroundColor: vars.color.gray25 },
    '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
    '&:disabled:hover': { backgroundColor: vars.color.white },
  },
});

export const deviceTypeChipActive = style({
  borderColor: vars.color.primary,
  backgroundColor: vars.color.primaryLight2,
  color: vars.color.primary,
});

export const nodeAddInput = style({
  outline: 'none',
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.md,
  padding: `${vars.space.s2} ${vars.space.s3}`,
  color: vars.color.textHigh,
  ...vars.typography.body14,
  selectors: {
    '&:focus': { borderColor: vars.color.primary },
  },
});

export const nodeAddActions = style({
  display: 'flex',
  gap: vars.space.s2,
});

export const nodeAddBackBtn = style({
  flexShrink: 0,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.white,
  cursor: 'pointer',
  padding: `${vars.space.s2} ${vars.space.s3}`,
  color: vars.color.textMid,
  ...vars.typography.body14,
  selectors: {
    '&:hover': { backgroundColor: vars.color.gray25 },
  },
});

export const nodeAddCancelBtn = style({
  flex: 1,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.white,
  cursor: 'pointer',
  padding: vars.space.s2,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: vars.color.textMid,
  ...vars.typography.body14,
  selectors: {
    '&:hover': { backgroundColor: vars.color.gray25 },
  },
});

export const nodeAddSubmitBtn = style({
  flex: 1,
  border: 'none',
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.primary,
  cursor: 'pointer',
  padding: vars.space.s2,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: vars.color.white,
  ...vars.typography.body14,
  selectors: {
    '&:hover:not(:disabled)': { backgroundColor: vars.color.primaryHover },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});

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

export const nodeTypeDotDoor = style({ backgroundColor: zoneDoorColor });
export const nodeTypeDotStair = style({ backgroundColor: zoneStairColor });
export const nodeTypeDotHallway = style({ backgroundColor: zoneHallwayColor });
export const nodeTypeDotStart = style({ backgroundColor: zoneStartColor });
export const nodeTypeDotLight = style({ backgroundColor: zoneLightColor });

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
  backgroundColor: zoneStartColor,
});

export const diagnosisLegendNodeStair = style({
  color: vars.color.gray300,
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

export const deviceCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s2,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.lg,
  cursor: 'pointer',
  padding: vars.space.s4,
});

export const deviceCardSelected = style({
  borderColor: vars.color.primary,
  backgroundColor: vars.color.primaryLight2,
});

export const deviceCardDiagnosisError = style({
  borderColor: vars.color.danger,
  backgroundColor: vars.color.dangerSurface,
});

export const zoneCardHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.s2,
});

export const zoneCardTitleGroup = style({
  display: 'flex',
  flex: 1,
  alignItems: 'center',
  gap: vars.space.s2,
  minWidth: 0,
});

export const zoneCardTitleText = style({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  minWidth: 0,
});

export const diagnosisCardHint = style({
  color: vars.color.danger,
  ...vars.typography.caption,
});

export const zoneCardDot = style({
  flexShrink: 0,
  borderRadius: '50%',
  width: '0.7rem',
  height: '0.7rem',
});

export const zoneCardDotDoor = style({ backgroundColor: zoneDoorColor });
export const zoneCardDotStair = style({ backgroundColor: zoneStairColor });
export const zoneCardDotHallway = style({ backgroundColor: zoneHallwayColor });
export const zoneCardDotStart = style({ backgroundColor: zoneStartColor });
export const zoneCardDotGeneral = style({ backgroundColor: vars.color.gray500 });

export const finalExitToggle = style({
  flexShrink: 0,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.pill,
  backgroundColor: vars.color.white,
  cursor: 'pointer',
  padding: `0.1rem ${vars.space.s2}`,
  color: vars.color.textLow,
  ...vars.typography.caption,
  selectors: {
    '&:hover:not(:disabled)': { borderColor: vars.color.gray300, color: vars.color.textMid },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});

export const finalExitBadge = style({
  flexShrink: 0,
  border: 'none',
  borderRadius: vars.radius.pill,
  backgroundColor: vars.color.successLight,
  cursor: 'pointer',
  padding: `0.1rem ${vars.space.s2}`,
  color: vars.color.successText,
  ...vars.typography.caption,
  selectors: {
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});

/* CCTV 카드의 사용가능/불가능 — 클릭 가능한 상태 칩처럼 보이던 걸(눌러보기 전까진 토글인지
   알 수 없었음) iOS 스타일 on/off 스위치로 바꿔서 누르는 UI라는 게 바로 보이게 함 */
export const cctvEnableRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.s2,
});

export const cctvEnableSwitch = style({
  position: 'relative',
  flexShrink: 0,
  transition: 'background-color 0.15s ease',
  border: 'none',
  borderRadius: vars.radius.pill,
  backgroundColor: vars.color.gray300,
  cursor: 'pointer',
  padding: '0.2rem',
  width: '3.2rem',
  height: '1.8rem',
});

export const cctvEnableSwitchOn = style({
  backgroundColor: vars.color.success,
});

export const cctvEnableSwitchThumb = style({
  display: 'block',
  transform: 'translateX(0)',
  transition: 'transform 0.15s ease',
  borderRadius: '50%',
  boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
  backgroundColor: vars.color.white,
  width: '1.4rem',
  height: '1.4rem',
  selectors: {
    [`${cctvEnableSwitchOn} &`]: {
      transform: 'translateX(1.4rem)',
    },
  },
});

// 기기명(입력창 또는 텍스트) + 삭제 아이콘 버튼을 한 줄에 나란히 둠 — 삭제가 하단 버튼 행에
// 있던 걸 여기로 옮겨서, 아래는 취소/완료(또는 수정)만 남게 함
export const deviceCardNameRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.s2,
});

export const deviceCardName = style({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: vars.color.textHigh,
  ...vars.typography.body14Medium,
});

export const deviceCardNameInput = style({
  flex: 1,
  outline: 'none',
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.sm,
  backgroundColor: vars.color.white,
  padding: `${vars.space.s1} ${vars.space.s2}`,
  minWidth: 0,
  color: vars.color.textHigh,
  ...vars.typography.body14Medium,
  selectors: {
    '&:focus': { borderColor: vars.color.primary },
  },
});

export const deviceCardRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const deviceCardKey = style({
  color: vars.color.textLow,
  ...vars.typography.caption,
});

export const deviceCardValue = style({
  color: vars.color.textHigh,
  ...vars.typography.caption,
});

// 감시 영역·구역 범위·가이던스처럼 "값 자체가 재선택/펼치기 액션"인 필드 — 별도 버튼을 두지
// 않고 값 텍스트를 눌러서 처리함. 이전엔 밑줄 친 링크 모양이었는데 "왜 이게 클릭되는 건지
// 모르겠다"는 피드백이 있어서, 카드 안 다른 작은 액션(훈련 준비 체크리스트의 readinessActionBtn)과
// 같은 알약형 버튼 모양으로 통일함
export const deviceCardFieldEditBtn = style({
  flexShrink: 0,
  border: `1px solid ${vars.color.primary}`,
  borderRadius: vars.radius.pill,
  backgroundColor: vars.color.white,
  cursor: 'pointer',
  padding: `0.1rem ${vars.space.s3}`,
  color: vars.color.primary,
  ...vars.typography.caption,
  selectors: {
    '&:hover': { backgroundColor: vars.color.primaryLight2 },
  },
});

// 가이던스(판단 노드/좌우 엣지) Dropdown 3개를 세로로 쌓는 영역 — deviceCardRow 밑에 통째로 붙음
export const lightFieldGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s2,
});

export const deviceCardActions = style({
  display: 'flex',
  gap: vars.space.s2,
  marginTop: vars.space.s1,
});

export const deviceCardEditBtn = style({
  flex: 1,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.white,
  cursor: 'pointer',
  padding: vars.space.s2,
  color: vars.color.textMid,
  ...vars.typography.caption,
  selectors: {
    '&:hover:not(:disabled)': { backgroundColor: vars.color.gray25 },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});

export const deviceCardDoneBtn = style({
  flex: 1,
  border: `1px solid ${vars.color.primary}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.primary,
  cursor: 'pointer',
  padding: vars.space.s2,
  color: vars.color.white,
  ...vars.typography.caption,
  selectors: {
    '&:hover:not(:disabled)': {
      borderColor: vars.color.primaryHover,
      backgroundColor: vars.color.primaryHover,
    },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});

/* ── 구역/문/계단 카드 — 한 줄로 압축, 수정·삭제는 아이콘 버튼 ── */
export const zoneCardHeaderActions = style({
  display: 'flex',
  flexShrink: 0,
  alignItems: 'center',
  gap: vars.space.s1,
});

export const zoneCardIconBtn = style({
  display: 'flex',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.white,
  cursor: 'pointer',
  width: '2.6rem',
  height: '2.6rem',
  color: vars.color.textMid,
  selectors: {
    '&:hover:not(:disabled)': { backgroundColor: vars.color.gray25 },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});

export const zoneCardIconBtnDone = style([
  zoneCardIconBtn,
  {
    borderColor: vars.color.primary,
    backgroundColor: vars.color.primary,
    color: vars.color.white,
    selectors: {
      '&:hover': {
        borderColor: vars.color.primaryHover,
        backgroundColor: vars.color.primaryHover,
      },
    },
  },
]);

export const zoneCardIconBtnDelete = style([
  zoneCardIconBtn,
  {
    borderColor: vars.color.dangerLight,
    color: vars.color.danger,
    selectors: {
      '&:hover': { backgroundColor: vars.color.dangerHoverBg },
    },
  },
]);

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
