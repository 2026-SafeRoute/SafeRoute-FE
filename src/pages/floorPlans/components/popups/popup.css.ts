import { style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';

/* ── 좌측 사이드바 팝업(노드·구역·엣지 추가, 그리드 설정) 공통 ── */
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
