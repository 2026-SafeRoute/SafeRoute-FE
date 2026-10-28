import type { StatusBadgeColor } from '@components/chip/StatusBadge';

import type {
  MonitoringEventSeverity,
  MonitoringEventType,
  TrainingSessionStatus,
} from '../types/trainingAnalysis';

// 훈련분석은 실시간 모니터링 전용 기능임(팀 결정) — 진행 중(RUNNING)인 훈련만 대상으로 하고,
// 끝난 훈련은 COMPLETED든 FAILED든 더 이상 열람 대상이 아님. 그래서 세션이 RUNNING을
// 벗어나는 순간(정상 종료·자동 실패 구분 없이) 화면이 자동으로 홈(다른 진행 중인 훈련이
// 있으면 그쪽, 없으면 빈 상태)으로 돌아감
export const VIEWABLE_SESSION_STATUSES = [
  'RUNNING',
] as const satisfies readonly TrainingSessionStatus[];

// 진행 중 훈련의 상태·이벤트를 다시 확인하는 기본 주기
export const LIVE_SESSION_POLL_INTERVAL_MS = 1000;

// 카메라·프레임은 WebSocket 이벤트로 즉시 갱신하고, 폴링은 이벤트 누락 시 복구하는 안전망으로만
// 사용함. 서버의 기본 프레임 저장 주기(5초)보다 자주 전체 목록을 다시 받아도 새 프레임은 늘지 않고
// presigned URL만 바뀌어 기존 이미지까지 다시 내려받을 수 있으므로 이미지 조회 주기는 분리함
export const LIVE_MONITORING_IMAGE_POLL_INTERVAL_MS = 5000;

export const isLiveSessionStatus = (status: TrainingSessionStatus | undefined) =>
  status === 'RUNNING';

export const TRAINING_SESSION_STATUS_VIEW = {
  RUNNING: { label: '진행 중', color: 'yellow' },
  STOPPED: { label: '중지됨', color: 'neutral' },
  SCHEDULED: { label: '예정', color: 'blue' },
  COMPLETED: { label: '종료', color: 'green' },
  FAILED: { label: '실패', color: 'red' },
  CANCELLED: { label: '취소됨', color: 'neutral' },
} as const satisfies Record<TrainingSessionStatus, { label: string; color: StatusBadgeColor }>;

export const EVENT_SEVERITY_COLOR = {
  INFO: '#2563EB',
  WARNING: '#F59E0B',
  DANGER: '#EF4444',
} as const satisfies Record<MonitoringEventSeverity, string>;

export const EVENT_TYPE_LABEL = {
  AI_ANALYSIS_STARTED: 'AI 분석 시작',
  CONGESTION_STARTED: '혼잡 감지 시작',
  CONGESTION_LEVEL_UP: '혼잡 단계 상승',
  CONGESTION_ENDED: '혼잡 해소',
  ROUTE_DEVIATION_DETECTED: '경로 이탈 감지',
  ROUTE_RECALCULATION_REQUESTED: '경로 재탐색 요청',
  EVACUATION_ROUTE_UPDATED: '대피 경로 갱신',
  ROUTE_RECALCULATION_REJECTED: '경로 재탐색 거부',
  ROUTE_RECALCULATION_CANCELLED: '경로 재탐색 취소',
} as const satisfies Record<MonitoringEventType, string>;
