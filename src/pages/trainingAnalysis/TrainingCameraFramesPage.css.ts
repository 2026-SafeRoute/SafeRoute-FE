import { style } from '@vanilla-extract/css';

import { vars } from '@styles/global.css';
import { contentBreakpoints, pageContent } from '@styles/responsive.css';

export const container = style([
  pageContent,
  {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: vars.space.s4,
    paddingBlock: `${vars.space.s4} ${vars.layout.pageGutter}`,
    overflow: 'auto',
    // 스크롤은 그대로 되지만 오른쪽 스크롤바만 안 보이게 함
    scrollbarWidth: 'none',
    selectors: {
      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },
  },
]);

// 사이드바(카메라 목록)·뷰어·우측 패널을 나란히 두는 틀만 여기서 잡음 — 배경은 각 영역이
// 알아서 관리함(뷰어·필름스트립은 영상이라 어둡게, 사이드바·우측 패널은 앱의 다른 화면과
// 같은 밝은 카드 톤으로). 전체를 하나의 어두운 캔버스로 묶어봤다가 정보 카드까지 다 어두워져
// 가독성이 떨어진다는 피드백을 받고 되돌림
export const consolePanel = style({
  display: 'grid',
  gridTemplateColumns: '25rem minmax(0, 1fr) 30rem',
  alignItems: 'start',
  gap: vars.space.s5,
  minWidth: 0,
  '@container': {
    [`(max-width: ${contentBreakpoints.threePanel})`]: {
      gridTemplateColumns: '25rem minmax(0, 1fr)',
    },
    [`(max-width: ${contentBreakpoints.compact})`]: {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
});

export const viewerCol = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s4,
  minWidth: 0,
});

/* 프레임 뷰어 — 목록 화면의 카드 썸네일(16:9, 그리드 한 칸 폭)보다 이 화면이 실제로 "보는" 데
   전념하는 화면이니 눈에 띄게 커야 함. 이전엔 maxWidth로 눌러놨는데 그러면 카드 썸네일이랑
   체감 크기 차이가 잘 안 남 — 가운데 열 폭을 그대로 다 씀(대신 세로로 과하게 길어지지 않도록
   maxHeight로만 상한을 둠). 영상이 실제로 나오는 자리라 검정 배경은 그대로 유지함(영상 플레이어의
   일반적인 관례이고, 주변이 밝아도 이 박스만 어두운 건 자연스러움) */
export const viewer = style({
  aspectRatio: '16 / 9',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.lg,
  backgroundColor: '#000000',
  width: '100%',
  maxHeight: '60rem',
  overflow: 'hidden',
});

export const viewerImg = style({
  objectFit: 'contain',
  width: '100%',
  height: '100%',
});

export const liveBadge = style({
  position: 'absolute',
  bottom: vars.space.s3,
  left: vars.space.s3,
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  borderRadius: vars.radius.sm,
  backgroundColor: 'rgba(0,0,0,0.5)',
  padding: '0.4rem 0.9rem',
  color: '#F87171',
  ...vars.typography.captionBold,
});

export const liveDot = style({
  borderRadius: '50%',
  backgroundColor: '#F87171',
  width: '0.7rem',
  height: '0.7rem',
});

export const viewerTime = style({
  position: 'absolute',
  top: vars.space.s3,
  left: vars.space.s3,
  borderRadius: vars.radius.sm,
  backgroundColor: 'rgba(0,0,0,0.5)',
  padding: '0.4rem 1rem',
  color: 'rgba(255,255,255,0.85)',
  ...vars.typography.caption,
});

export const viewerIndex = style({
  position: 'absolute',
  top: vars.space.s3,
  right: vars.space.s3,
  borderRadius: vars.radius.sm,
  backgroundColor: 'rgba(0,0,0,0.5)',
  padding: '0.4rem 1rem',
  color: 'rgba(255,255,255,0.85)',
  ...vars.typography.captionBold,
});

export const navBtn = style({
  position: 'absolute',
  top: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transform: 'translateY(-50%)',
  transition: 'background 0.15s',
  border: 'none',
  borderRadius: '50%',
  backgroundColor: 'rgba(255,255,255,0.1)',
  cursor: 'pointer',
  width: '4rem',
  height: '4rem',
  color: vars.color.white,
  selectors: {
    '&:hover:not(:disabled)': {
      backgroundColor: 'rgba(255,255,255,0.18)',
    },
    '&:disabled': {
      opacity: 0.3,
      cursor: 'default',
    },
  },
});

export const navIconPrev = style({
  transform: 'scaleX(-1)',
});

/* 지표 3종 — 영상이 아니라 수치 데이터라 우측 패널과 같은 밝은 카드 톤으로 둠 */
export const statRow = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: vars.space.s3,
});

export const statBox = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem',
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.lg,
  backgroundColor: vars.color.white,
  padding: vars.space.s5,
});

