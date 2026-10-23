import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { trainingSessionQueryKeys } from '@apis/trainingSessions/trainingSessionQueryKeys';

import {
  getRouteRecalculationDetail,
  getRouteRecalculations,
  patchApproveRouteRecalculation,
  patchRejectRouteRecalculation,
} from './routeRecalculationsApi';

import type { GetRouteRecalculationsParams } from './routeRecalculationsApi';

const PENDING_RECALCULATION_REFETCH_INTERVAL_MS = 10_000;

export const routeRecalculationQueryKeys = {
  all: ['route-recalculations'] as const,
  lists: () => [...routeRecalculationQueryKeys.all, 'list'] as const,
  list: (params?: Partial<GetRouteRecalculationsParams>) =>
    [...routeRecalculationQueryKeys.lists(), params] as const,
  details: () => [...routeRecalculationQueryKeys.all, 'detail'] as const,
  detail: (recalculationId?: string) =>
    [...routeRecalculationQueryKeys.details(), recalculationId] as const,
};

export const routeRecalculationDetailQueryOptions = (recalculationId: string) =>
  queryOptions({
    queryKey: routeRecalculationQueryKeys.detail(recalculationId),
    queryFn: ({ signal }) => getRouteRecalculationDetail(recalculationId, signal),
  });

export const useRouteRecalculationsQuery = (
  params?: GetRouteRecalculationsParams,
  enabled = true,
) =>
  useQuery({
    queryKey: routeRecalculationQueryKeys.list(params),
    queryFn: ({ signal }) => {
      if (!params) throw new Error('재탐색 목록 조회 조건이 필요합니다.');
      return getRouteRecalculations(params, signal);
    },
    enabled: enabled && Boolean(params),
    refetchInterval: PENDING_RECALCULATION_REFETCH_INTERVAL_MS,
  });

export const useRouteRecalculationDetailQuery = (recalculationId?: string, enabled = true) =>
  useQuery({
    ...(recalculationId
      ? routeRecalculationDetailQueryOptions(recalculationId)
      : {
          queryKey: routeRecalculationQueryKeys.detail(),
          queryFn: () => Promise.reject(new Error('재탐색 ID가 필요합니다.')),
        }),
    enabled: enabled && Boolean(recalculationId),
  });

const useInvalidateRouteRecalculationQueries = () => {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: routeRecalculationQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: trainingSessionQueryKeys.currentRoutes() }),
    ]);
};

export const useApproveRouteRecalculationMutation = () => {
  const invalidateQueries = useInvalidateRouteRecalculationQueries();

  return useMutation({
    mutationFn: patchApproveRouteRecalculation,
    onSuccess: invalidateQueries,
  });
};

export const useRejectRouteRecalculationMutation = () => {
  const invalidateQueries = useInvalidateRouteRecalculationQueries();

  return useMutation({
    mutationFn: patchRejectRouteRecalculation,
    onSuccess: invalidateQueries,
  });
};
