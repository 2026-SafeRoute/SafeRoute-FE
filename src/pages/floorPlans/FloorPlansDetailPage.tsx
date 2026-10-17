import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import clsx from 'clsx';
import { useNavigate, useParams } from 'react-router';

import { useGetBuildingsQuery } from '@apis/buildings/useBuildingsQuery';
import { extractApiError } from '@apis/errors/apiError';
import {
  floorGraphQueryOptions,
  floorQueryKeys,
  useBuildingFloorsQuery,
  useFloorCctvsQuery,
  useFloorGridCellsQuery,
  useFloorImageUrlQuery,
  useFloorLightsQuery,
  useFloorUserZonesQuery,
} from '@apis/floors/floorQueries';
import type { UserZoneWithCells } from '@apis/floors/floorQueries';
import { TRAINING_SESSION_STATUS } from '@apis/trainingSessions/trainingSessionConstants';
import { useGetTrainingSessionsQuery } from '@apis/trainingSessions/useGetTrainingSessionsQuery';

import AlertIcon from '@assets/icons/ic-alert.svg?react';
import CheckIcon from '@assets/icons/ic-check.svg?react';
import ChevronRightIcon from '@assets/icons/ic-chevron-right.svg?react';
import EditIcon from '@assets/icons/ic-edit.svg?react';
import MapIcon from '@assets/icons/ic-map.svg?react';
import TrashIcon from '@assets/icons/ic-trash.svg?react';

import { Button } from '@components/Button';
import StatusBadge from '@components/chip/StatusBadge';
import EmptyState from '@components/empty';
import LoadingState from '@components/loadingState';
import useToast from '@components/toast/useToast';

import { interactivePanelBreakpoints } from '@styles/responsive.css';

import { formatFloor, hasFloorPlan } from '@utils/floor';
import { CANVAS_W, getGridCellPxSize, getGridDimensions } from '@utils/floorCanvas';
import { formatAreaM2 } from '@utils/format';

import {
  configureCctvGridCells,
  createCctv,
  deleteCctv,
  disableCctv,
  enableCctv,
  updateCctv,
} from './api/cctvApi';
import { getFloorGridCells, getFloorGridScale, setFloorGrid } from './api/floorGridApi';
import { analyzeFloor, getFloorDetail, toFloor, uploadFloor } from './api/floorPlansApi';
import {
  assignLightCctv,
  configureLightGuidance,
  createIoTLight,
  deleteIoTLight,
  disableIoTLight,
  enableIoTLight,
  updateIoTLight,
} from './api/iotLightsApi';
import {
  createMapEdge,
  createMapNode,
  deleteMapEdge,
  deleteMapNode,
  updateMapNodePosition,
  updateNodeStartCandidate,
} from './api/mapGraphApi';
import {
  floorRouteDiagnosisQueryKey,
  useFloorRouteDiagnosisQuery,
} from './api/useFloorRouteDiagnosisQuery';
import { createUserZone, deleteUserZone } from './api/userZoneApi';
import AddActionMenu from './components/AddActionMenu';
import DeviceCard from './components/DeviceCard';
import EdgeChainReviewPopup from './components/EdgeChainReviewPopup';
import FloorCanvas from './components/FloorCanvas';
import NodeAddPopup from './components/NodeAddPopup';
import NodeTypeLegendInfo from './components/NodeTypeLegendInfo';
import ReadinessChecklist from './components/ReadinessChecklist';
import ZoneAddPopup from './components/ZoneAddPopup';
import { DEVICE_PLACE_CONFIG } from './constants/devicePlacement';
import {
  API_TYPE_TO_STRUCTURE,
  isStructureNodeType,
  STRUCTURE_NODE_API_TYPE,
  STRUCTURE_NODE_LABEL,
  ZONE_CARD_DOT_CLASS,
} from './constants/structureNode';
import * as styles from './FloorPlansDetailPage.css';
import EquipmentDeleteConfirmModal from './modals/EquipmentDeleteConfirmModal';
import FloorUploadModal from './modals/FloorUploadModal';
import GridAreaSettingModal from './modals/GridAreaSettingModal';
import { EMPTY_DEVICE_EDIT_FORM } from './types/panelItem';
import {
  GRID_SIZE_KEY,
  PENDING_GRID_SIZE_KEY,
  readStoredNumber,
  rememberGridSize,
  rememberPendingGridSize,
} from './utils/gridStorage';
import { hasExistingEdge } from './utils/hasExistingEdge';

import type { Cctv } from './api/cctvApi';
import type { FloorGridCell } from './api/floorGridApi';
import type { IoTLight } from './api/iotLightsApi';
import type { FloorGraph, MapEdge, MapNodeType } from './api/mapGraphApi';
import type { LightAddFields } from './components/NodeAddPopup';
import type { AddedDevice, PlacingDeviceType } from './constants/devicePlacement';
import type { StructureNode } from './constants/structureNode';
import type { SelectedItem, ZoneEntry, ZoneRect, ZoneRefSelection } from './types/canvasSelection';
import type { DeviceType, Floor, FloorBuilding } from './types/floorPlans';
import type { DeviceEditForm, PanelItem } from './types/panelItem';

// CCTV 등록·시야 재선택·수정 세 곳에서 카드에 보여줄 "모니터링 N칸 · M㎡" 문구를 각자 다시
// 조립하면 한 줄이 100자를 넘기기 쉽고 표현도 어긋나기 쉬워 하나로 합침
const formatMonitoredZone = (cctv: Pick<Cctv, 'monitoredGridCellCount' | 'monitoredAreaM2'>) =>
  `모니터링 ${cctv.monitoredGridCellCount}칸 · ${formatAreaM2(cctv.monitoredAreaM2)}㎡`;

// "설치 위치" 카드 행 — CCTV는 감시 영역에서 계산한 실제 값(zone)이 있지만, 유도등은 그런
// 백엔드 필드가 없어(등록 팝업의 "설치 위치" 입력은 저장 API로 나가지 않음) 새로고침하면
// 사라지고 고정 문구로 되돌아가던 값이었음 — 대신 이미 갖고 있는 실제 좌표를 보여줘서
// 최소한 의미 있는 값이 뜨게 함
const formatInstallLocation = (type: PanelItem['type'], x: number, y: number, zone: string) =>
  type === 'cctv' ? zone : `X ${Math.round(x)}% · Y ${Math.round(y)}%`;

// 도면 마커의 DeviceType('cctv'|'iot'|'fire')을 패널 필터 체계(PanelItem.type)로 변환.
// 두 군데(패널 목록 만들 때, 지도 클릭으로 필터 이동할 때)에서 각각 다시 구현하면 인식 못하는
// 값의 처리(fallback)가 서로 어긋날 수 있어 하나로 합침
const deviceTypeToPlaceType = (type: DeviceType): PanelItem['type'] => {
  if (type === 'cctv') return 'cctv';
  if (type === 'iot') return 'light';
  return 'general';
};

// deviceTypeFilter(하위 필터 칩)는 'general' 칩이 따로 없어서, 그 값은 필터 해제(null)로 흡수함 —
// 위 매핑에서 파생시켜 fallback이 서로 다른 두 벌의 변환 로직으로 갈라지지 않게 함
const deviceTypeToFilterChip = (type: DeviceType): 'cctv' | 'light' | null => {
  const placeType = deviceTypeToPlaceType(type);
  return placeType === 'general' ? null : placeType;
};

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

// 그리드 좌표계 기준값·순수 계산 함수는 shared/utils/floorCanvas에서 관리한다.
// 시나리오 설정 캔버스도 같은 계산을 사용해 셀 경계가 어긋나지 않게 한다.
const DEFAULT_CANVAS_H = 420;

// react-query data가 아직 없을 때(로딩 중) 쓰는 안정적인 빈 배열 — `data ?? []`처럼 매 렌더
// 새 배열을 만들면 그 값을 의존성으로 쓰는 effect가 로딩 중에 계속 재실행돼버림
const EMPTY_CCTVS: Cctv[] = [];
const EMPTY_LIGHTS: IoTLight[] = [];
const EMPTY_GRID_CELLS: FloorGridCell[] = [];
const EMPTY_USER_ZONES: UserZoneWithCells[] = [];
const EMPTY_GRAPH: FloorGraph = { nodes: [], edges: [] };
const EDITING_LOCK_HINT_ID = 'floor-editing-lock-notice';

// AI 분석이 DONE으로 바뀐 직후엔 노드가 아직 생성 중일 수 있어 그래프가 비어 올 수 있음 — 재조회 설정
const GRAPH_RETRY_LIMIT = 5;
const GRAPH_RETRY_INTERVAL_MS = 2000;

// DONE 전환 후에도 서버가 문/계단 노드를 순차 생성하는 동안(방만 먼저 오는 경우가 많음)
// 그래프를 계속 다시 받아온다. 전환 시점부터 GRAPH_SETTLE_WINDOW_MS 동안, 노드 수가
// GRAPH_SETTLE_STABLE_TICKS번 연속(=실제 재조회 기준) 같아지면 생성이 끝난 것으로 보고 멈춘다.
const GRAPH_SETTLE_WINDOW_MS = 180_000;
const GRAPH_SETTLE_POLL_MS = 3000;
const GRAPH_SETTLE_STABLE_TICKS = 3;

// 드래그 사각형(캔버스 좌표)과 영역이 조금이라도 겹치는 셀들의 id — 셀 중심이 아니라 셀 면적 기준.
// 드래그 미리보기와 실제 잡히는 셀이 일치하도록 드래그 중/드래그 종료 양쪽에서 같은 로직을 씀
const cellIdsIntersectingRect = (
  cells: FloorGridCell[],
  rect: { x: number; y: number; w: number; h: number },
  size: { w: number; h: number },
  canvasH: number,
): string[] =>
  cells
    .filter((cell) => {
      const left = cell.centerX * CANVAS_W - size.w / 2;
      const top = cell.centerY * canvasH - size.h / 2;
      return (
        left < rect.x + rect.w &&
        left + size.w > rect.x &&
        top < rect.y + rect.h &&
        top + size.h > rect.y
      );
    })
    .map((cell) => cell.id);

