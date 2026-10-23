import type { CctvGridCellResponse, CctvResponse } from '@apis/__generated__/data-contracts';
import { HTTP_METHOD, request } from '@apis/config/request';
import { API_ENDPOINTS } from '@apis/constants/endpoints';

export interface CctvGridCell {
  id: string;
  rowIndex: number;
  columnIndex: number;
  centerX: number;
  centerY: number;
  walkable: boolean;
}

export interface Cctv {
  id: string;
  code: string;
  name: string;
  floorId: string;
  x: number;
  y: number;
  enabled: boolean;
  /** CCTV 등록 시 함께 생성되는 CUSTOM 타입 위치 노드. 삭제 시 서버가 cascade로 안 지워줘서 FE가 직접 정리해야 함 */
  customNodeId: string | null;
  /** 이 CCTV가 등록될 때 층에 설정돼 있던 그리드 배율(cm). 층 배율 조회 API가 없어서 이 값으로 역추적함 */
  gridCellSizeMeter: number | null;
  monitoredGridCellCount: number;
  monitoredAreaM2: number;
  gridCells: CctvGridCell[];
}

const toCctvGridCell = (response: CctvGridCellResponse): CctvGridCell => {
  const { id, rowIndex, columnIndex, centerX, centerY } = response;
  if (
    !id ||
    rowIndex === undefined ||
    columnIndex === undefined ||
    centerX === undefined ||
    centerY === undefined
  ) {
    throw new Error('CCTV 그리드 셀 응답에 필수 필드가 누락되었습니다.');
  }

  return { id, rowIndex, columnIndex, centerX, centerY, walkable: response.walkable ?? true };
};

export const toCctv = (response: CctvResponse): Cctv => {
  const { id, code, name, floorId, x, y } = response;
  if (!id || !code || !name || !floorId || x === undefined || y === undefined) {
    throw new Error('CCTV 응답에 필수 필드가 누락되었습니다.');
  }

  return {
    id,
    code,
    name,
    floorId,
    x,
    y,
    enabled: response.enabled ?? false,
    customNodeId: response.customNodeId ?? null,
    gridCellSizeMeter: response.gridCellSizeMeter ?? null,
    monitoredGridCellCount: response.monitoredGridCellCount ?? 0,
    monitoredAreaM2: response.monitoredAreaM2 ?? 0,
    gridCells: (response.gridCells ?? []).map(toCctvGridCell),
  };
};

export const getFloorCctvs = async (floorId: string, signal?: AbortSignal) => {
  const cctvs = await request<CctvResponse[]>({
    method: HTTP_METHOD.GET,
    url: API_ENDPOINTS.CCTV.ROOT,
    query: { floorId },
    signal,
  });

  return cctvs.map(toCctv);
};
