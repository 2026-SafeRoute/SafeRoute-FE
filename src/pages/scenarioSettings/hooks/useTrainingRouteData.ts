import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import {
  routeRecalculationQueryKeys,
  useApproveRouteRecalculationMutation,
  useRejectRouteRecalculationMutation,
  useRouteRecalculationDetailQuery,
  useRouteRecalculationsQuery,
} from '@pages/scenarioSettings/api/routeRecalculations/routeRecalculationQueries';
import type { RoutePoint } from '@pages/scenarioSettings/types/scenarioSettings';
import {
  createRouteEventState,
  getResolvedRecalculationId,
  getRouteEventKeys,
  getRouteEventStatus,
  isResolvedRecalculation,
  ROUTE_RECALCULATION_EVENT_TYPES,
} from '@pages/scenarioSettings/utils/trainingRouteEvents';
import {
  formatCurrentRoute,
  formatRouteProposal,
  getLatestRecalculation,
} from '@pages/scenarioSettings/utils/trainingRoutes';

import type {
  CurrentRouteResponse,
  RouteRecalculationSummaryResponse,
} from '@apis/__generated__/data-contracts';
import { floorQueryKeys } from '@apis/floors/floorQueries';
import { fireZoneQueryKeys } from '@apis/scenarios/fireZoneQueries';
import { trainingSessionQueryKeys } from '@apis/trainingSessions/trainingSessionQueryKeys';
import { useGetCurrentTrainingRouteQuery } from '@apis/trainingSessions/useGetCurrentTrainingRouteQuery';
import { TRAINING_EVENT_TYPE } from '@apis/trainingSessions/websocket/trainingSessionEvents';
import type {
  RouteRecalculationEventData,
  TrainingSessionEvent,
} from '@apis/trainingSessions/websocket/trainingSessionEvents';

interface UseTrainingRouteDataParams {
  sessionId?: string | null;
  enabled: boolean;
  liveUpdatesEnabled: boolean;
}

const getCurrentRouteMessage = (
  route: CurrentRouteResponse | undefined,
  isPending: boolean,
  isError: boolean,
) => {
  if (isPending) return '현재 대피 경로를 불러오는 중...';
  if (isError) return '현재 대피 경로를 불러오지 못했습니다.';
  return formatCurrentRoute(route);
};

const hasRouteCoordinates = (point: { x?: number; y?: number }): point is RoutePoint =>
  point.x !== undefined && point.y !== undefined;

