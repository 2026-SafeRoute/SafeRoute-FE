import { scenarioQueryKeys } from './scenarioQueryKeys';
import { SCENARIO_STATUS } from './scenarioTypes';

import type { Scenario } from './scenarioTypes';
import type { QueryClient } from '@tanstack/react-query';

const toInProgress = (scenario: Scenario): Scenario => ({
  ...scenario,
  status: SCENARIO_STATUS.IN_PROGRESS,
  deletable: false,
});

// 훈련 시작 직후 시나리오 목록·상세 캐시를 진행 중으로 바꾸고, 다음 진입 시 서버 데이터로 재검증한다.
export const setScenarioInProgressCache = (
  queryClient: QueryClient,
  scenarioId: string,
  scenario?: Scenario,
) => {
  queryClient.setQueryData<Scenario>(scenarioQueryKeys.detail(scenarioId), (current) => {
    const base = current ?? scenario;
    return base ? toInProgress(base) : current;
  });
  queryClient.setQueryData<Scenario[]>(scenarioQueryKeys.list(), (current) => {
    if (!current) return current;
    if (current.some((item) => item.id === scenarioId)) {
      return current.map((item) => (item.id === scenarioId ? toInProgress(item) : item));
    }
    // 목록 캐시가 생성 전에 받아 둔 것이면 이 시나리오가 없으므로 맨 앞에 추가
    return scenario ? [toInProgress(scenario), ...current] : current;
  });
  void queryClient.invalidateQueries({
    queryKey: scenarioQueryKeys.list(),
    exact: true,
    refetchType: 'none',
  });
  void queryClient.invalidateQueries({
    queryKey: scenarioQueryKeys.detail(scenarioId),
    exact: true,
    refetchType: 'none',
  });
};
