import { globalStyle, style } from '@vanilla-extract/css';

import { sectionCardBase } from '@pages/scenarioSettings/ScenarioSettingsPage.css';

import { vars } from '@styles/global.css';

export const trainingActions = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.s2,
});

export const forceEndLink = style({
  border: 0,
  background: 'none',
  cursor: 'pointer',
  padding: 0,
  textDecoration: 'underline',
  color: vars.color.textLow,
  textUnderlineOffset: '0.2rem',
  ...vars.typography.caption,
  selectors: {
    '&:hover:not(:disabled)': {
      color: vars.color.danger,
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
});

export const elapsedTimer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `0 ${vars.space.s5}`,
  minHeight: '4rem',
});

export const timerLabel = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.s2,
  color: vars.color.textMid,
  ...vars.typography.body14,
});

export const dangerDot = style({
  borderRadius: '50%',
  backgroundColor: vars.color.danger,
  width: '0.8rem',
  height: '0.8rem',
});

export const timerValue = style({
  color: vars.color.textHigh,
  ...vars.typography.body16Bold,
});

export const durationNotice = style({
  marginTop: `-${vars.space.s2}`,
  padding: `0 ${vars.space.s5}`,
  color: vars.color.textLow,
  ...vars.typography.caption,
});

export const proposalCard = style([
  sectionCardBase,
  {
    borderColor: vars.color.warningStrong,
    backgroundColor: vars.color.warningSurface,
    padding: vars.space.s5,
  },
]);

export const proposalHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.s3,
});

export const proposalTitle = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.s2,
  color: vars.color.textHigh,
  ...vars.typography.body14Bold,
});

export const warningDot = style({
  borderRadius: '50%',
  backgroundColor: vars.color.warningStrong,
  width: '0.8rem',
  height: '0.8rem',
});

export const proposalMessage = style({
  marginTop: vars.space.s2,
  minHeight: '3.6rem',
  color: vars.color.textMid,
  ...vars.typography.body14,
});

export const routeComparison = style({
  display: 'grid',
  gap: vars.space.s2,
  marginTop: vars.space.s3,
  marginBottom: 0,
});

globalStyle(`${routeComparison} > div`, {
  display: 'grid',
  gridTemplateColumns: '3.2rem 1fr',
  gap: vars.space.s2,
});

globalStyle(`${routeComparison} dt`, {
  color: vars.color.textLow,
  ...vars.typography.caption,
});

globalStyle(`${routeComparison} dd`, {
  margin: 0,
  color: vars.color.textMid,
  ...vars.typography.caption,
});

export const proposalActions = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1.08fr',
  gap: vars.space.s2,
  marginTop: vars.space.s3,
});

export const lockNotice = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.gray25,
  padding: vars.space.s3,
  minHeight: '4.4rem',
  textAlign: 'center',
  color: vars.color.textLow,
  ...vars.typography.caption,
});
