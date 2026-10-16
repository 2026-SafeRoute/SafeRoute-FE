import type { RouteRecalculationSummaryResponse } from '@apis/__generated__/data-contracts';
import type { TrainingSessionStatus } from '@apis/trainingSessions/trainingSessionConstants';

// 훈련 세션 WebSocket에서 수신하는 이벤트 종류
export const TRAINING_EVENT_TYPE = {
  STATUS_UPDATED: 'TRAINING_STATUS_UPDATED',
  CONGESTION_UPDATED: 'CONGESTION_UPDATED',
  CONGESTION_IMAGE_UPDATED: 'CONGESTION_IMAGE_UPDATED',
  CONGESTION_EVENT_RECEIVED: 'CONGESTION_EVENT_RECEIVED',
  CONGESTION_EVENT_IMAGE_UPDATED: 'CONGESTION_EVENT_IMAGE_UPDATED',
  // AI_ANALYSIS_STARTED·ROUTE_DEVIATION_DETECTED 등 이벤트 타임라인용 이벤트가 이 봉투로 옴
  MONITORING_EVENT_CREATED: 'MONITORING_EVENT_CREATED',
  ROUTE_RECALCULATION_REQUESTED: 'ROUTE_RECALCULATION_REQUESTED',
  ROUTE_RECALCULATION_APPROVED: 'ROUTE_RECALCULATION_APPROVED',
  EVACUATION_ROUTE_UPDATED: 'EVACUATION_ROUTE_UPDATED',
  ROUTE_RECALCULATION_REJECTED: 'ROUTE_RECALCULATION_REJECTED',
  ROUTE_RECALCULATION_CANCELLED: 'ROUTE_RECALCULATION_CANCELLED',
  IOT_LIGHT_STATUS_UPDATED: 'IOT_LIGHT_STATUS_UPDATED',
  FIRE_SPREAD_UPDATED: 'FIRE_SPREAD_UPDATED',
  EVACUATION_ROUTE_BLOCKED: 'EVACUATION_ROUTE_BLOCKED',
} as const;

export type TrainingEventType = (typeof TRAINING_EVENT_TYPE)[keyof typeof TRAINING_EVENT_TYPE];

// 훈련 상태 변경 이벤트 데이터
export interface TrainingStatusEventData {
  status: TrainingSessionStatus;
  startedAt: string | null;
  endedAt: string | null;
}

// CCTV별 혼잡 상태 갱신 이벤트 데이터. 동일 eventId는 Edge 개수와 무관하게 CCTV당 한 번만 옴 —
// 프론트에서 eventId로 중복 처리를 걸러야 함
export interface CongestionUpdatedEventData {
  eventId: string;
  affectedEdgeIds: string[];
  cctvCode: string;
  avgHeadcount: number;
  peakHeadcount: number;
  density: number;
  congestionLevel: 'NORMAL' | 'CAUTION' | 'CROWDED' | 'VERY_CROWDED';
  windowStart: number;
  windowEnd: number;
  capturedAt: number;
  configVersion: number;
  hasMonitoringImage: boolean;
}

// 이벤트 타임라인에 추가할 단건 이벤트(AI_ANALYSIS_STARTED·ROUTE_DEVIATION_DETECTED 등)가
// 이 봉투로 옴. 문구·정렬 일관성을 위해 직접 목록에 꽂기보다 수신 후 이벤트 REST 첫 페이지를
// 다시 조회하는 방식을 씀 — data는 eventId 중복 판단용으로만 읽음
export interface MonitoringEventCreatedData {
  eventId: string;
  type: string;
  severity: string;
  occurredAt: number;
  cctvCode: string;
  congestionLevel: string;
  message: string;
}

// 경로 재탐색 이벤트는 서버 버전에 따라 eventId 또는 recalculationId를 식별자로 전달함
export interface RouteRecalculationEventData {
  eventId?: string;
  recalculationId?: string;
  status?: RouteRecalculationSummaryResponse['status'];
  triggerEdgeId?: string | null;
  triggerType?: RouteRecalculationSummaryResponse['triggerType'];
  congestionLevel?: RouteRecalculationSummaryResponse['congestionLevel'] | null;
}

// 화재 확산으로 시작 지점에서 출구까지 도달 가능한 경로가 모두 사라진 시점
export interface EvacuationRouteBlockedEventData {
  floorId: string;
  blockedAt: string;
  blockedAfterSec: number;
}

// 훈련 세션 WebSocket 이벤트의 공통 응답 형식
export interface TrainingSessionEvent<TData = unknown> {
  eventType: TrainingEventType;
  sessionId: string;
  occurredAt: string;
  data: TData;
}
