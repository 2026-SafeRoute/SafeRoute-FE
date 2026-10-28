import { useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { TRAINING_EVENT_TYPE } from '@apis/trainingSessions/websocket/trainingSessionEvents';
import type {
  CongestionUpdatedEventData,
  MonitoringEventCreatedData,
  TrainingEventType,
} from '@apis/trainingSessions/websocket/trainingSessionEvents';
import { useTrainingSessionSocket } from '@apis/trainingSessions/websocket/useTrainingSessionSocket';

import { monitoringQueryKeys } from './monitoringQueryKeys';

import type { CctvCurrentState } from '../types/trainingAnalysis';

// 이 이벤트들은 문구·심각도·정렬을 프론트에서 다시 조합하지 않고, 수신 즉시 이벤트 타임라인
// 첫 페이지를 다시 조회해서 서버 값을 그대로 반영함(명세 §9 권장 방식)
const TIMELINE_REFETCH_EVENT_TYPES: readonly TrainingEventType[] = [
  TRAINING_EVENT_TYPE.CONGESTION_EVENT_RECEIVED,
  TRAINING_EVENT_TYPE.ROUTE_RECALCULATION_REQUESTED,
  TRAINING_EVENT_TYPE.ROUTE_RECALCULATION_APPROVED,
  TRAINING_EVENT_TYPE.EVACUATION_ROUTE_UPDATED,
  TRAINING_EVENT_TYPE.ROUTE_RECALCULATION_REJECTED,
  TRAINING_EVENT_TYPE.ROUTE_RECALCULATION_CANCELLED,
  TRAINING_EVENT_TYPE.MONITORING_EVENT_CREATED,
];

interface CameraRef {
  cctvId: string;
  code: string;
}

// 훈련분석 화면(카메라 목록·프레임 상세)의 실시간 갱신을 담당하는 WebSocket 구독.
// REST 폴링은 그대로 두고(WS가 잠깐 끊겨도 최신 상태로 수렴하는 안전망), 이 훅은 그 사이의
// 지연을 줄이는 역할만 함 — 즉 이 훅이 실패해도 화면이 완전히 멈추지는 않음
export const useTrainingMonitoringSocket = (
  sessionId: string | undefined,
  cameras: CameraRef[],
) => {
  const queryClient = useQueryClient();
  // CONGESTION_UPDATED·MONITORING_EVENT_CREATED는 동일 eventId가 재전달될 수 있어(재연결 등)
  // 세션이 바뀌지 않는 한 계속 누적해서 중복 처리를 막음
  const processedEventIdsRef = useRef(new Set<string>());

  useTrainingSessionSocket({
    sessionId,
    onEvent: (event) => {
      if (!sessionId) return;

      if (event.eventType === TRAINING_EVENT_TYPE.CONGESTION_UPDATED) {
        const data = event.data as CongestionUpdatedEventData;
        if (!data?.eventId || processedEventIdsRef.current.has(data.eventId)) return;
        processedEventIdsRef.current.add(data.eventId);

        const cctv = cameras.find((c) => c.code === data.cctvCode);

        // CCTV별 현재 상태 캐시를 즉시 패치 — 다음 폴링 주기(최대 5초) 전에도 화면에 반영되게 함.
        // peakHeadcount를 "현재 감지 인원"으로 씀(명세 §6)
        queryClient.setQueryData<CctvCurrentState[]>(
          monitoringQueryKeys.currentStates(sessionId),
          (prev) => {
            const next: CctvCurrentState = {
              cctvId: cctv?.cctvId ?? '',
              cctvCode: data.cctvCode,
              avgHeadcount: data.avgHeadcount,
              peakHeadcount: data.peakHeadcount,
              density: data.density,
              congestionLevel: data.congestionLevel,
              lastDetectedAt: data.capturedAt,
              stale: false,
              configVersion: data.configVersion,
            };
            if (!prev) return [next];
            const index = prev.findIndex((state) => state.cctvCode === data.cctvCode);
            if (index === -1) return [...prev, next];
            const merged = [...prev];
            merged[index] = { ...merged[index], ...next };
            return merged;
          },
        );

        // 이미지가 새로 붙은 관측치면 카메라 목록 썸네일·해당 카메라 프레임 첫 페이지를 다시 조회
        if (data.hasMonitoringImage && cctv) {
          // 같은 시점에 안전망 폴링이 이미 진행 중이면 요청을 취소하고 다시 시작하지 않음. 진행 중인
          // 조회 결과를 먼저 반영하고, 서버 반영이 늦은 경우는 다음 안전망 폴링에서 수렴시킴
          void queryClient.invalidateQueries(
            { queryKey: monitoringQueryKeys.cameras(sessionId) },
            { cancelRefetch: false },
          );
          void queryClient.invalidateQueries(
            { queryKey: monitoringQueryKeys.frameLists(sessionId, cctv.cctvId) },
            { cancelRefetch: false },
          );
        }
        return;
      }

      if (event.eventType === TRAINING_EVENT_TYPE.MONITORING_EVENT_CREATED) {
        const data = event.data as MonitoringEventCreatedData;
        if (!data?.eventId || processedEventIdsRef.current.has(data.eventId)) return;
        processedEventIdsRef.current.add(data.eventId);
      }

      if (TIMELINE_REFETCH_EVENT_TYPES.includes(event.eventType)) {
        void queryClient.invalidateQueries({ queryKey: monitoringQueryKeys.eventsRoot(sessionId) });
        return;
      }

      // 훈련 상태 변경(종료 포함) — 세션 정보·카메라·현재 상태·프레임·타임라인을 전부 다시 조회.
      // 진행 시간 타이머는 context 재조회로 받아오는 endedAt/새 status가 화면 쪽에서 멈추게 함
      if (event.eventType === TRAINING_EVENT_TYPE.STATUS_UPDATED) {
        void queryClient.invalidateQueries({ queryKey: monitoringQueryKeys.context(sessionId) });
        void queryClient.invalidateQueries({
          queryKey: monitoringQueryKeys.currentStates(sessionId),
        });
        void queryClient.invalidateQueries({ queryKey: monitoringQueryKeys.cameras(sessionId) });
        void queryClient.invalidateQueries({ queryKey: monitoringQueryKeys.frames(sessionId) });
        void queryClient.invalidateQueries({ queryKey: monitoringQueryKeys.eventsRoot(sessionId) });
      }
    },
  });
};
