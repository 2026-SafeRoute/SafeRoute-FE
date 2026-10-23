import type { FloorResponse } from '@apis/__generated__/data-contracts';
import { getBuildings } from '@apis/buildings/buildingsApi';
import { request as apiRequest, HTTP_METHOD } from '@apis/config/request';
import { API_ENDPOINTS } from '@apis/constants/endpoints';
import { getBuildingFloors as getSharedBuildingFloors } from '@apis/floors/floorsApi';

import type { Floor, FloorBuilding } from '../types/floorPlans';

// devices는 CCTV·IoT·맵그래프 API 연동 전까지 빈 배열로 둠 (다음 단위에서 채울 예정)
interface FloorSource {
  id?: string;
  floorNum?: number;
  segmentationStatus?: FloorResponse['segmentationStatus'];
  processedAt?: string | null;
  mapImageKey?: string | null;
}

export const toFloor = (response: FloorSource, buildingId: string): Floor => {
  const { id, floorNum, segmentationStatus, processedAt, mapImageKey } = response;
  if (!id || floorNum === undefined || !segmentationStatus) {
    throw new Error('층 응답에 필수 필드가 누락되었습니다.');
  }
  return {
    id,
    buildingId,
    floorNum,
    // 목록/사이드바 등에서는 "도면이 등록됐는지"만 boolean으로 판단하면 되고 실제 이미지를 그리지는
    // 않아서, mapImageKey 존재 여부만 truthy 값으로 씀(도면 개수만큼 presigned URL을 미리 다
    // 발급받는 낭비를 피하기 위함). 실제 화면에 그릴 이미지 URL은 getFloorImageUrl로 따로 조회
    mapImageUrl: mapImageKey ?? null,
    segmentationStatus,
    processedAt: processedAt ?? null,
    devices: [],
  };
};

export async function getBuildingFloors(buildingId: string): Promise<Floor[]> {
  const floors = await getSharedBuildingFloors(buildingId);
  return floors.map((f) => toFloor(f, buildingId));
}

export async function getFloorDetail(
  buildingId: string,
  floorId: string,
  signal?: AbortSignal,
): Promise<Floor> {
  const floor = await apiRequest<FloorResponse>({
    method: HTTP_METHOD.GET,
    url: API_ENDPOINTS.FLOORS.DETAIL(buildingId, floorId),
    signal,
  });
  return toFloor(floor, buildingId);
}

/** 목록 페이지용: 모든 건물 + 해당 도면 목록을 한 번에 가져옴 */
export async function getFloorBuildings(): Promise<FloorBuilding[]> {
  const buildings = await getBuildings();
  const results = await Promise.all(
    buildings.map(async (b) => {
      const floors = await getBuildingFloors(b.id);
      return { id: b.id, name: b.name, floors } satisfies FloorBuilding;
    }),
  );
  return results;
}

// 도면 이미지 없이 층 번호만 먼저 등록 — 새 건물처럼 층이 하나도 없을 때 업로드 카드가 뜰 자리를 만들기 위함
// 이 엔드포인트는 스웨거상 requestBody가 없고 floorNum을 쿼리 파라미터로 받음(JSON body 아님)
export async function createFloor(buildingId: string, floorNum: number): Promise<Floor> {
  const floor = await apiRequest<FloorResponse>({
    method: HTTP_METHOD.POST,
    url: API_ENDPOINTS.FLOORS.ROOT(buildingId),
    query: { floorNum },
  });
  return toFloor(floor, buildingId);
}

export async function uploadFloor(
  buildingId: string,
  floorNum: number,
  file: File,
  realWidthM: number,
  realHeightM: number,
): Promise<Floor> {
  const form = new FormData();
  form.append('floorNum', String(floorNum));
  form.append('realWidth', String(realWidthM));
  form.append('realHeight', String(realHeightM));
  form.append('file', file);
  const floor = await apiRequest<FloorResponse, FormData>({
    method: HTTP_METHOD.POST,
    url: API_ENDPOINTS.FLOORS.UPLOAD(buildingId),
    body: form,
  });
  return toFloor(floor, buildingId);
}

export async function deleteFloor(buildingId: string, floorId: string): Promise<void> {
  await apiRequest<void>({
    method: HTTP_METHOD.DELETE,
    url: API_ENDPOINTS.FLOORS.DETAIL(buildingId, floorId),
  });
}

// 세그멘테이션 요청 자체는 비동기로 처리되고 결과는 별도 폴링/조회로 반영되는 구조라 응답 바디를 쓰지 않음.
// 이미지 분석이 axios 기본 타임아웃(30초)보다 오래 걸리는 게 정상이라 — 백엔드는 계속 분석 중인데
// 클라이언트가 먼저 포기하고 "실패"로 잘못 보여주는 문제가 있었음 — 넉넉하게 늘려서 요청함
const ANALYZE_TIMEOUT_MS = 180_000; // 3분

export async function analyzeFloor(floorId: string): Promise<void> {
  await apiRequest<unknown>({
    method: HTTP_METHOD.POST,
    url: API_ENDPOINTS.FLOORS.ANALYZE(floorId),
    timeout: ANALYZE_TIMEOUT_MS,
  });
}
