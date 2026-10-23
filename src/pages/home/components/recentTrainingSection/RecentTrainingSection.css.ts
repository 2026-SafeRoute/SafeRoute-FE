import { globalStyle, style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';

import { vars } from '@styles/global.css';

import { sectionCardBase } from '../../HomePage.css';

export const recordsSection = style([
  sectionCardBase,
  {
    display: 'flex',
    flexDirection: 'column',
    gridArea: 'records',
    borderRadius: '2rem',
    padding: 0,
    minWidth: 0,
    minHeight: '69rem',
    overflow: 'hidden',
  },
]);

// 좁은 본문에서는 표의 열 폭을 희생하지 않고 카드 내부만 가로 스크롤
export const tableScroll = style({ minWidth: 0, overflowX: 'auto' });

export const sectionHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '2rem 2.4rem',
});

export const sectionTitle = style({
  color: vars.color.textHigh,
  ...vars.typography.titleBold,
});

export const headerAction = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.s1,
  color: vars.color.primary,
  ...vars.typography.body14Medium,
});

export const headerActionButton = style([
  headerAction,
  {
    border: 'none',
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    padding: 0,
    height: 'auto',
    minHeight: 'auto',
    selectors: {
      '&&:hover:not(:disabled)': {
        border: 'none',
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        color: vars.color.primaryHover,
      },
    },
  },
]);

export const recordsTable = style({
  width: '100%',
  minWidth: '72rem',
  tableLayout: 'fixed',
  borderCollapse: 'collapse',
});

export const tableRow = recipe({
  base: {
    position: 'relative',
    transition: `background-color 150ms ease, box-shadow 150ms ease`,
  },
  variants: {
    interactive: {
      true: {
        cursor: 'pointer',
        selectors: {
          '&:hover': { backgroundColor: vars.color.primaryLight2 },
          '&:focus-within': {
            outline: 'none',
            boxShadow: `inset 0 0 0 2px ${vars.color.primary}`,
          },
        },
      },
      false: {},
    },
  },
  defaultVariants: { interactive: false },
});

export const reportButton = style({
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
  padding: 0,
  color: 'inherit',
  font: 'inherit',
  fontWeight: 'inherit',
  selectors: {
    '&:focus-visible': { outline: 'none' },
    '&::after': {
      position: 'absolute',
      inset: 0,
      content: '',
    },
  },
});

globalStyle(`${recordsTable} th:nth-child(1)`, { width: '30%' });
globalStyle(`${recordsTable} th:nth-child(2)`, { width: '18%' });
globalStyle(`${recordsTable} th:nth-child(3)`, { width: '11%' });
globalStyle(`${recordsTable} th:nth-child(4)`, { width: '15%' });
globalStyle(`${recordsTable} th:nth-child(5)`, { width: '14%' });
globalStyle(`${recordsTable} th:nth-child(6)`, { width: '12%' });

export const tableHeadCell = style({
  borderTop: `1px solid ${vars.color.gray100}`,
  borderBottom: `1px solid ${vars.color.gray100}`,
  backgroundColor: vars.color.gray25,
  padding: '1.2rem 2rem',
  color: vars.color.textMid,
  ...vars.typography.captionBold,
});

export const tableCell = recipe({
  base: {
    borderBottom: `1px solid ${vars.color.gray100}`,
    padding: '1.7rem 2rem',
    textAlign: 'center',
    ...vars.typography.body14,
    color: vars.color.textHigh,
  },
  variants: {
    tone: {
      default: {},
      emphasis: {
        color: vars.color.textHigh,
        fontWeight: vars.fontWeight.bold,
      },
      date: {
        color: vars.color.textMid,
      },
    },
  },
  defaultVariants: {
    tone: 'default',
  },
});

export const emptyState = style({
  flex: 1,
  borderTop: `1px solid ${vars.color.gray100}`,
  padding: vars.space.s6,
});
