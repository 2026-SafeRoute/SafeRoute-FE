import { style } from '@vanilla-extract/css';

/* ── 전체 레이아웃 ── */
// 폭 상한을 뒀었는데 그러면 큰 화면에서 좌우로 회색 여백만 생기고 정작 캔버스는 안 넓어짐
// (되돌림) — 범례·팝업이 도면과 동떨어져 보이는 문제는 그 둘을 각각 접을 수 있게 하거나
// 캔버스 밖으로 옮기는 쪽으로 해결함(범례는 인포 아이콘 팝오버로, 팝업은 좌측 사이드바로 이동)
export const layout = style({
  display: 'flex',
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
});
