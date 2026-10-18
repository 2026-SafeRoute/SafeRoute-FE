import { useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import type { Cctv } from '../api/cctvApi';
import type { MapNode } from '../api/mapGraphApi';
import type { MapEdge } from '../api/mapGraphApi';
import type { LightGuidanceValue } from '../components/popups/LightGuidanceFields';
import type { PlacingDeviceType } from '../constants/devicePlacement';
import type { StructureNode } from '../constants/structureNode';
import type { DeviceEditForm, PanelItem } from '../types/panelItem';
import type { LightPickTarget } from '../utils/lightPick';

interface UseLightGuidanceParams {
  structureNodes: StructureNode[];
  graphNodes: MapNode[];
  graphEdges: MapEdge[];
  realCctvs: Cctv[];
  getGraphNodeLabel: (id: string) => string;
  nodeAddOpen: boolean;
  nodeAddType: PlacingDeviceType;
  nodeAddLightFields: LightGuidanceValue;
  setNodeAddLightFields: Dispatch<SetStateAction<LightGuidanceValue>>;
  editingPanelItem: PanelItem | undefined;
  editForm: DeviceEditForm;
  setEditForm: Dispatch<SetStateAction<DeviceEditForm>>;
  lightPickTarget: LightPickTarget | null;
  setLightPickTarget: Dispatch<SetStateAction<LightPickTarget | null>>;
}

// 유도등 갈림길 위치·좌우 통로 선택 — 선택지 목록, "캔버스에서 선택" 모드, 캔버스 미리보기
export const useLightGuidance = ({
  structureNodes,
  graphNodes,
  graphEdges,
  realCctvs,
  getGraphNodeLabel,
  nodeAddOpen,
  nodeAddType,
  nodeAddLightFields,
  setNodeAddLightFields,
  editingPanelItem,
  editForm,
  setEditForm,
  lightPickTarget,
  setLightPickTarget,
}: UseLightGuidanceParams) => {
  // 유도등 설정 모달의 판단 노드/엣지 드롭다운 목록 — getGraphNodeLabel과 같은 번호 규칙을
  // 쓰도록 그 함수를 그대로 재사용함(따로 STRUCTURE_NODE_LABEL만 가져다 쓰면 번호가 안 붙어
  // 같은 종류 노드가 여러 개일 때 다시 구분이 안 되는 문제로 되돌아감)
  const lightNodeOptions = useMemo(
    () => [
      ...structureNodes.map((n) => ({ id: n.id, label: getGraphNodeLabel(n.id) })),
      ...graphNodes.map((n) => ({ id: n.id, label: n.name })),
    ],
    // getGraphNodeLabel은 structureNodes/graphNodes를 참조하는 클로저라 그 둘을 대신 의존성으로 둠
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [structureNodes, graphNodes],
  );

  // fromNodeId/toNodeId도 같이 내려줌 — 판단 노드에 실제로 연결된 엣지만 좌/우 후보로 걸러내는 데 씀
  // (판단 노드와 무관한 엣지를 골라도 UI는 막지 않고 저장 시점에야 서버가 거부해서 헷갈리던 문제)
  const lightEdgeOptions = useMemo(
    () =>
      graphEdges.map((edge) => ({
        id: edge.id,
        label: `${getGraphNodeLabel(edge.fromNodeId)} → ${getGraphNodeLabel(edge.toNodeId)} (${edge.distance}m)`,
        fromNodeId: edge.fromNodeId,
        toNodeId: edge.toNodeId,
      })),
    // getGraphNodeLabel은 structureNodes/graphNodes를 참조하는 클로저라 그 둘을 대신 의존성으로 둠
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [graphEdges, structureNodes, graphNodes],
  );

  // 담당 CCTV 배정 드롭다운 목록 — realCctvs는 이미 이 층 floorId로만 조회됨
  const lightCctvOptions = useMemo(
    () => realCctvs.map((c) => ({ id: c.id, label: c.code ? `${c.name} (${c.code})` : c.name })),
    [realCctvs],
  );

  // 캔버스에 비출 유도등 갈림길·좌우 통로 미리보기 — 추가 팝업이 열려있으면 그 값을, 유도등을
  // 수정 중이면 수정 폼 값을 보여줌(둘 다 아니면 null이라 캔버스에 강조가 안 남음)
  const lightPreviewSource =
    nodeAddOpen && nodeAddType === 'light'
      ? nodeAddLightFields
      : editingPanelItem?.type === 'light'
        ? editForm
        : null;

  // "캔버스에서 선택" — 드롭다운에 같은 이름 노드가 많아 고르기 혼란스럽다는 피드백으로,
  // 도면에서 직접 클릭해 갈림길 위치·좌우 통로를 지정하는 대안 제공. 추가 팝업/수정 카드
  // 중 어느 쪽이 지금 열려있는지에 따라 그쪽의 픽 모드만 캔버스에 반영함
  const currentLightPickField =
    nodeAddOpen && nodeAddType === 'light'
      ? lightPickTarget?.source === 'add'
        ? lightPickTarget.field
        : null
      : editingPanelItem?.type === 'light'
        ? lightPickTarget?.source === 'edit'
          ? lightPickTarget.field
          : null
        : null;

  // 클릭 결과를 올바른 곳(추가 팝업 vs 수정 카드)에 반영하려면 시작한 소스를 같이 들고 있어야 함
  const handleStartLightPick = (
    source: 'add' | 'edit',
    field: 'decisionNode' | 'leftEdge' | 'rightEdge',
  ) => {
    setLightPickTarget((prev) =>
      prev?.source === source && prev.field === field ? null : { source, field },
    );
  };

  // FloorCanvasSvg가 픽 모드에서 유효한(연결된) 노드·엣지만 클릭 가능하게 걸러주므로, 여기서는
  // 넘어온 id를 그대로 해당 대상의 값으로 반영하면 됨
  const handleLightCanvasPick = (id: string) => {
    if (!lightPickTarget) return;
    const { source, field } = lightPickTarget;
    if (source === 'add') {
      setNodeAddLightFields((prev) =>
        field === 'decisionNode'
          ? { decisionNodeId: id, leftEdgeId: '', rightEdgeId: '' }
          : field === 'leftEdge'
            ? { ...prev, leftEdgeId: id }
            : { ...prev, rightEdgeId: id },
      );
    } else {
      setEditForm((prev) =>
        field === 'decisionNode'
          ? { ...prev, decisionNodeId: id, leftEdgeId: '', rightEdgeId: '' }
          : field === 'leftEdge'
            ? { ...prev, leftEdgeId: id }
            : { ...prev, rightEdgeId: id },
      );
    }
    setLightPickTarget(null);
  };

  const nodeAddLightPickField = lightPickTarget?.source === 'add' ? lightPickTarget.field : null;

  const editLightPickField = lightPickTarget?.source === 'edit' ? lightPickTarget.field : null;

  return {
    lightNodeOptions,
    lightEdgeOptions,
    lightCctvOptions,
    lightPreviewSource,
    currentLightPickField,
    handleStartLightPick,
    handleLightCanvasPick,
    nodeAddLightPickField,
    editLightPickField,
  };
};
