import { useEffect, useRef } from 'react';

import { Client } from '@stomp/stompjs';
import { useQueryClient } from '@tanstack/react-query';

import { dashboardQueryKeys } from '@apis/dashboard/dashboardQueryKeys';
import { scenarioQueryKeys } from '@apis/scenarios/scenarioQueryKeys';
import { trainingSessionQueryKeys } from '@apis/trainingSessions/trainingSessionQueryKeys';

import { getAccessToken } from '@shared/auth/tokenStorage';

import { TRAINING_EVENT_TYPE } from './trainingSessionEvents';

import type { TrainingSessionEvent } from './trainingSessionEvents';

// WebSocket 구독 대상 세션과 이벤트 처리 함수
interface UseTrainingSessionSocketOptions {
  sessionId?: string | null;
  onEvent?: (event: TrainingSessionEvent, clientReceivedAt: number) => void;
}

// 세션별 STOMP 구독 경로 생성
const getTrainingSessionTopic = (sessionId: string) => `/topic/training-sessions/${sessionId}`;

// 훈련 세션 WebSocket 연결 및 이벤트 구독
export const useTrainingSessionSocket = ({
  sessionId,
  onEvent,
}: UseTrainingSessionSocketOptions) => {
  const queryClient = useQueryClient();
  const onEventRef = useRef(onEvent);

  // 콜백 변경 시 WebSocket을 재연결하지 않고 최신 함수만 참조
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  // JWT로 STOMP 서버에 연결하고 해당 훈련 세션 topic 구독
  useEffect(() => {
    const accessToken = getAccessToken();
    const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL?.replace(/\/$/, '');

    if (!sessionId || !accessToken || !wsBaseUrl) return;

    const client = new Client({
      brokerURL: `${wsBaseUrl}/ws`,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      reconnectDelay: 5_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      onConnect: () => {
        client.subscribe(getTrainingSessionTopic(sessionId), (message) => {
          // JSON 해석과 후속 캐시 갱신 시간을 제외한 WebSocket 도착 시점을 기록
          const clientReceivedAt = Date.now();
          try {
            const event = JSON.parse(message.body) as TrainingSessionEvent;

            if (event.sessionId !== sessionId) return;

            // 상태 변경 또는 경로 차단 시 홈 상태를 다시 조회해 새 서버 필드를 복원 가능하게 한다.
            if (
              event.eventType === TRAINING_EVENT_TYPE.STATUS_UPDATED ||
              event.eventType === TRAINING_EVENT_TYPE.EVACUATION_ROUTE_BLOCKED
            ) {
              const invalidations = [
                queryClient.invalidateQueries({
                  queryKey: dashboardQueryKeys.trainingStatus(sessionId),
                }),
              ];

              if (event.eventType === TRAINING_EVENT_TYPE.STATUS_UPDATED) {
                invalidations.push(
                  queryClient.invalidateQueries({
                    queryKey: trainingSessionQueryKeys.lists(),
                  }),
                  queryClient.invalidateQueries({
                    queryKey: scenarioQueryKeys.all,
                  }),
                );
              }

              void Promise.all(invalidations);
            }

            onEventRef.current?.(event, clientReceivedAt);
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('훈련 WebSocket 이벤트를 해석하지 못했습니다.', error);
            }
          }
        });
      },
    });

    client.activate();

    // 화면 이탈 또는 구독 세션 변경 시 연결 해제
    return () => {
      void client.deactivate();
    };
  }, [queryClient, sessionId]);
};
