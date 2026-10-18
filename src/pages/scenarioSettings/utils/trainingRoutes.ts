import type {
  CurrentRouteResponse,
  RouteRecalculationDetailResponse,
  RouteRecalculationSummaryResponse,
  RouteSegment,
} from '@apis/__generated__/data-contracts';

import { ROUTE_RECALCULATION_EXPIRED_MESSAGE } from '../constants/scenarioSettings';

export const formatCurrentRoute = (route?: CurrentRouteResponse) => {
  const labels = route?.path?.map((node) => node.name || '이름 없는 지점').filter(Boolean) ?? [];
  if (labels.length === 0) return '현재 대피 경로 정보가 없습니다.';
  return labels.join(' → ');
};

const formatRouteSegment = (segment?: RouteSegment) => {
  const nodeCount = segment?.nodeIds?.length ?? 0;
  if (nodeCount === 0) return '현재 대피 경로 정보가 없습니다.';

  const weight = segment?.totalWeight;
  return weight === undefined
    ? `${nodeCount}개 지점`
    : `${nodeCount}개 지점 · 가중치 ${weight.toFixed(1)}`;
};

export const formatRouteProposal = (
  detail: RouteRecalculationDetailResponse | undefined,
  summary?: RouteRecalculationSummaryResponse,
) => {
  const status = summary?.status ?? detail?.status;
  if (status === 'CANCELLED') {
    return {
      status: 'CANCELLED' as const,
      message: ROUTE_RECALCULATION_EXPIRED_MESSAGE,
      previousRoute: '',
      candidateRoute: '',
    };
  }

  const recalculation = detail ?? summary;
  if (!recalculation || status !== 'PENDING') return null;

  const isFireSpread = recalculation.triggerType === 'FIRE_SPREAD';
  const density =
    isFireSpread || recalculation.density === undefined
      ? null
      : `${recalculation.density.toFixed(1)}명/㎡ 밀집도 감지`;
  const source = isFireSpread ? null : (recalculation.cctvCode ?? null);
  const reason = [source, density].filter(Boolean).join(' · ');
  const previousRoute = detail
    ? formatRouteSegment(detail.previousRoute)
    : '경로 정보를 불러오는 중...';
  const candidateRoute = detail
    ? formatRouteSegment(detail.candidateRoute)
    : '경로 정보를 불러오는 중...';

  return {
    status: 'PENDING' as const,
    message: isFireSpread
      ? '화재 확산으로 우회 경로가 제안되었습니다.'
      : reason || '혼잡 감지로 새 대피 경로가 제안되었습니다.',
    previousRoute,
    candidateRoute,
  };
};

export const getLatestRecalculation = (items: RouteRecalculationSummaryResponse[]) =>
  [...items].sort((a, b) => {
    const aTime = a.requestedAt ? Date.parse(a.requestedAt) : 0;
    const bTime = b.requestedAt ? Date.parse(b.requestedAt) : 0;
    return bTime - aTime;
  })[0];
