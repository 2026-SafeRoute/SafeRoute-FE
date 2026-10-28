import { useQuery } from '@tanstack/react-query';

import { LIVE_MONITORING_IMAGE_POLL_INTERVAL_MS } from '@pages/trainingAnalysis/constants/trainingAnalysis';

import { getSessionCameras } from './monitoringApi';
import { monitoringQueryKeys } from './monitoringQueryKeys';

// 세션의 카메라별 최신 캡처 목록 (카메라 목록 화면).
// live=true(진행 중 훈련)면 최신 캡처 썸네일을 반영하려고 주기적으로 다시 조회
export const useSessionCamerasQuery = (
  sessionId: string | undefined,
  options?: { live?: boolean },
) =>
  useQuery({
    queryKey: monitoringQueryKeys.cameras(sessionId ?? ''),
    queryFn: ({ signal }) => getSessionCameras(sessionId as string, signal),
    enabled: Boolean(sessionId),
    refetchInterval: options?.live ? LIVE_MONITORING_IMAGE_POLL_INTERVAL_MS : false,
  });
