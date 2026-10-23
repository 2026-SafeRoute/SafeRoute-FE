import { globalStyle, style, styleVariants } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';
import { cardGrid, contentBreakpoints } from '@styles/responsive.css';

import { sectionCardBase } from '../../HomePage.css';

const summaryCardBase = style([
  sectionCardBase,
  {
    borderRadius: vars.radius.lg,
  },
]);

// 지표가 3 + 1로 고아 카드처럼 남는 구간은 균형 잡힌 2 × 2로 묶는다.
export const summaryGrid = style([
  cardGrid,
  {
    '@container': {
      [`(max-width: ${contentBreakpoints.wide})`]: {
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      },
    },
  },
]);

export const metricCard = style([
  summaryCardBase,
  {
    padding: '2.1rem',
    minHeight: '15.9rem',
  },
]);

export const metricIcon = styleVariants({
  blue: {
    backgroundColor: vars.color.primaryLight2,
    color: vars.color.primary,
  },
  yellow: {
    backgroundColor: vars.color.warningLight,
    color: vars.color.warning,
  },
  green: {
    backgroundColor: vars.color.successLight,
    color: vars.color.success,
  },
  purple: {
    backgroundColor: vars.color.purpleLight,
    color: vars.color.purple,
  },
});

export const metricIconBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '1.4rem',
  borderRadius: '1rem',
  width: '4rem',
  height: '4rem',
});

globalStyle(`${metricIconBase} svg`, {
  width: '2rem',
  height: '2rem',
});

export const metricValueRow = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: '0.2rem',
  marginBottom: vars.space.s1,
});

export const metricValue = style({
  color: vars.color.gray900,
  ...vars.typography.titleBold28,
});

export const metricSuffix = style({
  color: vars.color.gray700,
  ...vars.typography.body14,
});

export const metricTitle = style({
  color: vars.color.textMid,
  ...vars.typography.body14,
});
