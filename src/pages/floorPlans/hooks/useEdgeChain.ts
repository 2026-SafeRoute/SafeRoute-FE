import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { extractApiError } from '@apis/errors/apiError';

import useToast from '@components/toast/useToast';

import { CANVAS_W, getGridDimensions } from '@utils/floorCanvas';

import { createMapEdge, deleteMapEdge } from '../api/mapGraphApi';
import { GRID_SIZE_KEY, PENDING_GRID_SIZE_KEY, readStoredNumber } from '../utils/gridStorage';
import { hasExistingEdge } from '../utils/hasExistingEdge';

import type { FloorData } from './useFloorData';
import type { Cctv } from '../api/cctvApi';
import type { FloorGridCell } from '../api/floorGridApi';
import type { MapNode } from '../api/mapGraphApi';
import type { MapEdge } from '../api/mapGraphApi';
import type { StructureNode } from '../constants/structureNode';
import type { Floor } from '../types/floorPlans';

interface UseEdgeChainParams {
  currentFloor: Floor | null;
  canvasH: number;
  floorGridCells: FloorGridCell[];
  realCctvs: Cctv[];
  structureNodes: StructureNode[];
  graphNodes: MapNode[];
  graphEdges: MapEdge[];
  getGraphNodeLabel: (id: string) => string;
  setNodeAddOpen: Dispatch<SetStateAction<boolean>>;
  setZoneAddOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedEdgeId: Dispatch<SetStateAction<string | null>>;
  updateGraphCache: FloorData['updateGraphCache'];
  invalidateFloorRouteDiagnosis: FloorData['invalidateFloorRouteDiagnosis'];
}

