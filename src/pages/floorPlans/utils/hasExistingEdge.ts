import type { MapEdge } from '../api/mapGraphApi';

// 두 노드 사이에 이미 엣지가 있는지 확인 — 방향은 상관없음(A-B가 있으면 B-A도 같은 구간으로 봄).
// 체인으로 여러 경로를 잇다 보면 이전에 만든 경로와 구간이 겹칠 수 있는데, 그 구간만 생성에서
// 자동으로 제외하기 위해 캔버스 미리보기와 검토 화면 양쪽에서 이 함수를 같이 씀
export const hasExistingEdge = (edges: MapEdge[], fromId: string, toId: string): boolean =>
  edges.some(
    (e) =>
      (e.fromNodeId === fromId && e.toNodeId === toId) ||
      (e.fromNodeId === toId && e.toNodeId === fromId),
  );
