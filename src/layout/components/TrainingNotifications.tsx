import { useCallback, useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router';

import { useGetTrainingStatusQuery } from '@pages/home/api/useTrainingStatusQuery';
import type { RunningTrainingStatusResponse } from '@pages/home/types/home';
import { monitoringQueryKeys } from '@pages/trainingAnalysis/api/monitoringQueryKeys';
import { useSessionContextQuery } from '@pages/trainingAnalysis/api/useSessionContextQuery';
import type { TrainingSessionContext } from '@pages/trainingAnalysis/types/trainingAnalysis';

import type { TrainingSessionSummaryResponse } from '@apis/__generated__/data-contracts';
import { scenarioQueryKeys } from '@apis/scenarios/scenarioQueryKeys';
import {
  SESSION_DISCOVERY_POLL_INTERVAL_MS,
  TRAINING_SESSION_STATUS,
} from '@apis/trainingSessions/trainingSessionConstants';
import { trainingSessionQueryKeys } from '@apis/trainingSessions/trainingSessionQueryKeys';
import { useGetTrainingSessionsQuery } from '@apis/trainingSessions/useGetTrainingSessionsQuery';
import { TRAINING_EVENT_TYPE } from '@apis/trainingSessions/websocket/trainingSessionEvents';
import type {
  EvacuationRouteBlockedEventData,
  TrainingSessionEvent,
  TrainingStatusEventData,
} from '@apis/trainingSessions/websocket/trainingSessionEvents';
import { useTrainingSessionSocket } from '@apis/trainingSessions/websocket/useTrainingSessionSocket';

import useToast from '@components/toast/useToast';

import { getScenarioDetailPath, ROUTES } from '@constants/path';

import { formatDuration } from '@utils/format';

import { useRouteRecalculationNotifications } from '../hooks/useRouteRecalculationNotifications';

interface SessionNotificationProps {
  session: TrainingSessionSummaryResponse;
  onEnded: (sessionId: string) => void;
}

const isActiveSessionStatus = (status: TrainingStatusEventData['status'] | undefined) =>
  status === TRAINING_SESSION_STATUS.RUNNING || status === TRAINING_SESSION_STATUS.SCHEDULED;

// RUNNING 목록에서 사라져도 상세 조회로 실제 종료 상태를 확인할 때까지 구독을 유지한다.
const SessionNotification = ({ session, onEnded }: SessionNotificationProps) => {
  const { show } = useToast();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: context } = useSessionContextQuery(session.sessionId);
  const { data: trainingStatus } = useGetTrainingStatusQuery(session.sessionId);
  const timedOut = context?.status === TRAINING_SESSION_STATUS.FAILED;
  const interrupted =
    context?.status === TRAINING_SESSION_STATUS.STOPPED ||
    context?.status === TRAINING_SESSION_STATUS.CANCELLED;
  const completed = context?.status === TRAINING_SESSION_STATUS.COMPLETED;
  const lastRouteBlockedEvent = useRef<string>();
  const isScenarioPage = Boolean(
    session.scenarioId && pathname === getScenarioDetailPath(session.scenarioId),
  );
  const isTrainingAnalysisPage =
    pathname === ROUTES.TRAINING_ANALYSIS || pathname.startsWith(`${ROUTES.TRAINING_ANALYSIS}/`);
  const handleRouteRecalculationEvent = useRouteRecalculationNotifications({
    session,
    isScenarioPage,
  });

  const showRouteBlockedWarning = useCallback(
    ({
      blockedAt,
      blockedAfterSec,
    }: Pick<EvacuationRouteBlockedEventData, 'blockedAt' | 'blockedAfterSec'>) => {
      const blockedAtEpoch = Date.parse(blockedAt);
      const eventKey = Number.isNaN(blockedAtEpoch)
        ? `elapsed:${blockedAfterSec}`
        : `blocked-at:${blockedAtEpoch}`;
      if (lastRouteBlockedEvent.current === eventKey) return;
      lastRouteBlockedEvent.current = eventKey;
      show({
        title: '대피 가능한 경로가 모두 차단되었습니다.',
        description: `화재 확산으로 시작 지점에서 출구까지 이동할 수 없습니다.\n(훈련 시작 ${formatDuration(blockedAfterSec)} 후)`,
        variant: 'warning',
        duration: 0,
      });
    },
    [show],
  );

  useTrainingSessionSocket({
    sessionId: session.sessionId,
    onEvent: (event) => {
      if (event.eventType === TRAINING_EVENT_TYPE.STATUS_UPDATED) {
        const statusEvent = event as TrainingSessionEvent<TrainingStatusEventData>;
        if (!isActiveSessionStatus(statusEvent.data.status)) {
          queryClient.setQueryData<TrainingSessionSummaryResponse[]>(
            trainingSessionQueryKeys.list(TRAINING_SESSION_STATUS.RUNNING),
            (sessions) =>
              sessions?.filter((item) => item.sessionId !== event.sessionId) ?? sessions,
          );
        }
        queryClient.setQueryData<TrainingSessionContext>(
          monitoringQueryKeys.context(event.sessionId),
          (current) =>
            current
              ? {
                  ...current,
                  status: statusEvent.data.status,
                  endedAt: statusEvent.data.endedAt
                    ? Date.parse(statusEvent.data.endedAt)
                    : current.endedAt,
                }
              : current,
        );
        void queryClient.invalidateQueries({
          queryKey: monitoringQueryKeys.context(event.sessionId),
        });
      }
      if (event.eventType === TRAINING_EVENT_TYPE.EVACUATION_ROUTE_BLOCKED) {
        const blockedEvent = event as TrainingSessionEvent<EvacuationRouteBlockedEventData>;
        showRouteBlockedWarning(blockedEvent.data);
        return;
      }
      handleRouteRecalculationEvent(event);
    },
  });

  useEffect(() => {
    const runningStatus = trainingStatus as RunningTrainingStatusResponse | undefined;
    if (
      !runningStatus?.routeBlockedAt ||
      runningStatus.routeBlockedAfterSec === null ||
      runningStatus.routeBlockedAfterSec === undefined
    )
      return;
    showRouteBlockedWarning({
      blockedAt: runningStatus.routeBlockedAt,
      blockedAfterSec: runningStatus.routeBlockedAfterSec,
    });
  }, [showRouteBlockedWarning, trainingStatus]);

  useEffect(() => {
    if (!context?.status || isActiveSessionStatus(context.status)) return;
    queryClient.setQueryData<TrainingSessionSummaryResponse[]>(
      trainingSessionQueryKeys.list(TRAINING_SESSION_STATUS.RUNNING),
      (sessions) => sessions?.filter((item) => item.sessionId !== session.sessionId) ?? sessions,
    );
    void queryClient.invalidateQueries({ queryKey: scenarioQueryKeys.all });
    void queryClient.invalidateQueries({ queryKey: trainingSessionQueryKeys.lists() });
  }, [context?.status, queryClient, session.sessionId]);

  useEffect(() => {
    if (!session.sessionId) return;
    const sessionEnded = Boolean(context?.status && !isActiveSessionStatus(context.status));
    if (!sessionEnded) return;

    const scenarioPath = session.scenarioId ? getScenarioDetailPath(session.scenarioId) : undefined;

    // 훈련 분석에서는 시간 초과 후 필요한 결과 입력 화면으로 바로 이어준다.
    if (timedOut && isTrainingAnalysisPage && scenarioPath) {
      void navigate(scenarioPath, {
        replace: true,
        state: { timedOutSessionId: session.sessionId },
      });
      onEnded(session.sessionId);
      return;
    }

    if (interrupted && isTrainingAnalysisPage) {
      show({ title: '오류로 인해 훈련이 종료되었습니다.', variant: 'error' });
      void navigate(ROUTES.TRAINING_ANALYSIS, { replace: true });
      onEnded(session.sessionId);
      return;
    }

    if (completed && isTrainingAnalysisPage) {
      show({ title: '훈련이 완료되었습니다.', variant: 'success' });
      void navigate(ROUTES.TRAINING_ANALYSIS, { replace: true });
      onEnded(session.sessionId);
      return;
    }

    // 시나리오 화면에서는 오류 안내 또는 결과 입력 모달이 안내한다.
    if (!isScenarioPage && (timedOut || interrupted || completed)) {
      show({
        title: timedOut
          ? '최대 훈련 시간 초과로 훈련이 종료되었습니다.'
          : interrupted
            ? '오류로 인해 훈련이 종료되었습니다.'
            : '훈련이 완료되었습니다.',
        description: timedOut
          ? `${session.scenarioName ?? '훈련'} 훈련이 종료되었습니다. 대피 완료 인원을 입력해 분석 보고서를 생성해 주세요.`
          : `${session.scenarioName ?? '훈련'}의 시나리오 화면에서 결과를 확인해 주세요.`,
        variant: timedOut ? 'warning' : interrupted ? 'error' : 'success',
        duration: 10000,
        actionLabel: timedOut && scenarioPath ? '결과 입력하러 가기' : undefined,
        onAction:
          timedOut && scenarioPath
            ? () => {
                void navigate(scenarioPath, {
                  state: { timedOutSessionId: session.sessionId },
                });
              }
            : undefined,
      });
    }
    onEnded(session.sessionId);
  }, [
    context,
    completed,
    interrupted,
    isScenarioPage,
    isTrainingAnalysisPage,
    navigate,
    onEnded,
    session,
    show,
    timedOut,
  ]);

  return null;
};

const TrainingNotifications = () => {
  const [trackedSessions, setTrackedSessions] = useState<TrainingSessionSummaryResponse[]>([]);
  const { data: runningSessions } = useGetTrainingSessionsQuery(TRAINING_SESSION_STATUS.RUNNING, {
    refetchIntervalMs: trackedSessions.length > 0 ? undefined : SESSION_DISCOVERY_POLL_INTERVAL_MS,
  });
  const endedSessionIds = useRef(new Set<string>());

  useEffect(() => {
    if (!runningSessions) return;
    setTrackedSessions((previous) => {
      const additions = runningSessions.filter(
        (session) =>
          session.sessionId &&
          !endedSessionIds.current.has(session.sessionId) &&
          !previous.some((tracked) => tracked.sessionId === session.sessionId),
      );
      return additions.length ? [...previous, ...additions] : previous;
    });
  }, [runningSessions]);

  const handleEnded = useCallback((sessionId: string) => {
    endedSessionIds.current.add(sessionId);
    setTrackedSessions((previous) => previous.filter((session) => session.sessionId !== sessionId));
  }, []);

  return trackedSessions.map((session) => (
    <SessionNotification key={session.sessionId} session={session} onEnded={handleEnded} />
  ));
};

export default TrainingNotifications;
