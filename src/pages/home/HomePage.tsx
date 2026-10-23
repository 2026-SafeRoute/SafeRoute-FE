import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { useGetBuildingsQuery } from '@apis/buildings/useBuildingsQuery';
import { extractApiError } from '@apis/errors/apiError';
import { setScenarioInProgressCache } from '@apis/scenarios/scenarioCache';
import { SCENARIO_STATUS } from '@apis/scenarios/scenarioTypes';
import { useGetScenariosQuery } from '@apis/scenarios/useScenariosQuery';
import { TRAINING_SESSION_STATUS } from '@apis/trainingSessions/trainingSessionConstants';
import { currentTrainingRouteQueryOptions } from '@apis/trainingSessions/useGetCurrentTrainingRouteQuery';
import { useGetTrainingSessionsQuery } from '@apis/trainingSessions/useGetTrainingSessionsQuery';
import { useStartTrainingSessionMutation } from '@apis/trainingSessions/useTrainingSessionMutations';
import { useTrainingSessionSocket } from '@apis/trainingSessions/websocket/useTrainingSessionSocket';

import ActivityIcon from '@assets/icons/ic-activity.svg?react';
import ArrowRightIcon from '@assets/icons/ic-arrow-right.svg?react';
import CalendarIcon from '@assets/icons/ic-calendar.svg?react';
import ClockIcon from '@assets/icons/ic-clock.svg?react';
import UsersIcon from '@assets/icons/ic-multi-user.svg?react';
import PlayIcon from '@assets/icons/ic-play.svg?react';
import TrendUpIcon from '@assets/icons/ic-trendup.svg?react';

import useToast from '@components/toast/useToast';

import {
  ROUTES,
  getReportPath,
  getScenarioDetailPath,
  getTrainingCamerasPath,
} from '@constants/path';

import { useGetDashboardStatsQuery } from './api/useDashboardStatsQuery';
import { useGetDashboardTrainingsQuery } from './api/useDashboardTrainingsQuery';
import { useGetTrainingStatusQuery } from './api/useTrainingStatusQuery';
import HomeSummarySection from './components/homeSummarySection/HomeSummarySection';
import RecentTrainingSection from './components/recentTrainingSection/RecentTrainingSection';
import ScheduledTrainingSection from './components/scheduledTrainingSection/ScheduledTrainingSection';
import * as styles from './HomePage.css';
import {
  toHomeMetrics,
  toReadyScenarioTraining,
  toScheduledTraining,
  toTrainingRecord,
} from './utils/home';

import type { HomeMetric } from './types/home';

const metricIcons: Record<HomeMetric['iconKey'], JSX.Element> = {
  activity: <ActivityIcon />,
  clock: <ClockIcon />,
  trend: <TrendUpIcon />,
  user: <UsersIcon />,
};

const sectionIcons = {
  calendar: <CalendarIcon />,
  action: <ArrowRightIcon />,
  play: <PlayIcon />,
};

const HomePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { show } = useToast();
  const { data: stats } = useGetDashboardStatsQuery();
  const { data: trainings = [] } = useGetDashboardTrainingsQuery();
  const { data: scenarios = [] } = useGetScenariosQuery();
  const { data: buildings = [] } = useGetBuildingsQuery();
  const { data: runningSessions = [] } = useGetTrainingSessionsQuery(
    TRAINING_SESSION_STATUS.RUNNING,
  );
  const { data: scheduledSessions = [] } = useGetTrainingSessionsQuery(
    TRAINING_SESSION_STATUS.SCHEDULED,
    { shouldPoll: false },
  );
  const startTrainingSessionMutation = useStartTrainingSessionMutation();
  const selectedSession = runningSessions[0] ?? scheduledSessions[0];
  const { data: trainingStatus } = useGetTrainingStatusQuery(selectedSession?.sessionId);
  const readyScenario = scenarios.find((scenario) => scenario.status === SCENARIO_STATUS.READY);
  const readyBuildingName = buildings.find(
    (building) => building.id === readyScenario?.buildingId,
  )?.name;
  const training = selectedSession
    ? toScheduledTraining(selectedSession, trainingStatus)
    : readyScenario
      ? toReadyScenarioTraining(readyScenario, readyBuildingName)
      : null;
  // 실시간 이벤트는 RUNNING 세션에만 필요하다. SCHEDULED 세션은 목록·상태 조회만 사용한다.
  useTrainingSessionSocket({ sessionId: runningSessions[0]?.sessionId });

  const handleTrainingAction = async () => {
    if (!training) return;

    if (training.status === SCENARIO_STATUS.READY) {
      void navigate(getScenarioDetailPath(training.id));
      return;
    }

    if (training.status === TRAINING_SESSION_STATUS.RUNNING) {
      // 훈련분석 개편으로 실시간 모니터링(TRAINING_MONITORING) 라우트는 제거됐지만,
      // 훈련분석의 카메라 목록·프레임 화면이 RUNNING 세션의 라이브 열람을 지원하므로 그쪽으로 보냄
      void navigate(getTrainingCamerasPath(training.id));
      return;
    }

    try {
      const currentRoute = await queryClient.fetchQuery({
        ...currentTrainingRouteQueryOptions(training.id),
        staleTime: 0,
      });
      if (!currentRoute.path?.length) {
        throw new Error('시작 지점에서 출구까지 연결된 기본 경로가 없습니다.');
      }

      await startTrainingSessionMutation.mutateAsync(training.id);
      if (selectedSession?.scenarioId) {
        setScenarioInProgressCache(
          queryClient,
          selectedSession.scenarioId,
          scenarios.find((scenario) => scenario.id === selectedSession.scenarioId),
        );
      }
      show({ title: '훈련이 시작되었습니다.', variant: 'success' });
    } catch (error) {
      const serverMessage = extractApiError(error).message;
      const description =
        serverMessage || (error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.');
      show({ title: '훈련 시작에 실패했습니다.', description, variant: 'error' });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.sectionContainer}>
        <HomeSummarySection
          metrics={toHomeMetrics(stats ?? {}).map((metric) => ({
            ...metric,
            icon: metricIcons[metric.iconKey],
          }))}
        />

        <div className={styles.contentGrid}>
          <div className={styles.sideColumn}>
            <ScheduledTrainingSection
              training={training}
              onAction={() => void handleTrainingAction()}
              isLoading={startTrainingSessionMutation.isPending}
              sectionIcon={sectionIcons.calendar}
              actionIcon={sectionIcons.play}
            />
          </div>

          <RecentTrainingSection
            records={trainings.map(toTrainingRecord)}
            actionIcon={sectionIcons.action}
            onViewAll={() => void navigate(ROUTES.SCENARIO_LIST)}
            onOpenReport={(reportId) => void navigate(getReportPath(reportId))}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
