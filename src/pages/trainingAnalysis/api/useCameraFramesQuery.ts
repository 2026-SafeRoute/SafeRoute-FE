import { useInfiniteQuery } from '@tanstack/react-query';

import { LIVE_MONITORING_IMAGE_POLL_INTERVAL_MS } from '@pages/trainingAnalysis/constants/trainingAnalysis';

import { getCameraFrames } from './monitoringApi';
import { monitoringQueryKeys } from './monitoringQueryKeys';

const FRAMES_PAGE_SIZE = 20;

// 카메라별 프레임 목록 — 최신순 커서 페이지네이션. 프레임 탐색에서 필요한 만큼만 이어서 불러옴.
// live=true(진행 중 훈련)면 WebSocket 누락에 대비해 주기적으로 다시 조회함
// (react-query가 로드된 페이지를 전부 다시 불러오므로 이미지 저장 주기보다 자주 조회하지 않음)
export const useCameraFramesQuery = (
  sessionId: string | undefined,
  cctvId: string | undefined,
  options?: { live?: boolean },
) =>
  useInfiniteQuery({
    queryKey: monitoringQueryKeys.frameLists(sessionId ?? '', cctvId ?? ''),
    queryFn: ({ pageParam, signal }) =>
      getCameraFrames(
        sessionId as string,
        cctvId as string,
        { limit: FRAMES_PAGE_SIZE, cursor: pageParam },
        signal,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: Boolean(sessionId && cctvId),
    refetchInterval: options?.live ? LIVE_MONITORING_IMAGE_POLL_INTERVAL_MS : false,
  });
