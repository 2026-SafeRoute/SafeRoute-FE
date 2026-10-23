import type { FloorRouteDiagnosisResponse } from '@apis/__generated__/data-contracts';

// 갈 수 있는 탈출구가 1곳 이하인 시작 후보 노드 ID — 체크리스트 개수와 도면 주황 테두리가 같은 기준을 쓰게 함
export const getLimitedExitStartNodeIds = (diagnosis?: FloorRouteDiagnosisResponse): string[] =>
  diagnosis?.startCandidates
    ?.filter(
      ({ nodeId, reachableExitCount }) =>
        Boolean(nodeId) && reachableExitCount !== undefined && reachableExitCount <= 1,
    )
    .map(({ nodeId }) => nodeId as string) ?? [];
