import type { MapEdge } from '../api/mapGraphApi';
import type { StructureNode } from '../constants/structureNode';

// 시작 후보 중 하나라도 엣지를 따라 최종 탈출구까지 이어지는지 (훈련 준비 체크리스트용).
// 이 경로가 없으면 경로 탐색기가 EVAC005("도달 가능한 EXIT 노드가 없습니다")로 실패함 —
// 시작 노드가 그래프에 아예 연결 안 돼 있어도 여기서 걸림. graphEdges + structureNodes로 BFS.
export const hasRouteToExit = (structureNodes: StructureNode[], graphEdges: MapEdge[]): boolean => {
  // 시작점 후보 = 예전 방식의 START 노드 + 문·출입구 중 시작 후보로 지정된 것
  const startNodes = structureNodes.filter((n) => n.type === 'start' || n.isStartCandidate);
  const exitIds = new Set(structureNodes.filter((n) => n.isFinalExit).map((n) => n.id));
  if (startNodes.length === 0 || exitIds.size === 0) return false;

  const adjacency = new Map<string, string[]>();
  const link = (from: string, to: string) => {
    const list = adjacency.get(from);
    if (list) list.push(to);
    else adjacency.set(from, [to]);
  };
  for (const edge of graphEdges) {
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
};
