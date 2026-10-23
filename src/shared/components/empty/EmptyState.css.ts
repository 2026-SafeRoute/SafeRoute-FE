import { globalStyle, style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.s5,
  textAlign: 'center',
});

// 캔버스/뷰어 안 인라인 빈 상태용 — 카드 레이아웃 없이 좁은 공간에 바로 얹는 크기
export const containerCompact = style({
  gap: vars.space.s2,
});

export const icon = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  backgroundColor: vars.color.primaryLight2,
  width: vars.space.s15,
  height: vars.space.s15,
  color: vars.color.primary,
});

globalStyle(`${icon} svg`, {
  width: vars.space.s7,
  height: vars.space.s7,
});

export const iconCompact = style({
  width: vars.space.s12,
  height: vars.space.s12,
});

globalStyle(`${icon}${iconCompact} svg`, {
  width: vars.space.s5,
  height: vars.space.s5,
});

// 어두운 뷰어 배경(훈련 모니터링 프레임 뷰어 등) 위에 올릴 때 — 기존 다크 오버레이 톤과 동일
export const iconDark = style({
  backgroundColor: 'rgba(255,255,255,0.1)',
  color: vars.color.white,
});

export const text = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.s2,
});

export const title = style({
  color: vars.color.textHigh,
  ...vars.typography.h4,
});

export const titleCompact = style({
  ...vars.typography.body14Bold,
});

export const titleDark = style({
  color: vars.color.textInverseHigh,
});

export const description = style({
  color: vars.color.textLow,
  ...vars.typography.body14,
});

export const descriptionCompact = style({
  ...vars.typography.caption,
});

export const descriptionDark = style({
  color: vars.color.textInverseLow,
});
