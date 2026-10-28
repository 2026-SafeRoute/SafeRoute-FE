import type {
  CctvCurrentState,
  MonitoringCamera,
  MonitoringEvent,
  MonitoringFrame,
  TrainingSessionContext,
  TrainingSessionStatus,
} from '@pages/trainingAnalysis/types/trainingAnalysis';

import type {
  MonitoringCameraResponse,
  MonitoringEventResponse,
  MonitoringFrameResponse,
} from '@apis/__generated__/data-contracts';
import { request as apiRequest, HTTP_METHOD } from '@apis/config/request';
import { API_ENDPOINTS } from '@apis/constants/endpoints';

// GET .../monitoring/context 응답. 아직 생성된 타입이 없어서(스웨거 재생성 전) 직접 정의함.
// startedAt/endedAt은 다른 날짜 필드(ISO 문자열)와 달리 epoch ms 숫자로 내려옴(실측 확인)
interface MonitoringContextResponse {
  scenarioName?: string;
  buildingName?: string;
  status?: TrainingSessionStatus;
  startedAt?: number | null;
  endedAt?: number | null;
  elapsedSeconds?: number | null;
  snapshotIntervalSec?: number;
  stateStaleAfterSec?: number;
}

// GET .../monitoring/current-states 응답 항목. 아직 생성된 타입이 없어서 직접 정의함
interface CctvCurrentStateResponse {
  cctvId?: string;
  cctvCode?: string;
  avgHeadcount?: number;
  peakHeadcount?: number;
  density?: number;
  congestionLevel?: 'NORMAL' | 'CAUTION' | 'CROWDED' | 'VERY_CROWDED' | null;
  lastDetectedAt?: number | null;
  stale?: boolean;
  configVersion?: number;
}

// 프레임 응답에 window 필드·totalCount가 아직 없을 수 있어(BE 작업 예정) 낙관적으로 옵셔널 처리
interface MonitoringFrameResponseExt extends MonitoringFrameResponse {
  windowStart?: number;
  windowEnd?: number;
}

// 캡처된 프레임이 아직 없는 카메라는 thumbnailUrl/capturedAt/urlExpiresAt이 정상적으로 없는
// 상태라 필수값으로 취급하지 않음(카드에서 "프레임 없음"으로 표시)
const toMonitoringCamera = (response: MonitoringCameraResponse): MonitoringCamera => {
  const { cctvId, code, name, buildingName, floorName, location } = response;
  if (!cctvId || !code || !name || !buildingName || !floorName || !location) {
    throw new Error('모니터링 카메라 응답에 필수 필드가 누락되었습니다.');
  }
  const capturedAt = response.capturedAt ?? null;
  return {
    cctvId,
    code,
    name,
    buildingName,
    floorName,
    location,
    thumbnailUrl: response.thumbnailUrl ?? null,
    capturedAt,
    receivedAt: response.receivedAt ?? null,
    // 구버전 응답처럼 stale이 없으면 캡처 존재 여부로만 최소한의 호환 처리를 함
    stale: response.stale ?? capturedAt === null,
    urlExpiresAt: response.urlExpiresAt ?? null,
  };
};

// 이미지 업로드가 아직 안 끝난 프레임은 imageUrl/urlExpiresAt이 없을 수 있어서 필수값에서 뺌
const toMonitoringFrame = (response: MonitoringFrameResponseExt): MonitoringFrame => {
  const { frameId, capturedAt, headcount, density, congestionLevel } = response;
  if (
    !frameId ||
    capturedAt === undefined ||
    headcount === undefined ||
    density === undefined ||
    !congestionLevel
  ) {
    throw new Error('모니터링 프레임 응답에 필수 필드가 누락되었습니다.');
  }
  return {
    frameId,
    capturedAt,
    receivedAt: response.receivedAt ?? null,
    windowStart: response.windowStart ?? null,
    windowEnd: response.windowEnd ?? null,
    imageUrl: response.imageUrl ?? null,
    urlExpiresAt: response.urlExpiresAt ?? null,
    headcount,
    density,
    congestionLevel,
  };
};

const toMonitoringEvent = (response: MonitoringEventResponse): MonitoringEvent => {
  const { eventId, type, severity, occurredAt, cctvCode, congestionLevel, message } = response;
  if (!eventId || !type || !severity || occurredAt === undefined || !cctvCode || !message) {
    throw new Error('모니터링 이벤트 응답에 필수 필드가 누락되었습니다.');
  }
  return {
    eventId,
    type,
    severity,
    occurredAt,
    cctvCode,
    congestionLevel: congestionLevel ?? null,
    message,
  };
};

// 예약 상태(SCHEDULED)는 startedAt/endedAt이 원래 없어서 필수값에서 뺌 — status는 화면 분기의
// 기준이라 없으면 화면을 정상적으로 그릴 수 없으므로 필수로 취급함
const toTrainingSessionContext = (
  sessionId: string,
  response: MonitoringContextResponse,
): TrainingSessionContext => {
  const { scenarioName, buildingName, status } = response;
  if (!scenarioName || !buildingName || !status) {
    throw new Error('훈련 세션 정보 응답에 필수 필드가 누락되었습니다.');
  }
  return {
    sessionId,
    scenarioName,
    buildingName,
    status,
    startedAt: response.startedAt ?? null,
    endedAt: response.endedAt ?? null,
    elapsedSeconds: response.elapsedSeconds ?? null,
    // 아직 BE 미반영 구간을 대비한 기본값 — 명세상 훈련분석의 저장 주기는 5초
    snapshotIntervalSec: response.snapshotIntervalSec ?? 5,
    stateStaleAfterSec: response.stateStaleAfterSec ?? 15,
  };
};

