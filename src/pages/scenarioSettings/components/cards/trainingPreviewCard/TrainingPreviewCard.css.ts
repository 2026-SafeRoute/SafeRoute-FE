import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';

import { sectionCardBase } from '@pages/scenarioSettings/ScenarioSettingsPage.css';

import { vars } from '@styles/global.css';

export const card = style([
  sectionCardBase,
  {
    padding: vars.space.s5,
  },
]);

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.s3,
});

export const metricList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s3,
  marginTop: vars.space.s4,
});

export const metricRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.s3,
});

export const metricLabel = style({
  color: vars.color.textMid,
  ...vars.typography.body14,
});

export const metricValue = recipe({
  base: vars.typography.body14Bold,
  variants: {
    tone: {
      default: { color: vars.color.textHigh },
      danger: { color: vars.color.dangerText },
    },
  },
  defaultVariants: { tone: 'default' },
});

export const divider = style({
  backgroundColor: vars.color.gray100,
  width: '100%',
  height: '1px',
});

export const warningBox = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s1,
  marginTop: vars.space.s4,
  border: `1px solid ${vars.color.warning}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.warningSurface,
  padding: `${vars.space.s2} ${vars.space.s3}`,
  ...vars.typography.caption,
  color: vars.color.warningText,
});

export const warningLink = style({
  cursor: 'pointer',
  width: 'fit-content',
  color: vars.color.primary,
  ...vars.typography.captionBold,
  selectors: {
    '&:hover': { textDecoration: 'underline' },
  },
});

export const description = style({
  color: vars.color.textLow,
  ...vars.typography.caption,
});
