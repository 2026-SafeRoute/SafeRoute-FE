import { useQuery } from '@tanstack/react-query';

import { scenarioQueryKeys } from '@apis/scenarios/scenarioQueryKeys';

import { getScenarioRouteDiagnosis } from './routeDiagnosisApi';

export const useScenarioRouteDiagnosisQuery = (scenarioId?: string, enabled = true) =>
  useQuery({
    queryKey: scenarioQueryKeys.routeDiagnosis(scenarioId),
    queryFn: ({ signal }) => {
      if (!scenarioId) throw new Error('시나리오 경로 진단에 필요한 시나리오 ID가 없습니다.');
      return getScenarioRouteDiagnosis(scenarioId, signal);
    },
    enabled: enabled && Boolean(scenarioId),
  });