// 훈련 세션 기본 정보(시나리오명·건물명·상태·시간 정보). 화면 진입·WebSocket 재연결 시 조회
export async function getSessionContext(
  sessionId: string,
  signal?: AbortSignal,
): Promise<TrainingSessionContext> {
  const response = await apiRequest<MonitoringContextResponse>({
    method: HTTP_METHOD.GET,
    url: API_ENDPOINTS.TRAINING_SESSIONS.MONITORING_CONTEXT(sessionId),
    signal,
  });
  return toTrainingSessionContext(sessionId, response);
}

// congestionLevel=null과 stale=true는 별개 개념 — null은 아직 값이 없는 것, stale은 값은
// 있지만 오래된 것. 둘 다 "정상(NORMAL)"으로 임의 대체하지 않고 그대로 전달함
const toCctvCurrentState = (response: CctvCurrentStateResponse): CctvCurrentState | null => {
  const { cctvId, cctvCode } = response;
  if (!cctvId || !cctvCode) return null;
  return {
    cctvId,
    cctvCode,
    avgHeadcount: response.avgHeadcount ?? 0,
    peakHeadcount: response.peakHeadcount ?? 0,
    density: response.density ?? 0,
    congestionLevel: response.congestionLevel ?? null,
    lastDetectedAt: response.lastDetectedAt ?? null,
    stale: response.stale ?? true,
    configVersion: response.configVersion ?? 0,
  };
};

// 세션의 CCTV별 현재 혼잡 상태 목록 (카메라 목록·프레임 상세 화면의 초기 상태).
// 응답 필드명은 states(실측 확인) — cameras/events 응답의 명명(cameras/events)과 다르니 주의
export async function getSessionCurrentStates(
  sessionId: string,
  signal?: AbortSignal,
): Promise<CctvCurrentState[]> {
  const response = await apiRequest<{ states?: CctvCurrentStateResponse[] }>({
    method: HTTP_METHOD.GET,
    url: API_ENDPOINTS.TRAINING_SESSIONS.MONITORING_CURRENT_STATES(sessionId),
    signal,
  });
  return (response.states ?? [])
    .map(toCctvCurrentState)
    .filter((state): state is CctvCurrentState => state !== null);
}

// 훈련 세션의 카메라별 최신 캡처 목록 (카메라 목록 화면)
export async function getSessionCameras(
  sessionId: string,
  signal?: AbortSignal,
): Promise<MonitoringCamera[]> {
  const response = await apiRequest<{ cameras?: MonitoringCameraResponse[] }>({
    method: HTTP_METHOD.GET,
    url: API_ENDPOINTS.TRAINING_SESSIONS.MONITORING_CAMERAS(sessionId),
    signal,
  });
  return (response.cameras ?? []).map(toMonitoringCamera);
}

export interface CameraFramesPage {
  frames: MonitoringFrame[];
  nextCursor: string | null;
  hasNext: boolean;
  // 선택된 CCTV에 저장된 전체 프레임 수. BE 작업 예정 필드라 아직 없을 수 있음 — 없으면
  // 화면에서 지금까지 불러온 프레임 개수(frames.length)로 대신 표시함
  totalCount: number | null;
}

// 카메라별 프레임 목록 (최신순 커서 페이지네이션 — 프레임 상세 화면)
export async function getCameraFrames(
  sessionId: string,
  cctvId: string,
  options?: { limit?: number; cursor?: string },
  signal?: AbortSignal,
): Promise<CameraFramesPage> {
  const response = await apiRequest<{
    frames?: MonitoringFrameResponseExt[];
    nextCursor?: string;
    hasNext?: boolean;
    totalCount?: number;
  }>({
    method: HTTP_METHOD.GET,
    url: API_ENDPOINTS.TRAINING_SESSIONS.MONITORING_FRAMES(sessionId, cctvId),
    query: { limit: options?.limit, cursor: options?.cursor },
    signal,
  });
  return {
    frames: (response.frames ?? []).map(toMonitoringFrame),
    nextCursor: response.nextCursor ?? null,
    hasNext: response.hasNext ?? false,
    totalCount: response.totalCount ?? null,
  };
}

// 훈련 세션의 이벤트 타임라인. cctvCode로 특정 카메라 이벤트만 필터링 가능
export async function getSessionEvents(
  sessionId: string,
  cctvCode?: string,
  signal?: AbortSignal,
): Promise<MonitoringEvent[]> {
  const response = await apiRequest<{ events?: MonitoringEventResponse[] }>({
    method: HTTP_METHOD.GET,
    url: API_ENDPOINTS.TRAINING_SESSIONS.MONITORING_EVENTS(sessionId),
    query: { cctvCode },
    signal,
  });
  return (response.events ?? []).map(toMonitoringEvent);
}
