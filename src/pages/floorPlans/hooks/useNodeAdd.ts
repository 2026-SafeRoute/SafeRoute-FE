import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { extractApiError } from '@apis/errors/apiError';
import { floorQueryKeys } from '@apis/floors/floorQueries';

import useToast from '@components/toast/useToast';

import { CANVAS_W, getGridCellPxSize } from '@utils/floorCanvas';

import { createCctv } from '../api/cctvApi';
import { getFloorGridCells, setFloorGrid } from '../api/floorGridApi';
import { createIoTLight } from '../api/iotLightsApi';
import { createMapNode } from '../api/mapGraphApi';
import { DEVICE_PLACE_CONFIG } from '../constants/devicePlacement';
import { EMPTY_LIGHT_GUIDANCE_FIELDS } from '../constants/floorEditor';
import { isStructureNodeType, STRUCTURE_NODE_API_TYPE } from '../constants/structureNode';
import { cellIdsIntersectingRect } from '../utils/cellIdsIntersectingRect';
import {
  GRID_SIZE_KEY,
  PENDING_GRID_SIZE_KEY,
  readStoredNumber,
  rememberGridSize,
} from '../utils/gridStorage';

import type { FloorData } from './useFloorData';
import type { Cctv } from '../api/cctvApi';
import type { FloorGridCell } from '../api/floorGridApi';
import type { IoTLight } from '../api/iotLightsApi';
import type { LightAddFields } from '../components/popups/NodeAddPopup';
import type { AddedDevice, PlacingDeviceType } from '../constants/devicePlacement';
import type { StructureNode } from '../constants/structureNode';
import type { ZoneRect } from '../types/canvasSelection';
import type { Floor } from '../types/floorPlans';
import type { LightPickTarget } from '../utils/lightPick';

interface UseNodeAddParams {
  floorId: string | undefined;
  currentFloor: Floor | null;
  canvasH: number;
  floorGridCells: FloorGridCell[];
  realCctvs: Cctv[];
  structureNodes: StructureNode[];
  addedDevices: AddedDevice[];
  cctvDraftCellIds: string[];
  setCctvDraftCellIds: Dispatch<SetStateAction<string[]>>;
  setZoneAddOpen: Dispatch<SetStateAction<boolean>>;
  setZoneDraftRect: (rect: ZoneRect | null) => void;
  setLightPickTarget: Dispatch<SetStateAction<LightPickTarget | null>>;
  updateGraphCache: FloorData['updateGraphCache'];
  invalidateFloorRouteDiagnosis: FloorData['invalidateFloorRouteDiagnosis'];
  runLightFollowups: FloorData['runLightFollowups'];
}

