import type {
  AssignCctvRequest,
  ConfigureGuidanceRequest,
  CreateIoTLightRequest,
  IoTLightResponse,
  UpdateIoTLightRequest,
} from '@apis/__generated__/data-contracts';
import { request as apiRequest, HTTP_METHOD } from '@apis/config/request';
import { API_ENDPOINTS } from '@apis/constants/endpoints';
import { toIoTLight } from '@apis/floors/iotLightsApi';
import type { IoTLight } from '@apis/floors/iotLightsApi';

export { getFloorLights } from '@apis/floors/iotLightsApi';
export type { IoTLight } from '@apis/floors/iotLightsApi';

export async function createIoTLight(body: CreateIoTLightRequest): Promise<IoTLight> {
  const light = await apiRequest<IoTLightResponse, CreateIoTLightRequest>({
    method: HTTP_METHOD.POST,
    url: API_ENDPOINTS.IOT_LIGHTS.ROOT,
    body,
  });
  return toIoTLight(light);
}

export async function updateIoTLight(
  lightId: string,
  body: UpdateIoTLightRequest,
): Promise<IoTLight> {
  const light = await apiRequest<IoTLightResponse, UpdateIoTLightRequest>({
    method: HTTP_METHOD.PATCH,
    url: API_ENDPOINTS.IOT_LIGHTS.DETAIL(lightId),
    body,
  });
  return toIoTLight(light);
}

export async function enableIoTLight(lightId: string): Promise<IoTLight> {
  const light = await apiRequest<IoTLightResponse>({
    method: HTTP_METHOD.PATCH,
    url: API_ENDPOINTS.IOT_LIGHTS.ENABLE(lightId),
  });
  return toIoTLight(light);
}

// 삭제 시 이 유도등이 붙어있던 노드와 연결 엣지까지 서버에서 cascade로 함께 삭제됨(백엔드 확인, 2026-08-27)
export async function deleteIoTLight(lightId: string): Promise<void> {
  await apiRequest<void>({
    method: HTTP_METHOD.DELETE,
    url: API_ENDPOINTS.IOT_LIGHTS.DETAIL(lightId),
  });
}

export async function disableIoTLight(lightId: string): Promise<IoTLight> {
  const light = await apiRequest<IoTLightResponse>({
    method: HTTP_METHOD.PATCH,
    url: API_ENDPOINTS.IOT_LIGHTS.DISABLE(lightId),
  });
  return toIoTLight(light);
}

export async function configureLightGuidance(
  lightId: string,
  body: ConfigureGuidanceRequest,
): Promise<IoTLight> {
  const light = await apiRequest<IoTLightResponse, ConfigureGuidanceRequest>({
    method: HTTP_METHOD.PATCH,
    url: API_ENDPOINTS.IOT_LIGHTS.GUIDANCE(lightId),
    body,
  });
  return toIoTLight(light);
}

// 유도등이 대피 흐름을 참고할 담당 CCTV 배정 — 같은 층 CCTV만 유효(백엔드 검증)
export async function assignLightCctv(lightId: string, cctvId: string): Promise<IoTLight> {
  const light = await apiRequest<IoTLightResponse, AssignCctvRequest>({
    method: HTTP_METHOD.PATCH,
    url: API_ENDPOINTS.IOT_LIGHTS.CCTV(lightId),
    body: { cctvId },
  });
  return toIoTLight(light);
}
