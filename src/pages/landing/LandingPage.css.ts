import { globalStyle, style, styleVariants } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  background: vars.gradient.landing,
  minHeight: '100vh',
  color: vars.color.textHigh,
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${vars.color.gray100}`,
  backgroundColor: vars.color.white,
  padding: `0 clamp(${vars.space.s6}, 4vw, ${vars.space.s18})`,
  height: '7.2rem',
});

export const brand = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.s3,
  color: vars.color.gray900,
  ...vars.typography.h4,
});

export const logoIcon = style({
  width: vars.space.s7,
  height: vars.space.s7,
});

export const authActions = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: vars.space.s3,
});

export const loginButton = style({
  '@media': {
    '(max-width: 560px)': {
      display: 'none',
    },
  },
});

export const main = style({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  alignItems: 'center',
  padding: `0 clamp(${vars.space.s5}, 4vw, ${vars.space.s18})`,
  width: '100%',
  '@media': {
    '(max-width: 560px)': {
      padding: `0 ${vars.space.s4}`,
    },
  },
});

export const hero = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingTop: vars.space.s20,
  textAlign: 'center',
});

export const badge = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.pill,
  backgroundColor: vars.color.primaryLight,
  padding: `0 ${vars.space.s3}`,
  height: vars.space.s6,
  color: vars.color.infoText,
  ...vars.typography.captionBold,
});

export const title = style({
  marginTop: vars.space.s3,
  color: vars.color.gray900,
  ...vars.typography.h1Landing,
});

export const description = style({
  marginTop: vars.space.s6,
  color: vars.color.gray500,
  ...vars.typography.body16,
});

export const ctaGroup = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.s3,
  marginTop: vars.space.s8,
});

const ctaBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.s2,
  borderRadius: vars.radius.md,
  padding: `0 ${vars.space.s6}`,
  height: vars.space.s12,
  ...vars.typography.body14Bold,
});

export const primaryCta = style([
  ctaBase,
  {
    backgroundColor: vars.color.primary,
    color: vars.color.white,
    selectors: {
      '&:hover': {
        backgroundColor: vars.color.primaryHover,
      },
    },
  },
]);

globalStyle(`${primaryCta} svg`, {
  width: vars.space.s4,
  height: vars.space.s4,
});

export const featureGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: vars.space.s4,
  marginTop: vars.space.s20,
  paddingBottom: vars.space.s18,
  width: 'min(100%, 110rem)',
});

export const featureCard = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.s5,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.sm,
  backgroundColor: vars.color.white,
  padding: `${vars.space.s5} ${vars.space.s6}`,
  minHeight: '9rem',
});

const iconBoxBase = style({
  display: 'inline-flex',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.md,
  width: vars.space.s12,
  height: vars.space.s12,
});

export const iconBox = styleVariants({
  blue: [
    iconBoxBase,
    {
      backgroundColor: vars.color.primaryLight,
      color: vars.color.primary,
    },
  ],
  green: [
    iconBoxBase,
    {
      backgroundColor: vars.color.successLight,
      color: vars.color.success,
    },
  ],
  purple: [
    iconBoxBase,
    {
      backgroundColor: vars.color.purpleLight,
      color: vars.color.purple,
    },
  ],
  yellow: [
    iconBoxBase,
    {
      backgroundColor: vars.color.warningLight,
      color: vars.color.warning,
    },
  ],
});

globalStyle(`${iconBoxBase} svg`, {
  width: vars.space.s5,
  height: vars.space.s5,
});

globalStyle(`${iconBoxBase} svg path`, {
  stroke: 'currentColor',
});

export const featureText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s2,
  minWidth: 0,
});

globalStyle(`${featureText} h2`, {
  color: vars.color.gray900,
  ...vars.typography.body16Bold,
});

globalStyle(`${featureText} p`, {
  color: vars.color.gray500,
  ...vars.typography.captionMedium,
});

export const footer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderTop: `1px solid ${vars.color.gray100}`,
  padding: `0 clamp(${vars.space.s6}, 4vw, ${vars.space.s18})`,
  minHeight: vars.space.s14,
  color: vars.color.textLow,
  ...vars.typography.captionMedium,
});
