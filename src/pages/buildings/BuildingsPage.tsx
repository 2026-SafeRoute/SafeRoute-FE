import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import type {
  CreateBuildingRequest,
  UpdateBuildingRequest,
} from '@apis/__generated__/data-contracts';
import { buildingQueryKeys } from '@apis/buildings/buildingQueryKeys';
import type { Building } from '@apis/buildings/buildingTypes';
import { useGetBuildingsQuery } from '@apis/buildings/useBuildingsQuery';
import { extractApiError } from '@apis/errors/apiError';
import { useMyProfileQuery } from '@apis/users/useMyProfileQuery';

import BuildingIcon from '@assets/icons/ic-building.svg?react';
import PlusIcon from '@assets/icons/ic-plus.svg?react';

import { Button } from '@components/Button';
import EmptyState from '@components/empty';
import LoadingState from '@components/loadingState';
import useToast from '@components/toast/useToast';

import { useCreateBuildingMutation } from './api/useCreateBuildingMutation';
import { useDeleteBuildingMutation } from './api/useDeleteBuildingMutation';
import { useUpdateBuildingMutation } from './api/useUpdateBuildingMutation';
import * as styles from './BuildingsPage.css';
import BuildingCard from './components/BuildingCard/BuildingCard';
import OrganizationCard from './components/OrganizationCard/OrganizationCard';
import BuildingAddModal from './modals/BuildingAddModal';
import BuildingDeleteModal from './modals/BuildingDeleteModal';
import BuildingEditModal from './modals/BuildingEditModal';
import FloorSyncWarningModal from './modals/FloorSyncWarningModal';
import { applyFloorSync, createInitialFloors, planFloorSync } from './utils/floorSync';

import type { FloorCounts, FloorSyncPlan } from './utils/floorSync';

type ModalState =
  | { type: 'add' }
  | { type: 'edit'; building: Building }
  | { type: 'delete'; building: Building }
  | null;

// 실패 원인을 토스트에도 보여줘서, 재현했을 때 개발자도구 없이도 바로 원인을 알 수 있게 함
// (request.ts는 HTTP 에러 상태코드가 오면 실제 서버 메시지 대신 고정 문구로 덮어써서 콘솔에도 안 남으므로,
// 여기서는 서버 응답의 원본 code·message를 공용 헬퍼로 직접 꺼내 진짜 서버 메시지를 보여줌)
const describeError = (error: unknown): string => {
  const { code, message } = extractApiError(error);
  if (message) return `${message}${code ? ` (${code})` : ''}`;
  // 서버 응답 바디가 없는 4xx/5xx는 extractApiError가 code/message를 둘 다 빈 문자열로
  // 돌려주므로, 그때만 HTTP 상태코드라도 보여줘서 "알 수 없는 오류"보다 단서를 남김
  if (isAxiosError(error) && error.response?.status)
    return `알 수 없는 오류 (HTTP ${error.response.status})`;
  return '알 수 없는 오류';
};

interface FloorSyncTarget {
  buildingId: string;
  buildingName: string;
  body: UpdateBuildingRequest;
  plan: FloorSyncPlan;
}

