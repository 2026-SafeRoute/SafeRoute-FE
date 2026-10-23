import { style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';

export const wideModal = style({
  maxWidth: '90rem',
});

export const footer = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.s3,
  width: '100%',
});

export const cancelButton = style({
  flex: '1 1 16rem',
});

export const confirmButton = style({
  flex: '2 1 16rem',
});

export const preview = style({
  position: 'relative',
  borderRadius: vars.radius.lg,
  backgroundColor: vars.color.gray50,
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'contain',
  width: '100%',
  height: '40rem',
  overflow: 'hidden',
});

export const previewEmpty = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
});

export const gridOverlay = style({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
});

export const toolbar = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.s6,
  marginTop: vars.space.s4,
  borderTop: `1px solid ${vars.color.gray100}`,
  paddingTop: vars.space.s4,
});

export const dimensionFields = style({
  display: 'flex',
  gap: vars.space.s4,
});

export const areaField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s2,
});

export const fieldLabel = style({
  color: vars.color.textHigh,
  ...vars.typography.body14Medium,
});

export const areaInputShell = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.s1,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.md,
  padding: `${vars.space.s2} ${vars.space.s3}`,
  width: '16rem',
});

export const areaInput = style({
  flex: 1,
  outline: 'none',
  border: 'none',
  minWidth: 0,
  ...vars.typography.body14,
  color: vars.color.textHigh,
});

export const areaUnit = style({
  color: vars.color.textLow,
  ...vars.typography.body14,
});

export const divider = style({
  alignSelf: 'stretch',
  borderLeft: `1px solid ${vars.color.gray100}`,
});

export const scaleField = style({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: vars.space.s2,
  minWidth: '20rem',
});

export const scaleLabelRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const scaleValue = style({
  color: vars.color.primary,
  ...vars.typography.body14Medium,
});

export const scaleSlider = style({
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
