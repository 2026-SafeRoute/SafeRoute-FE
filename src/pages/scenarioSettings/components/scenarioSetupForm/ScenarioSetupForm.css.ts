import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s4,
  minWidth: 0,
});

export const conditionFields = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: vars.space.s4,
  marginTop: vars.space.s4,
});

export const conditionFieldsSingle = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  marginTop: vars.space.s4,
  width: '100%',
  maxWidth: '32rem',
});

export const lockedSetup = style({
  marginTop: vars.space.s5,
  borderTop: `1px solid ${vars.color.gray100}`,
  paddingTop: vars.space.s5,
});

export const lockedSetupCard = style({
  border: `1px solid ${vars.color.gray200}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.gray25,
  padding: vars.space.s4,
});

export const lockedSetupDescription = style({
  marginTop: vars.space.s1,
  color: vars.color.textLow,
  ...vars.typography.body14,
});

export const setupHeading = style({
  marginTop: vars.space.s5,
  borderTop: `1px solid ${vars.color.gray100}`,
  paddingTop: vars.space.s5,
});

export const fireLocationLabel = style({
  color: vars.color.textHigh,
  ...vars.typography.body16Bold,
});

export const setupDescription = style({
  marginTop: vars.space.s1,
  color: vars.color.textMid,
  ...vars.typography.body14,
});

export const setupSteps = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: vars.space.s2,
  marginTop: vars.space.s3,
  marginBottom: vars.space.s2,
});

const setupStepBase = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space.s2,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.md,
  padding: vars.space.s3,
});

export const setupStep = styleVariants({
  active: [
    setupStepBase,
    { borderColor: vars.color.primary, backgroundColor: vars.color.primaryLight2 },
  ],
  blocked: [setupStepBase, { borderColor: vars.color.gray200, backgroundColor: vars.color.gray25 }],
  complete: [
    setupStepBase,
    { borderColor: vars.color.success, backgroundColor: vars.color.successLight },
  ],
  pending: [setupStepBase, { backgroundColor: vars.color.gray25 }],
});

const stepNumberBase = style({
  display: 'inline-flex',
  flex: '0 0 auto',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.pill,
  backgroundColor: vars.color.gray200,
  width: '2.4rem',
  height: '2.4rem',
  color: vars.color.textMid,
  ...vars.typography.captionBold,
});

export const stepNumber = styleVariants({
  active: [stepNumberBase, { backgroundColor: vars.color.primary, color: vars.color.white }],
  blocked: [stepNumberBase],
  complete: [stepNumberBase, { backgroundColor: vars.color.success, color: vars.color.white }],
  pending: [stepNumberBase],
});

export const stepTitle = style({
  display: 'block',
  color: vars.color.textHigh,
  ...vars.typography.body14Bold,
});

export const stepDescription = style({
  marginTop: '0.2rem',
  color: vars.color.textLow,
  ...vars.typography.caption,
});

export const setupNotice = style({
  marginTop: vars.space.s3,
  color: vars.color.textLow,
  ...vars.typography.body14,
});

export const setupMapWrapper = style({
  position: 'relative',
});

export const setupMapBlocker = style({
  position: 'absolute',
  zIndex: 1,
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.lg,
  backgroundColor: `color-mix(in srgb, ${vars.color.white} 72%, transparent)`,
  cursor: 'not-allowed',
});

export const setupMapBlockerMessage = style({
  border: `1px solid ${vars.color.gray200}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.white,
  padding: `${vars.space.s2} ${vars.space.s3}`,
  textAlign: 'center',
  color: vars.color.textMid,
  ...vars.typography.body14Medium,
});

export const setupButton = style({
  display: 'block',
  marginTop: vars.space.s3,
  marginLeft: 'auto',
});
