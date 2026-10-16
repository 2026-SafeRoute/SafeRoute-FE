import type { ReactNode } from 'react';

import type { HOME_GRADE_BADGE_COLOR } from '@pages/home/constants/home';

import type { SCENARIO_STATUS } from '@apis/scenarios/scenarioTypes';
import type { TRAINING_SESSION_STATUS } from '@apis/trainingSessions/trainingSessionConstants';

export type MetricIconTone = 'blue' | 'yellow' | 'green' | 'purple';
export type MetricIconKey = 'activity' | 'clock' | 'trend' | 'user';

export interface HomeMetric {
  id: string;
  title: string;
  value: string;
  valueSuffix?: string;
  iconTone: MetricIconTone;
  iconKey: MetricIconKey;
  icon?: ReactNode;
}

export interface TrainingRecord {
  id: number;
  reportId?: string;
  name: string;
  date: string;
  participants: string;
  evacuationTime: string;
  survivalRate: string;
  grade: keyof typeof HOME_GRADE_BADGE_COLOR;
}

// 예정된 훈련의 홈 상태 상세 응답
export interface ScheduledTrainingStatusResponse {
  buildingName: string;
  totalFloors: number;
  scheduledAt: string;
  expectedParticipants: number;
}

// 진행 중인 훈련의 홈 상태 상세 응답
export interface RunningTrainingStatusResponse {
  buildingName: string;
  elapsedSeconds: number;
  actualParticipants: number;
  currentSurvivalRate: number;
  routeBlockedAt?: string | null;
  routeBlockedAfterSec?: number | null;
}

export type HomeTrainingStatusResponse =
  | ScheduledTrainingStatusResponse
  | RunningTrainingStatusResponse;

export interface ScheduledTraining {
  // READY에서는 시나리오 ID, 그 외에는 훈련 세션 ID.
  id: string;
  name: string;
  building: string;
  date: string;
  time: string;
  participants: string;
  startedAt?: string;
  status:
    | typeof SCENARIO_STATUS.READY
    | typeof TRAINING_SESSION_STATUS.RUNNING
    | typeof TRAINING_SESSION_STATUS.SCHEDULED;
}
