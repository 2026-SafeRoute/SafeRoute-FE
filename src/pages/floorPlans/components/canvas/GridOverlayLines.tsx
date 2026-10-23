import { CANVAS_W } from '@utils/floorCanvas';

import type { FloorGridCell } from '../../api/floorGridApi';

interface GridOverlayLinesProps {
  cells: FloorGridCell[];
  size: { w: number; h: number };
  canvasH: number;
}

// 그리드 표시 토글용 균일 격자선(모눈종이). 셀별 rect 대신 캔버스(560x420) 전체를
// 가로지르는 직선만 그어서, 공유 변이 두 번 그려져 자리표처럼 보이던 문제를 없앰.
// 선 위치는 실제 그리드 원점에 위상만 맞추고, 셀 범위를 넘어 캔버스 가장자리까지 채움
const GridOverlayLines = ({ cells, size, canvasH }: GridOverlayLinesProps) => {
  if (cells.length === 0) return null;
  const CANVAS_H = canvasH;

  // 위상(offset)은 각 셀 왼쪽/위쪽 변을 셀 크기로 나눈 나머지의 중앙값으로 구함 —
  // 특정 셀 하나의 부동소수 오차에 흔들리지 않고, 격자선이 실제 셀 경계에 맞음.
  // 그 위상에서 0부터 캔버스 끝까지 셀 간격으로 선을 반복해 전체를 덮음
  const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] ?? 0;
  };
  const phaseX = median(
    cells.map((c) => {
      const left = c.centerX * CANVAS_W - size.w / 2;
      return ((left % size.w) + size.w) % size.w;
    }),
  );
  const phaseY = median(
    cells.map((c) => {
      const top = c.centerY * CANVAS_H - size.h / 2;
      return ((top % size.h) + size.h) % size.h;
    }),
  );
  const verticalXs: number[] = [];
  for (let x = phaseX; x <= CANVAS_W + 0.001; x += size.w) verticalXs.push(x);
  const horizontalYs: number[] = [];
  for (let y = phaseY; y <= CANVAS_H + 0.001; y += size.h) horizontalYs.push(y);

  return (
    <g style={{ pointerEvents: 'none' }}>
      {verticalXs.map((x) => (
        <line
          key={`v${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={CANVAS_H}
          stroke="rgba(107,114,128,0.22)"
          strokeWidth="0.6"
        />
      ))}
      {horizontalYs.map((y) => (
        <line
          key={`h${y}`}
          x1={0}
          y1={y}
          x2={CANVAS_W}
          y2={y}
          stroke="rgba(107,114,128,0.22)"
          strokeWidth="0.6"
        />
      ))}
    </g>
  );
};

export default GridOverlayLines;