// 엣지 연결 — 노드를 순서대로 클릭해 쌓은 경로를 구간별로 검토한 뒤 일괄 생성, 선택한 엣지 삭제
export const useEdgeChain = ({
  currentFloor,
  canvasH,
  floorGridCells,
  realCctvs,
  structureNodes,
  graphNodes,
  graphEdges,
  getGraphNodeLabel,
  setNodeAddOpen,
  setZoneAddOpen,
  setSelectedEdgeId,
  updateGraphCache,
  invalidateFloorRouteDiagnosis,
}: UseEdgeChainParams) => {
  const { show } = useToast();

  const [edgeAddOpen, setEdgeAddOpen] = useState(false);

  // 노드를 한 쌍씩 고르던 방식 대신, 클릭한 순서대로 경로를 쌓아뒀다가 한 번에 구간별로
  // 검토·확정함(A→B→C→D 클릭 시 A-B, B-C, C-D를 일괄 생성) — 매번 팝업을 반복하던 번거로움을 줄임
  const [edgeChainNodeIds, setEdgeChainNodeIds] = useState<string[]>([]);
  const [edgeChainReviewOpen, setEdgeChainReviewOpen] = useState(false);

  // 클릭한 순서대로 경로에 노드를 쌓음 — 같은 노드를 연속으로 눌러도 무시(실수로 두 번 클릭)
  // 방금 고른 노드를 실수로 다시 클릭했을 수 있으니, 마지막 노드를 다시 누르면 추가하는 대신
  // 선택을 취소함(경로 맨 끝을 한 단계 되돌리는 것과 같음)
  const handleEdgeNodeClick = (nodeId: string) => {
    setEdgeChainNodeIds((prev) =>
      prev[prev.length - 1] === nodeId ? prev.slice(0, -1) : [...prev, nodeId],
    );
  };

  const handleClearEdgeChain = () => {
    setEdgeChainNodeIds([]);
  };

  // 엣지 연결 모드 종료
  const handleExitEdgeMode = useCallback(() => {
    setEdgeChainNodeIds([]);
    setEdgeChainReviewOpen(false);
    setEdgeAddOpen(false);
  }, []);

  // 두 노드 사이 거리(m) 추정 — 정규화 좌표(0~1) 차이를 칸 수로 환산한 뒤 그리드 배율(cm/칸)을
  // 곱하고 m로 변환한다. 배율(GRID_SIZE_KEY→PENDING→등록된 CCTV 순으로 탐색)이나 그리드 정보가 없으면 null이라
  // 검토 화면에서 그 구간만 수동 입력으로 폴백한다.
  const estimateEdgeDistanceM = (fromId: string, toId: string): number | null => {
    if (!currentFloor) return null;
    const cellSizeCm =
      readStoredNumber(GRID_SIZE_KEY(currentFloor.id)) ??
      readStoredNumber(PENDING_GRID_SIZE_KEY(currentFloor.id)) ??
      realCctvs.find((c) => c.floorId === currentFloor.id && c.gridCellSizeMeter)
        ?.gridCellSizeMeter ??
      null;
    if (!cellSizeCm) return null;
    const { cols, rows } = getGridDimensions(floorGridCells);
    if (!cols || !rows) return null;
    const normalizedPos = (id: string): { x: number; y: number } | null => {
      const structure = structureNodes.find((n) => n.id === id);
      if (structure) return { x: structure.x / CANVAS_W, y: structure.y / canvasH };
      const graphNode = graphNodes.find((n) => n.id === id);
      return graphNode ? { x: graphNode.x, y: graphNode.y } : null;
    };
    const from = normalizedPos(fromId);
    const to = normalizedPos(toId);
    if (!from || !to) return null;
    const meters = (Math.hypot((from.x - to.x) * cols, (from.y - to.y) * rows) * cellSizeCm) / 100;
    return Math.max(0.1, Math.round(meters * 10) / 10);
  };

  // 클릭한 순서(A→B→C→D)를 연속 구간(A-B, B-C, C-D)으로 풀어 검토 화면에 넘길 목록을 만듦.
  // handleEdgeNodeClick은 "바로 직전 노드"를 다시 누른 경우만 취소시켜서, A→B→C→A→B처럼
  // 더 앞 노드를 다시 밟으면 같은 구간(A-B)이 두 번 생길 수 있음 — 검토 화면 key 충돌과
  // createMapEdge 중복 호출을 막기 위해 같은 쌍(방향 무관)은 처음 나온 것만 남김
  const seenEdgeChainPairs = new Set<string>();

  const edgeChainSegments = edgeChainNodeIds
    .slice(0, -1)
    .map((fromId, i) => {
      const toId = edgeChainNodeIds[i + 1];
      return {
        fromId,
        toId,
        fromLabel: getGraphNodeLabel(fromId),
        toLabel: getGraphNodeLabel(toId),
        suggestedDistanceM: estimateEdgeDistanceM(fromId, toId),
        // 다른 경로를 잇다 겹친 구간 — 이미 있는 엣지라 다시 만들 필요가 없어서 검토 화면에서
        // 자동으로 제외함(사용자가 일일이 안 겹치게 클릭할 필요 없게)
        alreadyExists: hasExistingEdge(graphEdges, fromId, toId),
      };
    })
    .filter(({ fromId, toId }) => {
      const pairKey = [fromId, toId].sort().join('|');
      if (seenEdgeChainPairs.has(pairKey)) return false;
      seenEdgeChainPairs.add(pairKey);
      return true;
    });

  const handleProceedToEdgeChainReview = () => {
    if (edgeChainNodeIds.length < 2) return;
    setEdgeChainReviewOpen(true);
  };

  const handleBackFromEdgeChainReview = () => {
    setEdgeChainReviewOpen(false);
  };

  // 검토 화면에서 확정한 구간들을 한 번에 생성 — 일부만 실패해도 성공한 구간은 반영하고
  // 실패한 개수·사유만 토스트로 알림(하나 실패했다고 나머지까지 날아가면 안 됨)
  const handleSubmitEdgeChain = (
    rows: {
      fromId: string;
      toId: string;
      fromLabel: string;
      toLabel: string;
      distanceM: number;
      bidirectional: boolean;
    }[],
  ) => {
    Promise.allSettled(
      rows.map((row) =>
        createMapEdge({
          fromNodeId: row.fromId,
          toNodeId: row.toId,
          distance: row.distanceM,
          bidirectional: row.bidirectional,
        }),
      ),
    ).then((results) => {
      const succeeded: MapEdge[] = [];
      // 실패한 구간의 라벨을 같이 모아둠 — 전체 실패 개수만 알려주면 어느 구간이 안 됐는지
      // 몰라서 성공한 구간까지 처음부터 다시 골라야 했던 문제
      const failedLabels: string[] = [];
      let firstErrorMessage: string | undefined;
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          succeeded.push(result.value);
        } else {
          failedLabels.push(`${rows[i].fromLabel} → ${rows[i].toLabel}`);
          firstErrorMessage ??= extractApiError(result.reason).message;
        }
      });
      if (succeeded.length > 0) {
        updateGraphCache((prev) => ({ ...prev, edges: [...prev.edges, ...succeeded] }));
        void invalidateFloorRouteDiagnosis();
        show({ title: `${succeeded.length}개 구간이 연결되었습니다.`, variant: 'success' });
      }
      if (failedLabels.length > 0) {
        show({
          title: `${failedLabels.length}개 구간 연결에 실패했습니다.${
            firstErrorMessage ? ` (${firstErrorMessage})` : ''
          }`,
          description: failedLabels.join(', '),
          variant: 'error',
        });
      }
      // 경로 하나를 확정하면 모드도 함께 종료 — 이어서 계속 뜨면 "안 끝난다"는 인상을 줌.
      // 다른 경로를 더 잇고 싶으면 "엣지 연결"을 다시 열면 되고, 그때는 방금 만든 구간이
      // graphEdges에 반영돼 있어 중복 클릭도 곧바로 감지됨
      setEdgeChainNodeIds([]);
      setEdgeChainReviewOpen(false);
      setEdgeAddOpen(false);
    });
  };

  const handleEdgeDelete = (edgeId: string) => {
    deleteMapEdge(edgeId)
      .then(() => {
        updateGraphCache((prev) => ({ ...prev, edges: prev.edges.filter((e) => e.id !== edgeId) }));
        setSelectedEdgeId((prev) => (prev === edgeId ? null : prev));
        void invalidateFloorRouteDiagnosis();
      })
      .catch(() => {});
  };

  const handleOpenEdgeAdd = () => {
    setNodeAddOpen(false);
    setZoneAddOpen(false);
    setSelectedEdgeId(null);
    setEdgeAddOpen(true);
    setEdgeChainNodeIds([]);
    setEdgeChainReviewOpen(false);
  };

  return {
    edgeAddOpen,
    setEdgeAddOpen,
    edgeChainNodeIds,
    setEdgeChainNodeIds,
    edgeChainReviewOpen,
    setEdgeChainReviewOpen,
    handleEdgeNodeClick,
    handleClearEdgeChain,
    handleExitEdgeMode,
    estimateEdgeDistanceM,
    seenEdgeChainPairs,
    edgeChainSegments,
    handleProceedToEdgeChainReview,
    handleBackFromEdgeChainReview,
    handleSubmitEdgeChain,
    handleEdgeDelete,
    handleOpenEdgeAdd,
  };
};
