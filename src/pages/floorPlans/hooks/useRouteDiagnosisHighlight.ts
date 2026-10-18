import { useEffect, useMemo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import {
  floorRouteDiagnosisQueryKey,
  useFloorRouteDiagnosisQuery,
} from '../api/useFloorRouteDiagnosisQuery';
import { getLimitedExitStartNodeIds } from '../utils/routeDiagnosis';

import type { FloorRouteDiagnosisHighlight } from '../types/routeDiagnosis';

// 층 대체 경로 진단 결과와 도면 강조 표시 여부 — 체크리스트·캔버스·범례가 같은 상태를 봄
export const useRouteDiagnosisHighlight = (floorId: string | undefined, isFloorReady: boolean) => {
  const queryClient = useQueryClient();
  // 현재 층 대체 경로 진단 결과
  const routeDiagnosisQuery = useFloorRouteDiagnosisQuery(floorId, isFloorReady);
  // 화면에 쓰는 진단 결과 — 재조회 실패 시 이전 결과를 계속 보여주지 않도록 오류면 없는 것으로 처리
  // (체크리스트·캔버스 알림·도면 강조·카드 표시가 모두 이 값을 봄)
  const routeDiagnosis = routeDiagnosisQuery.isError ? undefined : routeDiagnosisQuery.data;
  // 도면 진단 강조 표시 여부
  const [isDiagnosisHighlighted, setIsDiagnosisHighlighted] = useState(false);

  // 층 전환·진단 결과 변경(완료·조회 실패 포함) 시 강조 상태 초기화
  useEffect(() => {
    setIsDiagnosisHighlighted(false);
  }, [floorId, routeDiagnosis?.ready]);

  // 캔버스 진단 강조 대상
  const routeDiagnosisHighlight = useMemo((): FloorRouteDiagnosisHighlight | undefined => {
    if (!isDiagnosisHighlighted || routeDiagnosis?.ready !== false) return undefined;
    return {
      unreachableNodeIds: routeDiagnosis.unreachableNodeIds ?? [],
      limitedExitStartNodeIds: getLimitedExitStartNodeIds(routeDiagnosis),
      undesignatedStairNodeIds: routeDiagnosis.undesignatedStairNodeIds ?? [],
    };
  }, [isDiagnosisHighlighted, routeDiagnosis]);

  const toggleDiagnosisHighlight = () => setIsDiagnosisHighlighted((current) => !current);

  // 그래프 변경 후 진단 갱신
  const invalidateFloorRouteDiagnosis = () =>
    queryClient.invalidateQueries({ queryKey: floorRouteDiagnosisQueryKey(floorId) });

  return {
    routeDiagnosis,
    isDiagnosisHighlighted,
    toggleDiagnosisHighlight,
    routeDiagnosisHighlight,
    invalidateFloorRouteDiagnosis,
  };
};
