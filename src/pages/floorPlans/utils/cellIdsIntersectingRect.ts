import { CANVAS_W } from '@utils/floorCanvas';

import type { FloorGridCell } from '../api/floorGridApi';

// 드래그 사각형(캔버스 좌표)과 영역이 조금이라도 겹치는 셀들의 id — 셀 중심이 아니라 셀 면적 기준.
// 드래그 미리보기와 실제 잡히는 셀이 일치하도록 드래그 중/드래그 종료 양쪽에서 같은 로직을 씀
export const cellIdsIntersectingRect = (
  cells: FloorGridCell[],
  rect: { x: number; y: number; w: number; h: number },
  size: { w: number; h: number },
  canvasH: number,
): string[] =>
  cells
    .filter((cell) => {
      const left = cell.centerX * CANVAS_W - size.w / 2;
      const top = cell.centerY * canvasH - size.h / 2;
      return (
        left < rect.x + rect.w &&
        left + size.w > rect.x &&
        top < rect.y + rect.h &&
        top + size.h > rect.y
      );
    })
    .map((cell) => cell.id);
