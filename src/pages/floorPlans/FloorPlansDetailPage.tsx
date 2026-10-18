import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useNavigate, useParams } from 'react-router';

import { floorQueryKeys } from '@apis/floors/floorQueries';
import { TRAINING_SESSION_STATUS } from '@apis/trainingSessions/trainingSessionConstants';
import { useGetTrainingSessionsQuery } from '@apis/trainingSessions/useGetTrainingSessionsQuery';

import AlertIcon from '@assets/icons/ic-alert.svg?react';
import CheckIcon from '@assets/icons/ic-check.svg?react';
import ChevronRightIcon from '@assets/icons/ic-chevron-right.svg?react';
import MapIcon from '@assets/icons/ic-map.svg?react';

import { Button } from '@components/Button';
import StatusBadge from '@components/chip/StatusBadge';
import EmptyState from '@components/empty';
import LoadingState from '@components/loadingState';

import { interactivePanelBreakpoints } from '@styles/responsive.css';

import { formatFloor, hasFloorPlan } from '@utils/floor';
import { CANVAS_W } from '@utils/floorCanvas';

import AddActionMenu from './components/AddActionMenu';
import { canvasPlaceholder } from './components/canvas/canvas.css';
import FloorCanvas from './components/canvas/FloorCanvas';
import NodeTypeLegendInfo from './components/NodeTypeLegendInfo';
import DeviceCard from './components/panel/DeviceCard';
import StructureNodeCard from './components/panel/StructureNodeCard';
import ZoneCard from './components/panel/ZoneCard';
import EdgeChainPopup from './components/popups/EdgeChainPopup';
import GridSetupPopup from './components/popups/GridSetupPopup';
import NodeAddPopup from './components/popups/NodeAddPopup';
import SidebarPopup from './components/popups/SidebarPopup';
import ZoneAddPopup from './components/popups/ZoneAddPopup';
import ReadinessChecklist from './components/ReadinessChecklist';
import { EDITING_LOCK_HINT_ID } from './constants/floorEditor';
import { API_TYPE_TO_STRUCTURE, STRUCTURE_NODE_LABEL } from './constants/structureNode';
import * as styles from './FloorPlansDetailPage.css';
import { useDeviceEditing } from './hooks/useDeviceEditing';
import { useEdgeChain } from './hooks/useEdgeChain';
import { useFloorData } from './hooks/useFloorData';
import { useFloorUpload } from './hooks/useFloorUpload';
import { useLightGuidance } from './hooks/useLightGuidance';
import { useNodeAdd } from './hooks/useNodeAdd';
import { useStructureNodeActions } from './hooks/useStructureNodeActions';
import { useZoneActions } from './hooks/useZoneActions';
import EquipmentDeleteConfirmModal from './modals/EquipmentDeleteConfirmModal';
import FloorUploadModal from './modals/FloorUploadModal';
import GridAreaSettingModal from './modals/GridAreaSettingModal';
import { cellIdsIntersectingRect } from './utils/cellIdsIntersectingRect';
import {
  deviceTypeToFilterChip,
  deviceTypeToPlaceType,
  formatInstallLocation,
  formatMonitoredZone,
} from './utils/deviceDisplay';
import { hasRouteToExit } from './utils/hasRouteToExit';

import type { AddedDevice } from './constants/devicePlacement';
import type { StructureNode } from './constants/structureNode';
import type { SelectedItem, ZoneEntry, ZoneRect, ZoneRefSelection } from './types/canvasSelection';
import type { PanelDeviceTypeFilter, PanelItem, PanelTopFilter } from './types/panelItem';

// 그리드(PUT /floors/{id}/grid, GET /floors/{id}/grid/cells)는 두 가지 용도로만 존재함:
//  1) 사용자 구역(user-zone): 구역 = 그리드 셀 id의 집합(UserZoneCreateRequest.cellIds). 셀 단위로만 선택 가능
//  2) 화재 구역(fire-zone): 초기 발화 셀 = 그리드 셀 id 하나(CreateFireZoneRequest.gridCellId), 화재 확산 시뮬레이션 기준
// 반면 맵그래프 노드/엣지의 좌표(x,y)는 0~1 정규화 double로 자유 좌표이고 그리드와 무관함 —
// 노드 배치/이동은 클릭한 지점 그대로 저장한다(격자 스냅 없음).

// CCTV 등록(POST /cctvs)은 감시 면적 계산에 그리드 배율(cellSizeMeter)을 요구하는데(없으면 CCTV006),
// 배율 복원 순서(백엔드에 조회 API가 없어 브라우저에 기록해뒀다 되찾음):
//   1) 이 브라우저에 기록해둔 값(업로드 때 입력했거나 이전에 설정한 값) — localStorage라 새로고침/재접속에도 유지
//   2) 이 층에 이미 등록된 CCTV의 gridCellSizeMeter (한 대라도 있으면 그때 쓰인 배율을 알 수 있음)
//   3) 위 둘 다 없을 때만 사용자에게 한 번 물어봄
// 키 정의·읽기/쓰기 헬퍼는 FloorPlansPage(업로드 화면)도 같이 쓰므로 utils/gridStorage로 뺌