export const useTrainingRouteData = ({
  sessionId,
  enabled,
  liveUpdatesEnabled,
}: UseTrainingRouteDataParams) => {
  const queryClient = useQueryClient();
  const eventStateRef = useRef(createRouteEventState(sessionId));

  useEffect(() => {
    if (eventStateRef.current.sessionId === sessionId) return;
    eventStateRef.current = createRouteEventState(sessionId);
  }, [sessionId]);

  const shouldFetch = enabled && Boolean(sessionId);
  const currentRouteQuery = useGetCurrentTrainingRouteQuery(sessionId, shouldFetch);
  const recalculationsQuery = useRouteRecalculationsQuery(
    sessionId ? { trainingSessionId: sessionId } : undefined,
    shouldFetch && liveUpdatesEnabled,
  );
  const fetchedRecalculations = useMemo(
    () => recalculationsQuery.data ?? [],
    [recalculationsQuery.data],
  );
  const recalculations = fetchedRecalculations.filter(
    (item) =>
      !item.recalculationId ||
      !isResolvedRecalculation(eventStateRef.current, sessionId, item.recalculationId),
  );
  const visibleRecalculation = getLatestRecalculation(
    recalculations.filter((item) => item.status === 'PENDING' || item.status === 'CANCELLED'),
  );
  const pendingRecalculation =
    visibleRecalculation?.status === 'PENDING' ? visibleRecalculation : undefined;
  const detailQuery = useRouteRecalculationDetailQuery(
    pendingRecalculation?.recalculationId,
    shouldFetch && liveUpdatesEnabled,
  );
  const approveMutation = useApproveRouteRecalculationMutation();
  const rejectMutation = useRejectRouteRecalculationMutation();
  const routeProposal = formatRouteProposal(detailQuery.data, visibleRecalculation);
  const currentRouteMessage = getCurrentRouteMessage(
    currentRouteQuery.data,
    currentRouteQuery.isPending,
    currentRouteQuery.isError,
  );

  const removeResolvedRecalculation = useCallback(
    (recalculationId: string) => {
      if (eventStateRef.current.sessionId !== sessionId) return;
      eventStateRef.current.resolvedRecalculationIds.add(recalculationId);
      if (!sessionId) return;

      queryClient.setQueryData<RouteRecalculationSummaryResponse[]>(
        routeRecalculationQueryKeys.list({ trainingSessionId: sessionId }),
        (items) => items?.filter((item) => item.recalculationId !== recalculationId),
      );
      queryClient.removeQueries({
        queryKey: routeRecalculationQueryKeys.detail(recalculationId),
        exact: true,
      });
    },
    [queryClient, sessionId],
  );

  const restoreRecalculationAfterMutationError = useCallback(
    (recalculationId: string) => {
      if (eventStateRef.current.sessionId !== sessionId) return;
      eventStateRef.current.resolvedRecalculationIds.delete(recalculationId);
      void queryClient.invalidateQueries({ queryKey: routeRecalculationQueryKeys.all });
    },
    [queryClient, sessionId],
  );

  const handleTrainingEvent = useCallback(
    (event: TrainingSessionEvent) => {
      if (event.sessionId !== sessionId || eventStateRef.current.sessionId !== sessionId) return;

      if (ROUTE_RECALCULATION_EVENT_TYPES.includes(event.eventType)) {
        const routeEvent = event as TrainingSessionEvent<RouteRecalculationEventData>;
        const status = getRouteEventStatus(routeEvent);
        const eventKeys = getRouteEventKeys(routeEvent, status);
        if (eventKeys.some((key) => eventStateRef.current.processedEventKeys.has(key))) return;
        eventKeys.forEach((key) => eventStateRef.current.processedEventKeys.add(key));

        const resolvedId = getResolvedRecalculationId(routeEvent.data, fetchedRecalculations);
        if (status === 'CANCELLED') {
          if (resolvedId) eventStateRef.current.resolvedRecalculationIds.delete(resolvedId);
        } else if (status !== 'PENDING' && resolvedId) {
          removeResolvedRecalculation(resolvedId);
        }

        void queryClient.invalidateQueries({ queryKey: routeRecalculationQueryKeys.all });
        if (status === 'APPROVED') {
          void queryClient.invalidateQueries({
            queryKey: trainingSessionQueryKeys.currentRoute(sessionId ?? undefined),
          });
        }
      }

      if (event.eventType === TRAINING_EVENT_TYPE.FIRE_SPREAD_UPDATED) {
        void queryClient.invalidateQueries({ queryKey: fireZoneQueryKeys.lists() });
      }

      if (event.eventType === TRAINING_EVENT_TYPE.IOT_LIGHT_STATUS_UPDATED) {
        void queryClient.invalidateQueries({ queryKey: floorQueryKeys.lights() });
      }
    },
    [fetchedRecalculations, queryClient, removeResolvedRecalculation, sessionId],
  );

  return {
    currentRouteMessage,
    routeFloorId: currentRouteQuery.data?.floorId ?? null,
    // 경로 계산은 서버 책임이다. current-route가 준 좌표만 이어서 도면에 표시한다.
    routePoints: currentRouteQuery.data?.path?.filter(hasRouteCoordinates) ?? [],
    routeProposal,
    isApplyingRouteProposal: approveMutation.isPending,
    isRejectingRouteProposal: rejectMutation.isPending,
    approveRouteProposal: async () => {
      if (!pendingRecalculation?.recalculationId) return Promise.resolve(undefined);
      const recalculationId = pendingRecalculation.recalculationId;
      removeResolvedRecalculation(recalculationId);
      try {
        return await approveMutation.mutateAsync(recalculationId);
      } catch (error) {
        restoreRecalculationAfterMutationError(recalculationId);
        throw error;
      }
    },
    rejectRouteProposal: async () => {
      if (!pendingRecalculation?.recalculationId) return Promise.resolve(undefined);
      const recalculationId = pendingRecalculation.recalculationId;
      removeResolvedRecalculation(recalculationId);
      try {
        return await rejectMutation.mutateAsync({ recalculationId });
      } catch (error) {
        restoreRecalculationAfterMutationError(recalculationId);
        throw error;
      }
    },
    handleTrainingEvent,
  };
};
