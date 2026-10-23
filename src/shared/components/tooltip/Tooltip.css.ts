import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';

import { vars } from '@styles/global.css';

export const trigger = style({
  position: 'relative',
  display: 'inline-flex',
});

export const fullWidthTrigger = style({
  width: '100%',
});

export const content = recipe({
  base: {
    position: 'absolute',
    zIndex: 300,
    transform: 'translateY(0.4rem)',
    transition: 'opacity 120ms ease, transform 120ms ease, visibility 120ms ease',
    visibility: 'hidden',
    opacity: 0,
    borderRadius: vars.radius.sm,
    boxShadow: vars.shadow.md,
    backgroundColor: vars.color.gray700,
    pointerEvents: 'none',
    padding: `${vars.space.s2} ${vars.space.s3}`,
    width: 'max-content',
    maxWidth: '24rem',
    textAlign: 'center',
    color: vars.color.white,
    ...vars.typography.caption,
    selectors: {
      [`${trigger}:hover &`]: {
        transform: 'translate(0, 0)',
        visibility: 'visible',
        opacity: 1,
      },
      [`${trigger} > :focus-visible + &`]: {
        transform: 'translate(0, 0)',
        visibility: 'visible',
        opacity: 1,
      },
    },
    '@media': {
      '(prefers-reduced-motion: reduce)': { transition: 'none' },
    },
  },
  variants: {
    placement: {
      top: {
        right: 0,
        bottom: 'calc(100% + 0.8rem)',
      },
      right: {
        top: '50%',
        left: 'calc(100% + 0.8rem)',
        transform: 'translate(-0.4rem, -50%)',
        selectors: {
          [`${trigger}:hover &`]: { transform: 'translate(0, -50%)' },
          [`${trigger} > :focus-visible + &`]: { transform: 'translate(0, -50%)' },
        },
      },
    },
  },
});