/* ── 메인 페이지 ── */
const FloorPlansDetailPage = () => {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { buildingId, floorId } = useParams<{ buildingId: string; floorId: string }>();

  const { data: runningSessions = [], isPending: isRunningSessionsPending } =
    useGetTrainingSessionsQuery(TRAINING_SESSION_STATUS.RUNNING);

  const editingLocked = Boolean(
    isRunningSessionsPending ||
    (buildingId && runningSessions.some((session) => session.buildingId === buildingId)),
  );

  const layoutRef = useRef<HTMLDivElement>(null);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [devicePanelOpenOverride, setDevicePanelOpenOverride] = useState<boolean | null>(null);

  const isDevicePanelOpen = devicePanelOpenOverride ?? !isCompactLayout;

  useLayoutEffect(() => {
    const layout = layoutRef.current;
    if (!layout) return;

    const updateLayoutWidth = (width: number) => {
      setIsCompactLayout(width < interactivePanelBreakpoints.floorEditorCollapse);
    };
    updateLayoutWidth(layout.getBoundingClientRect().width);

    const observer = new ResizeObserver(([entry]) => {
      if (entry) updateLayoutWidth(entry.contentRect.width);
    });
    observer.observe(layout);
    return () => observer.disconnect();
  }, []);

  const [zoom, setZoom] = useState(100);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [selectedZoneRef, setSelectedZoneRef] = useState<ZoneRefSelection | null>(null);
  const [zoneAddOpen, setZoneAddOpen] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // 구역 재설정(재드래그) 중인 기존 구역 id — null이면 zoneAddOpen은 "새 구역 추가" 흐름.
  // 구역은 PATCH가 없어 새로 만들고 기존 걸 지우는 방식으로만 "수정"할 수 있음(스웨거 확인)
  const [zoneResetTargetId, setZoneResetTargetId] = useState<string | null>(null);
  const [zoneDraftRect, setZoneDraftRectState] = useState<ZoneRect | null>(null);
  const zoneDraftRectRef = useRef<ZoneRect | null>(null);

  const setZoneDraftRect = useCallback((rect: ZoneRect | null) => {
    zoneDraftRectRef.current = rect;
    setZoneDraftRectState(rect);
  }, []);

  // 구역 드래그(사각형 선택) 중엔 캔버스 위 CCTV·유도등 마커(SVG 밖 별도 HTML 마커)와
  // 격자 셀·구조 노드가 저마다 다른 커서를 걸고 있어도 항상 십자선(crosshair)으로 보이게 함 —
  // FloorCanvasSvg(SVG 내부)에서 드래그 시작/종료 시 이 값을 갱신하고, FloorCanvas가 SVG 밖
  // 마커의 pointer-events를 같이 꺼서 호버가 아래 SVG 배경(crosshair)으로 그대로 넘어가게 함
  const [isZoneDragging, setIsZoneDragging] = useState(false);
  const [topFilter, setTopFilter] = useState<PanelTopFilter>('all');

  // 여러 칩을 동시에 켤 수 있는 다중 선택 필터 — 빈 배열이면 "전체"와 같음
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<PanelDeviceTypeFilter[]>([]);

  // 지금 "캔버스에서 선택" 모드가 걸려있는 대상 — 추가 팝업/수정 카드 중 어느 쪽의 어느
  // 필드인지 알아야 캔버스 클릭 결과를 올바른 곳에 반영할 수 있음
  const [lightPickTarget, setLightPickTarget] = useState<{
    source: 'add' | 'edit';
    field: 'decisionNode' | 'leftEdge' | 'rightEdge';
  } | null>(null);

  const [addedDevices, setAddedDevices] = useState<AddedDevice[]>([]);
  const [structureNodes, setStructureNodes] = useState<StructureNode[]>([]);
  const [editingCctvId, setEditingCctvId] = useState<string | null>(null);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [zoneEditLabel, setZoneEditLabel] = useState('');
  const [cctvDraftCellIds, setCctvDraftCellIds] = useState<string[]>([]);
  const [zoneDraftCellIds, setZoneDraftCellIds] = useState<string[]>([]);
  const [zoneDeleteTarget, setZoneDeleteTarget] = useState<ZoneEntry | null>(null);
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const devicePanelRef = useRef<HTMLDivElement>(null);

  // 서버 데이터(층 상세·그래프·그리드·장비·구역)와 캐시 갱신 헬퍼
  const {
    floorGridCells,
    floorDetailQuery,
    floor,
    markAwaitingUploadAnalysis,
    canvasH,
    resolvedMapImageUrl,
    routeDiagnosisQuery,
    isDiagnosisHighlighted,
    toggleDiagnosisHighlight,
    routeDiagnosisHighlight,
    invalidateFloorRouteDiagnosis,
    updateGraphCache,
    graphData,
    iotLights,
    realCctvs,
    zones,
    selectedBuildingId,
    selectedFloorId,
    graphNodes,
    graphEdges,
    patchCctvCache,
    patchLightCache,
    runLightFollowups,
    updateZonesCache,
    updateFloorCache,
    currentBuilding,
    currentFloor,
    resolvedFloor,
    gridCellPxSize,
  } = useFloorData({ buildingId, floorId });

  // 노드 id로 표시용 라벨 조회 (구조 노드 + 그 외 그래프 노드 통합) — 같은 종류(예: 복도)가
  // 여러 개면 전부 "복도"로만 보여서 유도등 판단 노드·경로 엣지를 고를 때 뭐가 뭔지 구분이
  // 안 되던 문제(QA 피드백) — 우측 패널 카드와 같은 규칙("복도 1", "복도 2"...)으로 번호를
  // 붙여서, 패널에서 본 번호와 드롭다운 번호가 그대로 대응되게 함
  const getGraphNodeLabel = (id: string): string => {
    const structureNode = structureNodes.find((n) => n.id === id);
    if (structureNode) {
      const sameTypeIndex = structureNodes
        .filter((n) => n.type === structureNode.type)
        .findIndex((n) => n.id === structureNode.id);
      return `${STRUCTURE_NODE_LABEL[structureNode.type]} ${sameTypeIndex + 1}`;
    }
    const graphNode = graphNodes.find((n) => n.id === id);
    return graphNode?.name ?? id;
  };

  // 드래그(mousemove)마다 재렌더되는 컴포넌트라, 매 렌더 O(n·m) 재계산을 피하려고 useMemo로 감쌈
  const allPanelItems: PanelItem[] = useMemo(
    () => [
      ...(floor?.devices ?? []).map((d) => ({
        id: d.id,
        kind: 'device' as const,
        type: deviceTypeToPlaceType(d.type),
        label: d.label,
        statusText: d.status === 'online' ? '실시간' : '오프라인',
        statusOnline: d.status === 'online',
        zone: formatInstallLocation(deviceTypeToPlaceType(d.type), d.x, d.y, d.zone),
        source: 'floor' as const,
      })),
      // 상태는 실제 CCTV/유도등의 enabled를 따라감 — 예전엔 '실시간'으로 고정돼 있어서
      // 사용 불가로 바꿔도 카드에 반영되지 않았음
      ...addedDevices.map((d) => {
        const matchedCctv = realCctvs.find((c) => c.id === d.id);
        const matchedLight = iotLights.find((l) => l.id === d.id);
        const enabled = matchedCctv?.enabled ?? matchedLight?.enabled ?? true;
        return {
          id: d.id,
          kind: 'device' as const,
          type: d.placeType,
          label: d.label,
          statusText: enabled ? '활성화' : '비활성화',
          statusOnline: enabled,
          zone: formatInstallLocation(d.placeType, d.x, d.y, d.zone),
          source: 'added' as const,
          monitoredArea: matchedCctv
            ? { cellCount: matchedCctv.monitoredGridCellCount, areaM2: matchedCctv.monitoredAreaM2 }
            : undefined,
          code: matchedCctv?.code ?? matchedLight?.code,
          cctvName: matchedLight?.cctvId
            ? (realCctvs.find((c) => c.id === matchedLight.cctvId)?.name ?? '알 수 없는 CCTV')
            : undefined,
          guidanceConfigured: matchedLight?.guidanceConfigured,
        };
      }),
    ],
    [floor?.devices, addedDevices, realCctvs, iotLights],
  );

  const {
    lastCctvDraftRectRef,
    nodeAddOpen,
    setNodeAddOpen,
    nodeAddType,
    setNodeAddType,
    nodeAddLightFields,
    setNodeAddLightFields,
    nodeAddStage,
    setNodeAddStage,
    gridSetupPromptOpen,
    setGridSetupPromptOpen,
    gridSetupIntent,
    setGridSetupIntent,
    gridSizeCmInput,
    setGridSizeCmInput,
    nodeStagedPosition,
    setNodeStagedPosition,
    handleMapClick,
    ensureFloorGridCells,
    openGridSetupPrompt,
    handleSubmitNodeEntry,
    handleNodeAddBack,
    handleCancelNodeAdd,
    handleGridSetupPromptCancel,
    handleGridSetupPromptConfirm,
    handleFinalizeFov,
    handleOpenNodeAdd,
  } = useNodeAdd({
    floorId,
    currentFloor,
    canvasH,
    floorGridCells,
    realCctvs,
    structureNodes,
    addedDevices,
    cctvDraftCellIds,
    setCctvDraftCellIds,
    setZoneAddOpen,
    setZoneDraftRect,
    setLightPickTarget,
    updateGraphCache,
    invalidateFloorRouteDiagnosis,
    runLightFollowups,
  });

  const {
    edgeAddOpen,
    setEdgeAddOpen,
    edgeChainNodeIds,
    setEdgeChainNodeIds,
    edgeChainReviewOpen,
    setEdgeChainReviewOpen,
    handleEdgeNodeClick,
    handleClearEdgeChain,
    handleExitEdgeMode,
    edgeChainSegments,
    handleProceedToEdgeChainReview,
    handleBackFromEdgeChainReview,
    handleSubmitEdgeChain,
    handleEdgeDelete,
    handleOpenEdgeAdd,
  } = useEdgeChain({
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
  });

  const {
    startCandidatePendingIds,
    handleToggleFinalExit,
    handleToggleStartCandidate,
    handleStructureNodeMove,
    handleStructureNodeMoveEnd,
    handleStructureNodeDelete,
  } = useStructureNodeActions({
    floorId,
    canvasH,
    structureNodes,
    setEditingStructureId,
    updateGraphCache,
    invalidateFloorRouteDiagnosis,
  });

  const {
    deleteConfirmTarget,
    setDeleteConfirmTarget,
    isDeletingItem,
    editingItemId,
    setEditingItemId,
    editForm,
    setEditForm,
    devicePositions,
    setDevicePositions,
    handleDeviceMoved,
    handleToggleEnabled,
    handleStartEditCctvCells,
    handleCancelEditCctvCells,
    handleSaveEditCctvCells,
    editingPanelItem,
    isDeviceEditFormDirty,
    isPanelItemSelected,
    handlePanelItemSelect,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handlePanelItemDelete,
    handleDeleteConfirm,
  } = useDeviceEditing({
    floorId,
    floor,
    realCctvs,
    iotLights,
    allPanelItems,
    addedDevices,
    setAddedDevices,
    selectedItem,
    setSelectedItem,
    setSelectedZoneRef,
    editingCctvId,
    setEditingCctvId,
    cctvDraftCellIds,
    setCctvDraftCellIds,
    setEditingStructureId,
    setEditingZoneId,
    zoneAddOpen,
    setZoneAddOpen,
    setNodeAddOpen,
    setEdgeAddOpen,
    updateGraphCache,
    updateFloorCache,
    patchCctvCache,
    patchLightCache,
    runLightFollowups,
  });

  const { isDeletingZone, handleAddZone, handleConfirmZoneReset, handleZoneDeleteConfirm } =
    useZoneActions({
      currentFloor,
      zones,
      zoneDraftCellIds,
      setZoneDraftCellIds,
      zoneResetTargetId,
      selectedZoneRef,
      setSelectedZoneRef,
      setZoneAddOpen,
      setEditingZoneId,
      zoneDeleteTarget,
      setZoneDeleteTarget,
      updateZonesCache,
    });

  const {
    lightNodeOptions,
    lightEdgeOptions,
    lightCctvOptions,
    lightPreviewSource,
    currentLightPickField,
    handleStartLightPick,
    handleLightCanvasPick,
    nodeAddLightPickField,
    editLightPickField,
  } = useLightGuidance({
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
  });

  // 층이 바뀌거나 도면을 다시 올렸을 때, 이전 도면 기준으로 만들어진 노드·장비·구역이
  // 화면에 남지 않도록 층 단위 상태를 한 번에 비움 (각 조회 effect가 새 데이터로 다시 채움)
  const resetFloorScopedState = useCallback(() => {
    lastCctvDraftRectRef.current = null;
    setAddedDevices([]);
    // 드래그로 옮긴 위치를 담아두는 오버레이 — 층을 바꿔도 안 비우면 다른 층에서 우연히
    // id가 겹칠 때 엉뚱한 위치가 그대로 보일 수 있음
    setDevicePositions({});
    setSelectedItem(null);
    setSelectedZoneRef(null);
    setSelectedEdgeId(null);
    setDeleteConfirmTarget(null);
    setEditingItemId(null);
    setEditingStructureId(null);
    setEditingZoneId(null);
    setNodeAddOpen(false);
    setZoneAddOpen(false);
    setEdgeAddOpen(false);
    setEditingCctvId(null);
    setCctvDraftCellIds([]);
    setZoneDraftCellIds([]);
    setNodeStagedPosition(null);
  }, [
    lastCctvDraftRectRef,
    setDevicePositions,
    setDeleteConfirmTarget,
    setEditingItemId,
    setNodeAddOpen,
    setEdgeAddOpen,
    setNodeStagedPosition,
  ]);

  const {
    uploadModalOpen,
    openUploadModal,
    closeUploadModal,
    pendingUpload,
    isReuploading,
    handleFileSelected,
    handleCloseUploadDimensionsModal,
    handleUploadDimensionsConfirm,
    resetUpload,
  } = useFloorUpload({
    buildingId,
    floorId,
    currentFloor,
    selectedBuildingId,
    editingLocked,
    resetFloorScopedState,
    markAwaitingUploadAnalysis,
  });

  // 층이 바뀌면(라우트 전환) 이전 층 기준으로 만들어진 노드·장비·구역이 화면에 남지 않도록 즉시 비움
  // (각 조회는 floorDetailQuery 등 react-query 훅들이 쿼리 키 변경으로 알아서 새로 받아옴)
  useEffect(() => {
    resetFloorScopedState();
  }, [buildingId, floorId, resetFloorScopedState]);

  // 훈련이 시작되는 순간 열려 있던 편집 흐름도 닫아, 잠금 전에 고른 값으로 변경 요청이
  // 나가는 것을 막는다. 서버의 FLOOR004는 최종 안전장치로 그대로 유지한다.
  useEffect(() => {
    if (!editingLocked) return;
    resetFloorScopedState();
    if (!isRunningSessionsPending) {
      void queryClient.invalidateQueries({ queryKey: floorQueryKeys.graph(floorId) });
    }
    resetUpload();
    setGridSetupPromptOpen(false);
    setGridSetupIntent(null);
    setLightPickTarget(null);
    setEdgeChainNodeIds([]);
    setEdgeChainReviewOpen(false);
    setZoneDeleteTarget(null);
  }, [
    editingLocked,
    floorId,
    isRunningSessionsPending,
    queryClient,
    resetFloorScopedState,
    resetUpload,
    setGridSetupPromptOpen,
    setGridSetupIntent,
    setEdgeChainNodeIds,
    setEdgeChainReviewOpen,
  ]);

  // 문/계단/복도/시작 후보는 구조 노드 편집 상태(비율 좌표 → 픽셀)로 별도로 들고, 나머지는
  // graphNodes로 조회 전용 보관 — canvasH(그리드/이미지 로드가 끝나야 확정)가 나중에 바뀌어도
  // 서버 재조회 없이 이 조회 결과(graphData)로 픽셀 좌표만 다시 계산함(예전엔 canvasH가 fetch
  // effect의 의존성에 들어있어서 canvasH가 바뀔 때마다 노드·엣지를 통째로 다시 조회했었음 —
  // 실측 확인된 중복 요청의 주 원인)
  useEffect(() => {
    const structureFromGraph: StructureNode[] = graphData.nodes.flatMap((n) => {
      const structureType = API_TYPE_TO_STRUCTURE[n.type];
      if (!structureType) return [];
      return [
        {
          id: n.id,
          type: structureType,
          x: n.x * CANVAS_W,
          y: n.y * canvasH,
          // 경로 탐색기가 인정하는 최종 탈출구는 type === 'EXIT'뿐 — 예전 코드로 isExitTarget만
          // 붙은 계단은 '탈출구로 지정'을 다시 눌러 EXIT로 승격해야 함(배지 아직 안 붙음)
          isFinalExit: n.type === 'EXIT',
          isStartCandidate: n.isStartCandidate,
        },
      ];
    });
    setStructureNodes(structureFromGraph);
  }, [graphData, canvasH]);

  // 유도등은 useFloorLightsQuery가 조회를 맡고(바로 위), 실제 등록된 유도등이 바뀔 때마다(조회·
  // 생성·수정·삭제 등 무엇으로 바뀌었든) 장비 마커 목록에 그대로 반영되게 동기화만 함
  useEffect(() => {
    setAddedDevices((prev) => [
      ...prev.filter((d) => d.placeType !== 'light'),
      ...iotLights.map(
        (light): AddedDevice => ({
          id: light.id,
          type: 'iot',
          placeType: 'light',
          label: light.name,
          x: light.x * 100,
          y: light.y * 100,
          status: 'online',
          zone: '사용자 등록',
        }),
      ),
    ]);
  }, [iotLights]);

  // CCTV는 useFloorCctvsQuery가 조회를 맡고(바로 위), 실제 등록된 CCTV가 바뀔 때마다(조회·생성·
  // 수정·삭제 등 무엇으로 바뀌었든) 장비 마커 목록에 그대로 반영되게 동기화만 함
  useEffect(() => {
    setAddedDevices((prev) => [
      ...prev.filter((d) => d.type !== 'cctv'),
      ...realCctvs.map(
        (cctv): AddedDevice => ({
          id: cctv.id,
          type: 'cctv',
          placeType: 'cctv',
          label: cctv.name,
          x: cctv.x * 100,
          y: cctv.y * 100,
          status: 'online',
          zone: formatMonitoredZone(cctv),
        }),
      ),
    ]);
  }, [realCctvs]);

  // 선택된 카드를 상단에 고정하지 않는 대신, 리스트 안에서 스크롤로 한 번 보여줌 (하이퍼링크 이동과 동일한 느낌)
  const focusedPanelId =
    selectedItem?.kind === 'device' ? selectedItem.data.id : (selectedZoneRef?.id ?? null);

  useEffect(() => {
    if (!isDevicePanelOpen || !focusedPanelId) return;
    const target = devicePanelRef.current?.querySelector(`[data-panel-id="${focusedPanelId}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusedPanelId, isDevicePanelOpen]);

  // 구역 설정 팝업이 닫히면 드래그로 선택한 임시 영역/셀과 재설정 대상도 함께 초기화
  useEffect(() => {
    if (!zoneAddOpen) {
      setZoneDraftRect(null);
      setZoneDraftCellIds([]);
      setZoneResetTargetId(null);
    }
  }, [zoneAddOpen, setZoneDraftRect]);

  const handleFloorChange = (newId: string) => {
    // selectedFloorId는 아래 navigate로 URL이 바뀌면 useParams를 통해 자동으로 갱신됨
    setSelectedItem(null);
    setDeleteConfirmTarget(null);
    setNodeAddOpen(false);
    setZoneAddOpen(false);
    void navigate(`/floorPlans/${selectedBuildingId}/${newId}`);
  };

  // 그리드 셀 드래그/클릭 선택은 CCTV 등록·CCTV 시야구역 재선택·구역 추가/수정 세 곳에서
  // 공유함 — 임시 선택값을 각자 다른 state(cctvDraftCellIds/zoneDraftCellIds)에 담아두고
  // 있어서 "지금 어느 쪽이 활성 상태인지"만 여기서 한 번 정하고 아래에서 그대로 씀
  const activeDraftCellIds = zoneAddOpen ? zoneDraftCellIds : cctvDraftCellIds;

  const setActiveDraftCellIds = zoneAddOpen ? setZoneDraftCellIds : setCctvDraftCellIds;

  const handleGridCellToggle = (cellId: string) => {
    setActiveDraftCellIds((prev) =>
      prev.includes(cellId) ? prev.filter((id) => id !== cellId) : [...prev, cellId],
    );
  };

  const handleZoneDragEnd = () => {
    const rect = zoneDraftRectRef.current;
    const isNewCctvSelecting = nodeAddOpen && nodeAddType === 'cctv' && nodeAddStage === 'fov';
    const cctvCellSelecting = isNewCctvSelecting || !!editingCctvId;
    if (cctvCellSelecting || zoneAddOpen) {
      if (rect && rect.w > 0 && rect.h > 0) {
        // 새 드래그가 이전 선택을 대체함(여러 번 드래그해도 마지막 것만 유효). 미세 조정은 셀 클릭 토글로
        setActiveDraftCellIds(
          cellIdsIntersectingRect(floorGridCells, rect, gridCellPxSize, canvasH),
        );
        // 신규 CCTV 등록 흐름일 때만 rect를 별도 보관 — 그리드 배율이 서버에서 사라져있어
        // 등록이 실패하면(CCTV006) 이 rect로 같은 영역을 다시 계산해 재시도함
        if (isNewCctvSelecting) lastCctvDraftRectRef.current = rect;
      }
      setZoneDraftRect(null);
    }
  };

  const isSameZoneRef = (a: ZoneRefSelection | null, b: ZoneRefSelection): boolean =>
    !!a && a.kind === b.kind && a.id === b.id;

  // 우측 패널 카드 클릭 — 이미 필터를 통과해 보이는 카드이므로 필터는 건드리지 않음
  const handleZoneRefSelect = (ref: ZoneRefSelection) => {
    setSelectedItem(null);
    setEditingItemId(null);
    // 엣지를 선택해둔 채로 다른 노드·구역을 고르면 엣지 강조가 그대로 남아있던 문제 —
    // 포커스는 하나만 유지되게 함
    setSelectedEdgeId(null);
    setSelectedZoneRef((prev) => (isSameZoneRef(prev, ref) ? null : ref));
  };

  // 도면에서 항목을 클릭하면, 그 카드가 지금 필터에 가려져 있어도 우측 패널에 드러나서
  // 포커싱(스크롤)되도록 상위/하위 필터를 그 항목에 맞게 이동시킴
  const handleZoneRefSelectFromMap = (ref: ZoneRefSelection) => {
    if (!isSameZoneRef(selectedZoneRef, ref)) setDevicePanelOpenOverride(true);
    handleZoneRefSelect(ref);
    if (ref.kind === 'zone') {
      setTopFilter((prev) => (prev === 'device' ? 'all' : prev));
      return;
    }
    setTopFilter((prev) => (prev === 'zone' ? 'all' : prev));
    // 문/계단 노드면 해당 하위 칩으로 이동(다른 칩은 정리), 그 외(방·복도 등)는 하위 필터 해제
    const structureType = structureNodes.find((n) => n.id === ref.id)?.type;
    setDeviceTypeFilter(
      structureType === 'door' || structureType === 'stair' ? [structureType] : [],
    );
  };

  // 카드 수정은 한 번에 하나만 — 다른 종류의 카드를 수정 중이었다면 여기서 정리함
  const handleStartEditStructure = (id: string) => {
    setNodeAddOpen(false);
    setZoneAddOpen(false);
    setEditingItemId(null);
    setEditingZoneId(null);
    handleCancelEditCctvCells();
    setEditingStructureId((prev) => (prev === id ? null : id));
  };

  // "수정"을 누르면 이름 입력뿐 아니라 도면 그리드 셀 선택도 바로 켬 — 재설정을 위해 별도
  // 버튼·팝업을 한 번 더 거치게 했더니 클릭이 너무 많다는 피드백으로, CCTV 감시영역과 같은
  // 결로 통일함(수정 중엔 도면을 드래그하면 바로 영역이 다시 잡힘)
  const handleStartEditZone = (zone: ZoneEntry) => {
    setEditingItemId(null);
    setEditingStructureId(null);
    handleCancelEditCctvCells();
    setZoneResetTargetId(zone.id);
    setZoneDraftCellIds(zone.cellIds);
    setZoneAddOpen(true);
    setEditingZoneId(zone.id);
    setZoneEditLabel(zone.label);
  };

  // 이름 수정 API가 아직 없어서 로컬에만 반영됨 — 새로고침하면 원래 이름으로 돌아감
  const handleSaveZoneLabel = (id: string) => {
    const trimmed = zoneEditLabel.trim();
    if (zoneResetTargetId === id) {
      const original = zones.find((z) => z.id === id);
      const cellsChanged =
        !original ||
        original.cellIds.length !== zoneDraftCellIds.length ||
        !original.cellIds.every((c) => zoneDraftCellIds.includes(c));
      const nameChanged = !!trimmed && !!original && trimmed !== original.label;
      // 아무것도 안 바꿨으면(이름도 그대로, 도면도 안 건드림) 굳이 삭제→생성을 왕복하지 않고
      // 그냥 수정 모드만 닫음
      if (!cellsChanged && !nameChanged) {
        setZoneAddOpen(false);
        setZoneDraftCellIds([]);
        setZoneResetTargetId(null);
        setEditingZoneId(null);
        return;
      }
      if (trimmed) handleConfirmZoneReset(trimmed);
      return;
    }
    if (trimmed) {
      updateZonesCache((prev) => prev.map((z) => (z.id === id ? { ...z, name: trimmed } : z)));
    }
    setEditingZoneId(null);
  };

  // 구역 추가 버튼 — 그리드가 있어야 셀을 선택할 수 있어서, 없으면 설정 팝업부터 띄움
  const handleToggleZoneAdd = () => {
    setNodeAddOpen(false);
    if (zoneAddOpen) {
      setZoneAddOpen(false);
      return;
    }
    setZoneResetTargetId(null);
    ensureFloorGridCells().then((cells) => {
      if (cells.length > 0) {
        setZoneAddOpen(true);
        return;
      }
      openGridSetupPrompt('zone');
    });
  };

  // 추가/편집 모드는 이제 바깥 클릭으로 안 닫히므로(캔버스가 아닌 다른 영역을 눌러도 진행
  // 중인 폼이 사라지지 않게 하기 위함), 마우스 없이도 빠져나갈 수 있도록 Esc로 지금 열려 있는
  // 모드 하나를 명시적으로 종료함. 이 모드들은 서로 배타적으로 열리므로 우선순위만 정해두면 됨
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (gridSetupPromptOpen) {
        // handleGridSetupPromptCancel과 같은 동작 — 매 렌더마다 새로 만들어지는 함수라
        // 의존성 배열에 넣으면 리스너가 렌더마다 재구독되므로 여기선 로직만 그대로 옮겨 씀
        setGridSetupPromptOpen(false);
        if (gridSetupIntent === 'cctv') {
          setNodeAddStage('entry');
          setZoneDraftRect(null);
          setCctvDraftCellIds([]);
          lastCctvDraftRectRef.current = null;
        }
        setGridSetupIntent(null);
      } else if (editingCctvId) {
        handleCancelEditCctvCells();
      } else if (edgeChainReviewOpen) {
        // 검토 화면에서는 모드 전체를 나가지 말고 경로 편집으로 한 단계만 되돌아감
        setEdgeChainReviewOpen(false);
      } else if (edgeAddOpen) {
        handleExitEdgeMode();
      } else if (zoneAddOpen) {
        setZoneAddOpen(false);
      } else if (nodeAddOpen) {
        handleCancelNodeAdd();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    gridSetupPromptOpen,
    gridSetupIntent,
    editingCctvId,
    edgeChainReviewOpen,
    edgeAddOpen,
    zoneAddOpen,
    nodeAddOpen,
    setGridSetupPromptOpen,
    setGridSetupIntent,
    setNodeAddStage,
    setZoneDraftRect,
    lastCctvDraftRectRef,
    handleCancelEditCctvCells,
    setEdgeChainReviewOpen,
    handleExitEdgeMode,
    handleCancelNodeAdd,
  ]);

  // 시작 후보에서 최종 탈출구까지 엣지 경로 존재 여부 (훈련 준비 체크리스트용)
  const hasRouteFromStartToExit = useMemo(
    () => hasRouteToExit(structureNodes, graphEdges),
    [structureNodes, graphEdges],
  );

  // 다른 삭제(장비/POI)는 전부 확인 모달을 거치는데 구역만 클릭 즉시 삭제되고 있어서 맞춤
  const handleZoneDeleteRequest = (zone: ZoneEntry) => setZoneDeleteTarget(zone);

  const handleZoneDeleteCancel = () => setZoneDeleteTarget(null);

  const isNodeSelected = (id: string) =>
    selectedZoneRef?.kind === 'node' && selectedZoneRef.id === id;

  const isZoneSelected = (id: string) =>
    selectedZoneRef?.kind === 'zone' && selectedZoneRef.id === id;

  const panelItems = useMemo(
    () =>
      allPanelItems.filter(
        (item) => deviceTypeFilter.length === 0 || deviceTypeFilter.some((t) => t === item.type),
      ),
    [allPanelItems, deviceTypeFilter],
  );

  const visibleStructureNodes = useMemo(
    () =>
      structureNodes.filter(
        (n) => deviceTypeFilter.length === 0 || deviceTypeFilter.some((t) => t === n.type),
      ),
    [structureNodes, deviceTypeFilter],
  );

  // 그리드는 더 이상 토글로 껐다 켰다 하지 않고, 선택/조회 중이 아니면 항상 표시함
  // (floorGridCells가 비어 있으면 어차피 그릴 게 없어서 실질적으로 아무것도 안 보임)
  const cctvGridCellsMode: 'selecting' | 'viewing' | 'browsing' =
    (nodeAddOpen && nodeAddType === 'cctv' && nodeAddStage === 'fov') ||
    editingCctvId ||
    zoneAddOpen
      ? 'selecting'
      : selectedItem?.kind === 'device' && realCctvs.some((c) => c.id === selectedItem.data.id)
        ? 'viewing'
        : 'browsing';

  // 드래그 중에는 미리보기로 "겹치는 셀"을 실시간 표시 → 손을 떼면 그대로 확정됨
  const dragPreviewCellIds =
    cctvGridCellsMode === 'selecting' && zoneDraftRect && zoneDraftRect.w > 0 && zoneDraftRect.h > 0
      ? cellIdsIntersectingRect(floorGridCells, zoneDraftRect, gridCellPxSize, canvasH)
      : null;

  const selectedGridCellIds =
    cctvGridCellsMode === 'selecting'
      ? (dragPreviewCellIds ?? activeDraftCellIds)
      : cctvGridCellsMode === 'viewing' && selectedItem?.kind === 'device'
        ? (realCctvs.find((c) => c.id === selectedItem.data.id)?.gridCells.map((c) => c.id) ?? [])
        : [];

  return (
    <>
      <div ref={layoutRef} className={styles.layout}>
        {/* ── 좌측 사이드바 ── */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarInner} style={{ padding: '2rem 2rem 2.4rem' }}>
            <div
              id={EDITING_LOCK_HINT_ID}
              className={editingLocked ? styles.editingLockNotice : undefined}
              role="status"
            >
              {editingLocked
                ? isRunningSessionsPending
                  ? '훈련 진행 여부를 확인하는 동안 도면 편집을 잠시 사용할 수 없습니다.'
                  : '훈련 진행 중에는 도면·노드·구역·기기 설정을 변경할 수 없습니다. 기기 활성화·비활성화는 계속 사용할 수 있습니다.'
                : ''}
            </div>

            {/* 층 목록 */}
            <div className={styles.floorNavCard}>
              <div className={styles.floorNavHeader}>층 목록</div>
              <div className={styles.floorNavList}>
                {[...(currentBuilding?.floors ?? [])]
                  .sort((a, b) => b.floorNum - a.floorNum)
                  .map((f) => {
                    const isCurrent = f.id === selectedFloorId;
                    const isNone = !hasFloorPlan(f);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        className={clsx(
                          styles.floorNavItem,
                          isCurrent && styles.floorNavItemActive,
                        )}
                        onClick={() => handleFloorChange(f.id)}
                      >
                        <span>{formatFloor(f.floorNum)}</span>
                        {isNone && <StatusBadge label="미등록" color="neutral" />}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* 훈련 준비 체크리스트 — 시작 노드·최종 탈출구가 없으면 시나리오 재생이 안 되는데
                그동안 눈에 띄는 안내가 없었음. 층 목록 바로 아래, 도면 편집을 시작하기 전에
                가장 먼저 보이는 자리에 둠.
                상태는 currentFloor(목록 캐시)가 아니라 실시간으로 폴링되는 상세 조회(floor)를
                우선으로 봄 — 업로드 후 분석이 끝나도 목록 캐시는 안 갱신돼서 체크리스트만
                새로고침 전엔 안 뜨던 문제. 캔버스도 아래에서 resolvedFloor로 판단함 */}
            {resolvedFloor?.segmentationStatus === 'DONE' && (
              <ReadinessChecklist
                hasStartNode={structureNodes.some((n) => n.type === 'start' || n.isStartCandidate)}
                hasFinalExit={structureNodes.some((n) => n.isFinalExit)}
                hasStair={structureNodes.some((n) => n.type === 'stair')}
                hasRouteToExit={hasRouteFromStartToExit}
                routeDiagnosis={routeDiagnosisQuery.isError ? undefined : routeDiagnosisQuery.data}
                isDiagnosisHighlighted={isDiagnosisHighlighted}
                editingLocked={editingLocked}
                editingLockHintId={EDITING_LOCK_HINT_ID}
                onAddStartNode={() => {
                  // 시작 후보는 문·출입구 카드에서 지정 — 해당 필터로 이동
                  setTopFilter('device');
                  setDeviceTypeFilter(['door']);
                }}
                onAddStair={() => handleOpenNodeAdd('stair')}
                onFocusDeviceCards={() => {
                  setTopFilter('device');
                  setDeviceTypeFilter([]);
                }}
                onConnectEdges={handleOpenEdgeAdd}
                onToggleDiagnosisHighlight={toggleDiagnosisHighlight}
              />
            )}

            {/* 노드/구역/엣지 추가 · 그리드 설정 · 감시영역 재선택 팝업 — 예전엔 캔버스 위에
                떠 있어서 도면을 가려 그 밑을 클릭할 수 없었음. 도면을 보면서 동시에 입력할 수
                있어야 하는 흐름이라, 캔버스와 겹치지 않는 이 사이드바로 옮김 */}
            {gridSetupPromptOpen && (
              <GridSetupPopup
                cellSizeCm={gridSizeCmInput}
                onCellSizeChange={setGridSizeCmInput}
                onCancel={handleGridSetupPromptCancel}
                onConfirm={handleGridSetupPromptConfirm}
              />
            )}

            {edgeAddOpen && (
              <EdgeChainPopup
                nodeLabels={edgeChainNodeIds.map((id) => getGraphNodeLabel(id))}
                reviewing={edgeChainReviewOpen}
                segments={edgeChainSegments}
                onClear={handleClearEdgeChain}
                onNext={handleProceedToEdgeChainReview}
                onCancel={handleExitEdgeMode}
                onBack={handleBackFromEdgeChainReview}
                onSubmit={handleSubmitEdgeChain}
              />
            )}

            {editingCctvId && (
              <SidebarPopup
                title="감시 영역 재선택"
                hint={`도면에서 칸을 클릭하거나 드래그해서 감시 영역을 다시 선택해주세요. ${cctvDraftCellIds.length}칸 선택됨.`}
                actions={[
                  { label: '취소', variant: 'cancel', onClick: handleCancelEditCctvCells },
                  {
                    label: '저장',
                    variant: 'submit',
                    disabled: cctvDraftCellIds.length === 0,
                    onClick: handleSaveEditCctvCells,
                  },
                ]}
              />
            )}

            {nodeAddOpen && !gridSetupPromptOpen && (
              <NodeAddPopup
                type={nodeAddType}
                onTypeChange={setNodeAddType}
                stage={nodeAddStage}
                hasPosition={!!nodeStagedPosition}
                selectedCellCount={cctvDraftCellIds.length}
                onCancel={handleCancelNodeAdd}
                onBack={handleNodeAddBack}
                onSubmitEntry={handleSubmitNodeEntry}
                onFinalize={handleFinalizeFov}
                lightNodeOptions={lightNodeOptions}
                lightEdgeOptions={lightEdgeOptions}
                lightCctvOptions={lightCctvOptions}
                lightFields={nodeAddLightFields}
                onLightFieldsChange={setNodeAddLightFields}
                lightPickField={nodeAddLightPickField}
                onStartLightPick={(field) => handleStartLightPick('add', field)}
              />
            )}

            {/* 기존 구역 수정(zoneResetTargetId)은 팝업 없이 카드에서 이름을, 도면에서 칸을
                바로 편집함 — 이 팝업은 "새 구역 추가"에만 씀(이름을 받을 카드가 아직 없어서
                여전히 필요함) */}
            {zoneAddOpen && !zoneResetTargetId && (
              <ZoneAddPopup
                selectedCellCount={zoneDraftCellIds.length}
                onCancel={() => setZoneAddOpen(false)}
                onSave={handleAddZone}
              />
            )}
          </div>
        </aside>

        {/* ── 중앙 캔버스 ── */}
        <div className={styles.canvasArea}>
          {currentFloor && (
            <div className={styles.canvasHeader}>
              <button
                type="button"
                className={styles.backButton}
                onClick={() => navigate('/floorPlans')}
                aria-label="도면 관리 목록으로"
              >
                <ChevronRightIcon width={16} height={16} className={styles.backButtonIcon} />
              </button>
              <span className={styles.canvasHeaderText}>{currentBuilding?.name ?? ''}</span>
              <span className={styles.canvasHeaderFloor}>{formatFloor(currentFloor.floorNum)}</span>
            </div>
          )}

          <div
            className={clsx(
              styles.canvasBody,
              currentFloor?.segmentationStatus === 'DONE' && styles.canvasBodyWithActions,
            )}
          >
            {/* 그리드는 이제 토글 없이 항상 표시함(아래 ensureFloorGridCells 자동 조회 효과 참고) */}
            {currentFloor?.segmentationStatus === 'DONE' && (
              <div className={styles.canvasTopRightRow}>
                <AddActionMenu
                  disabled={editingLocked}
                  disabledHintId={EDITING_LOCK_HINT_ID}
                  onAddNode={() => handleOpenNodeAdd()}
                  onAddZone={handleToggleZoneAdd}
                  onAddEdge={handleOpenEdgeAdd}
                />
              </div>
            )}

            {(routeDiagnosisQuery.data?.ready === true ||
              (isDiagnosisHighlighted && routeDiagnosisQuery.data?.ready === false)) && (
              <div
                className={styles.canvasDiagnosisAlert({
                  tone: routeDiagnosisQuery.data.ready ? 'success' : 'danger',
                })}
                role={routeDiagnosisQuery.data.ready ? 'status' : 'alert'}
              >
                <span
                  className={styles.canvasDiagnosisAlertIcon({
                    tone: routeDiagnosisQuery.data.ready ? 'success' : 'danger',
                  })}
                  aria-hidden="true"
                >
                  {routeDiagnosisQuery.data.ready ? (
                    <CheckIcon width={12} height={12} />
                  ) : (
                    <AlertIcon width={12} height={12} />
                  )}
                </span>
                <span className={styles.canvasDiagnosisAlertMessage}>
                  {routeDiagnosisQuery.data.ready
                    ? '모든 시작 후보가 2곳 이상의 탈출구와 연결되어 있어요.'
                    : '빨간색 노드는 탈출구로 이어지는 경로가 없어요. 가까운 노드와 엣지로 연결해 주세요.'}
                </span>
              </div>
            )}

            <div className={styles.canvasScrollArea}>
              {floorDetailQuery.isError && !currentFloor ? (
                // 실제로 없는 층(404 등)일 때만 안내. 목록 캐시에 아직 안 들어온 층을 직접
                // 열었거나 방금 만든 직후엔 잠깐 둘 다 비어 있을 수 있어, 그 사이엔 로딩만 보여줌
                <EmptyState
                  className={canvasPlaceholder}
                  size="compact"
                  icon={<MapIcon />}
                  title="층 정보를 찾을 수 없습니다"
                />
              ) : resolvedFloor ? (
                <FloorCanvas
                  mapWrapRef={mapWrapRef}
                  floor={resolvedFloor}
                  resolvedImageUrl={resolvedMapImageUrl}
                  canvasH={canvasH}
                  selected={selectedItem}
                  zoom={zoom}
                  editingItemId={editingItemId}
                  placingActive={nodeAddOpen}
                  zoneAddActive={
                    zoneAddOpen ||
                    (nodeAddType === 'cctv' && nodeAddStage === 'fov') ||
                    !!editingCctvId
                  }
                  onZoneDraftChange={setZoneDraftRect}
                  onZoneDragEnd={handleZoneDragEnd}
                  isZoneDragging={isZoneDragging}
                  onZoneDraggingChange={setIsZoneDragging}
                  savedZones={zones}
                  structureNodes={structureNodes}
                  editingStructureId={editingStructureId}
                  onStructureNodeMove={handleStructureNodeMove}
                  onStructureNodeMoveEnd={handleStructureNodeMoveEnd}
                  graphNodes={graphNodes}
                  graphEdges={graphEdges}
                  edgeAddActive={edgeAddOpen && !edgeChainReviewOpen}
                  onNodeClickForEdge={handleEdgeNodeClick}
                  edgeChainNodeIds={edgeChainNodeIds}
                  selectedEdgeId={selectedEdgeId}
                  onEdgeSelect={setSelectedEdgeId}
                  onEdgeDelete={handleEdgeDelete}
                  selectedZoneRef={selectedZoneRef}
                  onZoneRefSelect={handleZoneRefSelectFromMap}
                  cctvGridCellsMode={cctvGridCellsMode}
                  floorGridCells={floorGridCells}
                  selectedGridCellIds={selectedGridCellIds}
                  gridCellPxSize={gridCellPxSize}
                  onGridCellToggle={handleGridCellToggle}
                  lightPreviewNodeId={lightPreviewSource?.decisionNodeId}
                  lightPreviewLeftEdgeId={lightPreviewSource?.leftEdgeId}
                  lightPreviewRightEdgeId={lightPreviewSource?.rightEdgeId}
                  lightPickField={currentLightPickField}
                  onLightPick={handleLightCanvasPick}
                  stagedCameraPosition={nodeStagedPosition}
                  onSelectDevice={(d) => {
                    const isSame = selectedItem?.kind === 'device' && selectedItem.data.id === d.id;
                    if (!isSame) setDevicePanelOpenOverride(true);
                    setSelectedItem(isSame ? null : { kind: 'device', data: d });
                    setSelectedZoneRef(null);
                    // 엣지를 선택해둔 채로 장비를 고르면 엣지 강조가 그대로 남아있던 문제 —
                    // 포커스는 하나만 유지되게 함
                    setSelectedEdgeId(null);
                    // 지금 하위 필터에 가려져 있어도 이 장비 카드가 패널에 드러나도록 그 종류로 이동
                    // (다른 칩은 정리 — 안 그러면 이 종류가 아직 안 켜져 있을 때 여전히 숨어 있음)
                    setTopFilter((prev) => (prev === 'zone' ? 'all' : prev));
                    const chip = deviceTypeToFilterChip(d.type);
                    setDeviceTypeFilter(chip ? [chip] : []);
                  }}
                  onMapClick={handleMapClick}
                  onBackgroundClick={() => {
                    setSelectedItem(null);
                    setSelectedZoneRef(null);
                    setSelectedEdgeId(null);
                  }}
                  devicePositions={devicePositions}
                  onDeviceMoved={handleDeviceMoved}
                  addedDevices={addedDevices}
                  onUpload={openUploadModal}
                  editingLocked={editingLocked}
                  editingLockHintId={EDITING_LOCK_HINT_ID}
                  routeDiagnosisHighlight={routeDiagnosisHighlight}
                />
              ) : (
                <LoadingState message="도면을 불러오는 중..." />
              )}
            </div>
          </div>

          {/* 캔버스 우하단 — 범례 정보 아이콘을 줌 컨트롤 바로 위에 세로로 쌓음 */}
          <div className={styles.canvasBottomRightColumn}>
            {currentFloor?.segmentationStatus === 'DONE' && (
              <NodeTypeLegendInfo diagnosisVisible={isDiagnosisHighlighted} />
            )}
            <div className={styles.canvasZoomFloat}>
              <button
                type="button"
                className={styles.zoomButton}
                onClick={() => setZoom((v) => Math.max(50, v - 10))}
                disabled={zoom <= 50}
                aria-label="축소"
              >
                −
              </button>
              <button
                type="button"
                className={zoom !== 100 ? styles.zoomValueClickable : styles.zoomValue}
                onClick={() => setZoom(100)}
                title={zoom !== 100 ? '클릭해서 100% 리셋' : undefined}
              >
                {zoom}%
              </button>
              <button
                type="button"
                className={styles.zoomButton}
                onClick={() => setZoom((v) => Math.min(200, v + 10))}
                disabled={zoom >= 200}
                aria-label="확대"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* ── 우측 장비 목록 패널 ── */}
        <aside
          ref={devicePanelRef}
          className={clsx(styles.devicePanel, !isDevicePanelOpen && styles.devicePanelCollapsed)}
          aria-label="장비 목록"
        >
          <div className={styles.devicePanelHeader}>
            {isDevicePanelOpen && <span className={styles.devicePanelHeading}>장비 목록</span>}
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={isDevicePanelOpen ? '장비 목록 접기' : '장비 목록 펼치기'}
              aria-expanded={isDevicePanelOpen}
              aria-controls="floor-device-panel-content"
              onClick={() => setDevicePanelOpenOverride(!isDevicePanelOpen)}
            >
              <ChevronRightIcon
                className={isDevicePanelOpen ? undefined : styles.devicePanelToggleExpand}
              />
            </Button>
          </div>
          <div
            id="floor-device-panel-content"
            className={clsx(
              styles.devicePanelInner,
              !isDevicePanelOpen && styles.devicePanelInnerHidden,
            )}
          >
            <div className={styles.devicePanelSticky}>
              <div className={styles.filterTabs}>
                {(
                  [
                    { key: 'all', label: '전체' },
                    { key: 'device', label: '노드' },
                    { key: 'zone', label: '구역' },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    className={clsx(styles.filterTab, topFilter === key && styles.filterTabActive)}
                    onClick={() => {
                      // 유도등 등 하위 필터 칩을 고른 채로 "전체"를 누르면 그 필터가 그대로
                      // 남아서 전체가 아니라 필터링된 목록만 보이는 문제가 있었음 — 탭을
                      // 바꿀 때마다 하위 필터도 같이 초기화함
                      setTopFilter(key);
                      setDeviceTypeFilter([]);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {topFilter === 'device' && (
                <div className={styles.subFilterChips}>
                  {(
                    [
                      { key: 'cctv', label: 'CCTV' },
                      { key: 'light', label: '유도등' },
                      { key: 'door', label: '문 · 출입구' },
                      { key: 'stair', label: '계단' },
                      { key: 'hallway', label: '복도' },
                      { key: 'start', label: '시작 후보' },
                    ] as const
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      className={clsx(
                        styles.subFilterChip,
                        deviceTypeFilter.includes(key) && styles.subFilterChipActive,
                      )}
                      onClick={() =>
                        setDeviceTypeFilter((prev) =>
                          prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
                        )
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.devicePanelList}>
              {topFilter !== 'zone' && (
                <>
                  {visibleStructureNodes.map((n) => (
                    <StructureNodeCard
                      key={n.id}
                      node={n}
                      sameTypeIndex={structureNodes
                        .filter((x) => x.type === n.type)
                        .findIndex((x) => x.id === n.id)}
                      selected={isNodeSelected(n.id)}
                      editing={editingStructureId === n.id}
                      diagnosisUnreachable={
                        isDiagnosisHighlighted &&
                        !!routeDiagnosisQuery.data?.unreachableNodeIds?.includes(n.id)
                      }
                      startCandidatePending={startCandidatePendingIds.has(n.id)}
                      editingLocked={editingLocked}
                      editingLockHintId={EDITING_LOCK_HINT_ID}
                      onSelect={(id) => handleZoneRefSelect({ kind: 'node', id })}
                      onToggleFinalExit={handleToggleFinalExit}
                      onToggleStartCandidate={handleToggleStartCandidate}
                      onStartEdit={handleStartEditStructure}
                      onDelete={handleStructureNodeDelete}
                    />
                  ))}

                  {panelItems.map((item) => (
                    <DeviceCard
                      key={item.id}
                      item={item}
                      selected={isPanelItemSelected(item)}
                      editing={editingItemId === item.id}
                      editForm={editForm}
                      hasChanges={isDeviceEditFormDirty}
                      editingLocked={editingLocked}
                      editingLockHintId={EDITING_LOCK_HINT_ID}
                      onEditFormChange={setEditForm}
                      onSelect={handlePanelItemSelect}
                      onStartEdit={handleStartEdit}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      onDelete={handlePanelItemDelete}
                      onToggleEnabled={handleToggleEnabled}
                      onEditCctvCells={handleStartEditCctvCells}
                      lightNodeOptions={lightNodeOptions}
                      lightEdgeOptions={lightEdgeOptions}
                      lightCctvOptions={lightCctvOptions}
                      lightPickField={editingItemId === item.id ? editLightPickField : null}
                      onStartLightPick={(field) => handleStartLightPick('edit', field)}
                    />
                  ))}

                  {panelItems.length === 0 &&
                    visibleStructureNodes.length === 0 &&
                    topFilter === 'device' && (
                      <EmptyState size="compact" title="표시할 노드가 없습니다" />
                    )}
                </>
              )}

              {topFilter !== 'device' &&
                zones
                  .filter((z) => z.type === 'general')
                  .map((z) => (
                    <ZoneCard
                      key={z.id}
                      zone={z}
                      selected={isZoneSelected(z.id)}
                      editing={editingZoneId === z.id}
                      editLabel={zoneEditLabel}
                      draftCellCount={zoneDraftCellIds.length}
                      editingLocked={editingLocked}
                      editingLockHintId={EDITING_LOCK_HINT_ID}
                      onEditLabelChange={setZoneEditLabel}
                      onSelect={(id) => handleZoneRefSelect({ kind: 'zone', id })}
                      onStartEdit={handleStartEditZone}
                      onSaveLabel={handleSaveZoneLabel}
                      onDelete={handleZoneDeleteRequest}
                    />
                  ))}
            </div>
          </div>
        </aside>
      </div>

      <FloorUploadModal
        open={uploadModalOpen}
        onClose={closeUploadModal}
        buildingName={currentBuilding?.name ?? ''}
        floorNum={currentFloor?.floorNum ?? 0}
        onConfirm={handleFileSelected}
      />

      {pendingUpload && (
        <GridAreaSettingModal
          open
          onClose={handleCloseUploadDimensionsModal}
          mapImageUrl={pendingUpload.previewUrl}
          onConfirm={handleUploadDimensionsConfirm}
          isSubmitting={isReuploading}
        />
      )}

      {deleteConfirmTarget && (
        <EquipmentDeleteConfirmModal
          open
          onClose={() => setDeleteConfirmTarget(null)}
          label={deleteConfirmTarget.label}
          onConfirm={handleDeleteConfirm}
          isSubmitting={isDeletingItem}
        />
      )}

      {zoneDeleteTarget && (
        <EquipmentDeleteConfirmModal
          open
          onClose={handleZoneDeleteCancel}
          label={zoneDeleteTarget.label}
          onConfirm={handleZoneDeleteConfirm}
          isSubmitting={isDeletingZone}
        />
      )}
    </>
  );
};

export default FloorPlansDetailPage;
