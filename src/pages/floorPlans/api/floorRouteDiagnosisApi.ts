import type { FloorRouteDiagnosisResponse } from '@apis/__generated__/data-contracts';
import { HTTP_METHOD, request } from '@apis/config/request';
import { API_ENDPOINTS } from '@apis/constants/endpoints';

export const getFloorRouteDiagnosis = (
  floorId: string,
  signal?: AbortSignal,
): Promise<FloorRouteDiagnosisResponse> =>
  request<FloorRouteDiagnosisResponse>({
    method: HTTP_METHOD.GET,
    url: API_ENDPOINTS.FLOORS.ROUTE_DIAGNOSIS(floorId),
    signal,
  });