const BuildingsPage = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useGetBuildingsQuery();
  const { data: myProfile } = useMyProfileQuery();
  const createBuildingMutation = useCreateBuildingMutation();
  const updateBuildingMutation = useUpdateBuildingMutation();
  const deleteBuildingMutation = useDeleteBuildingMutation();
  const buildings = data ?? [];
  const [modal, setModal] = useState<ModalState>(null);
  const [floorSyncTarget, setFloorSyncTarget] = useState<FloorSyncTarget | null>(null);
  const [isPlanningFloorSync, setIsPlanningFloorSync] = useState(false);
  const [isApplyingFloorSync, setIsApplyingFloorSync] = useState(false);
  const { show } = useToast();

  // 건물 층수 동기화 워크어라운드(createInitialFloors/applyFloorSync) 실패를 콘솔+토스트로 알림
  const reportFloorSyncFailure = (tag: string, title: string) => (error: unknown) => {
    if (import.meta.env.DEV) console.error(tag, error);
    show({ title, description: describeError(error), variant: 'error' });
  };

  const handleAdd = () => setModal({ type: 'add' });
  const handleEdit = (building: Building) => setModal({ type: 'edit', building });
  const handleDelete = (building: Building) => setModal({ type: 'delete', building });

  // 건물 층수는 서버가 groundFloorCount+basementFloorCount로 계산하는 읽기 전용 값이라
  // 등록 요청에는 안 실려있음 — 등록 직후 지상/지하 층을 도면관리 쪽에 직접 생성해서 반영함
  const handleConfirmAdd = (body: CreateBuildingRequest, floorCounts: FloorCounts) => {
    createBuildingMutation.mutate(body, {
      onSuccess: (newBuilding) => {
        setModal(null);
        show({
          title: '건물이 추가되었습니다.',
          description: `${body.name}이(가) 등록되었습니다.`,
          variant: 'success',
        });
        createInitialFloors(newBuilding.id, floorCounts)
          // totalFloors는 서버가 floors 개수로 계산하는 값이라, 층 생성이 끝난 뒤에야
          // 목록 쿼리를 다시 불러와야 최신 층수가 카드에 반영됨
          .then(() => queryClient.invalidateQueries({ queryKey: buildingQueryKeys.lists() }))
          .catch(reportFloorSyncFailure('[createInitialFloors]', '층 목록 생성에 실패했습니다.'));
      },
      onError: () => {
        show({ title: '건물 추가에 실패했습니다.', variant: 'error' });
      },
    });
  };

  // 건물 수정 + 층 동기화가 하나의 서버 트랜잭션이 아니라 별개 요청 두 개라, applyFloorSync 도중
  // 일부만 실패하면 totalFloors와 실제 floors 목록이 어긋날 수 있음 — 백엔드에 트랜잭션 처리 요청해둔 상태
  // (scratchpad/backend_questions.md #8), 서버 쪽 cascade가 나오면 이 워크어라운드는 제거 예정
  const runBuildingUpdate = (
    buildingId: string,
    body: UpdateBuildingRequest,
    plan: FloorSyncPlan,
  ) => {
    updateBuildingMutation.mutate(
      { buildingId, body },
      {
        onSuccess: () => {
          setModal(null);
          setFloorSyncTarget(null);
          setIsApplyingFloorSync(false);
          show({
            title: '건물 정보가 수정되었습니다.',
            description: `${body.name} 정보가 업데이트되었습니다.`,
            variant: 'success',
          });
          applyFloorSync(plan)
            .then(() => queryClient.invalidateQueries({ queryKey: buildingQueryKeys.lists() }))
            .catch(reportFloorSyncFailure('[applyFloorSync]', '층 목록 동기화에 실패했습니다.'));
        },
        onError: () => {
          setIsApplyingFloorSync(false);
          show({ title: '건물 수정에 실패했습니다.', variant: 'error' });
        },
      },
    );
  };

  // 층수를 줄이는 경우 기존 층에 도면 데이터가 있으면 먼저 경고 모달을 띄움
  const handleConfirmEdit = (body: UpdateBuildingRequest, floorCounts: FloorCounts) => {
    if (modal?.type !== 'edit') return;
    const { building } = modal;
    setIsPlanningFloorSync(true);
    planFloorSync(building.id, floorCounts)
      .then((plan) => {
        setIsPlanningFloorSync(false);
        if (plan.hasDataLoss) {
          setModal(null);
          setFloorSyncTarget({ buildingId: building.id, buildingName: building.name, body, plan });
          return;
        }
        runBuildingUpdate(building.id, body, plan);
      })
      .catch(() => {
        setIsPlanningFloorSync(false);
        show({ title: '층 정보를 확인하지 못했습니다.', variant: 'error' });
      });
  };

  const handleConfirmFloorSyncWarning = () => {
    if (!floorSyncTarget) return;
    setIsApplyingFloorSync(true);
    runBuildingUpdate(floorSyncTarget.buildingId, floorSyncTarget.body, floorSyncTarget.plan);
  };

  const handleConfirmDelete = () => {
    if (modal?.type !== 'delete') return;
    const { building } = modal;
    deleteBuildingMutation.mutate(building.id, {
      onSuccess: () => {
        setModal(null);
        show({
          title: '건물이 삭제되었습니다.',
          description: `${building.name}이(가) 삭제되었습니다.`,
          variant: 'default',
        });
      },
      onError: () => {
        show({ title: '건물 삭제에 실패했습니다.', variant: 'error' });
      },
    });
  };

  const handleCloseModal = () => setModal(null);

  return (
    <>
      <div className={styles.container}>
        <OrganizationCard
          schoolName={myProfile?.schoolName ?? ''}
          buildingCount={buildings.length}
        />

        <div className={styles.listHeader}>
          <span className={styles.listCount}>총 {buildings.length}개 건물</span>
          <Button onClick={handleAdd}>
            <PlusIcon width={16} height={16} />
            건물 추가
          </Button>
        </div>

        {isLoading && <LoadingState />}

        {isError && (
          <EmptyState
            className={styles.emptyState}
            icon={<BuildingIcon />}
            title="건물 목록을 불러오지 못했습니다."
            action={
              <Button type="button" variant="ghost" onClick={() => void refetch()}>
                다시 시도
              </Button>
            }
          />
        )}

        {!isLoading && !isError && buildings.length === 0 && (
          <EmptyState
            className={styles.emptyState}
            icon={<BuildingIcon />}
            title="아직 등록된 건물이 없습니다."
            description="건물을 추가하면 층별 도면과 장비를 관리할 수 있습니다."
          />
        )}

        {!isLoading && !isError && buildings.length > 0 && (
          <div className={styles.grid}>
            {buildings.map((building) => (
              <BuildingCard
                key={building.id}
                building={building}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {modal?.type === 'add' && (
        <BuildingAddModal
          open
          onClose={handleCloseModal}
          onConfirm={handleConfirmAdd}
          isSubmitting={createBuildingMutation.isPending}
        />
      )}

      {modal?.type === 'edit' && (
        <BuildingEditModal
          open
          onClose={handleCloseModal}
          building={modal.building}
          onConfirm={handleConfirmEdit}
          isSubmitting={isPlanningFloorSync || updateBuildingMutation.isPending}
        />
      )}

      {modal?.type === 'delete' && (
        <BuildingDeleteModal
          open
          onClose={handleCloseModal}
          building={modal.building}
          onConfirm={handleConfirmDelete}
          isSubmitting={deleteBuildingMutation.isPending}
        />
      )}

      {floorSyncTarget && (
        <FloorSyncWarningModal
          open
          onClose={() => setFloorSyncTarget(null)}
          buildingName={floorSyncTarget.buildingName}
          floorsToDelete={floorSyncTarget.plan.toDeleteFloors}
          onConfirm={handleConfirmFloorSyncWarning}
          isSubmitting={isApplyingFloorSync}
        />
      )}
    </>
  );
};

export default BuildingsPage;
