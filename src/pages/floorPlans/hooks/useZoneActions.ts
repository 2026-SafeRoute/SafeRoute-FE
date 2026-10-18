import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { extractApiError } from '@apis/errors/apiError';

import useToast from '@components/toast/useToast';

import { createUserZone, deleteUserZone } from '../api/userZoneApi';

import type { FloorData } from './useFloorData';
import type { ZoneEntry, ZoneRefSelection } from '../types/canvasSelection';
import type { Floor } from '../types/floorPlans';

interface UseZoneActionsParams {
  currentFloor: Floor | null;
  zones: ZoneEntry[];
  zoneDraftCellIds: string[];
  setZoneDraftCellIds: Dispatch<SetStateAction<string[]>>;
  zoneResetTargetId: string | null;
  selectedZoneRef: ZoneRefSelection | null;
  setSelectedZoneRef: Dispatch<SetStateAction<ZoneRefSelection | null>>;
  setZoneAddOpen: Dispatch<SetStateAction<boolean>>;
  setEditingZoneId: Dispatch<SetStateAction<string | null>>;
  zoneDeleteTarget: ZoneEntry | null;
  setZoneDeleteTarget: Dispatch<SetStateAction<ZoneEntry | null>>;
  updateZonesCache: FloorData['updateZonesCache'];
}

// 구역 서버 반영 — 새 구역 추가, 칸 재설정(삭제 후 재생성·실패 시 복구), 삭제
export const useZoneActions = ({
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
}: UseZoneActionsParams) => {
  const { show } = useToast();

  const [isDeletingZone, setIsDeletingZone] = useState(false);

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

  return {
    isDeletingZone,
    setIsDeletingZone,
    handleAddZone,
    handleConfirmZoneReset,
    handleZoneDeleteConfirm,
  };
};
