import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { extractApiError } from '@apis/errors/apiError';
import { floorQueryKeys } from '@apis/floors/floorQueries';

import useToast from '@components/toast/useToast';

import {
  configureCctvGridCells,
  deleteCctv,
  disableCctv,
  enableCctv,
  updateCctv,
} from '../api/cctvApi';
import {
  deleteIoTLight,
  disableIoTLight,
  enableIoTLight,
  updateIoTLight,
} from '../api/iotLightsApi';
import { deleteMapNode } from '../api/mapGraphApi';
import { EMPTY_DEVICE_EDIT_FORM } from '../types/panelItem';

import type { FloorData } from './useFloorData';
import type { Cctv } from '../api/cctvApi';
import type { IoTLight } from '../api/iotLightsApi';
import type { AddedDevice } from '../constants/devicePlacement';
import type { SelectedItem, ZoneRefSelection } from '../types/canvasSelection';
import type { Floor } from '../types/floorPlans';
import type { DeviceEditForm, PanelItem } from '../types/panelItem';

interface UseDeviceEditingParams {
  floorId: string | undefined;
  floor: Floor | null;
  realCctvs: Cctv[];
  iotLights: IoTLight[];
  allPanelItems: PanelItem[];
  addedDevices: AddedDevice[];
  setAddedDevices: Dispatch<SetStateAction<AddedDevice[]>>;
  selectedItem: SelectedItem | null;
  setSelectedItem: Dispatch<SetStateAction<SelectedItem | null>>;
  setSelectedZoneRef: Dispatch<SetStateAction<ZoneRefSelection | null>>;
  editingCctvId: string | null;
  setEditingCctvId: Dispatch<SetStateAction<string | null>>;
  cctvDraftCellIds: string[];
  setCctvDraftCellIds: Dispatch<SetStateAction<string[]>>;
  setEditingStructureId: Dispatch<SetStateAction<string | null>>;
  setEditingZoneId: Dispatch<SetStateAction<string | null>>;
  zoneAddOpen: boolean;
  setZoneAddOpen: Dispatch<SetStateAction<boolean>>;
  setNodeAddOpen: Dispatch<SetStateAction<boolean>>;
  setEdgeAddOpen: Dispatch<SetStateAction<boolean>>;
  updateGraphCache: FloorData['updateGraphCache'];
  updateFloorCache: FloorData['updateFloorCache'];
  patchCctvCache: FloorData['patchCctvCache'];
  patchLightCache: FloorData['patchLightCache'];
  runLightFollowups: FloorData['runLightFollowups'];
}

// CCTV·유도등 카드 — 선택, 이름·위치·경로 수정, 감시 영역 재선택, 활성화, 삭제
export const useDeviceEditing = ({
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
}: UseDeviceEditingParams) => {
  const queryClient = useQueryClient();
  const { show } = useToast();

  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<PanelItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DeviceEditForm>(EMPTY_DEVICE_EDIT_FORM);

  const [devicePositions, setDevicePositions] = useState<Record<string, { x: number; y: number }>>(
    {},
  );

  // devicePositions는 드래그 중 화면에 즉시 반영하기 위한 임시 오버레이 — 실제 저장은
  // "완료"를 눌렀을 때(handleSaveEdit)만 일어나고, 그 전까지는 이 값만 갱신됨. 수정 모드를
  // 벗어나면(완료든 취소든) 렌더링 쪽에서 이 오버레이를 무시하고 원래 좌표로 되돌아감
  const handleDeviceMoved = (id: string, x: number, y: number) => {
    setDevicePositions((prev) => ({ ...prev, [id]: { x, y } }));
  };

  // 수정 세션이 끝나거나 새로 시작할 때 스테이징해둔 드래그 좌표를 버림
  const clearDevicePosition = (id: string) => {
    setDevicePositions((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
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

  const handleCancelEditCctvCells = useCallback(() => {
    setEditingCctvId(null);
    setCctvDraftCellIds([]);
  }, [setCctvDraftCellIds, setEditingCctvId]);

  const handleSaveEditCctvCells = () => {
    if (!editingCctvId || cctvDraftCellIds.length === 0) return;
    configureCctvGridCells(editingCctvId, cctvDraftCellIds)
      .then((updated) => {
        // addedDevices의 zone(감시 영역 문구)은 realCctvs 동기화 effect가 알아서 다시 채움
        patchCctvCache(updated);
        setEditingCctvId(null);
        setCctvDraftCellIds([]);
      })
      .catch((error: unknown) => {
        // 실패해도 재선택 모드는 그대로 두어 다시 저장할 수 있게 하고, 이유만 알림
        const { message: serverMessage } = extractApiError(error);
        show({ title: serverMessage || '감시 영역 저장에 실패했습니다.', variant: 'error' });
      });
  };

  const handleAddedDeviceDelete = (id: string) => {
    setAddedDevices((prev) => prev.filter((d) => d.id !== id));
  };

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
    clearDevicePosition(item.id);
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
        })
          // 성공 응답을 유도등 캐시에도 반영 — 안 하면 이후 동기화 때 이전 이름·위치로 되돌아감
          .then(patchLightCache)
          .catch((error: unknown) => {
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
    clearDevicePosition(item.id);
  };

  // "취소" — 이름·가이던스 등 입력한 값은 그냥 버림. 위치도 저장 안 하고 나가면 렌더링
  // 쪽에서 editingItemId가 이 항목이 아닐 때 devicePositions 오버레이를 무시하게 돼있어
  // 자동으로 원래 좌표로 되돌아감(추가로 지워서 다음 수정 세션도 깨끗하게 시작하게 함)
  const handleCancelEdit = (item: PanelItem) => {
    if (editingCctvId === item.id) handleCancelEditCctvCells();
    setEditingItemId(null);
    clearDevicePosition(item.id);
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

  return {
    deleteConfirmTarget,
    setDeleteConfirmTarget,
    isDeletingItem,
    setIsDeletingItem,
    editingItemId,
    setEditingItemId,
    editForm,
    setEditForm,
    devicePositions,
    setDevicePositions,
    handleDeviceMoved,
    clearDevicePosition,
    handleToggleEnabled,
    handleStartEditCctvCells,
    handleCancelEditCctvCells,
    handleSaveEditCctvCells,
    handleAddedDeviceDelete,
    editingPanelItem,
    editingLight,
    isDeviceEditFormDirty,
    isPanelItemSelected,
    handlePanelItemSelect,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handlePanelItemDelete,
    handleDeleteConfirm,
  };
};
