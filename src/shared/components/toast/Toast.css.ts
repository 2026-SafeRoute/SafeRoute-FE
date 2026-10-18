import { keyframes } from '@vanilla-extract/css';
import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';

import { vars } from '@styles/global.css';

const slideIn = keyframes({
  from: { transform: 'translateX(110%)', opacity: 0 },
  to: { transform: 'translateX(0)', opacity: 1 },
});

const slideOut = keyframes({
  from: { transform: 'translateX(0)', opacity: 1 },
  to: { transform: 'translateX(110%)', opacity: 0 },
});

const progressShrink = keyframes({
  from: { width: '100%' },
  to: { width: '0%' },
});

export const container = recipe({
  base: {
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-start',
    gap: vars.space.s3,
    border: '1px solid',
    borderRadius: vars.radius.xl,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    // 하단에 진행바(progressBar, 0.3rem 높이)가 absolute로 깔려서 다른 변보다 여백을 더
    // 줬었는데(s6→s5로 줄였다가), 1.6rem(s4)이면 0.3rem 진행바를 가리지 않으면서도 네 변이
    // 전부 동일해 더는 비대칭으로 안 보임
    padding: vars.space.s4,
    width: 'max-content',
    minWidth: 'min(34rem, calc(100vw - 4.8rem))',
    maxWidth: 'min(42rem, calc(100vw - 4.8rem))',
    overflow: 'hidden',
    animationFillMode: 'forwards',
  },
  variants: {
    variant: {
      default: {
        borderColor: vars.color.gray100,
        backgroundColor: vars.color.white,
      },
      success: {
        borderColor: vars.color.success,
        backgroundColor: vars.color.successLight,
      },
      warning: {
        borderColor: vars.color.warning,
        backgroundColor: vars.color.warningLight,
      },
      error: {
        borderColor: vars.color.danger,
        backgroundColor: vars.color.dangerLight,
      },
    },
    leaving: {
      true: {
        animationName: slideOut,
        animationDuration: '280ms',
        animationTimingFunction: 'ease-in',
      },
      false: {
        animationName: slideIn,
        animationDuration: '320ms',
        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
    wide: {
      true: {
        maxWidth: 'min(56rem, calc(100vw - 4.8rem))',
      },
      false: {},
    },
  },
  defaultVariants: { variant: 'default', leaving: false, wide: false },
});

export const iconWrapper = recipe({
  base: {
    flexShrink: 0,
    marginTop: '0.1rem',
    width: '2.4rem',
    height: '2.4rem',
  },
  variants: {
    variant: {
      default: { color: vars.color.gray500 },
      success: { color: vars.color.success },
      warning: { color: vars.color.warning },
      error: { color: vars.color.danger },
    },
  },
  defaultVariants: { variant: 'default' },
});

export const body = style({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: '0.4rem',
  minWidth: 0,
  overflowWrap: 'anywhere',
  wordBreak: 'keep-all',
});

export const title = recipe({
  base: {
    letterSpacing: '-0.02em',
    fontSize: '1.4rem',
    fontWeight: vars.fontWeight.semibold,
  },
  variants: {
    variant: {
      default: { color: vars.color.textHigh },
      success: { color: vars.color.successText },
      warning: { color: vars.color.warningText },
      error: { color: vars.color.dangerText },
    },
  },
  defaultVariants: { variant: 'default' },
});

export const description = recipe({
  base: {
    lineHeight: '1.5',
    letterSpacing: '-0.02em',
    whiteSpace: 'pre-line',
    fontSize: '1.3rem',
  },
  variants: {
    variant: {
      default: { color: vars.color.textMid },
      success: { color: vars.color.successText },
      warning: { color: vars.color.warningText },
      error: { color: vars.color.dangerText },
    },
    noWrap: {
      true: { whiteSpace: 'nowrap' },
      false: {},
    },
  },
  defaultVariants: { variant: 'default', noWrap: false },
});

export const actionButton = recipe({
  base: {
    alignSelf: 'flex-start',
    marginTop: vars.space.s1,
    outline: 'none',
    border: '1px solid currentColor',
    borderRadius: vars.radius.md,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    padding: `${vars.space.s1} ${vars.space.s3}`,
    ...vars.typography.captionMedium,
    selectors: {
      '&:focus-visible': {
        outline: '2px solid currentColor',
        outlineOffset: '2px',
      },
    },
  },
  variants: {
    variant: {
      default: { color: vars.color.textMid },
      success: { color: vars.color.successText },
      warning: { color: vars.color.warningText },
      error: { color: vars.color.dangerText },
    },
  },
  defaultVariants: { variant: 'default' },
});

export const closeButton = recipe({
  base: {
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: vars.radius.md,
    cursor: 'pointer',
    width: '2rem',
    height: '2rem',
  },
  variants: {
    variant: {
      default: {
        color: vars.color.textLow,
        selectors: { '&:hover': { backgroundColor: vars.color.gray50 } },
      },
      success: {
        color: vars.color.successText,
        selectors: { '&:hover': { backgroundColor: `${vars.color.success}20` } },
      },
      warning: {
        color: vars.color.warningText,
        selectors: { '&:hover': { backgroundColor: `${vars.color.warning}20` } },
      },
      error: {
        color: vars.color.dangerText,
        selectors: { '&:hover': { backgroundColor: `${vars.color.danger}20` } },
      },
    },
  },
  defaultVariants: { variant: 'default' },
});

export const progressBar = style({
  position: 'absolute',
  bottom: 0,
  left: 0,
  height: '0.3rem',
  animationName: progressShrink,
  animationTimingFunction: 'linear',
  animationFillMode: 'forwards',
});

export const progressBarVariant = recipe({
  base: {},
  variants: {
    variant: {
      default: { backgroundColor: vars.color.gray300 },
      success: { backgroundColor: vars.color.success },
      warning: { backgroundColor: vars.color.warning },
      error: { backgroundColor: vars.color.danger },
    },
  },
  defaultVariants: { variant: 'default' },
});
