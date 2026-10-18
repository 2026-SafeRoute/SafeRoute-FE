import { vars } from '@styles/global.css';

// 노드/장비 종류별 대표 색상 — TSX(SVG fill·DEVICE_PLACE_CONFIG)와 CSS(vanilla-extract 점 색상)
// 양쪽에서 같은 값을 써야 범례 점과 실제 도면 마커 색이 어긋나지 않음. SVG의 fill 속성은
// vanilla-extract 클래스를 쓸 수 없어 클래스가 아닌 상수로 공유함(코드래빗 리뷰 반영)
export const DEVICE_COLOR = {
  cctv: vars.color.purple,
  // 계단과 같은 주황 계열이라 구분이 안 된다는 피드백 — 노란색으로 분리
  light: '#eab308',
  door: vars.color.primary,
  stair: vars.color.orange,
  hallway: '#0891b2',
  // "시작 노드"가 아니라 "시작 후보"로 부름 — 실제 훈련 시작점 확정은 시나리오설정에서 함
  start: vars.color.pink,
} as const;