export const statLabel = style({
  color: vars.color.textLow,
  ...vars.typography.body14,
});

export const statValue = style({
  color: vars.color.textHigh,
  ...vars.typography.h4,
});

export const statSub = style({
  color: vars.color.textLow,
  ...vars.typography.body14,
});

/* 프레임 탐색 — 뷰어 바로 아래 이어지는 영상 타임라인이라 뷰어와 같은 어두운 톤을 유지함 */
export const filmstripSection = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.s2,
  minWidth: 0,
});

export const filmstripNavBtn = style({
  display: 'flex',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: '50%',
  backgroundColor: vars.color.gray900,
  cursor: 'pointer',
  width: '3.2rem',
  height: '3.2rem',
  color: vars.color.white,
  selectors: {
    '&:hover': { backgroundColor: vars.color.gray700 },
  },
});

// justify-content: center로 하면 20개가 넘쳐서 스크롤이 필요할 때 시작 쪽(왼쪽) 프레임이
// 스크롤로 닿지 않는 브라우저 동작이 있어서 뺐음(오버플로우 상태에서 center/end 정렬은
// 시작 쪽 스크롤 가능 영역이 없어지는 크로미움 이슈) — 넘치지 않을 때만 자연스레 왼쪽 정렬됨
export const filmstrip = style({
  display: 'flex',
  flex: 1,
  gap: vars.space.s2,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.gray900,
  padding: '0.6rem',
  minWidth: 0,
  overflowX: 'auto',
  scrollbarWidth: 'none',
  selectors: {
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
});

export const filmstripItem = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'outline-color 0.15s, box-shadow 0.15s',
  outline: `3px solid transparent`,
  outlineOffset: '-3px',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.gray700,
  cursor: 'pointer',
  width: '11rem',
  height: '7rem',
});

// 어두운 썸네일 위에서도 또렷이 보이도록 outline(진한 파랑) + 바깥쪽 은은한 링(box-shadow)을 같이 줌
export const filmstripItemActive = style({
  outlineColor: vars.color.primary,
  boxShadow: `0 0 0 2px ${vars.color.primaryLight}`,
});

export const filmstripThumb = style({
  position: 'absolute',
  inset: 0,
  borderRadius: vars.radius.md,
  objectFit: 'cover',
  width: '100%',
  height: '100%',
});

export const filmstripIndex = style({
  position: 'absolute',
  top: '0.5rem',
  right: '0.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  backgroundColor: 'rgba(0,0,0,0.55)',
  width: '1.8rem',
  height: '1.8rem',
  lineHeight: 1,
  color: 'rgba(255,255,255,0.9)',
  fontSize: '1rem',
  fontWeight: vars.fontWeight.semibold,
});

export const filmstripAlert = style({
  color: '#F59E0B',
});

export const filmstripAlertDanger = style({
  color: vars.color.danger,
});

export const filmstripTime = style({
  position: 'absolute',
  bottom: '0.4rem',
  color: 'rgba(255,255,255,0.7)',
  ...vars.typography.caption,
});

/* 우측 패널 — 세션·이벤트 정보는 영상이 아니라 텍스트 데이터라, 앱의 다른 화면과 같은
   밝은 카드 톤을 그대로 씀(어두운 캔버스에 묶었더니 오히려 안 읽힌다는 피드백 반영) */
export const rightCol = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s4,
  minWidth: 0,
  '@container': {
    [`(max-width: ${contentBreakpoints.threePanel})`]: { gridColumn: '1 / -1' },
  },
});

export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s3,
  border: `1px solid ${vars.color.gray100}`,
  borderRadius: vars.radius.lg,
  backgroundColor: vars.color.white,
  padding: vars.space.s5,
});

export const panelTitle = style({
  color: vars.color.textHigh,
  ...vars.typography.body14Bold,
});

export const infoRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const infoKey = style({
  color: vars.color.textLow,
  ...vars.typography.body14,
});

export const infoValue = style({
  color: vars.color.textHigh,
  ...vars.typography.body14Bold,
});

// 이벤트가 쌓일수록 패널이 끝없이 길어져 페이지 전체가 늘어지던 문제 — 높이를 고정하고
// 목록 안에서만 스크롤되게 함
export const timelineList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.s3,
  paddingRight: vars.space.s2,
  maxHeight: '28rem',
  overflowY: 'auto',
});

export const timelineItem = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space.s2,
});

export const timelineDot = style({
  flexShrink: 0,
  marginTop: '0.4rem',
  borderRadius: '50%',
  width: '0.8rem',
  height: '0.8rem',
});

export const timelineBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem',
});

export const timelineLabel = style({
  color: vars.color.textHigh,
  ...vars.typography.body14,
});

export const timelineMeta = style({
  color: vars.color.textLow,
  ...vars.typography.caption,
});
