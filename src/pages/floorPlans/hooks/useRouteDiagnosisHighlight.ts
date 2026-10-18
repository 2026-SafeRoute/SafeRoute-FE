import { useEffect, useMemo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import {
  floorRouteDiagnosisQueryKey,
  useFloorRouteDiagnosisQuery,
} from '../api/useFloorRouteDiagnosisQuery';

import type { FloorRouteDiagnosisHighlight } from '../types/routeDiagnosis';

// 층 대체 경로 진단 결과와 도면 강조 표시 여부 — 체크리스트·캔버스·범례가 같은 상태를 봄
export const useRouteDiagnosisHighlight = (floorId: string | undefined, isFloorReady: boolean) => {
  const queryClient = useQueryClient();
  // 현재 층 대체 경로 진단 결과
  const routeDiagnosisQuery = useFloorRouteDiagnosisQuery(floorId, isFloorReady);
  // 도면 진단 강조 표시 여부
  const [isDiagnosisHighlighted, setIsDiagnosisHighlighted] = useState(false);

  // 층 전환·진단 완료 시 강조 상태 초기화
  useEffect(() => {
    setIsDiagnosisHighlighted(false);
  }, [floorId, routeDiagnosisQuery.data?.ready]);

  // 캔버스 진단 강조 대상
  const routeDiagnosisHighlight = useMemo((): FloorRouteDiagnosisHighlight | undefined => {
    const diagnosis = routeDiagnosisQuery.data;
    if (!isDiagnosisHighlighted || diagnosis?.ready !== false) return undefined;
    return {
      unreachableNodeIds: diagnosis.unreachableNodeIds ?? [],
      limitedExitStartNodeIds:
        diagnosis.startCandidates
          ?.filter(
            ({ nodeId, reachableExitCount }) =>
              Boolean(nodeId) && reachableExitCount !== undefined && reachableExitCount <= 1,
          )
          .map(({ nodeId }) => nodeId as string) ?? [],
      undesignatedStairNodeIds: diagnosis.undesignatedStairNodeIds ?? [],
    };
  }, [isDiagnosisHighlighted, routeDiagnosisQuery.data]);

  const toggleDiagnosisHighlight = () => setIsDiagnosisHighlighted((current) => !current);

  // 그래프 변경 후 진단 갱신
  const invalidateFloorRouteDiagnosis = () =>
    queryClient.invalidateQueries({ queryKey: floorRouteDiagnosisQueryKey(floorId) });

  return {
    routeDiagnosisQuery,
    isDiagnosisHighlighted,
    toggleDiagnosisHighlight,
    routeDiagnosisHighlight,
    invalidateFloorRouteDiagnosis,
  };
};
