import { style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';

// FloorPlansDetailPage.css.ts에 있던 readiness* 클래스를 이 컴포넌트 전용 파일로 옮김 — 페이지
// 스타일 파일이 컴포넌트 내부 클래스까지 떠안고 있으면 이 컴포넌트를 다른 위치로 옮길 때 스타일이
// 따라오지 않음(코드래빗 리뷰 반영, 컴포넌트 범위 캡슐화)
export const readinessCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s2,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.lg,
  padding: vars.space.s4,
});

export const readinessHeader = style({
  color: vars.color.textHigh,
  ...vars.typography.body14Medium,
});

export const readinessHint = style({
  color: vars.color.textLow,
  ...vars.typography.caption,
});

export const readinessDoneText = style({
  flexShrink: 0,
  color: vars.color.textLow,
  ...vars.typography.caption,
});

export const readinessActionBtn = style({
  flexShrink: 0,
  border: `1px solid ${vars.color.primary}`,
  borderRadius: vars.radius.pill,
  backgroundColor: vars.color.white,
  cursor: 'pointer',
  padding: `0.2rem ${vars.space.s3}`,
  color: vars.color.primary,
  ...vars.typography.caption,
  selectors: {
    '&:hover:not(:disabled)': { backgroundColor: vars.color.primaryLight2 },
    '&:disabled': {
      borderColor: vars.color.gray100,
      backgroundColor: vars.color.gray50,
      cursor: 'not-allowed',
      color: vars.color.textLow,
    },
  },
});

// 앞 단계(시작 노드·최종 탈출구)가 안 끝나 지금은 누를 수 없는 상태 — 항목 자체는 계속
// 보여주되, 버튼을 회색으로 바꾸고 라벨에 뭘 먼저 해야 하는지 안내함
export const readinessActionBtnDisabled = style({
  flexShrink: 0,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.pill,
  backgroundColor: vars.color.gray50,
  cursor: 'not-allowed',
  padding: `0.2rem ${vars.space.s3}`,
  color: vars.color.textLow,
  ...vars.typography.caption,
});

// 비활성 버튼이 왜 눌리지 않는지 설명하는 문구 — title 속성은 비활성 버튼에서 포커스를 못 받아
// 스크린리더·키보드 사용자에게 일관되게 노출되지 않으므로, aria-describedby로 항상 연결되는
// 화면에서만 숨긴(시각적으로는 안 보이는) 문구로 대신함
export const readinessDisabledHint = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  clip: 'rect(0, 0, 0, 0)',
});
