import type {
  HomeMetric,
  HomeTrainingStatusResponse,
  RunningTrainingStatusResponse,
  ScheduledTraining,
  ScheduledTrainingStatusResponse,
  TrainingRecord,
} from '@pages/home/types/home';

import type {
  DashboardStatsResponse,
  RecentTrainingReportResponse,
  TrainingSessionSummaryResponse,
} from '@apis/__generated__/data-contracts';
import { SCENARIO_STATUS } from '@apis/scenarios/scenarioTypes';
import type { Scenario } from '@apis/scenarios/scenarioTypes';
import { TRAINING_SESSION_STATUS } from '@apis/trainingSessions/trainingSessionConstants';

import { formatDate, formatDuration } from '@utils/format';

const formatTime = (iso?: string) => {
  if (!iso) return '-';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

const isRunningTrainingStatus = (
  status?: HomeTrainingStatusResponse,
): status is RunningTrainingStatusResponse => Boolean(status && 'elapsedSeconds' in status);

const isScheduledTrainingStatus = (
  status?: HomeTrainingStatusResponse,
): status is ScheduledTrainingStatusResponse => Boolean(status && 'scheduledAt' in status);

const formatParticipants = (count?: number) =>
  count === undefined ? '-' : `${count.toLocaleString()}명`;

export const toHomeMetrics = (stats: DashboardStatsResponse): HomeMetric[] => [
  {
    id: 'sessions',
    title: '총 훈련 세션',
    value: (stats.totalSessions ?? 0).toLocaleString(),
    iconTone: 'blue',
    iconKey: 'activity',
  },
  {
    id: 'response-time',
    title: '평균 대피 시간',
    value: formatDuration(stats.avgEvacuationSec),
    valueSuffix: '분',
    iconTone: 'yellow',
    iconKey: 'clock',
  },
  {
    id: 'survival-rate',
    title: '평균 대피 성공률',
    value: (stats.avgSurvivalRate ?? 0).toFixed(1),
    valueSuffix: '%',
    iconTone: 'green',
    iconKey: 'trend',
  },
  {
    id: 'participants',
    title: '총 참가 인원',
    value: (stats.totalParticipants ?? 0).toLocaleString(),
    iconTone: 'purple',
    iconKey: 'user',
  },
];

export const toTrainingRecord = (
  training: RecentTrainingReportResponse,
  index: number,
): TrainingRecord => ({
  id: index,
  reportId: training.reportId,
  name: training.scenarioName ?? '-',
  date: formatDate(training.startedAt),
  participants: `${training.participantCount ?? 0}명`,
  evacuationTime: formatDuration(training.avgEvacuationSec),
  survivalRate: `${training.survivalRate ?? 0}%`,
  grade: training.grade ?? 'C',
});

export const toScheduledTraining = (
  session?: TrainingSessionSummaryResponse,
  trainingStatus?: HomeTrainingStatusResponse,
): ScheduledTraining | null => {
  if (!session?.sessionId) return null;

  const isRunning = session.status === TRAINING_SESSION_STATUS.RUNNING;
  const runningStatus = isRunningTrainingStatus(trainingStatus) ? trainingStatus : undefined;
  const scheduledStatus = isScheduledTrainingStatus(trainingStatus) ? trainingStatus : undefined;
  const scheduledAt = scheduledStatus?.scheduledAt ?? session.startedAt;

  return {
    id: session.sessionId,
    name: session.scenarioName ?? '-',
    building: trainingStatus?.buildingName ?? session.buildingName ?? '-',
    date: formatDate(scheduledAt),
    time: formatTime(scheduledAt),
    participants: formatParticipants(
      isRunning ? runningStatus?.actualParticipants : scheduledStatus?.expectedParticipants,
    ),
    startedAt: isRunning ? session.startedAt : undefined,
    status: isRunning ? TRAINING_SESSION_STATUS.RUNNING : TRAINING_SESSION_STATUS.SCHEDULED,
  };
};

// READY 시나리오는 발화 위치·START 후보 저장 전에 세션 없이 존재할 수 있다.
// 홈에서는 준비 대상으로 보여주되 세션 시작 액션과 구분한다.
export const toReadyScenarioTraining = (
  scenario: Scenario,
  buildingName?: string,
): ScheduledTraining => ({
  id: scenario.id,
  name: scenario.name ?? '-',
  building: buildingName ?? '-',
  date: formatDate(scenario.scheduledAt),
  time: formatTime(scenario.scheduledAt),
  participants: formatParticipants(scenario.expectedParticipants),
  status: SCENARIO_STATUS.READY,
});
