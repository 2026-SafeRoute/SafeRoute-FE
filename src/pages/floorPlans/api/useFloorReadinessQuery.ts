import { useFloorGraphQuery } from '@apis/floors/floorQueries';

export interface FloorReadiness {
  hasStartNode: boolean;
  hasFinalExit: boolean;
  hasRouteToExit: boolean;
  isLoading: boolean;
  // 조회 실패 시 호출부가 "0/3 미완료"가 아니라 별도의 오류 상태로 구분해서 보여줄 수 있게 함 —
  // 그래프가 비어서 진짜 0/3인지, 조회 자체가 실패해서 데이터를 모르는 건지는 다른 상황임
  isError: boolean;
}

// 도면 상세의 훈련 준비 체크리스트와 같은 조건(시작 노드/최종 탈출구/그 사이 경로)을 목록
// 카드에서도 보여주기 위해 재사용 — 경로가 없으면 경로 탐색기가 EVAC005("도달 가능한 EXIT
// 노드가 없습니다")로 실패하므로, 시작 노드가 그래프에 연결만 안 돼 있어도 여기서 걸림
export const useFloorReadinessQuery = (floorId: string, enabled = true): FloorReadiness => {
  const { data, isLoading, isError } = useFloorGraphQuery(floorId, enabled);
  const nodes = data?.nodes ?? [];
  const edges = data?.edges ?? [];

  // START 타입(레거시) + isStartCandidate(BE PR #225, DOOR 등을 시작 후보로 지정) 둘 다 인정
  const startNodes = nodes.filter((n) => n.type === 'START' || n.isStartCandidate);
  const exitIds = new Set(nodes.filter((n) => n.type === 'EXIT').map((n) => n.id));

  const hasRouteToExit = (() => {
    if (startNodes.length === 0 || exitIds.size === 0) return false;
    const adjacency = new Map<string, string[]>();
    const link = (from: string, to: string) => {
      const list = adjacency.get(from);
      if (list) list.push(to);
      else adjacency.set(from, [to]);
    };
    for (const edge of edges) {
      link(edge.fromNodeId, edge.toNodeId);
      if (edge.bidirectional) link(edge.toNodeId, edge.fromNodeId);
    }
    return startNodes.some((start) => {
      const visited = new Set([start.id]);
      const queue = [start.id];
      while (queue.length > 0) {
        const current = queue.shift() as string;
        if (exitIds.has(current)) return true;
        for (const next of adjacency.get(current) ?? []) {
          if (!visited.has(next)) {
            visited.add(next);
            queue.push(next);
          }
        }
      }
      return false;
    });
  })();

  return {
    hasStartNode: startNodes.length > 0,
    hasFinalExit: exitIds.size > 0,
    hasRouteToExit,
    isLoading,
    isError,
  };
};
