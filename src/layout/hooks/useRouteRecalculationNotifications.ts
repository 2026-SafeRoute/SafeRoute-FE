import { useCallback, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import {
  routeRecalculationDetailQueryOptions,
  routeRecalculationQueryKeys,
} from '@pages/scenarioSettings/api/routeRecalculations/routeRecalculationQueries';
import {
  ROUTE_RECALCULATION_EXPIRED_MESSAGE,
  ROUTE_RECALCULATION_EXPIRED_TITLE,
} from '@pages/scenarioSettings/constants/scenarioSettings';
import {
  getRouteEventStatus,
  ROUTE_RECALCULATION_EVENT_TYPES,
} from '@pages/scenarioSettings/utils/trainingRouteEvents';

import type {
  RouteRecalculationSummaryResponse,
  TrainingSessionSummaryResponse,
} from '@apis/__generated__/data-contracts';
import { TRAINING_EVENT_TYPE } from '@apis/trainingSessions/websocket/trainingSessionEvents';
import type {
  RouteRecalculationEventData,
  TrainingSessionEvent,
} from '@apis/trainingSessions/websocket/trainingSessionEvents';

import useToast from '@components/toast/useToast';

import { getScenarioDetailPath } from '@constants/path';

interface ActiveRouteToast {
  id: string;
  recalculationId?: string;
}

interface UseRouteRecalculationNotificationsParams {
  session: TrainingSessionSummaryResponse;
  isScenarioPage: boolean;
}

const getRouteRecalculationId = (data: RouteRecalculationEventData) =>
  data.recalculationId ??
  data.eventId?.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
  )?.[0] ??
  data.eventId;

const isSameRouteRecalculation = (
  activeRecalculationId: string | undefined,
  eventRecalculationId: string | undefined,
) =>
  Boolean(
    activeRecalculationId &&
    eventRecalculationId &&
    (activeRecalculationId === eventRecalculationId ||
      eventRecalculationId.startsWith(activeRecalculationId) ||
      activeRecalculationId.startsWith(eventRecalculationId)),
  );

export const useRouteRecalculationNotifications = ({
  session,
  isScenarioPage,
}: UseRouteRecalculationNotificationsParams) => {
  const { show, update, dismiss } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const processedEventKeys = useRef(new Set<string>());
  const activeToast = useRef<ActiveRouteToast>();

  const syncCache = useCallback(
    (
      event: TrainingSessionEvent<RouteRecalculationEventData>,
      recalculationId: string | undefined,
    ) => {
      if (!recalculationId) return;

      const params = { trainingSessionId: event.sessionId };
      const status = getRouteEventStatus(event);
      const eventSummary: RouteRecalculationSummaryResponse = {
        recalculationId,
        trainingSessionId: event.sessionId,
        status,
        requestedAt: event.occurredAt,
        triggerEdgeId: event.data.triggerEdgeId ?? undefined,
        triggerType: event.data.triggerType,
        congestionLevel: event.data.congestionLevel ?? undefined,
      };

      queryClient.setQueryData<RouteRecalculationSummaryResponse[]>(
        routeRecalculationQueryKeys.list(params),
        (items) => {
          const existing = items?.find((item) => item.recalculationId === recalculationId);
          if (!existing && status !== 'PENDING' && status !== 'CANCELLED') return items;

          const updated = {
            ...existing,
            ...eventSummary,
            requestedAt: existing?.requestedAt ?? eventSummary.requestedAt,
          };
          return existing
            ? items?.map((item) => (item.recalculationId === recalculationId ? updated : item))
            : [updated, ...(items ?? [])];
        },
      );

      if (status === 'PENDING') {
        void queryClient.prefetchQuery(routeRecalculationDetailQueryOptions(recalculationId));
      }
    },
    [queryClient],
  );

  return useCallback(
    (event: TrainingSessionEvent) => {
      if (!ROUTE_RECALCULATION_EVENT_TYPES.includes(event.eventType)) return;

      const routeEvent = event as TrainingSessionEvent<RouteRecalculationEventData>;
      const recalculationId = getRouteRecalculationId(routeEvent.data);
      const eventKey = `${event.eventType}:${recalculationId ?? event.occurredAt}`;
      if (processedEventKeys.current.has(eventKey)) return;
      processedEventKeys.current.add(eventKey);
      syncCache(routeEvent, recalculationId);

      if (event.eventType === TRAINING_EVENT_TYPE.ROUTE_RECALCULATION_REQUESTED) {
        if (isScenarioPage) return;

        const requestToast = {
          title: '대피 경로 재탐색 요청이 도착했습니다.',
          description: `${session.scenarioName ?? '진행 중인 훈련'}의 시나리오 화면에서 경로 변경 제안을 확인해 주세요.`,
          variant: 'warning' as const,
          duration: 0,
          actionLabel: '시나리오로 이동',
          onAction: () => {
            activeToast.current = undefined;
            if (session.scenarioId) void navigate(getScenarioDetailPath(session.scenarioId));
          },
        };
        const currentToast = activeToast.current;
        const toastId =
          currentToast && update(currentToast.id, requestToast)
            ? currentToast.id
            : show(requestToast);
        activeToast.current = { id: toastId, recalculationId };
        return;
      }

      const currentToast = activeToast.current;
      if (
        !currentToast ||
        !isSameRouteRecalculation(currentToast.recalculationId, recalculationId)
      ) {
        return;
      }

      if (event.eventType === TRAINING_EVENT_TYPE.ROUTE_RECALCULATION_CANCELLED) {
        const updated = update(currentToast.id, {
          title: ROUTE_RECALCULATION_EXPIRED_TITLE,
          description: ROUTE_RECALCULATION_EXPIRED_MESSAGE,
          variant: 'default',
          icon: 'info',
          descriptionNoWrap: true,
          duration: 0,
        });
        if (!updated) activeToast.current = undefined;
        return;
      }

      dismiss(currentToast.id);
      activeToast.current = undefined;
    },
    [
      dismiss,
      isScenarioPage,
      navigate,
      session.scenarioId,
      session.scenarioName,
      show,
      syncCache,
      update,
    ],
  );
};
