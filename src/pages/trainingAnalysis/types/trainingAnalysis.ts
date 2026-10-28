import type { TrainingSessionStatus } from '@apis/trainingSessions/trainingSessionConstants';

export type { TrainingSessionStatus } from '@apis/trainingSessions/trainingSessionConstants';

export interface TrainingSessionSummary {
  sessionId: string;
  scenarioId?: string;
  scenarioName: string;
  buildingId: string;
  buildingName: string;
  status: TrainingSessionStatus;
  startedAt: string;
}

// GET /api/v1/sessions/{sessionId}/monitoring/context 응답 기준.
// 상세 화면(카메라 목록·프레임 상세)은 이 API를 세션 정보의 기준으로 삼음 — 세션 목록 API와
// 달리 진행 시간·종료 시각·저장 간격·정보 지연 판단 기준(stateStaleAfterSec)까지 내려줌
export interface TrainingSessionContext {
  sessionId: string;
  scenarioName: string;
  buildingName: string;
  status: TrainingSessionStatus;
  startedAt: number | null; // epoch ms. 예약 상태(SCHEDULED)면 null
  endedAt: number | null; // epoch ms. 진행 중이면 null
  elapsedSeconds: number | null; // 조회 시점 값 — 진행 중엔 프론트에서 1초 단위로 이어서 증가시킴
  snapshotIntervalSec: number;
  stateStaleAfterSec: number;
}

// GET /api/v1/sessions/{sessionId}/monitoring/current-states 응답 기준.
// stale=true면 avgHeadcount 등 기존 수치를 정상값으로 신뢰하면 안 됨(갱신 지연으로 표시)
export interface CctvCurrentState {
  cctvId: string;
  cctvCode: string;
  avgHeadcount: number;
  peakHeadcount: number;
  density: number;
  congestionLevel: CongestionLevel | null;
  lastDetectedAt: number | null; // epoch ms
  stale: boolean;
  configVersion: number;
}

// GET /api/v1/sessions/{sessionId}/monitoring/cameras 응답 기준
// headcount 등 실시간 카운터는 이 API에 없어서 목록 카드에는 캡처 시각만 표시
export interface MonitoringCamera {
  cctvId: string;
  code: string;
  name: string;
  buildingName: string;
  floorName: string;
  location: string;
  thumbnailUrl: string | null;
  capturedAt: number | null; // epoch ms, 캡처 프레임 없으면 null
  receivedAt: number | null; // epoch ms, 서버가 최신 프레임 관측값을 받은 시각
  stale: boolean; // 최신 캡처가 없거나 서버의 stale 기준 시간을 넘겼으면 true
  urlExpiresAt: number | null;
}

export type CongestionLevel = 'NORMAL' | 'CAUTION' | 'CROWDED' | 'VERY_CROWDED';

export const CONGESTION_LEVEL_LABEL: Record<CongestionLevel, string> = {
  NORMAL: '정상',
  CAUTION: '주의',
  CROWDED: '혼잡',
  VERY_CROWDED: '매우 혼잡',
};

// GET /api/v1/sessions/{sessionId}/monitoring/cameras/{cctvId}/frames 응답 기준, 커서 페이징.
// windowStart/windowEnd는 해당 프레임이 집계된 분석 구간 시각일 뿐 훈련 전체 시간이 아님 —
// 화면의 "훈련 시작 후 경과 시간"·"훈련 종료 시각"에는 쓰지 않고(각각 capturedAt과
// context.endedAt을 씀) 구간 폭이 필요해질 때를 대비해 값만 들고 있음
export interface MonitoringFrame {
  frameId: string;
  capturedAt: number;
  receivedAt: number | null;
  windowStart: number | null;
  windowEnd: number | null;
  imageUrl: string | null;
  urlExpiresAt: number | null;
  headcount: number;
  density: number;
  congestionLevel: CongestionLevel;
}

export type MonitoringEventType =
  | 'AI_ANALYSIS_STARTED'
  | 'CONGESTION_STARTED'
  | 'CONGESTION_LEVEL_UP'
  | 'CONGESTION_ENDED'
  | 'ROUTE_DEVIATION_DETECTED'
  | 'ROUTE_RECALCULATION_REQUESTED'
  | 'EVACUATION_ROUTE_UPDATED'
  | 'ROUTE_RECALCULATION_REJECTED'
  | 'ROUTE_RECALCULATION_CANCELLED';

export type MonitoringEventSeverity = 'INFO' | 'WARNING' | 'DANGER';

// GET /api/v1/sessions/{sessionId}/monitoring/events 응답 기준
export interface MonitoringEvent {
  eventId: string;
  type: MonitoringEventType;
  severity: MonitoringEventSeverity;
  occurredAt: number;
  cctvCode: string;
  // AI 분석 시작처럼 혼잡도와 직접 관련 없는 이벤트는 null로 내려옴
  congestionLevel: CongestionLevel | null;
  message: string;
}
