import { useCallback, useEffect, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { extractApiError } from '@apis/errors/apiError';
import { floorQueryKeys } from '@apis/floors/floorQueries';

import useToast from '@components/toast/useToast';

import { getFloorGridCells, setFloorGrid } from '../api/floorGridApi';
import { analyzeFloor, uploadFloor } from '../api/floorPlansApi';
import { rememberPendingGridSize } from '../utils/gridStorage';

import type { Floor } from '../types/floorPlans';

interface UseFloorUploadParams {
  buildingId: string | undefined;
  floorId: string | undefined;
  currentFloor: Floor | null;
  selectedBuildingId: string;
  editingLocked: boolean;
  resetFloorScopedState: () => void;
  markAwaitingUploadAnalysis: () => void;
}

// 도면 업로드 흐름 — 파일 선택 → 실측 크기·셀 크기 입력 → 업로드 후 AI 분석 요청
export const useFloorUpload = ({
  buildingId,
  floorId,
  currentFloor,
  selectedBuildingId,
  editingLocked,
  resetFloorScopedState,
  markAwaitingUploadAnalysis,
}: UseFloorUploadParams) => {
  const queryClient = useQueryClient();
  const { show } = useToast();

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
        // 방금 업로드→분석을 걸었으니, mapImageKey가 한두 사이클 비어 와도 상세 폴링이 끊기지 않게 함
        markAwaitingUploadAnalysis();
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
  const openUploadModal = () => setUploadModalOpen(true);
  const closeUploadModal = () => setUploadModalOpen(false);

  // 훈련 시작(편집 잠금) 시 열려 있던 업로드 흐름을 닫고 미리보기 URL도 정리
  const resetUpload = useCallback(() => {
    setUploadModalOpen(false);
    setPendingUpload((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  }, []);

  return {
    uploadModalOpen,
    openUploadModal,
    closeUploadModal,
    pendingUpload,
    isReuploading,
    handleFileSelected,
    handleCloseUploadDimensionsModal,
    handleUploadDimensionsConfirm,
    resetUpload,
  };
};
