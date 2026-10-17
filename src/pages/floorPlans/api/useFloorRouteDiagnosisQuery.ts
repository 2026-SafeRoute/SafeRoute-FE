import { useQuery } from '@tanstack/react-query';

import { getFloorRouteDiagnosis } from './floorRouteDiagnosisApi';

export const floorRouteDiagnosisQueryKey = (floorId?: string) =>
  ['floors', 'route-diagnosis', floorId] as const;

export const useFloorRouteDiagnosisQuery = (floorId?: string, enabled = true) =>
  useQuery({
    queryKey: floorRouteDiagnosisQueryKey(floorId),
    queryFn: ({ signal }) => {
      if (!floorId) throw new Error('층 경로 진단에 필요한 층 ID가 없습니다.');
      return getFloorRouteDiagnosis(floorId, signal);
    },
    enabled: enabled && Boolean(floorId),
  });
