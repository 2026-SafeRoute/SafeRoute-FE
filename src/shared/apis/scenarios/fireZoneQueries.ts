import { queryOptions, useQuery } from '@tanstack/react-query';

import { getScenarioFireZones } from './fireZonesApi';

const RUNNING_FIRE_ZONE_REFETCH_INTERVAL_MS = 10_000;

export const fireZoneQueryKeys = {
  all: ['scenario-fire-zones'] as const,
  lists: () => [...fireZoneQueryKeys.all, 'list'] as const,
  list: (scenarioId?: string) => [...fireZoneQueryKeys.lists(), scenarioId] as const,
};

// 다른 페이지에서도 레이아웃이 확산 이벤트마다 미리 조회하고, 복귀 시에도 다시 조회한다.
export const fireZoneQueryOptions = (scenarioId: string) =>
  queryOptions({
    queryKey: fireZoneQueryKeys.list(scenarioId),
    queryFn: ({ signal }) => getScenarioFireZones(scenarioId, signal),
    staleTime: 0,
  });

export const useScenarioFireZonesQuery = (scenarioId?: string, enabled = true) =>
  useQuery({
    ...(scenarioId
      ? fireZoneQueryOptions(scenarioId)
      : {
          queryKey: fireZoneQueryKeys.list(),
          queryFn: () => Promise.reject(new Error('화재구역을 조회할 시나리오 ID가 필요합니다.')),
        }),
    enabled: enabled && Boolean(scenarioId),
    // 웹소켓 이벤트 누락·재연결 구간에도 확산 상태가 복구되도록 RUNNING에서만 보조 폴링한다.
    refetchInterval: enabled ? RUNNING_FIRE_ZONE_REFETCH_INTERVAL_MS : false,
  });
