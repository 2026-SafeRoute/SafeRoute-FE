import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { extractApiError } from '@apis/errors/apiError';
import { floorQueryKeys } from '@apis/floors/floorQueries';

import useToast from '@components/toast/useToast';

import { CANVAS_W } from '@utils/floorCanvas';

import { deleteMapNode, updateMapNodePosition, updateNodeStartCandidate } from '../api/mapGraphApi';
import { STRUCTURE_NODE_API_TYPE } from '../constants/structureNode';

import type { FloorData } from './useFloorData';
import type { MapNodeType } from '../api/mapGraphApi';
import type { StructureNode } from '../constants/structureNode';

interface UseStructureNodeActionsParams {
  floorId: string | undefined;
  canvasH: number;
  structureNodes: StructureNode[];
  setEditingStructureId: Dispatch<SetStateAction<string | null>>;
  updateGraphCache: FloorData['updateGraphCache'];
  invalidateFloorRouteDiagnosis: FloorData['invalidateFloorRouteDiagnosis'];
}

// 구조 노드(문·계단·복도) 서버 반영 — 최종 탈출구·시작 후보 지정, 위치 이동, 삭제
export const useStructureNodeActions = ({
  floorId,
  canvasH,
  structureNodes,
  setEditingStructureId,
  updateGraphCache,
  invalidateFloorRouteDiagnosis,
}: UseStructureNodeActionsParams) => {
  const queryClient = useQueryClient();
  const { show } = useToast();

  // 시작 후보 PATCH가 진행 중인 노드 id — 같은 노드를 응답 전에 다시 토글하면 요청이
  // 뒤바뀐 순서로 끝나며 롤백이 최신 값을 덮어쓸 수 있어, 노드 단위로 버튼을 잠근다.
  const [startCandidatePendingIds, setStartCandidatePendingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  // 최종 탈출구 지정은 계단에서만 가능 — 서버에도 저장(실패 시 롤백).
  // 경로 탐색기(GET /sessions/{id}/current-route)는 type === 'EXIT'인 노드만 대피 목적지로
  // 인식함(EVAC005 "도달 가능한 EXIT 노드가 없습니다") — isExitTarget 플래그만으론 안 잡히므로
  // 지정 시 노드 타입을 EXIT로 승격하고, 해제 시 원래 구조 타입(STAIR)으로 되돌린다.
  const handleToggleFinalExit = (id: string) => {
    const node = structureNodes.find((n) => n.id === id);
    if (!node) return;
    const nextIsFinalExit = !node.isFinalExit;
    const originalType: MapNodeType = node.isFinalExit
      ? 'EXIT'
      : STRUCTURE_NODE_API_TYPE[node.type];
    const nextType: MapNodeType = nextIsFinalExit ? 'EXIT' : STRUCTURE_NODE_API_TYPE[node.type];
    updateGraphCache((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, type: nextType } : n)),
    }));
    updateMapNodePosition(id, {
      x: node.x / CANVAS_W,
      y: node.y / canvasH,
      type: nextType,
      isExitTarget: nextIsFinalExit,
    })
      .then(() => {
        void invalidateFloorRouteDiagnosis();
      })
      .catch((error: unknown) => {
        updateGraphCache((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) => (n.id === id ? { ...n, type: originalType } : n)),
        }));
        // 마지막 남은 탈출구는 해제할 수 없는 등 서버가 이유를 message로 내려주므로 그대로 보여줌
        const { message: serverMessage } = extractApiError(error);
        show({
          title: serverMessage || '최종 탈출구 지정에 실패했습니다.',
          variant: 'error',
        });
      });
  };

  // 훈련 시작 후보는 문·출입구 노드에서만 지정(BE PR #225). 타입·위치는 안 바뀌고
  // isStartCandidate 플래그만 토글됨 — 최종 탈출구와 달리 별도 엔드포인트(PATCH
  // /nodes/{id}/start-candidate). 낙관적으로 캐시를 바꾸고 실패 시 되돌린다.
  const handleToggleStartCandidate = (id: string) => {
    if (startCandidatePendingIds.has(id)) return;
    const node = structureNodes.find((n) => n.id === id);
    if (!node) return;
    const next = !node.isStartCandidate;
    setStartCandidatePendingIds((prev) => new Set(prev).add(id));
    updateGraphCache((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, isStartCandidate: next } : n)),
    }));
    updateNodeStartCandidate(id, next)
      .then((updated) => {
        // 서버가 확정한 값으로 캐시를 맞춘다 — 낙관적 값과 어긋났을 때를 대비
        updateGraphCache((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) =>
            n.id === id ? { ...n, isStartCandidate: updated.isStartCandidate } : n,
          ),
        }));
        void invalidateFloorRouteDiagnosis();
      })
      .catch((error: unknown) => {
        updateGraphCache((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) => (n.id === id ? { ...n, isStartCandidate: !next } : n)),
        }));
        const { message: serverMessage } = extractApiError(error);
        show({
          title: serverMessage || '시작 후보 지정에 실패했습니다.',
          variant: 'error',
        });
      })
      .finally(() => {
        setStartCandidatePendingIds((prev) => {
          const nextSet = new Set(prev);
          nextSet.delete(id);
          return nextSet;
        });
      });
  };

  // 드래그 중 미리보기용 — API 호출은 드래그가 끝났을 때(handleStructureNodeMoveEnd)만.
  // 픽셀 좌표를 그래프 캐시의 비율 좌표로 바로 바꿔 써서, structureNodes 동기화 effect가
  // canvasH로 다시 픽셀 변환해 그대로 반영함
  const handleStructureNodeMove = (id: string, x: number, y: number) => {
    updateGraphCache((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, x: x / CANVAS_W, y: y / canvasH } : n)),
    }));
  };

  const handleStructureNodeMoveEnd = (id: string, x: number, y: number) => {
    updateMapNodePosition(id, { x: x / CANVAS_W, y: y / canvasH }).catch((error: unknown) => {
      const { message } = extractApiError(error);
      show({ title: message || '위치 저장에 실패했습니다.', variant: 'error' });
      // 드래그 미리보기가 캐시에 이미 새 좌표를 써둔 상태 — 저장이 실패했는데 그래프가 비어있지
      // 않으면 폴링도 멈춰서, 그대로 두면 저장 안 된 좌표가 화면·엣지 거리 계산에 계속 쓰임.
      // 서버 기준으로 다시 받아와 되돌림
      void queryClient.invalidateQueries({ queryKey: floorQueryKeys.graph(floorId) });
    });
  };

  const handleStructureNodeDelete = (id: string) => {
    deleteMapNode(id)
      .then(() => {
        // 서버는 이 노드에 붙은 엣지까지 cascade 삭제하므로 로컬 캐시의 엣지도 같이 정리
        updateGraphCache((prev) => ({
          nodes: prev.nodes.filter((n) => n.id !== id),
          edges: prev.edges.filter((edge) => edge.fromNodeId !== id && edge.toNodeId !== id),
        }));
        setEditingStructureId((prev) => (prev === id ? null : prev));
        void invalidateFloorRouteDiagnosis();
      })
      .catch((error: unknown) => {
        // 유도등 판단 노드로 참조 중이거나 마지막 탈출구인 경우 등 서버가 이유를 message로 내려줌
        const { message: serverMessage } = extractApiError(error);
        show({
          title: serverMessage || '노드 삭제에 실패했습니다.',
          variant: 'error',
        });
      });
  };

  return {
    startCandidatePendingIds,
    setStartCandidatePendingIds,
    handleToggleFinalExit,
    handleToggleStartCandidate,
    handleStructureNodeMove,
    handleStructureNodeMoveEnd,
    handleStructureNodeDelete,
  };
};