// 노드(장비·구조 노드) 추가 흐름 — 위치 지정, CCTV 시야 지정과 그 전 단계인 그리드 설정까지
export const useNodeAdd = ({
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
}: UseNodeAddParams) => {
  const queryClient = useQueryClient();
  const { show } = useToast();

  // CCTV 등록 시 그리드 배율이 서버에서 사라져있어(CCTV006) 재적용 후 재시도할 때, 방금 사용자가
  // 드래그한 영역을 다시 그리게 하지 않고 같은 영역으로 셀을 재계산하기 위해 rect를 별도로 들고
  // 있음 — cctvDraftCellIds는 재적용 전 그리드의 셀 id라 그대로 재사용할 수 없음(그리드 재적용 시
  // 셀이 새로 생성되어 id가 바뀜). 등록 성공뿐 아니라 새 CCTV 시야 선택을 다시 시작할 때·층을
  // 바꿀 때도 비워야 함 — 안 그러면 취소 후 클릭만으로 새 영역을 고른 다음 CCTV006이 나면
  // 재시도가 엉뚱한(예전) 드래그 영역을 그대로 써버림(코드래빗 리뷰로 발견)
  const lastCctvDraftRectRef = useRef<ZoneRect | null>(null);
  const [nodeAddOpen, setNodeAddOpen] = useState(false);
  const [nodeAddType, setNodeAddType] = useState<PlacingDeviceType>('cctv');

  // 유도등 추가 팝업의 갈림길 위치·좌우 통로 값 — 드롭다운뿐 아니라 캔버스 클릭으로도 채울 수
  // 있어야 해서(도면에서 직접 고르는 대안) 팝업 로컬 state가 아니라 여기서 관리함. 담당 CCTV는
  // 캔버스에서 고를 대상이 아니라 계속 팝업 로컬 state(lightCctvId)로 남아있음
  const [nodeAddLightFields, setNodeAddLightFields] = useState(EMPTY_LIGHT_GUIDANCE_FIELDS);
  const [nodeAddStage, setNodeAddStage] = useState<'entry' | 'fov'>('entry');

  // 그리드 설정 팝업은 CCTV 등록·구역 추가 흐름에서 공유해서 사용 —
  // 확인 버튼을 눌렀을 때 어느 쪽으로 돌아가야 하는지 구분하기 위한 값
  const [gridSetupPromptOpen, setGridSetupPromptOpen] = useState(false);
  const [gridSetupIntent, setGridSetupIntent] = useState<'cctv' | 'zone' | null>(null);
  const [gridSizeCmInput, setGridSizeCmInput] = useState('100');

  const [nodeStagedPosition, setNodeStagedPosition] = useState<{ x: number; y: number } | null>(
    null,
  );

  // 장비 추가 팝업이 닫히면 배치 진행 상태 초기화
  useEffect(() => {
    if (!nodeAddOpen) {
      setNodeAddStage('entry');
      setNodeStagedPosition(null);
      setZoneDraftRect(null);
    }
  }, [nodeAddOpen, setZoneDraftRect]);

  // 장치 배치 모드 — 정보 입력과 같은 단계에서 클릭으로 위치 지정. 다시 클릭하면 위치를 옮길 수 있음
  // (CCTV 시야 구역 드래그 단계에서는 클릭이 다른 용도이므로 위치를 덮어쓰지 않음)
  const handleMapClick = (x: number, y: number) => {
    if (!nodeAddOpen || nodeAddStage !== 'entry') return;
    setNodeStagedPosition({ x: (x / CANVAS_W) * 100, y: (y / canvasH) * 100 });
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
    setNodeAddLightFields(EMPTY_LIGHT_GUIDANCE_FIELDS);
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
  const handleCancelNodeAdd = useCallback(() => {
    setNodeAddOpen(false);
    lastCctvDraftRectRef.current = null;
    setNodeAddLightFields(EMPTY_LIGHT_GUIDANCE_FIELDS);
    setLightPickTarget((prev) => (prev?.source === 'add' ? null : prev));
  }, [setLightPickTarget]);

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

  // 툴바 "+ 추가" 메뉴·훈련 준비 체크리스트가 같이 쓰는 진입점 — 다른 배치 모드를 정리하고 엶.
  // presetType을 주면 노드 종류 칩까지 미리 골라둠(예: 체크리스트의 "시작 노드 지정하기")
  const handleOpenNodeAdd = (presetType?: PlacingDeviceType) => {
    setZoneAddOpen(false);
    if (presetType) setNodeAddType(presetType);
    setNodeAddOpen(true);
    // 새로 여는 등록 흐름은 이전 시도의 드래그 영역과 무관해야 함
    lastCctvDraftRectRef.current = null;
  };

  return {
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
    finalizeNodePlacement,
    ensureFloorGridCells,
    openGridSetupPrompt,
    handleSubmitNodeEntry,
    handleNodeAddBack,
    handleCancelNodeAdd,
    handleGridSetupPromptCancel,
    handleGridSetupPromptConfirm,
    handleFinalizeFov,
    handleOpenNodeAdd,
  };
};
