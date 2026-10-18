// 훈련 시나리오 조회 캐시를 관리하는 쿼리키 팩토리
export const scenarioQueryKeys = {
  all: ['scenarios'] as const,
  lists: () => [...scenarioQueryKeys.all, 'list'] as const,
  list: () => [...scenarioQueryKeys.lists()] as const,
  details: () => [...scenarioQueryKeys.all, 'detail'] as const,
  detail: (scenarioId: string) => [...scenarioQueryKeys.details(), scenarioId] as const,
  routeDiagnoses: () => [...scenarioQueryKeys.all, 'route-diagnosis'] as const,
  routeDiagnosis: (scenarioId?: string) =>
    [...scenarioQueryKeys.routeDiagnoses(), scenarioId] as const,
};
