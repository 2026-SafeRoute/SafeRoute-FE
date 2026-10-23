import type {
  BuildingResponse,
  CreateBuildingRequest,
  UpdateBuildingRequest,
} from '@apis/__generated__/data-contracts';
import { HTTP_METHOD, request } from '@apis/config/request';
import { API_ENDPOINTS } from '@apis/constants/endpoints';

import type { Building } from './buildingTypes';

const toBuilding = (response: BuildingResponse): Building => {
  const {
    id,
    name,
    address,
    buildingType,
    groundFloorCount,
    basementFloorCount,
    totalFloors,
    isActive,
    lastTrainedAt,
  } = response;
  if (
    !id ||
    !name ||
    !address ||
    !buildingType ||
    groundFloorCount === undefined ||
    basementFloorCount === undefined ||
    totalFloors === undefined ||
    isActive === undefined
  ) {
    throw new Error('건물 응답에 필수 필드가 누락되었습니다.');
  }
  return {
    id,
    name,
    address,
    buildingType,
    groundFloorCount,
    basementFloorCount,
    totalFloors,
    isActive,
    lastTrainedAt: lastTrainedAt ?? null,
  };
};

export const getBuildings = async () => {
  const buildings = await request<BuildingResponse[]>({
    method: HTTP_METHOD.GET,
    url: API_ENDPOINTS.BUILDINGS.ROOT,
  });
  return buildings.map(toBuilding);
};

export const postBuilding = async (body: CreateBuildingRequest) => {
  const building = await request<BuildingResponse, CreateBuildingRequest>({
    method: HTTP_METHOD.POST,
    url: API_ENDPOINTS.BUILDINGS.ROOT,
    body,
  });
  return toBuilding(building);
};

export const putBuilding = async (buildingId: string, body: UpdateBuildingRequest) => {
  const building = await request<BuildingResponse, UpdateBuildingRequest>({
    method: HTTP_METHOD.PUT,
    url: API_ENDPOINTS.BUILDINGS.DETAIL(buildingId),
    body,
  });
  return toBuilding(building);
};

export const deleteBuilding = (buildingId: string) =>
  request<void>({
    method: HTTP_METHOD.DELETE,
    url: API_ENDPOINTS.BUILDINGS.DETAIL(buildingId),
  });
