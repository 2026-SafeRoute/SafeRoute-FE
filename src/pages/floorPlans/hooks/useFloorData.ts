import { useEffect, useMemo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useGetBuildingsQuery } from '@apis/buildings/useBuildingsQuery';
import { extractApiError } from '@apis/errors/apiError';
import {
  floorQueryKeys,
  useBuildingFloorsQuery,
  useFloorCctvsQuery,
  useFloorGridCellsQuery,
  useFloorImageUrlQuery,
  useFloorLightsQuery,
  useFloorUserZonesQuery,
} from '@apis/floors/floorQueries';
import type { UserZoneWithCells } from '@apis/floors/floorQueries';

import useToast from '@components/toast/useToast';

import { CANVAS_W, getGridCellPxSize, getGridDimensions } from '@utils/floorCanvas';

import { useFloorAnalysisPolling } from './useFloorAnalysisPolling';
import { useRouteDiagnosisHighlight } from './useRouteDiagnosisHighlight';
import { getFloorGridCells, getFloorGridScale, setFloorGrid } from '../api/floorGridApi';
import { toFloor } from '../api/floorPlansApi';
import { assignLightCctv, configureLightGuidance } from '../api/iotLightsApi';
import { API_TYPE_TO_STRUCTURE } from '../constants/structureNode';
import { PENDING_GRID_SIZE_KEY, readStoredNumber, rememberGridSize } from '../utils/gridStorage';

import type { Cctv } from '../api/cctvApi';
import type { FloorGridCell } from '../api/floorGridApi';
import type { IoTLight } from '../api/iotLightsApi';
import type { FloorGraph } from '../api/mapGraphApi';
import type { ZoneEntry } from '../types/canvasSelection';
import type { Floor, FloorBuilding } from '../types/floorPlans';

// 그리드 좌표계 기준값·순수 계산 함수는 shared/utils/floorCanvas에서 관리한다.
// 시나리오 설정 캔버스도 같은 계산을 사용해 셀 경계가 어긋나지 않게 한다.
const DEFAULT_CANVAS_H = 420;

// react-query data가 아직 없을 때(로딩 중) 쓰는 안정적인 빈 배열 — `data ?? []`처럼 매 렌더
// 새 배열을 만들면 그 값을 의존성으로 쓰는 effect가 로딩 중에 계속 재실행돼버림
const EMPTY_CCTVS: Cctv[] = [];
const EMPTY_LIGHTS: IoTLight[] = [];
const EMPTY_GRID_CELLS: FloorGridCell[] = [];
const EMPTY_USER_ZONES: UserZoneWithCells[] = [];

interface UseFloorDataParams {
  buildingId: string | undefined;
  floorId: string | undefined;
}

// 층 편집 화면의 서버 데이터 — 조회(상세·그래프·그리드·장비·구역)와 파생 값, 쿼리 캐시 갱신 헬퍼
export const useFloorData = ({ buildingId, floorId }: UseFloorDataParams) => {
  const queryClient = useQueryClient();
  const { show } = useToast();

  const { data: floorGridCells = EMPTY_GRID_CELLS } = useFloorGridCellsQuery(floorId);

  // 층 상세·맵그래프 — AI 분석이 끝날 때까지 폴링
  const { floorDetailQuery, floor, isFloorReady, graphData, markAwaitingUploadAnalysis } =
    useFloorAnalysisPolling(buildingId, floorId);

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

  const {
    routeDiagnosisQuery,
    isDiagnosisHighlighted,
    toggleDiagnosisHighlight,
    routeDiagnosisHighlight,
    invalidateFloorRouteDiagnosis,
  } = useRouteDiagnosisHighlight(floorId, isFloorReady);

  const updateGraphCache = (updater: (prev: FloorGraph) => FloorGraph) => {
    queryClient.setQueryData<FloorGraph>(floorQueryKeys.graph(floorId), (prev) =>
      updater(prev ?? { nodes: [], edges: [] }),
    );
  };

  const { data: iotLights = EMPTY_LIGHTS } = useFloorLightsQuery(floorId);

  const { data: realCctvs = EMPTY_CCTVS } = useFloorCctvsQuery(floorId);

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

  // 문/계단 등 구조 노드가 아닌 나머지 그래프 노드 — graphData(위 graphQuery)에서 조회 전용으로만 씀
  const graphNodes = useMemo(
    () => graphData.nodes.filter((n) => !API_TYPE_TO_STRUCTURE[n.type]),
    [graphData],
  );

  const graphEdges = graphData.edges;

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

  const gridCellPxSize = useMemo(
    () => getGridCellPxSize(floorGridCells, canvasH),
    [floorGridCells, canvasH],
  );

  return {
    floorGridCells,
    floorDetailQuery,
    floor,
    isFloorReady,
    graphData,
    markAwaitingUploadAnalysis,
    imageAspect,
    setImageAspect,
    canvasH,
    floorImageData,
    resolvedMapImageUrl,
    routeDiagnosisQuery,
    isDiagnosisHighlighted,
    toggleDiagnosisHighlight,
    routeDiagnosisHighlight,
    invalidateFloorRouteDiagnosis,
    updateGraphCache,
    iotLights,
    realCctvs,
    userZones,
    zones,
    selectedBuildingId,
    selectedFloorId,
    buildingsForName,
    buildingFloors,
    graphNodes,
    graphEdges,
    patchCctvCache,
    patchLightCache,
    runLightFollowups,
    updateZonesCache,
    updateFloorCache,
    currentBuildingName,
    currentBuilding,
    currentFloor,
    resolvedFloor,
    gridCellPxSize,
  };
};

export type FloorData = ReturnType<typeof useFloorData>;
