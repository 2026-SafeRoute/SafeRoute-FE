import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';

import { vars } from '@styles/global.css';

export const container = style({
  position: 'relative',
  display: 'inline-block',
});

export const containerFullWidth = style({
  display: 'block',
  width: '100%',
});

export const trigger = recipe({
  base: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: vars.space.s2,
    border: `1px solid ${vars.color.gray100}`,
    backgroundColor: vars.color.white,
    cursor: 'pointer',
    padding: `${vars.space.s2} ${vars.space.s3} ${vars.space.s2} ${vars.space.s4}`,
    minWidth: '14rem',
    color: vars.color.textHigh,
    ...vars.typography.body14Medium,
    selectors: {
      '&:hover': { borderColor: vars.color.primary },
      '&[aria-expanded="true"]': { borderColor: vars.color.primary },
    },
  },
  variants: {
    shape: {
      pill: { borderRadius: vars.radius.pill },
      rounded: { borderRadius: vars.radius.md },
    },
    size: {
      md: {},
      lg: { height: '4.4rem' },
    },
    disabled: {
      true: {
        opacity: 0.4,
        cursor: 'not-allowed',
        selectors: {
          '&:hover': { borderColor: vars.color.gray100 },
        },
      },
    },
    fullWidth: {
      // 기본 minWidth(14rem)가 그대로 남아있으면 컨테이너가 140px보다 좁을 때 트리거/패널이
      // 넘침 — width:100%와 함께 minWidth도 풀어줌(코드래빗 리뷰 반영)
      true: { width: '100%', minWidth: 0 },
    },
  },
});

export const chevron = style({
  flexShrink: 0,
  transition: 'transform 0.15s ease',
  color: vars.color.textMid,
  selectors: {
    '[aria-expanded="true"] &': { transform: 'rotate(180deg)' },
  },
});

export const panel = style({
  // document.body에 포탈로 렌더링되고 top/left/width(+maxHeight)는 인라인 스타일(뷰포트 좌표)로
  // 정해짐 — 모달 등 overflow: hidden 조상 안에서 열려도 잘리지 않게 함.
  // maxHeight 없이 overflow: hidden만 있으면 옵션이 많을 때 화면 아래로 넘친 항목이 스크롤도
  // 안 되고 그냥 안 보여서 "목록에 없다"고 오해하기 쉬웠음(코드래빗 아님, 실사용 버그 리포트) —
  // 세로 공간이 부족하면 트리거 위로 뒤집어 열리도록 이제 JS에서 maxHeight를 계산해 내려줌
  position: 'fixed',
  zIndex: 200,
  borderRadius: vars.radius.lg,
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
  backgroundColor: vars.color.white,
  padding: 0,
  minWidth: 'min(18rem, calc(100vw - 3.2rem))',
  overflowY: 'auto',
});

export const option = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.s3,
  cursor: 'pointer',
  padding: `${vars.space.s3} ${vars.space.s4}`,
  color: vars.color.textHigh,
  ...vars.typography.body14,
  selectors: {
    '&:hover': { backgroundColor: vars.color.primaryLight2 },
    '&[data-active="true"]': { backgroundColor: vars.color.primaryLight2 },
    '&[aria-selected="true"]': {
      backgroundColor: vars.color.primaryLight,
      color: vars.color.primary,
      fontWeight: vars.fontWeight.medium,
    },
  },
});

export const checkIcon = style({
  flexShrink: 0,
  color: vars.color.primary,
});
