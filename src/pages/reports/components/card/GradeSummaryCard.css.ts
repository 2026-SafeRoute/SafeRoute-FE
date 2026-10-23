import { style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';

import { card } from './ReportCard.css';

export const gradeCard = style([
  card,
  {
    display: 'flex',
    flexDirection: 'column',
    background: vars.gradient.reportGrade,
    padding: vars.space.s7,
    minHeight: '29rem',
    color: vars.color.textInverse,
  },
]);

export const grade = style({
  marginTop: vars.space.s1,
  color: vars.color.textInverse,
  ...vars.typography.reportGrade,
});

export const summary = style({
  marginTop: vars.space.s3,
  color: vars.color.textInverseHigh,
  ...vars.typography.body16,
});
