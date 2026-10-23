import { useEffect, useMemo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import type { PreviewMetric, RoutePoint } from '@pages/scenarioSettings/types/scenarioSettings';

import type { FloorGridCell } from '@apis/floors/floorGridApi';
import {
  buildingFloorsQueryOptions,
  floorCctvsQueryOptions,
  floorGraphQueryOptions,
  floorGridQueryOptions,
  floorImageQueryOptions,
  floorLightsQueryOptions,
  useBuildingFloorsQuery,
  useFloorCctvsQuery,
  useFloorGraphQuery,
  useFloorGridCellsQuery,
  useFloorImageUrlQuery,
  useFloorLightsQuery,
} from '@apis/floors/floorQueries';
import type { FloorGraph } from '@apis/floors/mapGraphApi';
import {
  useGetScenarioEvacuationSetupQuery,
  useSetEvacuationSetupMutation,
} from '@apis/scenarios/evacuationSetupQueries';
import { useScenarioFireZonesQuery } from '@apis/scenarios/fireZoneQueries';

import { formatFloor } from '@utils/floor';

interface UseScenarioFloorViewParams {
  scenarioId?: string;
  buildingId: string;
  enabled: boolean;
  isRunning: boolean;
  routeFloorId?: string | null;
  routePoints: readonly RoutePoint[];
}

export interface ScenarioFloorMapView {
  imageUrl?: string | null;
  graph?: FloorGraph | null;
  gridCells: readonly FloorGridCell[];
  routePoints: readonly RoutePoint[];
  fireCellIds: readonly string[];
  selectedFireCellId?: string | null;
  selectedStartNodeId?: string | null;
  originCellId?: string | null;
  hasStartCandidates: boolean;
  statusMessage?: string;
}

interface MetricValueParams {
  count?: number;
  suffix: string;
  isPending: boolean;
  isUnavailable: boolean;
}

const getMetricValue = ({ count, suffix, isPending, isUnavailable }: MetricValueParams) => {
  if (isPending) return '불러오는 중...';
  if (isUnavailable || count === undefined) return '정보 없음';
  return `${count}${suffix}`;
};

const getDisplayedFloorId = ({
  routeFloorId,
  configuredFloorId,
  selectedFloorId,
  fallbackFloorId,
  isSelectedFloorAvailable,
}: {
  routeFloorId?: string | null;
  configuredFloorId?: string;
  selectedFloorId: string | null;
  fallbackFloorId?: string;
  isSelectedFloorAvailable: boolean;
}) => {
  if (routeFloorId) return routeFloorId;
  if (configuredFloorId) return configuredFloorId;
  if (isSelectedFloorAvailable && selectedFloorId) return selectedFloorId;
  return fallbackFloorId;
};

// 시나리오 대피 설정에 필요한 층·도면·그래프·격자와 선택 상태를 관리
export const useScenarioFloorView = ({
  scenarioId,
  buildingId,
  enabled,
  isRunning,
  routeFloorId,
  routePoints,
}: UseScenarioFloorViewParams) => {
  const queryClient = useQueryClient();
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedFireCellId, setSelectedFireCellId] = useState<string | null>(null);
  const [selectedStartNodeId, setSelectedStartNodeId] = useState<string | null>(null);

  // 기본 정보 작성 중 첫 도면 데이터 prefetch
  useEffect(() => {
    if (enabled || !buildingId) return;

    let isCancelled = false;
    const floorsQueryOptions = buildingFloorsQueryOptions(buildingId);
    void queryClient
      .prefetchQuery(floorsQueryOptions)
      .then(async () => {
        if (isCancelled) return;

        const floors = queryClient.getQueryData(floorsQueryOptions.queryKey) ?? [];
        const defaultFloor = floors.find(
          (floor) => floor.segmentationStatus === 'DONE' && Boolean(floor.mapImageKey),
        );
        if (!defaultFloor) return;

        const imageQueryOptions = floorImageQueryOptions(buildingId, defaultFloor.id);
        const imagePrefetch = queryClient.prefetchQuery(imageQueryOptions).then(() => {
          if (isCancelled) return;
          const imageData = queryClient.getQueryData(imageQueryOptions.queryKey);
          if (!imageData?.imageUrl) return;

          const floorImage = new Image();
          floorImage.src = imageData.imageUrl;
        });

        await Promise.allSettled([
          imagePrefetch,
          queryClient.prefetchQuery(floorGraphQueryOptions(defaultFloor.id)),
          queryClient.prefetchQuery(floorGridQueryOptions(defaultFloor.id)),
          queryClient.prefetchQuery(floorCctvsQueryOptions(defaultFloor.id)),
          queryClient.prefetchQuery(floorLightsQueryOptions(defaultFloor.id)),
        ]);
      })
      .catch(() => undefined);

    return () => {
      isCancelled = true;
    };
  }, [buildingId, enabled, queryClient]);

  const floorsQuery = useBuildingFloorsQuery(buildingId, enabled);
  const setupQuery = useGetScenarioEvacuationSetupQuery(scenarioId, enabled);
  const setupMutation = useSetEvacuationSetupMutation();
  const fireZonesQuery = useScenarioFireZonesQuery(scenarioId, isRunning);
  const setup = setupQuery.data;
  const isSetupPending = enabled && Boolean(scenarioId) && setupQuery.isPending;
  const isConfigured = Boolean(
    setup?.configuredAt && setup.floorId && setup.fireOrigin?.gridCellId && setup.startNode?.nodeId,
  );

  const floors = floorsQuery.data ?? [];
  const selectableFloors = floors.filter(
    (floor) => floor.segmentationStatus === 'DONE' && Boolean(floor.mapImageKey),
  );
  const isSelectedFloorAvailable = selectableFloors.some((floor) => floor.id === selectedFloorId);
  const fallbackFloorId = selectableFloors[0]?.id;
  const floorId = getDisplayedFloorId({
    routeFloorId,
    configuredFloorId: setup?.floorId,
    selectedFloorId,
    fallbackFloorId,
    isSelectedFloorAvailable,
  });

  const floorImageQuery = useFloorImageUrlQuery(buildingId, floorId, enabled);
  const floorGraphQuery = useFloorGraphQuery(floorId, enabled);
  const floorGridQuery = useFloorGridCellsQuery(floorId, enabled);
  const floorCctvsQuery = useFloorCctvsQuery(floorId, enabled);
  const floorLightsQuery = useFloorLightsQuery(floorId, enabled);
  // START 타입 노드(레거시)뿐 아니라, DOOR 등을 시작 후보로 지정한 isStartCandidate도
  // 같이 인정해야 함(BE PR #225) — type만 보면 다 걸러져서 "START 후보 없음"으로 보였음
  const startNodes = useMemo(
    () =>
      floorGraphQuery.data?.nodes.filter(
        (node) => node.type === 'START' || node.isStartCandidate,
      ) ?? [],
    [floorGraphQuery.data],
  );
  const hasSelectedFireCell = Boolean(
    floorGridQuery.data?.some((cell) => cell.id === selectedFireCellId && cell.walkable),
  );
  const hasSelectedStartNode = startNodes.some((node) => node.id === selectedStartNodeId);

  const chooseFloor = (nextFloorId: string) => {
    setSelectedFloorId(nextFloorId);
    setSelectedFireCellId(null);
    setSelectedStartNodeId(null);
  };

  const chooseFireCell = (cellId: string) => {
    const cell = floorGridQuery.data?.find((candidate) => candidate.id === cellId);
    if (!cell?.walkable) return;
    setSelectedFireCellId((current) => (current === cellId ? null : cellId));
  };

  const chooseStartNode = (nodeId: string) => {
    if (!startNodes.some((node) => node.id === nodeId)) return;
    setSelectedStartNodeId((current) => (current === nodeId ? null : nodeId));
  };

  const saveEvacuationSetup = async () => {
    if (
      !scenarioId ||
      !selectedFireCellId ||
      !selectedStartNodeId ||
      !hasSelectedFireCell ||
      !hasSelectedStartNode
    ) {
      throw new Error('발화 위치와 시작 지점을 모두 선택해 주세요.');
    }

    return setupMutation.mutateAsync({
      scenarioId,
      fireOriginGridCellId: selectedFireCellId,
      startNodeId: selectedStartNodeId,
    });
  };

  const isFloorVisualPending =
    Boolean(floorId) &&
    (floorImageQuery.isPending || floorGraphQuery.isPending || floorGridQuery.isPending);
  let statusMessage: string | undefined;
  if (!buildingId) {
    statusMessage = '대상 건물을 먼저 선택해 주세요.';
  } else if (floorsQuery.isPending || isSetupPending) {
    statusMessage = '도면 정보를 불러오는 중...';
  } else if (floorsQuery.isError || setupQuery.isError) {
    statusMessage = '도면 또는 대피 설정을 불러오지 못했습니다.';
  } else if (!floorId) {
    statusMessage = '사용할 수 있는 도면이 없습니다.';
  } else if (isFloorVisualPending) {
    statusMessage = '도면을 불러오는 중...';
  } else if (floorImageQuery.isError || floorGraphQuery.isError || floorGridQuery.isError) {
    statusMessage = '도면 데이터를 불러오지 못했습니다.';
  } else if (floorGridQuery.data?.length === 0) {
    statusMessage = '등록된 격자 정보가 없습니다.';
  }

  const metricPending =
    Boolean(floorId) && (floorCctvsQuery.isPending || floorLightsQuery.isPending);
  const previewMetrics: PreviewMetric[] = [
    {
      id: 'cctv',
      label: '감지 CCTV',
      value: getMetricValue({
        count: floorCctvsQuery.data?.length,
        suffix: '대',
        isPending: metricPending,
        isUnavailable: !floorId || floorCctvsQuery.isError,
      }),
    },
    {
      id: 'iot',
      label: '활성 IoT 유도등',
      value: getMetricValue({
        count: floorLightsQuery.data?.filter((light) => light.enabled && light.guidanceConfigured)
          .length,
        suffix: '개',
        isPending: metricPending,
        isUnavailable: !floorId || floorLightsQuery.isError,
      }),
    },
  ];

  const persistedOriginCellId = setup?.floorId === floorId ? setup?.fireOrigin?.gridCellId : null;
  const persistedStartNodeId = setup?.floorId === floorId ? setup?.startNode?.nodeId : null;
  const runningFireCellIds = (fireZonesQuery.data ?? [])
    .filter((zone) => zone.floorId === floorId)
    .map((zone) => zone.gridCellId);
  const fireCellIds = isRunning ? runningFireCellIds : [];

  return {
    floorMap: {
      imageUrl: floorImageQuery.data?.imageUrl,
      graph: floorGraphQuery.data,
      gridCells: floorGridQuery.data ?? [],
      routePoints,
      fireCellIds,
      selectedFireCellId,
      selectedStartNodeId,
      originCellId: persistedOriginCellId,
      hasStartCandidates: startNodes.length > 0,
      statusMessage,
    } satisfies ScenarioFloorMapView,
    floorOptions: selectableFloors.map((floor) => ({
      label: formatFloor(floor.floorNum),
      value: floor.id,
    })),
    selectedFloorId: floorId ?? '',
    persistedStartNodeId,
    isConfigured,
    canSaveSetup: hasSelectedFireCell && hasSelectedStartNode && !statusMessage,
    isSetupPending,
    isSetupError: setupQuery.isError,
    isSavingSetup: setupMutation.isPending,
    previewMetrics,
    chooseFloor,
    chooseFireCell,
    chooseStartNode,
    saveEvacuationSetup,
  };
};