/* ── 메인 페이지 ── */
const FloorPlansDetailPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { buildingId, floorId } = useParams<{ buildingId: string; floorId: string }>();
  const { show } = useToast();
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

  const { data: floorGridCells = EMPTY_GRID_CELLS } = useFloorGridCellsQuery(floorId);

  // 업로드 직후 백엔드가 mapImageKey를 아직 안 채워 보낼 수 있는데(한두 사이클), 예전엔 키가
  // 비면 "분석 중"이 아니라고 보고 상세 폴링을 멈춰서 — 이후 상태가 DONE으로 바뀌어도, 실제
  // 이미지 URL을 발급받게 해주는 mapImageKey가 채워져도 — 화면을 새로고침해야 반영되던 문제.
  // 업로드→분석 요청을 우리가 방금 걸었으면 키가 잠깐 비어도 계속 폴링하도록 이 플래그를 본다.
  const awaitingUploadAnalysisRef = useRef(false);

  // 현재 층 상세 — 세그멘테이션이 끝날 때까지(isAnalyzing) 짧은 간격으로 다시 조회해 상태 전환을
  // 감지해야 해서, 폴링 여부를 방금 받은 데이터 기준으로 매번 다시 판단하는 refetchInterval에 맡김
  const floorDetailQuery = useQuery({
    queryKey: floorQueryKeys.detail(buildingId, floorId),
    queryFn: ({ signal }) => {
      if (!buildingId || !floorId) throw new Error('층 상세 조회 조건이 필요합니다.');
      return getFloorDetail(buildingId, floorId, signal);
    },
    enabled: Boolean(buildingId && floorId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const settled = data.segmentationStatus === 'DONE' || data.segmentationStatus === 'FAILED';
      const analyzing =
        !settled &&
        (data.segmentationStatus === 'PROCESSING' ||
          Boolean(data.mapImageUrl) ||
          awaitingUploadAnalysisRef.current);
      return analyzing ? 4000 : false;
    },
  });
  const floor = floorDetailQuery.data ?? null;

  // 도면 이미지의 원본 가로/세로 비율 — viewBox 높이(canvasH)를 여기에 맞춰 이미지 왜곡을 없앰
  const [imageAspect, setImageAspect] = useState<number | null>(null);

  // SVG viewBox 높이 — 폭 CANVAS_W(560)은 고정, 높이만 도면 실제 비율에 맞춤.
  // 그리드 columns/rows 비율을 우선으로 씀 — 셀 크기는 CANVAS_W/cols × canvasH/rows로 계산되므로
  // (getGridCellPxSize) 이 값이 이미지의 원본 픽셀 비율과 어긋나면 정사각형이어야 할 셀이
  // 직사각형으로 보임. 스캔·촬영한 도면은 실측 비율과 이미지 픽셀 비율이 딱 맞아떨어지지
  // 않는 경우가 많아, 그리드가 아직 없을 때(분석 전)만 이미지 비율로 대체하고 그것도
  // 없으면 4:3. viewBox 비율이 이미지와 살짝 어긋나면 배경 이미지가 미세하게 늘어날 수
  // 있지만, 셀을 정확히 클릭·드래그해야 하는 그리드 쪽이 더 중요해서 이 쪽을 우선함
  const canvasH = useMemo(() => {
    if (floorGridCells.length > 0) {
      const { cols, rows } = getGridDimensions(floorGridCells);
      if (cols > 0 && rows > 0) return (CANVAS_W * rows) / cols;
    }
    if (imageAspect && imageAspect > 0) return CANVAS_W / imageAspect;
    return DEFAULT_CANVAS_H;
  }, [imageAspect, floorGridCells]);

  const isFloorReady = floor?.segmentationStatus === 'DONE';

  // CCTV 등록 시 그리드 배율이 서버에서 사라져있어(CCTV006) 재적용 후 재시도할 때, 방금 사용자가
  // 드래그한 영역을 다시 그리게 하지 않고 같은 영역으로 셀을 재계산하기 위해 rect를 별도로 들고
  // 있음 — cctvDraftCellIds는 재적용 전 그리드의 셀 id라 그대로 재사용할 수 없음(그리드 재적용 시
  // 셀이 새로 생성되어 id가 바뀜). 등록 성공뿐 아니라 새 CCTV 시야 선택을 다시 시작할 때·층을
  // 바꿀 때도 비워야 함 — 안 그러면 취소 후 클릭만으로 새 영역을 고른 다음 CCTV006이 나면
  // 재시도가 엉뚱한(예전) 드래그 영역을 그대로 써버림(코드래빗 리뷰로 발견)
  const lastCctvDraftRectRef = useRef<ZoneRect | null>(null);

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
  }, []);

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
    setUploadModalOpen(false);
    setGridSetupPromptOpen(false);
    setGridSetupIntent(null);
    setLightPickTarget(null);
    setEdgeChainNodeIds([]);
    setEdgeChainReviewOpen(false);
    setZoneDeleteTarget(null);
    setPendingUpload((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  }, [editingLocked, floorId, isRunningSessionsPending, queryClient, resetFloorScopedState]);

  // 분석이 끝나면(DONE) 노드·엣지는 아래 맵그래프 effect가 isFloorReady 전환으로 자동 재조회하고,
  // 그리드 셀은 배율 재적용 effect가 다시 받아온다 — 별도의 페이지 새로고침은 필요 없음

  // 캔버스에 실제로 그릴 도면 이미지의 presigned URL — 도면 키가 잡혔거나(대부분) 분석이
  // 끝난 층이면 조회. 분석 완료 직후 상세 응답에 mapImageKey가 한두 사이클 늦게 실려도
  // (isFloorReady로) 곧바로 URL을 받으러 가도록 함 — 이 엔드포인트는 서버가 층 기준으로
  // 현재 이미지를 돌려줘서 키를 클라이언트가 몰라도 됨.
  const { data: floorImageData } = useFloorImageUrlQuery(
    buildingId,
    floorId,
    Boolean(floor?.mapImageUrl) || isFloorReady,
  );
  const resolvedMapImageUrl = floorImageData?.imageUrl ?? null;

  // 도면 이미지 원본 비율 측정 — 그리드가 없을 때 canvasH 계산의 기준으로 씀
  useEffect(() => {
    setImageAspect(null);
    if (!resolvedMapImageUrl) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled && img.naturalHeight > 0) {
        setImageAspect(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = resolvedMapImageUrl;
    return () => {
      cancelled = true;
    };
  }, [resolvedMapImageUrl]);

  // 업로드 시 정한 그리드 배율이 AI 분석 과정에서 사라질 수 있어, 분석 완료(DONE) 후 확정한다.
  // 다만 서버가 이미 배율을 갖고 있으면(대부분) PUT /grid를 다시 호출하지 않는다 — 큰 층에선
  // 그리드 재생성이 느려 503으로 실패하고, 그때마다 겁주는 실패 토스트가 떴었음. 배율은
  // GRID_SIZE_KEY에도 저장돼 있어 CCTV·구역 등록 시 필요하면 조용히 재적용된다.
  useEffect(() => {
    if (!floorId || !isFloorReady) return;
    const pending = readStoredNumber(PENDING_GRID_SIZE_KEY(floorId));
    if (!pending) return;
    let cancelled = false;
    void (async () => {
      try {
        const serverScale = await getFloorGridScale(floorId);
        if (cancelled) return;
        if (serverScale) {
          // 서버가 이미 배율을 갖고 있음 — 재생성 없이 확정만 하고 끝(pending 키 정리)
          rememberGridSize(floorId, serverScale);
          return;
        }
        // 서버에 배율이 없을 때만(분석이 지운 경우) 다시 PUT
        await setFloorGrid(floorId, pending);
        if (cancelled) return;
        queryClient.setQueryData(floorQueryKeys.grid(floorId), await getFloorGridCells(floorId));
        rememberGridSize(floorId, pending);
        show({ title: `그리드 배율(${pending}cm)이 자동 적용되었습니다.`, variant: 'success' });
      } catch (error) {
        if (cancelled) return;
        if (import.meta.env.DEV) console.warn('[그리드 배율 자동 적용 건너뜀]', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [floorId, isFloorReady, show, queryClient]);

  // 세그멘테이션이 방금 끝났을 때(PENDING/PROCESSING → DONE) 서버가 노드를 순차 생성 중이라
  // 그래프가 비었거나 방(ROOM)만 오고 문/계단은 아직 없는 상태로 올 수 있음. 그 전환 시점부터
  // GRAPH_SETTLE_WINDOW_MS 동안 아래 graphQuery.refetchInterval이 그래프를 계속 다시 받아온다.
  // 이미 DONE인 층을 그냥 열 때(undefined → DONE)는 창을 안 열어 불필요한 폴링을 막고,
  // 재업로드로 DONE이 잠깐 풀렸다가(PENDING) 다시 붙으면 창을 새로 연다.
  const graphSettleUntilRef = useRef<number>(0);
  const graphNodeStreakRef = useRef<{ count: number; streak: number; updateCount: number }>({
    count: -1,
    streak: 0,
    updateCount: -1,
  });
  const prevSegStatusRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const prev = prevSegStatusRef.current;
    const curr = floor?.segmentationStatus;
    prevSegStatusRef.current = curr;
    if (curr === 'DONE' || curr === 'FAILED') awaitingUploadAnalysisRef.current = false;
    const justFinished = (prev === 'PENDING' || prev === 'PROCESSING') && curr === 'DONE';
    if (justFinished) {
      graphSettleUntilRef.current = Date.now() + GRAPH_SETTLE_WINDOW_MS;
      graphNodeStreakRef.current = { count: -1, streak: 0, updateCount: -1 };
      // 분석이 끝나면 이 층에 걸린 모든 조회(이미지 URL·그래프·그리드·CCTV·유도등·구역·목록)를
      // 한 번에 무효화한다. 캐시마다 갱신 트리거(폴링/enabled 전환/staleTime)가 제각각이라
      // 업로드마다 어떤 건 뜨고 어떤 건 새로고침해야 뜨는 문제가 반복됐음 — 완료 시점에
      // 서버는 이미 일관된 상태이므로, 통째로 다시 받아오는 게 가장 확실하다.
      void queryClient.invalidateQueries({ queryKey: floorQueryKeys.all });
    } else if (curr && curr !== 'DONE') {
      graphSettleUntilRef.current = 0;
      graphNodeStreakRef.current = { count: -1, streak: 0, updateCount: -1 };
    }
  }, [floor?.segmentationStatus, queryClient]);

  // 맵그래프(노드/엣지) 조회. 노드가 아예 안 온 상태면 GRAPH_RETRY_LIMIT회까지 빠르게 재시도하고,
  // 노드가 오기 시작했으면 위 settle 창이 살아있는 동안 노드 수가 GRAPH_SETTLE_STABLE_TICKS번
  // 연속(실제 재조회 기준 — dataUpdateCount로 셈) 같아질 때까지 GRAPH_SETTLE_POLL_MS 간격으로 폴링.
  const graphQuery = useQuery({
    ...floorGraphQueryOptions(floorId),
    enabled: Boolean(floorId) && isFloorReady,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      if (data.nodes.length === 0) {
        return query.state.dataUpdateCount <= GRAPH_RETRY_LIMIT ? GRAPH_RETRY_INTERVAL_MS : false;
      }
      if (Date.now() >= graphSettleUntilRef.current) return false;
      const s = graphNodeStreakRef.current;
      if (query.state.dataUpdateCount !== s.updateCount) {
        s.updateCount = query.state.dataUpdateCount;
        if (data.nodes.length === s.count) s.streak += 1;
        else {
          s.count = data.nodes.length;
          s.streak = 1;
        }
      }
      return s.streak >= GRAPH_SETTLE_STABLE_TICKS ? false : GRAPH_SETTLE_POLL_MS;
    },
  });
  const graphData = graphQuery.data ?? EMPTY_GRAPH;

  // 현재 층 대체 경로 진단 결과
  const routeDiagnosisQuery = useFloorRouteDiagnosisQuery(floorId, isFloorReady);
  // 도면 진단 강조 표시 여부
  const [isDiagnosisHighlighted, setIsDiagnosisHighlighted] = useState(false);

  // 층 전환·진단 완료 시 강조 상태 초기화
  useEffect(() => {
    setIsDiagnosisHighlighted(false);
  }, [floorId, routeDiagnosisQuery.data?.ready]);

  // 캔버스 진단 강조 대상
  const routeDiagnosisHighlight = useMemo(() => {
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

  // 그래프 변경 후 진단 갱신
  const invalidateFloorRouteDiagnosis = () =>
    queryClient.invalidateQueries({ queryKey: floorRouteDiagnosisQueryKey(floorId) });

  const updateGraphCache = (updater: (prev: FloorGraph) => FloorGraph) => {
    queryClient.setQueryData<FloorGraph>(floorQueryKeys.graph(floorId), (prev) =>
      updater(prev ?? EMPTY_GRAPH),
    );
  };

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

  const { data: iotLights = EMPTY_LIGHTS } = useFloorLightsQuery(floorId);

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

  const { data: realCctvs = EMPTY_CCTVS } = useFloorCctvsQuery(floorId);

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

  // 사용자 지정 영역 조회 — 목록 API는 이름만 내려줘서, 화면에 그리려면 구역마다 셀 상세를 따로
  // 조회해야 함(useFloorUserZonesQuery 내부에서 합쳐서 내려줌)
  const { data: userZones = EMPTY_USER_ZONES } = useFloorUserZonesQuery(floorId);
  const zones: ZoneEntry[] = useMemo(
    () => userZones.map((z) => ({ id: z.id, type: 'general', label: z.name, cellIds: z.cellIds })),
    [userZones],
  );

  // 라우트 파라미터를 그대로 씀 — useState로 복제해두면 뒤로가기/외부 링크처럼 handleFloorChange를
  // 거치지 않고 URL만 바뀌는 경우 값이 낡아, 실제 조회(floorId 기반 쿼리)와 currentFloor 메타데이터가
  // 서로 다른 층을 가리키게 됨
  const selectedBuildingId = buildingId ?? '';
  const selectedFloorId = floorId ?? '';
  // 이 화면엔 건물 하나(이름)와 그 건물의 층 목록만 필요한데, 예전엔 getFloorBuildings()가
  // 전체 건물 목록 + 건물마다 층 목록을 다 조회했음(건물 N개면 요청 N+1개, 건물이 늘수록
  // 이 화면이 계속 느려지는 구조였음) — 건물 이름은 이미 캐시돼 있을 가능성이 높은 건물
  // 목록 조회 1번, 층 목록은 이 건물 것만 조회 1번으로 나눔
  const { data: buildingsForName } = useGetBuildingsQuery();
  const { data: buildingFloors } = useBuildingFloorsQuery(selectedBuildingId);
  const [zoom, setZoom] = useState(100);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [selectedZoneRef, setSelectedZoneRef] = useState<ZoneRefSelection | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{
    file: File;
    previewUrl: string;
    isReupload: boolean;
  } | null>(null);
  const [isReuploading, setIsReuploading] = useState(false);

  // 미리보기 objectURL이 명시적으로 취소/제출되지 않고 화면을 벗어나는 경우를 대비한 안전망
  useEffect(() => {
    return () => {
      if (pendingUpload) URL.revokeObjectURL(pendingUpload.previewUrl);
    };
  }, [pendingUpload]);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<PanelItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [nodeAddOpen, setNodeAddOpen] = useState(false);
  const [zoneAddOpen, setZoneAddOpen] = useState(false);
  const [edgeAddOpen, setEdgeAddOpen] = useState(false);
  // 노드를 한 쌍씩 고르던 방식 대신, 클릭한 순서대로 경로를 쌓아뒀다가 한 번에 구간별로
  // 검토·확정함(A→B→C→D 클릭 시 A-B, B-C, C-D를 일괄 생성) — 매번 팝업을 반복하던 번거로움을 줄임
  const [edgeChainNodeIds, setEdgeChainNodeIds] = useState<string[]>([]);
  const [edgeChainReviewOpen, setEdgeChainReviewOpen] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  // 구역 재설정(재드래그) 중인 기존 구역 id — null이면 zoneAddOpen은 "새 구역 추가" 흐름.
  // 구역은 PATCH가 없어 새로 만들고 기존 걸 지우는 방식으로만 "수정"할 수 있음(스웨거 확인)
  const [zoneResetTargetId, setZoneResetTargetId] = useState<string | null>(null);
  const [zoneDraftRect, setZoneDraftRectState] = useState<ZoneRect | null>(null);
  const zoneDraftRectRef = useRef<ZoneRect | null>(null);
  const setZoneDraftRect = (rect: ZoneRect | null) => {
    zoneDraftRectRef.current = rect;
    setZoneDraftRectState(rect);
  };
  // 구역 드래그(사각형 선택) 중엔 캔버스 위 CCTV·유도등 마커(SVG 밖 별도 HTML 마커)와
  // 격자 셀·구조 노드가 저마다 다른 커서를 걸고 있어도 항상 십자선(crosshair)으로 보이게 함 —
  // MockFloorMap3F(SVG 내부)에서 드래그 시작/종료 시 이 값을 갱신하고, FloorCanvas가 SVG 밖
  // 마커의 pointer-events를 같이 꺼서 호버가 아래 SVG 배경(crosshair)으로 그대로 넘어가게 함
  const [isZoneDragging, setIsZoneDragging] = useState(false);
  const [topFilter, setTopFilter] = useState<'all' | 'device' | 'zone'>('all');
  // 여러 칩을 동시에 켤 수 있는 다중 선택 필터 — 빈 배열이면 "전체"와 같음
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<
    Array<'cctv' | 'light' | 'door' | 'stair' | 'hallway' | 'start'>
  >([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DeviceEditForm>(EMPTY_DEVICE_EDIT_FORM);
  const [nodeAddType, setNodeAddType] = useState<PlacingDeviceType>('cctv');
  // 유도등 추가 팝업의 갈림길 위치·좌우 통로 값 — 드롭다운뿐 아니라 캔버스 클릭으로도 채울 수
  // 있어야 해서(도면에서 직접 고르는 대안) 팝업 로컬 state가 아니라 여기서 관리함. 담당 CCTV는
  // 캔버스에서 고를 대상이 아니라 계속 팝업 로컬 state(lightCctvId)로 남아있음
  const [nodeAddLightFields, setNodeAddLightFields] = useState({
    decisionNodeId: '',
    leftEdgeId: '',
    rightEdgeId: '',
  });
  // 지금 "캔버스에서 선택" 모드가 걸려있는 대상 — 추가 팝업/수정 카드 중 어느 쪽의 어느
  // 필드인지 알아야 캔버스 클릭 결과를 올바른 곳에 반영할 수 있음
  const [lightPickTarget, setLightPickTarget] = useState<{
    source: 'add' | 'edit';
    field: 'decisionNode' | 'leftEdge' | 'rightEdge';
  } | null>(null);
  const [addedDevices, setAddedDevices] = useState<AddedDevice[]>([]);
  const [structureNodes, setStructureNodes] = useState<StructureNode[]>([]);

  // 문/계단 등 구조 노드가 아닌 나머지 그래프 노드 — graphData(위 graphQuery)에서 조회 전용으로만 씀
  const graphNodes = useMemo(
    () => graphData.nodes.filter((n) => !API_TYPE_TO_STRUCTURE[n.type]),
    [graphData],
  );
  const graphEdges = graphData.edges;
  const [editingCctvId, setEditingCctvId] = useState<string | null>(null);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);
  // 시작 후보 PATCH가 진행 중인 노드 id — 같은 노드를 응답 전에 다시 토글하면 요청이
  // 뒤바뀐 순서로 끝나며 롤백이 최신 값을 덮어쓸 수 있어, 노드 단위로 버튼을 잠근다.
  const [startCandidatePendingIds, setStartCandidatePendingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [zoneEditLabel, setZoneEditLabel] = useState('');
  const [nodeAddStage, setNodeAddStage] = useState<'entry' | 'fov'>('entry');
  // 그리드 설정 팝업은 CCTV 등록·구역 추가 흐름에서 공유해서 사용 —
  // 확인 버튼을 눌렀을 때 어느 쪽으로 돌아가야 하는지 구분하기 위한 값
  const [gridSetupPromptOpen, setGridSetupPromptOpen] = useState(false);
  const [gridSetupIntent, setGridSetupIntent] = useState<'cctv' | 'zone' | null>(null);
  const [gridSizeCmInput, setGridSizeCmInput] = useState('100');
  const [cctvDraftCellIds, setCctvDraftCellIds] = useState<string[]>([]);
  const [zoneDraftCellIds, setZoneDraftCellIds] = useState<string[]>([]);
  const [zoneDeleteTarget, setZoneDeleteTarget] = useState<ZoneEntry | null>(null);
  const [isDeletingZone, setIsDeletingZone] = useState(false);
  const [nodeStagedPosition, setNodeStagedPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [devicePositions, setDevicePositions] = useState<Record<string, { x: number; y: number }>>(
    {},
  );

  // devicePositions는 드래그 중 화면에 즉시 반영하기 위한 임시 오버레이 — 실제 저장은
  // "완료"를 눌렀을 때(handleSaveEdit)만 일어나고, 그 전까지는 이 값만 갱신됨. 수정 모드를
  // 벗어나면(완료든 취소든) 렌더링 쪽에서 이 오버레이를 무시하고 원래 좌표로 되돌아감
  const handleDeviceMoved = (id: string, x: number, y: number) => {
    setDevicePositions((prev) => ({ ...prev, [id]: { x, y } }));
  };

  // realCctvs는 useFloorCctvsQuery 캐시라, 서버 응답으로 갱신하려면 로컬 setState가 아니라
  // 이 캐시를 직접 patch해야 함(여러 핸들러가 반복해서 쓰는 패턴이라 하나로 모음)
  const patchCctvCache = (updated: Cctv) => {
    queryClient.setQueryData<Cctv[]>(floorQueryKeys.cctv(floorId), (prev) =>
      prev?.map((c) => (c.id === updated.id ? updated : c)),
    );
  };

  // iotLights도 useFloorLightsQuery 캐시라 같은 방식으로 patch함
  const patchLightCache = (updated: IoTLight) => {
    queryClient.setQueryData<IoTLight[]>(floorQueryKeys.light(floorId), (prev) =>
      prev?.map((l) => (l.id === updated.id ? updated : l)),
    );
  };

  // configureLightGuidance와 assignLightCctv는 같은 IoTLight를 건드리는데, 각자 응답으로
  // patchLightCache를 부르면 나중에 도착한 응답이 다른 mutation의 변경분을 덮어쓸 수 있음
  // (코드래빗 리뷰). 둘을 병렬로 보내되 에러만 각자 알리고, 모두 끝난 뒤 캐시를 한 번
  // 무효화해서 서버 기준 최신 상태로 맞춤
  const runLightFollowups = async (
    lightId: string,
    opts: {
      guidance?: { decisionNodeId: string; leftEdgeId: string; rightEdgeId: string };
      cctvId?: string;
    },
  ) => {
    const tasks: Promise<unknown>[] = [];
    if (opts.guidance) {
      tasks.push(
        configureLightGuidance(lightId, opts.guidance).catch((error: unknown) => {
          const { message } = extractApiError(error);
          show({ title: message || '경로 저장에 실패했습니다.', variant: 'error' });
        }),
      );
    }
    if (opts.cctvId) {
      tasks.push(
        assignLightCctv(lightId, opts.cctvId).catch((error: unknown) => {
          const { message } = extractApiError(error);
          show({ title: message || '담당 CCTV 배정에 실패했습니다.', variant: 'error' });
        }),
      );
    }
    if (tasks.length === 0) return;
    await Promise.allSettled(tasks);
    void queryClient.invalidateQueries({ queryKey: floorQueryKeys.light(floorId) });
  };

  // zones(위 useMemo)도 useFloorUserZonesQuery 캐시에서 파생된 값이라 로컬 setState 대신
  // 이 캐시를 직접 갱신해야 반영됨
  const updateZonesCache = (updater: (prev: UserZoneWithCells[]) => UserZoneWithCells[]) => {
    queryClient.setQueryData<UserZoneWithCells[]>(floorQueryKeys.zone(floorId), (prev) =>
      updater(prev ?? []),
    );
  };

  // floor(위 floorDetailQuery)도 쿼리 캐시에서 파생된 값이라 로컬 setState 대신 이 캐시를 직접
  // 갱신해야 반영됨
  const updateFloorCache = (updater: (prev: Floor | null) => Floor | null) => {
    queryClient.setQueryData<Floor | null>(floorQueryKeys.detail(buildingId, floorId), (prev) =>
      updater(prev ?? null),
    );
  };

  // CCTV/유도등 카드의 활성화 스위치 — 둘 다 enabled 필드와 활성화/비활성화 PATCH API 모양이
  // 같아서 한 핸들러에서 타입만 보고 갈라 처리함
  const handleToggleEnabled = (item: PanelItem) => {
    if (item.type === 'cctv') {
      const cctv = realCctvs.find((c) => c.id === item.id);
      if (!cctv) return;
      const enabled = !cctv.enabled;
      const request = enabled ? enableCctv : disableCctv;
      request(cctv.id)
        .then((updated) => {
          patchCctvCache(updated);
          show({
            title: enabled ? 'CCTV를 활성화했습니다.' : 'CCTV를 비활성화했습니다.',
            variant: 'success',
          });
        })
        .catch(() => {
          show({ title: 'CCTV 활성화 여부 변경에 실패했습니다.', variant: 'error' });
        });
      return;
    }
    if (item.type === 'light') {
      const light = iotLights.find((l) => l.id === item.id);
      if (!light) return;
      const enabled = !light.enabled;
      const request = enabled ? enableIoTLight : disableIoTLight;
      request(light.id)
        .then((updated) => {
          patchLightCache(updated);
          show({
            title: enabled ? '유도등을 활성화했습니다.' : '유도등을 비활성화했습니다.',
            variant: 'success',
          });
        })
        .catch(() => {
          show({ title: '유도등 활성화 여부 변경에 실패했습니다.', variant: 'error' });
        });
    }
  };

  const handleStartEditCctvCells = (item: PanelItem) => {
    const cctv = realCctvs.find((c) => c.id === item.id);
    if (!cctv) return;
    setNodeAddOpen(false);
    setZoneAddOpen(false);
    setEdgeAddOpen(false);
    setEditingCctvId(cctv.id);
    setCctvDraftCellIds(cctv.gridCells.map((c) => c.id));
  };

  const handleCancelEditCctvCells = () => {
    setEditingCctvId(null);
    setCctvDraftCellIds([]);
  };

  const handleSaveEditCctvCells = () => {
    if (!editingCctvId || cctvDraftCellIds.length === 0) return;
    configureCctvGridCells(editingCctvId, cctvDraftCellIds)
      .then((updated) => {
        // addedDevices의 zone(감시 영역 문구)은 realCctvs 동기화 effect가 알아서 다시 채움
        patchCctvCache(updated);
        setEditingCctvId(null);
        setCctvDraftCellIds([]);
      })
      .catch(() => {});
  };

  const nodePopupRef = useRef<HTMLDivElement>(null);
  const zonePopupRef = useRef<HTMLDivElement>(null);
  const edgePopupRef = useRef<HTMLDivElement>(null);
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const devicePanelRef = useRef<HTMLDivElement>(null);

  // 선택된 카드를 상단에 고정하지 않는 대신, 리스트 안에서 스크롤로 한 번 보여줌 (하이퍼링크 이동과 동일한 느낌)
  const focusedPanelId =
    selectedItem?.kind === 'device' ? selectedItem.data.id : (selectedZoneRef?.id ?? null);

  useEffect(() => {
    if (!isDevicePanelOpen || !focusedPanelId) return;
    const target = devicePanelRef.current?.querySelector(`[data-panel-id="${focusedPanelId}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusedPanelId, isDevicePanelOpen]);

  // 장비 추가 팝업이 닫히면 배치 진행 상태 초기화
  useEffect(() => {
    if (!nodeAddOpen) {
      setNodeAddStage('entry');
      setNodeStagedPosition(null);
      setZoneDraftRect(null);
    }
  }, [nodeAddOpen]);

  // 구역 설정 팝업이 닫히면 드래그로 선택한 임시 영역/셀과 재설정 대상도 함께 초기화
  useEffect(() => {
    if (!zoneAddOpen) {
      setZoneDraftRect(null);
      setZoneDraftCellIds([]);
      setZoneResetTargetId(null);
    }
  }, [zoneAddOpen]);

  const currentBuildingName =
    buildingsForName?.find((b) => b.id === selectedBuildingId)?.name ?? '';
  // buildingFloors는 공용 훅(useBuildingFloorsQuery)이 내려주는 얕은 응답 형태(mapImageKey 등)라,
  // 이 페이지가 기대하는 Floor 형태(mapImageUrl·devices 포함)로 그대로 쓰면 hasFloorPlan 판정이
  // 항상 false가 돼(필드 이름이 달라 늘 "미등록"으로 보임) 이 파일의 toFloor로 다시 변환해줘야 함
  const currentBuilding: FloorBuilding | null = selectedBuildingId
    ? {
        id: selectedBuildingId,
        name: currentBuildingName,
        floors: (buildingFloors ?? []).map((f) => toFloor(f, selectedBuildingId)),
      }
    : null;
  const currentFloor = currentBuilding?.floors.find((f) => f.id === selectedFloorId) ?? null;
  // 실시간 상세 조회(floor)를 우선, 없으면 목록 캐시(currentFloor)로 폴백 — 캔버스·체크리스트 공통
  const resolvedFloor = floor ?? currentFloor;

  const handleFloorChange = (newId: string) => {
    // selectedFloorId는 아래 navigate로 URL이 바뀌면 useParams를 통해 자동으로 갱신됨
    setSelectedItem(null);
    setDeleteConfirmTarget(null);
    setNodeAddOpen(false);
    setZoneAddOpen(false);
    void navigate(`/floorPlans/${selectedBuildingId}/${newId}`);
  };

  // 파일 선택 단계 — 실제 업로드는 다음 단계(가로/세로 입력)에서 함께 이뤄짐
  const handleFileSelected = (file: File) => {
    if (editingLocked) return;
    setPendingUpload({
      file,
      previewUrl: URL.createObjectURL(file),
      isReupload: Boolean(currentFloor?.mapImageUrl),
    });
    setUploadModalOpen(false);
  };

  const handleCloseUploadDimensionsModal = () => {
    if (pendingUpload) URL.revokeObjectURL(pendingUpload.previewUrl);
    setPendingUpload(null);
  };

  const handleUploadDimensionsConfirm = (params: {
    realWidthM: number;
    realHeightM: number;
    cellSizeCm: number;
  }) => {
    if (!currentFloor || !pendingUpload || isReuploading || editingLocked) return;
    const { file, previewUrl, isReupload } = pendingUpload;
    setIsReuploading(true);
    uploadFloor(
      selectedBuildingId,
      currentFloor.floorNum,
      file,
      params.realWidthM,
      params.realHeightM,
    )
      .then(async (newFloor) => {
        // 도면이 바뀌면 이전 도면 기준으로 만들어진 노드·엣지·장비·구역은 더 이상 유효하지 않으므로
        // 화면에서 먼저 비우고, AI 재분석이 끝나면 각 조회 effect가 새 데이터로 채운다
        resetFloorScopedState();
        // 초기 업로드 경로와 동일하게, AI 분석이 배율을 지우더라도 복원할 수 있도록 먼저 기록해둠
        rememberPendingGridSize(newFloor.id, params.cellSizeCm);
        try {
          await setFloorGrid(newFloor.id, params.cellSizeCm);
          queryClient.setQueryData(
            floorQueryKeys.grid(newFloor.id),
            await getFloorGridCells(newFloor.id),
          );
        } catch {
          show({
            title: '그리드 설정에 실패했습니다. 분석 완료 후 자동으로 다시 시도합니다.',
            variant: 'warning',
          });
        }
        // newFloor는 이 파일 기준 Floor 형태(mapImageUrl)라, 공용 훅의 캐시(BuildingFloor 형태,
        // mapImageKey)에 그대로 patch하면 다른 화면(시나리오설정 등)이 같은 캐시를 읽을 때 모양이
        // 깨짐 — 직접 patch하지 않고 무효화해서 서버에서 올바른 모양으로 다시 받아오게 함
        void queryClient.invalidateQueries({
          queryKey: floorQueryKeys.list(selectedBuildingId),
        });
        // 방금 업로드→분석을 걸었으니, mapImageKey가 한두 사이클 비어 와도 상세 폴링이
        // 끊기지 않게 한다(refetchInterval이 이 플래그를 봄). DONE/FAILED에서 해제됨.
        awaitingUploadAnalysisRef.current = true;
        // 이미지가 바로 보이도록 상세 캐시에 새 도면을 먼저 반영하고,
        // 곧바로 무효화해 재조회를 태운다 — setQueryData만으로는 segmentationStatus 폴링
        // (floorDetailQuery의 refetchInterval)이 다시 시작되지 않아, 분석이 끝나도(DONE)
        // 화면을 새로고침해야 새 노드가 보이던 문제가 있었음. 그래프 캐시도 재업로드 전
        // 노드가 남아있으므로 같이 무효화한다(분석 완료 후 새 노드로 자동 갱신됨).
        queryClient.setQueryData(floorQueryKeys.detail(buildingId, floorId), newFloor);
        void queryClient.invalidateQueries({
          queryKey: floorQueryKeys.detail(buildingId, floorId),
        });
        void queryClient.invalidateQueries({ queryKey: floorQueryKeys.graph(floorId) });
        // presigned 이미지 URL 캐시는 이전 도면 것을 그대로 들고 있어(staleTime 5분) 무효화하지
        // 않으면 새 도면이 새로고침 전엔 안 보였음
        void queryClient.invalidateQueries({
          queryKey: floorQueryKeys.image(buildingId, floorId),
        });
        URL.revokeObjectURL(previewUrl);
        setPendingUpload(null);
        setIsReuploading(false);
        if (isReupload) {
          show({
            title: '도면 관련 설정을 다시 확인해 주세요.',
            description:
              'AI 분석 완료 후 유도등 안내 설정·담당 CCTV와 시나리오 시작 지점을 다시 설정해야 할 수 있습니다.',
            variant: 'warning',
            duration: 10000,
          });
        }
        // 타임아웃은 '분석이 시작됐다'는 증거가 아니므로 성공으로 넘기지 않고 구분해서 안내한다
        analyzeFloor(newFloor.id).catch((error: unknown) => {
          const timedOut = isAxiosError(error) && error.code === 'ECONNABORTED';
          const serverMessage = extractApiError(error).message;
          show({
            title: timedOut
              ? '분석 요청 응답이 지연되고 있습니다. 잠시 후 진행 상태를 확인해주세요.'
              : '도면 분석 요청에 실패했습니다.',
            description: timedOut ? undefined : serverMessage || '다시 시도해주세요.',
            variant: 'warning',
          });
        });
      })
      .catch((error: unknown) => {
        // 미리보기와 입력값을 유지해 모달을 닫지 않고 바로 재시도할 수 있게 함
        setIsReuploading(false);
        const serverMessage = extractApiError(error).message;
        show({
          title: '업로드에 실패했습니다.',
          description: serverMessage || '다시 시도해주세요.',
          variant: 'error',
        });
      });
  };

  // 장치 배치 모드 — 정보 입력과 같은 단계에서 클릭으로 위치 지정. 다시 클릭하면 위치를 옮길 수 있음
  // (CCTV 시야 구역 드래그 단계에서는 클릭이 다른 용도이므로 위치를 덮어쓰지 않음)
  const handleMapClick = (x: number, y: number) => {
    if (!nodeAddOpen || nodeAddStage !== 'entry') return;
    setNodeStagedPosition({ x: (x / CANVAS_W) * 100, y: (y / canvasH) * 100 });
  };

  const handleAddedDeviceDelete = (id: string) => {
    setAddedDevices((prev) => prev.filter((d) => d.id !== id));
  };

  // 정보 입력 + 위치 지정을 마친 뒤 확정 — CCTV만 시야 구역 지정 단계로 넘어가고, 나머지는 바로 저장
  const finalizeNodePlacement = (
    type: PlacingDeviceType,
    deviceId: string,
    position: { x: number; y: number },
    lightFields: LightAddFields,
  ) => {
    const cfg = DEVICE_PLACE_CONFIG[type];

    if (isStructureNodeType(type)) {
      // 클릭해 지정한 위치 그대로 저장 (격자 스냅 없음). position은 0~100(%) 기준
      const ratioX = position.x / 100;
      const ratioY = position.y / 100;
      if (currentFloor) {
        const apiType = STRUCTURE_NODE_API_TYPE[type];
        const count = structureNodes.filter((n) => n.type === type).length + 1;
        createMapNode(currentFloor.id, {
          code: `${apiType}-${Date.now()}`,
          type: apiType,
          name: `${cfg.label} ${count}`,
          x: ratioX,
          y: ratioY,
          isExitTarget: false,
        })
          .then((newNode) => {
            updateGraphCache((prev) => ({ ...prev, nodes: [...prev.nodes, newNode] }));
            void invalidateFloorRouteDiagnosis();
          })
          .catch((error: unknown) => {
            // 지금까지 문/계단/복도가 실패한 적이 없어서 안 드러났을 뿐, 실패해도 조용히
            // 무시되던 자리라 원인을 알 수 있게 서버 메시지를 그대로 보여줌
            const { code: serverCode, message: serverMessage } = extractApiError(error);
            if (import.meta.env.DEV) {
              console.error(`[${cfg.label} 노드 추가 실패]`, serverCode, error);
            }
            show({
              title: serverMessage || `${cfg.label} 추가에 실패했습니다. 다시 시도해주세요.`,
              variant: 'error',
              duration: 8000,
            });
          });
      }
    } else if (type === 'light') {
      if (currentFloor) {
        const count = addedDevices.filter((d) => d.placeType === 'light').length + 1;
        const name = deviceId || `${cfg.label}-${String(count).padStart(2, '0')}`;
        createIoTLight({
          floorId: currentFloor.id,
          name,
          x: position.x / 100,
          y: position.y / 100,
        })
          .then((newLight) => {
            // addedDevices에 새 마커를 추가하는 것도 iotLights 동기화 effect가 알아서 처리함
            queryClient.setQueryData<IoTLight[]>(floorQueryKeys.light(floorId), (prev) => [
              ...(prev ?? []),
              newLight,
            ]);

            // 담당 CCTV·가이던스는 handleSaveEdit(카드 수정)과 같은 방식으로, 값이 채워졌을
            // 때만 등록 직후 이어서 저장함 — 등록 시점에 판단 노드·엣지가 아직 없으면
            // 비워둔 채로 넘어가고 나중에 카드에서 채워도 됨
            const { decisionNodeId, leftEdgeId, rightEdgeId, cctvId } = lightFields;
            void runLightFollowups(newLight.id, {
              guidance:
                decisionNodeId && leftEdgeId && rightEdgeId
                  ? { decisionNodeId, leftEdgeId, rightEdgeId }
                  : undefined,
              cctvId: cctvId || undefined,
            });
          })
          .catch((error: unknown) => {
            const serverMessage = extractApiError(error).message;
            show({
              title: '유도등 등록에 실패했습니다.',
              description: serverMessage || '다시 시도해주세요.',
              variant: 'error',
            });
          });
      }
    }

    setNodeAddStage('entry');
    setNodeStagedPosition(null);
    setZoneDraftRect(null);
    setNodeAddOpen(false);
    setNodeAddLightFields({ decisionNodeId: '', leftEdgeId: '', rightEdgeId: '' });
  };

  // 그리드가 필요한 두 진입점(CCTV 등록, 그리드 표시 토글)이 공유하는 확인 로직 —
  // 로컬 state가 비어있어도 실제로 없는 게 맞는지 서버에서 한 번 더 확인한 뒤에만 설정 팝업을 띄움
  const ensureFloorGridCells = (): Promise<FloorGridCell[]> => {
    if (floorGridCells.length > 0) return Promise.resolve(floorGridCells);
    if (!currentFloor) return Promise.resolve([]);
    return getFloorGridCells(currentFloor.id)
      .then((cells) => {
        queryClient.setQueryData(floorQueryKeys.grid(currentFloor.id), cells);
        return cells;
      })
      .catch(() => []);
  };

  const openGridSetupPrompt = (intent: 'cctv' | 'zone') => {
    setGridSetupIntent(intent);
    // 업로드 때 정했던 값이 남아 있으면 다시 입력하지 않도록 채워둠
    const remembered = currentFloor
      ? (readStoredNumber(GRID_SIZE_KEY(currentFloor.id)) ??
        readStoredNumber(PENDING_GRID_SIZE_KEY(currentFloor.id)))
      : null;
    setGridSizeCmInput(String(remembered ?? 100));
    setGridSetupPromptOpen(true);
  };

  // 입력 단계 제출 — CCTV는 서버가 배율(cellSizeMeter) 없이는 등록을 거부(CCTV006)하는데
  // 배율 조회 API가 없어서, 아는 값이 있으면 조용히 다시 적용하고 정말 모를 때만 사용자에게 묻는다.
  // (드래그를 다 끝낸 뒤에 실패하지 않도록 시야 선택 단계로 넘어가기 전에 처리)
  const handleSubmitNodeEntry = (
    type: PlacingDeviceType,
    deviceId: string,
    lightFields: LightAddFields,
  ) => {
    if (!nodeStagedPosition) return;
    if (type === 'cctv') {
      // ensureFloorGridCells 호출 전 상태를 기억해둠 — 이미 이번 세션에서 그리드를 확인했다면
      // (cells가 새로 조회된 게 아니라 기존 state) 배율을 다시 PUT할 필요가 없음
      const hadGridAlready = floorGridCells.length > 0;
      void ensureFloorGridCells().then((cells) => {
        const floorIdForGrid = currentFloor?.id;
        if (!floorIdForGrid || cells.length === 0) {
          setNodeAddStage('entry');
          openGridSetupPrompt('cctv');
          return;
        }
        if (hadGridAlready) {
          // 그리드가 이미 확인된 상태에서 무관한 CCTV를 하나 더 등록하는 경우 — 배율을 다시
          // 적용하면 셀이 재생성될 수 있어(다른 CCTV·구역의 cellIds가 무효화됨) 건드리지 않음
          setNodeAddStage('fov');
          return;
        }
        // 기억해둔 값 → 이미 등록된 CCTV가 쓰던 배율 순으로 되찾음
        const knownSize =
          readStoredNumber(GRID_SIZE_KEY(floorIdForGrid)) ??
          realCctvs.find((c) => c.floorId === floorIdForGrid && c.gridCellSizeMeter)
            ?.gridCellSizeMeter ??
          null;

        if (!knownSize) {
          setNodeAddStage('entry');
          openGridSetupPrompt('cctv');
          return;
        }

        // 배율을 알고 있으면 사용자를 막지 않고 조용히 재적용(PUT은 create-or-update라 안전).
        // 셀이 재생성될 수 있으므로 적용 후 셀을 다시 받아온 뒤에 시야 선택 단계로 넘어감
        setFloorGrid(floorIdForGrid, knownSize)
          .then(() => getFloorGridCells(floorIdForGrid))
          .then((refreshed) => {
            queryClient.setQueryData(floorQueryKeys.grid(floorIdForGrid), refreshed);
            rememberGridSize(floorIdForGrid, knownSize);
            setNodeAddStage('fov');
          })
          .catch(() => {
            // 재적용이 실패하면 그때 사용자에게 물어봄
            setNodeAddStage('entry');
            openGridSetupPrompt('cctv');
          });
      });
      return;
    }
    finalizeNodePlacement(type, deviceId, nodeStagedPosition, lightFields);
  };

  // 그리드설정/시야구역 단계에서 뒤로 — 입력 단계로 돌아가되 이미 지정한 위치는 유지
  const handleNodeAddBack = () => {
    setNodeAddStage('entry');
    setZoneDraftRect(null);
    setCctvDraftCellIds([]);
    lastCctvDraftRectRef.current = null;
  };

  // 팝업을 취소로 닫을 때도 다음 CCTV 등록 시도가 이전 드래그 영역을 이어받지 않게 비움.
  // 유도등 갈림길·좌우 통로 값과 캔버스 픽 모드도 다음 추가 시도에 남아있지 않게 같이 정리
  const handleCancelNodeAdd = () => {
    setNodeAddOpen(false);
    lastCctvDraftRectRef.current = null;
    setNodeAddLightFields({ decisionNodeId: '', leftEdgeId: '', rightEdgeId: '' });
    setLightPickTarget((prev) => (prev?.source === 'add' ? null : prev));
  };

  const handleGridSetupPromptCancel = () => {
    setGridSetupPromptOpen(false);
    if (gridSetupIntent === 'cctv') handleNodeAddBack();
    setGridSetupIntent(null);
  };

  const handleGridSetupPromptConfirm = () => {
    if (!currentFloor) return;
    const cellSizeCm = Number(gridSizeCmInput);
    if (!(cellSizeCm > 0 && cellSizeCm < 500)) return;
    const floorIdForGrid = currentFloor.id;
    setFloorGrid(floorIdForGrid, cellSizeCm)
      .then(() => getFloorGridCells(floorIdForGrid))
      .then((cells) => {
        queryClient.setQueryData(floorQueryKeys.grid(floorIdForGrid), cells);
        rememberGridSize(floorIdForGrid, cellSizeCm);
        setGridSetupPromptOpen(false);
        if (gridSetupIntent === 'cctv') {
          setNodeAddStage('fov');
        } else if (gridSetupIntent === 'zone') {
          setZoneAddOpen(true);
        }
        setGridSetupIntent(null);
      })
      .catch((error: unknown) => {
        const msg = isAxiosError<{ message?: string }>(error)
          ? (error.response?.data?.message ?? '')
          : '';
        show({
          title: `그리드 설정에 실패했습니다${msg ? ` (${msg})` : ''}`,
          variant: 'error',
          duration: 8000,
        });
      });
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

  const handleFinalizeFov = (deviceId: string) => {
    // 조용히 return하지 않고 어디서 막혔는지 알려줌
    if (!nodeStagedPosition) {
      show({ title: '도면에서 카메라 위치를 먼저 지정해주세요.', variant: 'warning' });
      return;
    }
    if (!currentFloor) {
      show({
        title: '층 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.',
        variant: 'error',
      });
      return;
    }
    if (cctvDraftCellIds.length === 0) {
      show({ title: '도면을 드래그해서 감시 구역(칸)을 먼저 선택해주세요.', variant: 'warning' });
      return;
    }
    const count = addedDevices.filter((d) => d.type === 'cctv').length + 1;
    const label = deviceId || `CCTV-${String(count).padStart(2, '0')}`;
    // x,y는 0~1 정규화 값이어야 함 — 캔버스 경계 밖 클릭 등으로 살짝 벗어나는 경우 클램프
    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
    const x = clamp01(nodeStagedPosition.x / 100);
    const y = clamp01(nodeStagedPosition.y / 100);

    // 최초 시도·재시도 둘 다 여기로 옴 — 성공 처리를 한 곳에 모아 둠
    const handleCreated = (newCctv: Cctv) => {
      // addedDevices에 새 마커를 추가하는 것도 realCctvs 동기화 effect가 알아서 처리함
      queryClient.setQueryData<Cctv[]>(floorQueryKeys.cctv(floorId), (prev) => [
        ...(prev ?? []),
        newCctv,
      ]);
      lastCctvDraftRectRef.current = null;
      setNodeAddStage('entry');
      setNodeStagedPosition(null);
      setZoneDraftRect(null);
      setCctvDraftCellIds([]);
      setNodeAddOpen(false);
    };

    createCctv({ floorId: currentFloor.id, name: label, x, y, gridCellIds: cctvDraftCellIds })
      .then(handleCreated)
      .catch((error: unknown) => {
        // HTTP 4xx는 AxiosError로, 200 + isSuccess:false는 ApiError로 올라오므로 둘 다 본다
        const { code: serverCode, message: serverMessage } = extractApiError(error);
        if (import.meta.env.DEV) {
          console.error('[CCTV 등록 실패]', serverCode, error);
        }
        // CCTV006 = 이 층에 그리드 배율(cellSizeMeter)이 설정 안 됨. AI 재분석 등으로 서버에서
        // 배율이 사라지는 경우가 있어 드물지 않게 재현됨(알려진 백엔드 이슈).
        // 아는 배율이 있으면 조용히 재적용하고, 방금 드래그했던 영역(rect)을 새 그리드 기준으로
        // 다시 계산해서 같은 자리로 한 번 더 등록을 시도한다 — 사용자가 다시 드래그하지 않아도
        // 대부분 이 자리에서 바로 완료됨("새로고침해야 반영된다"는 문제의 원인이었음).
        // rect가 없거나(드래그 없이 클릭만 한 경우 등) 재시도도 실패하면 그때만 다시 그려달라고 안내함
        if (serverCode === 'CCTV006' || /GridCell 크기|cellSizeMeter/i.test(serverMessage)) {
          const knownSize = readStoredNumber(GRID_SIZE_KEY(currentFloor.id));
          if (!knownSize) {
            setCctvDraftCellIds([]);
            openGridSetupPrompt('cctv');
            show({
              title:
                '이 층의 그리드 배율(cm)을 먼저 설정해야 합니다. 설정 후 감시 구역을 다시 드래그해주세요.',
              variant: 'warning',
              duration: 7000,
            });
            return;
          }
          const draftRect = lastCctvDraftRectRef.current;
          setFloorGrid(currentFloor.id, knownSize)
            .then(() => getFloorGridCells(currentFloor.id))
            .then((refreshed) => {
              queryClient.setQueryData(floorQueryKeys.grid(currentFloor.id), refreshed);
              // gridCellPxSize는 재적용 전 floorGridCells 기준으로 계산된 memo라 그대로 쓰면
              // 안 됨 — 재생성된 그리드는 행·열 수가 달라질 수 있어(코드래빗 리뷰로 발견),
              // 새로 조회한 refreshed 기준으로 다시 계산해서 넘김
              const retryCellIds = draftRect
                ? cellIdsIntersectingRect(
                    refreshed,
                    draftRect,
                    getGridCellPxSize(refreshed, canvasH),
                    canvasH,
                  )
                : [];
              if (retryCellIds.length === 0) {
                setCctvDraftCellIds([]);
                show({
                  title: `그리드 배율(${knownSize}cm)을 다시 적용했습니다. 감시 구역을 다시 드래그해주세요.`,
                  variant: 'warning',
                  duration: 7000,
                });
                return;
              }
              return createCctv({
                floorId: currentFloor.id,
                name: label,
                x,
                y,
                gridCellIds: retryCellIds,
              })
                .then(handleCreated)
                .catch(() => {
                  setCctvDraftCellIds([]);
                  show({
                    title: `그리드 배율(${knownSize}cm)을 다시 적용했습니다. 감시 구역을 다시 드래그해주세요.`,
                    variant: 'warning',
                    duration: 7000,
                  });
                });
            })
            .catch(() => {
              setCctvDraftCellIds([]);
              openGridSetupPrompt('cctv');
            });
          return;
        }
        show({
          title: `CCTV 등록에 실패했습니다.${serverMessage ? ` (${serverMessage})` : ''}`,
          variant: 'error',
        });
      });
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
  const handleExitEdgeMode = () => {
    setEdgeChainNodeIds([]);
    setEdgeChainReviewOpen(false);
    setEdgeAddOpen(false);
  };

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

  const handleAddZone = (label: string) => {
    if (!currentFloor || zoneDraftCellIds.length === 0) return;
    createUserZone(currentFloor.id, { name: label, cellIds: zoneDraftCellIds })
      .then((zone) => {
        updateZonesCache((prev) => [
          ...prev,
          { id: zone.id, name: zone.name, floorNum: zone.floorNum, cellIds: zoneDraftCellIds },
        ]);
        setZoneAddOpen(false);
        setZoneDraftCellIds([]);
      })
      .catch((error: unknown) => {
        const serverMessage = extractApiError(error).message;
        show({
          title: '구역 저장에 실패했습니다.',
          description: serverMessage || '다시 시도해주세요.',
          variant: 'error',
        });
      });
  };

  // 구역은 PATCH가 없어(스웨거 확인) 새로 만들고 기존 걸 지우는 방식으로 "재설정"함 —
  // handleStartEditZone이 이미 zoneDraftCellIds를 기존 셀로 채워두고 도면 드래그를 켜뒀으므로
  // 여기서는 그 결과(zoneDraftCellIds)를 그대로 저장만 함
  const handleConfirmZoneReset = (label: string) => {
    if (!currentFloor || !zoneResetTargetId || zoneDraftCellIds.length === 0) return;
    const targetId = zoneResetTargetId;
    const nextCellIds = zoneDraftCellIds;
    const floorId = currentFloor.id;
    // 삭제 전 원본을 남겨둠 — 삭제는 됐는데 생성만 실패했을 때 원래 이름·셀로 한 번 더
    // 만들어보는 복구 시도에 씀(코드래빗 리뷰 반영: 복구 시도 없이 그냥 지워지기만 하면
    // 사용자가 셀 목록을 기억해서 손으로 다시 만들어야 함)
    const original = zones.find((z) => z.id === targetId);
    // 스웨거 확인 결과 구역 이름은 같은 층 안에서 유일해야 함 — 이름을 그대로 두고
    // 셀만 재설정하는 흔한 경우, 기존 구역을 먼저 안 지우면 "이름 중복"으로 새 구역
    // 생성이 거부됨(재설정할 때마다 매번 실패하던 원인). 그래서 삭제 → 생성 순서로 감:
    // 셀 겹침은 스웨거상 문제없음(기존 구역에서 자동으로 빠짐)이라 안전하지만, 생성이
    // 실패하면 기존 구역은 이미 사라진 상태로 남는 트레이드오프가 있음 — 아래에서 그 경우도 처리함
    let deleted = false;
    deleteUserZone(floorId, targetId)
      .then(() => {
        deleted = true;
        return createUserZone(floorId, { name: label, cellIds: nextCellIds });
      })
      .then((zone) => {
        updateZonesCache((prev) => [
          ...prev.filter((z) => z.id !== targetId),
          { id: zone.id, name: zone.name, floorNum: zone.floorNum, cellIds: nextCellIds },
        ]);
        if (selectedZoneRef?.kind === 'zone' && selectedZoneRef.id === targetId) {
          setSelectedZoneRef(null);
        }
        setZoneAddOpen(false);
        setZoneDraftCellIds([]);
        setEditingZoneId(null);
        show({ title: '구역을 다시 설정했습니다.', variant: 'success' });
      })
      .catch((error: unknown) => {
        const { message } = extractApiError(error);
        if (!deleted) {
          show({ title: message || '구역 재설정에 실패했습니다.', variant: 'error' });
          return;
        }
        if (!original) {
          // 원본 정보가 없으면(이론상 거의 없음) 복구를 시도할 수 없음 — 기존 안내로 대체
          updateZonesCache((prev) => prev.filter((z) => z.id !== targetId));
          show({
            title:
              message || '기존 구역은 삭제됐지만 새 구역 생성에 실패했습니다. 다시 만들어주세요.',
            variant: 'error',
            duration: 10000,
          });
          return;
        }
        // 삭제는 됐는데 새 구역 생성만 실패 — 원래 이름·셀로 한 번 더 복구를 시도해서
        // 실패 범위를 줄임(이름만 바꾸는 흔한 경우 특히 유효)
        createUserZone(floorId, { name: original.label, cellIds: original.cellIds })
          .then((restored) => {
            updateZonesCache((prev) => [
              ...prev.filter((z) => z.id !== targetId),
              {
                id: restored.id,
                name: original.label,
                floorNum: restored.floorNum,
                cellIds: original.cellIds,
              },
            ]);
            show({
              title: message || '구역 재설정에 실패해 이전 상태로 되돌렸습니다.',
              variant: 'error',
              duration: 10000,
            });
          })
          .catch(() => {
            // 복구 재시도까지 실패한 경우에만 진짜로 사라짐 — 목록에서 지우고 명확히 알림
            updateZonesCache((prev) => prev.filter((z) => z.id !== targetId));
            show({
              title: '기존 구역이 삭제됐고 복구에도 실패했습니다. 구역을 다시 만들어주세요.',
              variant: 'error',
              duration: 10000,
            });
          });
      });
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

  // 툴바 "+ 추가" 메뉴·훈련 준비 체크리스트가 같이 쓰는 진입점 — 다른 배치 모드를 정리하고 엶.
  // presetType을 주면 노드 종류 칩까지 미리 골라둠(예: 체크리스트의 "시작 노드 지정하기")
  const handleOpenNodeAdd = (presetType?: PlacingDeviceType) => {
    setZoneAddOpen(false);
    if (presetType) setNodeAddType(presetType);
    setNodeAddOpen(true);
    // 새로 여는 등록 흐름은 이전 시도의 드래그 영역과 무관해야 함
    lastCctvDraftRectRef.current = null;
  };

  const handleOpenEdgeAdd = () => {
    setNodeAddOpen(false);
    setZoneAddOpen(false);
    setSelectedEdgeId(null);
    setEdgeAddOpen(true);
    setEdgeChainNodeIds([]);
    setEdgeChainReviewOpen(false);
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
  ]);

  // 시작 후보 중 하나라도 엣지를 따라 최종 탈출구까지 이어지는지 (훈련 준비 체크리스트용).
  // 이 경로가 없으면 경로 탐색기가 EVAC005("도달 가능한 EXIT 노드가 없습니다")로 실패함 —
  // 시작 노드가 그래프에 아예 연결 안 돼 있어도 여기서 걸림. graphEdges + structureNodes로 BFS.
  const hasRouteFromStartToExit = useMemo(() => {
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
  }, [structureNodes, graphEdges]);

  // 다른 삭제(장비/POI)는 전부 확인 모달을 거치는데 구역만 클릭 즉시 삭제되고 있어서 맞춤
  const handleZoneDeleteRequest = (zone: ZoneEntry) => setZoneDeleteTarget(zone);
  const handleZoneDeleteCancel = () => setZoneDeleteTarget(null);

  const handleZoneDeleteConfirm = () => {
    if (!currentFloor || !zoneDeleteTarget || isDeletingZone) return;
    const id = zoneDeleteTarget.id;
    setIsDeletingZone(true);
    deleteUserZone(currentFloor.id, id)
      .then(() => {
        updateZonesCache((prev) => prev.filter((z) => z.id !== id));
        if (selectedZoneRef?.kind === 'zone' && selectedZoneRef.id === id) {
          setSelectedZoneRef(null);
        }
        setZoneDeleteTarget(null);
      })
      .catch((error: unknown) => {
        const serverMessage = extractApiError(error).message;
        show({
          title: '구역 삭제에 실패했습니다.',
          description: serverMessage || '다시 시도해주세요.',
          variant: 'error',
        });
      })
      .finally(() => setIsDeletingZone(false));
  };

  const isNodeSelected = (id: string) =>
    selectedZoneRef?.kind === 'node' && selectedZoneRef.id === id;
  const isZoneSelected = (id: string) =>
    selectedZoneRef?.kind === 'zone' && selectedZoneRef.id === id;

  const renderStructureCard = (n: StructureNode) => {
    const sameTypeIndex = structureNodes
      .filter((x) => x.type === n.type)
      .findIndex((x) => x.id === n.id);
    const isEditing = editingStructureId === n.id;
    // 탈출구 도달 불가 구조 노드 여부
    const isDiagnosisUnreachable =
      isDiagnosisHighlighted && routeDiagnosisQuery.data?.unreachableNodeIds?.includes(n.id);
    return (
      <div
        key={n.id}
        data-panel-id={n.id}
        className={clsx(
          styles.deviceCard,
          isNodeSelected(n.id) && styles.deviceCardSelected,
          isDiagnosisUnreachable && styles.deviceCardDiagnosisError,
        )}
        onClick={() => handleZoneRefSelect({ kind: 'node', id: n.id })}
      >
        <div className={styles.zoneCardHeader}>
          <span className={styles.zoneCardTitleGroup}>
            <span
              className={clsx(
                styles.zoneCardDot,
                n.type === 'door' && n.isStartCandidate
                  ? ZONE_CARD_DOT_CLASS.start
                  : ZONE_CARD_DOT_CLASS[n.type],
              )}
            />
            <span className={styles.zoneCardTitleText}>
              <span className={styles.deviceCardName}>
                {STRUCTURE_NODE_LABEL[n.type]} {sameTypeIndex + 1}
              </span>
              {isDiagnosisUnreachable && (
                <span className={styles.diagnosisCardHint}>출구와 연결 안 됨</span>
              )}
            </span>
          </span>
          <span className={styles.zoneCardHeaderActions}>
            {/* 최종 탈출구는 계단에서만 지정 — 문/출입구는 층 내부 통로라 제외 */}
            {n.type === 'stair' && (
              <button
                type="button"
                className={n.isFinalExit ? styles.finalExitBadge : styles.finalExitToggle}
                disabled={editingLocked}
                aria-describedby={editingLocked ? EDITING_LOCK_HINT_ID : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFinalExit(n.id);
                }}
              >
                {n.isFinalExit ? '최종 탈출구' : '탈출구로 지정'}
              </button>
            )}
            {/* 훈련 시작 후보는 문·출입구 노드에서 지정(BE 정책) */}
            {n.type === 'door' && (
              <button
                type="button"
                className={n.isStartCandidate ? styles.finalExitBadge : styles.finalExitToggle}
                disabled={editingLocked || startCandidatePendingIds.has(n.id)}
                aria-describedby={editingLocked ? EDITING_LOCK_HINT_ID : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleStartCandidate(n.id);
                }}
              >
                {n.isStartCandidate ? '시작 후보' : '시작 후보로 지정'}
              </button>
            )}
            <button
              type="button"
              aria-label={isEditing ? '수정 완료' : '수정'}
              className={isEditing ? styles.zoneCardIconBtnDone : styles.zoneCardIconBtn}
              disabled={editingLocked}
              aria-describedby={editingLocked ? EDITING_LOCK_HINT_ID : undefined}
              onClick={(e) => {
                e.stopPropagation();
                handleStartEditStructure(n.id);
              }}
            >
              {isEditing ? (
                <CheckIcon width={14} height={14} />
              ) : (
                <EditIcon width={14} height={14} />
              )}
            </button>
            <button
              type="button"
              aria-label="삭제"
              className={styles.zoneCardIconBtnDelete}
              disabled={editingLocked}
              aria-describedby={editingLocked ? EDITING_LOCK_HINT_ID : undefined}
              onClick={(e) => {
                e.stopPropagation();
                handleStructureNodeDelete(n.id);
              }}
            >
              <TrashIcon width={14} height={14} />
            </button>
          </span>
        </div>
      </div>
    );
  };

  const renderZoneCard = (z: ZoneEntry) => {
    const isEditing = editingZoneId === z.id;
    return (
      <div
        key={z.id}
        data-panel-id={z.id}
        className={clsx(styles.deviceCard, isZoneSelected(z.id) && styles.deviceCardSelected)}
        onClick={() => handleZoneRefSelect({ kind: 'zone', id: z.id })}
      >
        <div className={styles.zoneCardHeader}>
          <span className={styles.zoneCardTitleGroup}>
            <span className={clsx(styles.zoneCardDot, styles.zoneCardDotGeneral)} />
            {isEditing ? (
              <input
                className={styles.deviceCardNameInput}
                aria-label="구역 이름"
                value={zoneEditLabel}
                disabled={editingLocked}
                onChange={(e) => setZoneEditLabel(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className={styles.deviceCardName}>{z.label}</span>
            )}
          </span>
          <span className={styles.zoneCardHeaderActions}>
            <button
              type="button"
              aria-label={isEditing ? '수정 완료' : '수정'}
              className={isEditing ? styles.zoneCardIconBtnDone : styles.zoneCardIconBtn}
              disabled={editingLocked}
              aria-describedby={editingLocked ? EDITING_LOCK_HINT_ID : undefined}
              onClick={(e) => {
                e.stopPropagation();
                if (isEditing) {
                  handleSaveZoneLabel(z.id);
                } else {
                  handleStartEditZone(z);
                }
              }}
            >
              {isEditing ? (
                <CheckIcon width={14} height={14} />
              ) : (
                <EditIcon width={14} height={14} />
              )}
            </button>
            <button
              type="button"
              aria-label="삭제"
              className={styles.zoneCardIconBtnDelete}
              disabled={editingLocked}
              aria-describedby={editingLocked ? EDITING_LOCK_HINT_ID : undefined}
              onClick={(e) => {
                e.stopPropagation();
                handleZoneDeleteRequest(z);
              }}
            >
              <TrashIcon width={14} height={14} />
            </button>
          </span>
        </div>
        {/* 감시 영역(CCTV 카드)과 같은 자리·같은 모양 — 수정 중이 아닐 때도 정보를 보여줘서
            수정 모드로 들어갈 때 카드 규격이 갑자기 늘어나 보이지 않게 함. 수정을 누르면 바로
            도면 드래그가 켜지므로(handleStartEditZone) 별도 "재설정" 버튼 없이 여기는
            지금 고른 칸 수만 실시간으로 보여줌 */}
        <div
          className={styles.deviceCardRow}
          title={isEditing ? '도면에서 칸을 클릭하거나 드래그하면 영역이 바로 바뀌어요' : undefined}
        >
          <span className={styles.deviceCardKey}>구역 범위</span>
          {isEditing ? (
            <span className={styles.deviceCardValue}>{zoneDraftCellIds.length}칸</span>
          ) : (
            <span className={styles.deviceCardValue}>{z.cellIds.length}칸</span>
          )}
        </div>
      </div>
    );
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

  // 장비 카드 "완료" 버튼 — 실제로 바뀐 값이 있을 때만 눌리게. handleSaveEdit의
  // guidanceChanged 판정과 같은 기준(원본 값과 폼 값 비교)을 여기서도 씀
  const editingPanelItem = editingItemId
    ? allPanelItems.find((item) => item.id === editingItemId)
    : undefined;
  const editingLight =
    editingPanelItem?.type === 'light' ? iotLights.find((l) => l.id === editingItemId) : undefined;
  const isDeviceEditFormDirty = editingPanelItem
    ? editForm.label !== editingPanelItem.label ||
      editForm.decisionNodeId !== (editingLight?.decisionNodeId ?? '') ||
      editForm.leftEdgeId !== (editingLight?.leftEdgeId ?? '') ||
      editForm.rightEdgeId !== (editingLight?.rightEdgeId ?? '') ||
      editForm.cctvId !== (editingLight?.cctvId ?? '') ||
      // 위치 드래그도 완료를 눌러야 확정되므로, 옮긴 좌표가 스테이징돼 있으면 그것만으로도
      // "바뀐 값이 있다"고 봄(devicePositions[id]는 handleStartEdit이 매 세션 시작마다 지움)
      (!!editingItemId && editingItemId in devicePositions)
    : false;

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

  // MockFloorMap3F가 픽 모드에서 유효한(연결된) 노드·엣지만 클릭 가능하게 걸러주므로, 여기서는
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

  const gridCellPxSize = useMemo(
    () => getGridCellPxSize(floorGridCells, canvasH),
    [floorGridCells, canvasH],
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

  const isPanelItemSelected = (item: PanelItem) => selectedItem?.data.id === item.id;

  const handlePanelItemSelect = (item: PanelItem) => {
    if (item.kind !== 'device') return;
    const isSame = selectedItem?.kind === 'device' && selectedItem.data.id === item.id;
    if (isSame) {
      setSelectedItem(null);
      setEditingItemId(null);
      return;
    }
    const data =
      item.source === 'floor'
        ? floor?.devices.find((d) => d.id === item.id)
        : addedDevices.find((d) => d.id === item.id);
    if (data) setSelectedItem({ kind: 'device', data });
    setSelectedZoneRef(null);
    if (editingItemId && editingItemId !== item.id) setEditingItemId(null);
  };

  const handleStartEdit = (item: PanelItem) => {
    if (item.kind !== 'device') return;
    // 카드 수정은 한 번에 하나만 — 다른 카드 종류의 수정이나 CCTV 감시영역 재선택이
    // 남아있으면 여기서 정리함
    setEditingStructureId(null);
    setEditingZoneId(null);
    if (zoneAddOpen) setZoneAddOpen(false);
    if (editingCctvId && editingCctvId !== item.id) handleCancelEditCctvCells();
    if (selectedItem?.kind !== 'device' || selectedItem.data.id !== item.id) {
      handlePanelItemSelect(item);
    }
    // 유도등은 예전 설정 모달에 있던 필드까지 이 폼에 같이 채워서, 카드 하나에서 전부 편집함
    const light = item.type === 'light' ? iotLights.find((l) => l.id === item.id) : undefined;
    setEditForm({
      label: item.label,
      decisionNodeId: light?.decisionNodeId ?? '',
      leftEdgeId: light?.leftEdgeId ?? '',
      rightEdgeId: light?.rightEdgeId ?? '',
      cctvId: light?.cctvId ?? '',
    });
    // 이전에 드래그했다가 완료를 안 누르고 나간 세션의 스테이징 값이 남아있으면 이번에
    // 새로 안 옮겨도 그 값이 그대로 보여서 위치가 잘못 표시될 수 있음 — 새 수정 세션은
    // 항상 실제 저장된 좌표에서 다시 시작하게 정리함
    setDevicePositions((prev) => {
      if (!(item.id in prev)) return prev;
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
    setEditingItemId(item.id);
  };

  const handleSaveEdit = (item: PanelItem) => {
    // 감시영역 재선택 중에 카드 완료를 눌러도 재선택 팝업이 안 닫히던 문제 — 완료는
    // 재선택까지 함께 정리함(재선택 자체는 저장하지 않은 채로 취소됨)
    if (editingCctvId === item.id) handleCancelEditCctvCells();
    const newLabel = editForm.label;
    if (item.source === 'floor') {
      updateFloorCache((prev) =>
        prev
          ? {
              ...prev,
              devices: prev.devices.map((d) => (d.id === item.id ? { ...d, label: newLabel } : d)),
            }
          : prev,
      );
    } else if (item.source === 'added') {
      const prevDevice = addedDevices.find((d) => d.id === item.id);
      // 위치 드래그도 "완료"를 눌러야 확정되도록 함 — 이번 수정 세션에서 실제로 옮겼으면
      // devicePositions에 그 좌표가 스테이징돼 있고(없으면 안 옮긴 것이므로 기존 좌표 그대로)
      const stagedPos = devicePositions[item.id];
      const finalX = stagedPos?.x ?? prevDevice?.x ?? 0;
      const finalY = stagedPos?.y ?? prevDevice?.y ?? 0;
      setAddedDevices((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, label: newLabel, x: finalX, y: finalY } : d)),
      );
      // 실패하면 방금 낙관적으로 바꾼 이름·위치를 원래대로 되돌림 — 안 그러면 저장 안 됐는데 화면엔 새 값이 남음
      const rollback = () => {
        if (prevDevice)
          setAddedDevices((prev) => prev.map((d) => (d.id === item.id ? prevDevice : d)));
      };
      if (item.type === 'light' && prevDevice) {
        const prevLight = iotLights.find((l) => l.id === item.id);
        updateIoTLight(item.id, {
          name: newLabel,
          x: finalX / 100,
          y: finalY / 100,
        }).catch((error: unknown) => {
          rollback();
          const serverMessage = extractApiError(error).message;
          show({
            title: '유도등 정보 수정에 실패했습니다.',
            description: serverMessage || '다시 시도해주세요.',
            variant: 'error',
          });
        });

        // 가이던스·담당 CCTV는 예전 설정 모달의 "저장" 버튼들이 하던 일을 그대로 옮긴 것 —
        // 바뀐 값이 있을 때만, 각자 독립된 PATCH로 보냄. Pi 엔드포인트는 스웨거 확인 결과
        // "참고용 메타데이터일 뿐 실제 명령 전달 경로에는 쓰이지 않는다"고 명시되어 있어
        // 카드에서 뺌(연동에 필요한 값이 아님). 필요해지면 별도 연동한다.
        const { decisionNodeId, leftEdgeId, rightEdgeId } = editForm;
        const guidanceChanged =
          decisionNodeId !== (prevLight?.decisionNodeId ?? '') ||
          leftEdgeId !== (prevLight?.leftEdgeId ?? '') ||
          rightEdgeId !== (prevLight?.rightEdgeId ?? '');
        const cctvChanged = !!editForm.cctvId && editForm.cctvId !== (prevLight?.cctvId ?? '');
        void runLightFollowups(item.id, {
          guidance:
            decisionNodeId && leftEdgeId && rightEdgeId && guidanceChanged
              ? { decisionNodeId, leftEdgeId, rightEdgeId }
              : undefined,
          cctvId: cctvChanged ? editForm.cctvId : undefined,
        });
      } else if (item.type === 'cctv' && prevDevice) {
        updateCctv(item.id, { name: newLabel, x: finalX / 100, y: finalY / 100 })
          .then(patchCctvCache)
          .catch((error: unknown) => {
            rollback();
            const serverMessage = extractApiError(error).message;
            show({
              title: 'CCTV 정보 수정에 실패했습니다.',
              description: serverMessage || '다시 시도해주세요.',
              variant: 'error',
            });
          });
      }
    }
    if (selectedItem?.kind === 'device' && selectedItem.data.id === item.id) {
      setSelectedItem({
        kind: 'device',
        data: { ...selectedItem.data, label: newLabel },
      });
    }
    setEditingItemId(null);
    // 스테이징된 드래그 좌표는 이미 addedDevices에 커밋했으니 정리 — 다음 수정 세션은
    // handleStartEdit이 다시 깨끗한 상태로 시작함
    setDevicePositions((prev) => {
      if (!(item.id in prev)) return prev;
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  };

  // "취소" — 이름·가이던스 등 입력한 값은 그냥 버림. 위치도 저장 안 하고 나가면 렌더링
  // 쪽에서 editingItemId가 이 항목이 아닐 때 devicePositions 오버레이를 무시하게 돼있어
  // 자동으로 원래 좌표로 되돌아감(추가로 지워서 다음 수정 세션도 깨끗하게 시작하게 함)
  const handleCancelEdit = (item: PanelItem) => {
    if (editingCctvId === item.id) handleCancelEditCctvCells();
    setEditingItemId(null);
    setDevicePositions((prev) => {
      if (!(item.id in prev)) return prev;
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  };

  const handlePanelItemDelete = (item: PanelItem) => {
    setDeleteConfirmTarget(item);
  };

  const handleDeleteConfirm = () => {
    const item = deleteConfirmTarget;
    if (!item || isDeletingItem) return;
    if (
      item.source === 'added' &&
      item.type === 'cctv' &&
      !realCctvs.some((cctv) => cctv.id === item.id && cctv.floorId === floorId)
    ) {
      setDeleteConfirmTarget(null);
      return;
    }
    if (editingItemId === item.id) setEditingItemId(null);
    if (item.source === 'added') {
      if (item.type === 'cctv') {
        setIsDeletingItem(true);
        // CCTV 등록 시 함께 생성되는 CUSTOM 노드는 서버가 cascade로 안 지워줘서(유도등과 다름)
        // 보라색 점으로 도면에 영구히 남음 — 삭제 전에 미리 알아두고 CCTV 삭제 성공 후 직접 정리
        const customNodeId = realCctvs.find((cctv) => cctv.id === item.id)?.customNodeId;
        deleteCctv(item.id)
          .then(async () => {
            handleAddedDeviceDelete(item.id);
            queryClient.setQueryData<Cctv[]>(floorQueryKeys.cctv(floorId), (prev) =>
              prev?.filter((cctv) => cctv.id !== item.id),
            );
            setSelectedItem((prev) =>
              prev?.kind === 'device' && prev.data.id === item.id ? null : prev,
            );
            if (editingCctvId === item.id) handleCancelEditCctvCells();
            setDeleteConfirmTarget(null);
            void queryClient.invalidateQueries({ queryKey: floorQueryKeys.cctv(floorId) });

            if (customNodeId) {
              try {
                await deleteMapNode(customNodeId);
                updateGraphCache((prev) => ({
                  nodes: prev.nodes.filter((n) => n.id !== customNodeId),
                  edges: prev.edges.filter(
                    (edge) => edge.fromNodeId !== customNodeId && edge.toNodeId !== customNodeId,
                  ),
                }));
              } catch (error) {
                // CCTV 자체는 이미 삭제됐으니 이 실패로 사용자 흐름을 막지는 않음 — 다만 CUSTOM 노드는
                // 캔버스에 보여주기만 하고 삭제 UI가 따로 없어서, 여기서 실패하면 고아로 남는다
                if (import.meta.env.DEV) console.warn('[CCTV 연결 노드 정리 실패]', error);
              }
            }
          })
          .catch((error: unknown) => {
            const { message } = extractApiError(error);
            show({ title: message || 'CCTV 삭제에 실패했습니다.', variant: 'error' });
          })
          .finally(() => setIsDeletingItem(false));
        return;
      }
      if (item.type === 'light') {
        // 서버에서 이 유도등이 붙어있던 노드·엣지까지 cascade로 함께 삭제됨
        setIsDeletingItem(true);
        deleteIoTLight(item.id)
          .then(() => {
            handleAddedDeviceDelete(item.id);
            queryClient.setQueryData<IoTLight[]>(floorQueryKeys.light(floorId), (prev) =>
              prev?.filter((l) => l.id !== item.id),
            );
            setDeleteConfirmTarget(null);
          })
          .catch((error: unknown) => {
            // CCTV/구조 노드 삭제와 달리 여기만 서버 메시지를 안 보여줘서, 실패해도 왜 실패했는지
            // 알 수 없었음(예: 다른 곳에서 참조 중이라 서버가 거부하는 경우) — 실제 사유를 그대로 보여줌
            const { message } = extractApiError(error);
            show({ title: message || '유도등 삭제에 실패했습니다.', variant: 'error' });
          })
          .finally(() => setIsDeletingItem(false));
        return;
      }
      handleAddedDeviceDelete(item.id);
      setDeleteConfirmTarget(null);
      return;
    }
    updateFloorCache((prev) =>
      prev ? { ...prev, devices: prev.devices.filter((d) => d.id !== item.id) } : prev,
    );
    if (selectedItem?.kind === 'device' && selectedItem.data.id === item.id) {
      setSelectedItem(null);
    }
    setDeleteConfirmTarget(null);
  };

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
                onToggleDiagnosisHighlight={() => setIsDiagnosisHighlighted((current) => !current)}
              />
            )}

            {/* 노드/구역/엣지 추가 · 그리드 설정 · 감시영역 재선택 팝업 — 예전엔 캔버스 위에
                떠 있어서 도면을 가려 그 밑을 클릭할 수 없었음. 도면을 보면서 동시에 입력할 수
                있어야 하는 흐름이라, 캔버스와 겹치지 않는 이 사이드바로 옮김 */}
            {gridSetupPromptOpen && (
              <div className={styles.gridSetupPopup} onClick={(e) => e.stopPropagation()}>
                <span className={styles.nodeAddTitle}>그리드 설정 필요</span>
                <span className={styles.nodeAddHint}>
                  이 층에는 아직 그리드가 없어요. 셀 크기를 정하고 설정해주세요.
                </span>
                <div className={styles.nodeAddField}>
                  <div className={styles.gridSizeLabelRow}>
                    <span className={styles.nodeAddLabel}>셀 크기</span>
                    <span className={styles.gridSizeValue}>{Number(gridSizeCmInput || 1)}cm</span>
                  </div>
                  <input
                    type="range"
                    className={styles.gridSizeSlider}
                    aria-label="그리드 셀 크기(cm)"
                    min={1}
                    max={499}
                    step={1}
                    value={Number(gridSizeCmInput || 1)}
                    onChange={(e) => setGridSizeCmInput(e.target.value)}
                  />
                </div>
                <div className={styles.nodeAddActions}>
                  <button
                    type="button"
                    className={styles.nodeAddCancelBtn}
                    onClick={handleGridSetupPromptCancel}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className={styles.nodeAddSubmitBtn}
                    disabled={!(Number(gridSizeCmInput) > 0 && Number(gridSizeCmInput) < 500)}
                    onClick={handleGridSetupPromptConfirm}
                  >
                    설정
                  </button>
                </div>
              </div>
            )}

            {/* 노드를 순서대로 계속 클릭해 경로를 쌓는 패널 — 경로 하나를 확정하면 모드도 같이
                끝나므로(핸들러 쪽 주석 참고), 여기선 항상 "아직 아무 것도 안 만든 상태"만 보여줌 */}
            {edgeAddOpen && !edgeChainReviewOpen && (
              <div className={styles.nodeAddPopup} onClick={(e) => e.stopPropagation()}>
                <div className={styles.nodeAddHeader}>
                  <span className={styles.nodeAddTitle}>엣지 연결</span>
                </div>
                <span className={styles.nodeAddHint}>
                  {edgeChainNodeIds.length === 0
                    ? '연결할 노드를 순서대로 클릭하세요'
                    : `계속 클릭해서 경로를 잇거나, 다음을 눌러 ${edgeChainNodeIds.length - 1}개 구간을 확정하세요`}
                </span>
                {edgeChainNodeIds.length > 0 && (
                  <span className={styles.edgeChainPath}>
                    {edgeChainNodeIds.map((id) => getGraphNodeLabel(id)).join(' → ')}
                  </span>
                )}
                <div className={styles.nodeAddActions}>
                  {edgeChainNodeIds.length > 0 && (
                    <button
                      type="button"
                      className={styles.nodeAddCancelBtn}
                      onClick={handleClearEdgeChain}
                    >
                      다시 선택
                    </button>
                  )}
                  {edgeChainNodeIds.length >= 2 ? (
                    <button
                      type="button"
                      className={styles.nodeAddSubmitBtn}
                      onClick={handleProceedToEdgeChainReview}
                    >
                      다음
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.nodeAddCancelBtn}
                      onClick={handleExitEdgeMode}
                    >
                      취소
                    </button>
                  )}
                </div>
              </div>
            )}

            {edgeAddOpen && edgeChainReviewOpen && (
              <EdgeChainReviewPopup
                containerRef={edgePopupRef}
                segments={edgeChainSegments}
                onBack={handleBackFromEdgeChainReview}
                onSubmit={handleSubmitEdgeChain}
              />
            )}

            {editingCctvId && (
              // 예전엔 좌측 상단에 raw 스타일로 떠서 눈에 잘 안 띄었음 — 다른 모든 "설정 중"
              // 팝업(구역 설정 등)과 같은 자리·같은 스타일로 통일해서 찾기 쉽게 함
              <div className={styles.nodeAddPopup} onClick={(e) => e.stopPropagation()}>
                <div className={styles.nodeAddHeader}>
                  <span className={styles.nodeAddTitle}>감시 영역 재선택</span>
                </div>
                <span className={styles.nodeAddHint}>
                  도면에서 칸을 클릭하거나 드래그해서 감시 영역을 다시 선택해주세요.{' '}
                  {cctvDraftCellIds.length}칸 선택됨.
                </span>
                <div className={styles.nodeAddActions}>
                  <button
                    type="button"
                    className={styles.nodeAddCancelBtn}
                    onClick={handleCancelEditCctvCells}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className={styles.nodeAddSubmitBtn}
                    disabled={cctvDraftCellIds.length === 0}
                    onClick={handleSaveEditCctvCells}
                  >
                    저장
                  </button>
                </div>
              </div>
            )}

            {nodeAddOpen && !gridSetupPromptOpen && (
              <NodeAddPopup
                containerRef={nodePopupRef}
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
                containerRef={zonePopupRef}
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
                  className={styles.canvasPlaceholder}
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
                  onUpload={() => setUploadModalOpen(true)}
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
                  {visibleStructureNodes.map((n) => renderStructureCard(n))}

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
                zones.filter((z) => z.type === 'general').map((z) => renderZoneCard(z))}
            </div>
          </div>
        </aside>
      </div>

      <FloorUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
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
