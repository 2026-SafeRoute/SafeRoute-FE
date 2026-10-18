import { style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';

import { DEVICE_COLOR } from '../../constants/deviceColors';

/* ── 우측 패널 카드(장비·구조 노드·구역) 공통 ── */
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

export const zoneCardDotDoor = style({ backgroundColor: DEVICE_COLOR.door });
export const zoneCardDotStair = style({ backgroundColor: DEVICE_COLOR.stair });
export const zoneCardDotHallway = style({ backgroundColor: DEVICE_COLOR.hallway });
export const zoneCardDotStart = style({ backgroundColor: DEVICE_COLOR.start });
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
