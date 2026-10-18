import type { ScenarioRouteDiagnosisResponse } from '@apis/__generated__/data-contracts';
import { HTTP_METHOD, request } from '@apis/config/request';
import { API_ENDPOINTS } from '@apis/constants/endpoints';

export const getScenarioRouteDiagnosis = (
  scenarioId: string,
  signal?: AbortSignal,
): Promise<ScenarioRouteDiagnosisResponse> =>
  request<ScenarioRouteDiagnosisResponse>({
    method: HTTP_METHOD.GET,
    url: API_ENDPOINTS.SCENARIOS.ROUTE_DIAGNOSIS(scenarioId),
    signal,
  });
