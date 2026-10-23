import { useCallback, useEffect, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import type { TrainingSessionSummaryResponse } from '@apis/__generated__/data-contracts';
import { setScenarioInProgressCache } from '@apis/scenarios/scenarioCache';
import { scenarioQueryKeys } from '@apis/scenarios/scenarioQueryKeys';
import { getScenario } from '@apis/scenarios/scenariosApi';
import { SCENARIO_STATUS } from '@apis/scenarios/scenarioTypes';
import type { Scenario } from '@apis/scenarios/scenarioTypes';
import {
  MAX_TRAINING_DURATION_MS,
  TRAINING_SESSION_STATUS,
} from '@apis/trainingSessions/trainingSessionConstants';
import { trainingSessionQueryKeys } from '@apis/trainingSessions/trainingSessionQueryKeys';
import { getTrainingSessions } from '@apis/trainingSessions/trainingSessionsApi';
import { currentTrainingRouteQueryOptions } from '@apis/trainingSessions/useGetCurrentTrainingRouteQuery';
import { useGetTrainingSessionsQuery } from '@apis/trainingSessions/useGetTrainingSessionsQuery';
import {
  useCreateTrainingSessionMutation,
  useEndTrainingSessionMutation,
  useForceEndTrainingSessionMutation,
  useStartTrainingSessionMutation,
} from '@apis/trainingSessions/useTrainingSessionMutations';
import { TRAINING_EVENT_TYPE } from '@apis/trainingSessions/websocket/trainingSessionEvents';
import type {
  TrainingSessionEvent,
  TrainingStatusEventData,
} from '@apis/trainingSessions/websocket/trainingSessionEvents';
import { useTrainingSessionSocket } from '@apis/trainingSessions/websocket/useTrainingSessionSocket';

import { useTrainingRouteData } from './useTrainingRouteData';

interface UseScenarioTrainingParams {
  scenario?: Scenario;
  adminId?: string;
}

const getSessionEndedAt = (endedAt?: string | null) => {
  const parsedEndedAt = endedAt ? Date.parse(endedAt) : Number.NaN;
  return Number.isNaN(parsedEndedAt) ? Date.now() : parsedEndedAt;
};

export const useScenarioTraining = ({ scenario, adminId }: UseScenarioTrainingParams) => {
  const queryClient = useQueryClient();
  // 목록 쿼리가 갱신되기 전에도 시작 직후 화면을 전환할 수 있도록 시작 응답을 임시 보관
  const [startedSession, setStartedSession] = useState<{
    id: string;
    startedAt: string;
  } | null>(null);
  // 대피 설정 직후 생성한 SCHEDULED 세션을 목록 재조회 전에도 경로 미리보기에 사용
  const [preparedSessionId, setPreparedSessionId] = useState<string | null>(null);
  // 서버에서 실패 종료가 확인된 세션 ID를 유지하고, 실패 원인은 시나리오 상태로 구분
  const [confirmedFailedSessionId, setConfirmedFailedSessionId] = useState<string | null>(null);
  const [sessionEndedAt, setSessionEndedAt] = useState<number | null>(null);

  // 훈련 세션 예약·시작·종료
  const createSessionMutation = useCreateTrainingSessionMutation();
  const startSessionMutation = useStartTrainingSessionMutation();
  const endSessionMutation = useEndTrainingSessionMutation();
  const forceEndSessionMutation = useForceEndTrainingSessionMutation();

  // 시작 가능한 시나리오에서만 실행 중·예약 세션 조회
  const shouldQuerySessions =
    scenario?.status === SCENARIO_STATUS.READY || scenario?.status === SCENARIO_STATUS.IN_PROGRESS;
  const shouldPollRunningSessions =
    scenario?.status === SCENARIO_STATUS.IN_PROGRESS || startedSession !== null;
  const { data: runningSessions = [], isPending: isRunningSessionsPending } =
    useGetTrainingSessionsQuery(TRAINING_SESSION_STATUS.RUNNING, {
      enabled: shouldQuerySessions,
      shouldPoll: shouldPollRunningSessions,
    });
  const { data: scheduledSessions = [], isPending: isScheduledSessionsPending } =
    useGetTrainingSessionsQuery(TRAINING_SESSION_STATUS.SCHEDULED, {
      enabled: shouldQuerySessions,
      shouldPoll: false,
    });

  // 최신 응답의 scenarioId로 현재 시나리오 세션을 식별
  const runningSession = runningSessions.find((session) => session.scenarioId === scenario?.id);
  const scheduledSession = scheduledSessions.find((session) => session.scenarioId === scenario?.id);

  // 시작 직후에는 API 응답을 사용하고, 재진입 시에는 조회된 실행 세션 사용
  const activeSessionId = startedSession?.id ?? runningSession?.sessionId ?? null;
  const scheduledSessionId = preparedSessionId ?? scheduledSession?.sessionId ?? null;
  const activeStartedAt = startedSession?.startedAt ?? runningSession?.startedAt ?? null;
  const startedAt = activeStartedAt ? Date.parse(activeStartedAt) : null;
  const isRunning = activeSessionId !== null && startedAt !== null && !Number.isNaN(startedAt);

  // SCHEDULED부터 현재 경로를 조회하고, 실시간 이벤트는 RUNNING일 때만 연결
  const route = useTrainingRouteData({
    sessionId: activeSessionId ?? scheduledSessionId,
    enabled: Boolean(activeSessionId ?? scheduledSessionId),
    liveUpdatesEnabled: isRunning,
  });
  const handleRouteTrainingEvent = route.handleTrainingEvent;

  const clearLocalSessionState = useCallback(() => {
    setStartedSession(null);
    setPreparedSessionId(null);
  }, []);

  // 종료 이벤트 직후 이전 RUNNING·SCHEDULED 캐시가 세션을 다시 활성화하지 않도록 제거
  const removeSessionFromActiveCaches = useCallback(
    (sessionId: string) => {
      const removeSession = (sessions?: TrainingSessionSummaryResponse[]) =>
        sessions?.filter((session) => session.sessionId !== sessionId);

      queryClient.setQueryData(
        trainingSessionQueryKeys.list(TRAINING_SESSION_STATUS.RUNNING),
        removeSession,
      );
      queryClient.setQueryData(
        trainingSessionQueryKeys.list(TRAINING_SESSION_STATUS.SCHEDULED),
        removeSession,
      );
    },
    [queryClient],
  );

  const markSessionFailed = useCallback(
    (sessionId: string, endedAt?: string | null) => {
      removeSessionFromActiveCaches(sessionId);
      clearLocalSessionState();
      setConfirmedFailedSessionId(sessionId);
      setSessionEndedAt(getSessionEndedAt(endedAt));
      void queryClient.invalidateQueries({ queryKey: scenarioQueryKeys.all });
    },
    [clearLocalSessionState, queryClient, removeSessionFromActiveCaches],
  );

  // WebSocket이나 세션 목록 반영이 늦어도 서버의 시나리오 종료 상태로 화면을 정리한다.
  useEffect(() => {
    if (!activeSessionId) return;
    if (scenario?.status === SCENARIO_STATUS.COMPLETED) {
      removeSessionFromActiveCaches(activeSessionId);
      clearLocalSessionState();
      setSessionEndedAt(Date.now());
      return;
    }
    if (
      scenario?.status !== SCENARIO_STATUS.TIMEOUT_FAILED &&
      scenario?.status !== SCENARIO_STATUS.ERROR
    ) {
      return;
    }
    markSessionFailed(activeSessionId);
  }, [
    activeSessionId,
    clearLocalSessionState,
    markSessionFailed,
    removeSessionFromActiveCaches,
    scenario?.status,
  ]);

  const handleTrainingEvent = useCallback(
    (event: TrainingSessionEvent) => {
      handleRouteTrainingEvent(event);
      if (event.eventType !== TRAINING_EVENT_TYPE.STATUS_UPDATED) return;

      const statusEvent = event as TrainingSessionEvent<TrainingStatusEventData>;
      if (
        statusEvent.data.status === TRAINING_SESSION_STATUS.RUNNING ||
        statusEvent.data.status === TRAINING_SESSION_STATUS.SCHEDULED
      ) {
        return;
      }

      if (statusEvent.data.status !== TRAINING_SESSION_STATUS.FAILED) {
        removeSessionFromActiveCaches(event.sessionId);
        clearLocalSessionState();
        setSessionEndedAt(getSessionEndedAt(statusEvent.data.endedAt));
        return;
      }

      markSessionFailed(event.sessionId, statusEvent.data.endedAt);
    },
    [
      clearLocalSessionState,
      handleRouteTrainingEvent,
      markSessionFailed,
      removeSessionFromActiveCaches,
    ],
  );

  useTrainingSessionSocket({ sessionId: activeSessionId, onEvent: handleTrainingEvent });

  // 시나리오 생성 직후 또는 예약 세션이 없을 때 훈련 일정 등록
  const scheduleTraining = async (scenarioId: string) => {
    if (!adminId) throw new Error('훈련 세션을 등록할 관리자 ID가 없습니다.');

    const session = await createSessionMutation.mutateAsync({
      scenarioId,
      body: { adminId },
    });
    if (!session.id) throw new Error('생성된 훈련 세션 ID가 없습니다.');
    setPreparedSessionId(session.id);
    return session;
  };

  // 이미 생성된 예약 세션은 재사용하고 없을 때만 생성
  const ensureScheduledSession = async (scenarioId: string) => {
    if (scheduledSessionId) return scheduledSessionId;
    const session = await scheduleTraining(scenarioId);
    return session.id;
  };

  // 서버가 기본 경로를 반환하는지 마지막으로 검증한 뒤 훈련 시작
  const startTraining = async () => {
    if (!scenario || !adminId) throw new Error('훈련을 시작할 시나리오 정보가 없습니다.');

    const sessionId = await ensureScheduledSession(scenario.id);

    if (!sessionId) throw new Error('시작할 훈련 세션 ID가 없습니다.');

    const currentRoute = await queryClient.fetchQuery({
      ...currentTrainingRouteQueryOptions(sessionId),
      staleTime: 0,
    });
    if (!currentRoute.path?.length) {
      throw new Error('시작 지점에서 출구까지 연결된 기본 경로가 없습니다.');
    }

    const session = await startSessionMutation.mutateAsync(sessionId);
    if (!session.id || !session.startedAt) {
      throw new Error('시작된 훈련 세션 정보가 없습니다.');
    }

    setScenarioInProgressCache(queryClient, scenario.id, scenario);
    setStartedSession({ id: session.id, startedAt: session.startedAt });
    setConfirmedFailedSessionId(null);
    setSessionEndedAt(null);
  };

  // 현재 실행 중인 훈련 종료
  const endTraining = async () => {
    if (scenario?.status === SCENARIO_STATUS.ERROR) {
      throw new Error('오류로 종료된 훈련은 분석 보고서를 생성할 수 없습니다.');
    }
    if (!activeSessionId) throw new Error('종료할 훈련 세션 ID가 없습니다.');
    if (startedAt !== null && Date.now() >= startedAt + MAX_TRAINING_DURATION_MS) {
      if (!scenario) throw new Error('시나리오 정보를 확인할 수 없습니다.');

      const [endedScenario, failedSessions] = await Promise.all([
        getScenario(scenario.id),
        getTrainingSessions(TRAINING_SESSION_STATUS.FAILED),
      ]);
      queryClient.setQueryData(scenarioQueryKeys.detail(scenario.id), endedScenario);

      if (
        endedScenario.status === SCENARIO_STATUS.ERROR ||
        endedScenario.status === SCENARIO_STATUS.TIMEOUT_FAILED
      ) {
        markSessionFailed(activeSessionId);
      }
      if (endedScenario.status === SCENARIO_STATUS.ERROR) {
        return SCENARIO_STATUS.ERROR;
      }
      if (endedScenario.status === SCENARIO_STATUS.TIMEOUT_FAILED) {
        return SCENARIO_STATUS.TIMEOUT_FAILED;
      }
      if (failedSessions.some((session) => session.sessionId === activeSessionId)) {
        markSessionFailed(activeSessionId);
        return SCENARIO_STATUS.TIMEOUT_FAILED;
      }

      throw new Error('10분 초과 자동 종료가 서버에 아직 반영되지 않았습니다.');
    }
    const endedSession = await endSessionMutation.mutateAsync(activeSessionId);
    setSessionEndedAt(getSessionEndedAt(endedSession.endedAt));
    clearLocalSessionState();
    return SCENARIO_STATUS.COMPLETED;
  };

  // 장비·서버 오류로 정상 종료할 수 없을 때만 관리자가 수동으로 중단
  const forceEndTraining = async () => {
    if (!activeSessionId) throw new Error('중단할 훈련 세션 ID가 없습니다.');

    const endedSession = await forceEndSessionMutation.mutateAsync(activeSessionId);
    removeSessionFromActiveCaches(activeSessionId);
    clearLocalSessionState();
    setSessionEndedAt(getSessionEndedAt(endedSession.endedAt));
  };

  return {
    route,
    sessionId: activeSessionId,
    startedAt,
    endedAt: sessionEndedAt,
    isRunning,
    areSessionsPending:
      shouldQuerySessions && (isRunningSessionsPending || isScheduledSessionsPending),
    isScheduling: createSessionMutation.isPending,
    isStarting: createSessionMutation.isPending || startSessionMutation.isPending,
    isEnding: endSessionMutation.isPending,
    isForceEnding: forceEndSessionMutation.isPending,
    timedOutSessionId: scenario?.status === SCENARIO_STATUS.ERROR ? null : confirmedFailedSessionId,
    ensureScheduledSession,
    startTraining,
    endTraining,
    forceEndTraining,
  };
};
