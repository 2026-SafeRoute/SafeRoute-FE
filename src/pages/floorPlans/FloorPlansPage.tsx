import { useCallback, useEffect, useMemo, useState } from 'react';

import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router';

import { extractApiError } from '@apis/errors/apiError';
import { TRAINING_SESSION_STATUS } from '@apis/trainingSessions/trainingSessionConstants';
import { useGetTrainingSessionsQuery } from '@apis/trainingSessions/useGetTrainingSessionsQuery';

import BuildingIcon from '@assets/icons/ic-building.svg?react';
import EyeIcon from '@assets/icons/ic-eye.svg?react';
import MapIcon from '@assets/icons/ic-map.svg?react';
import UploadIcon from '@assets/icons/ic-upload.svg?react';

import { Button } from '@components/Button';
import StatusBadge from '@components/chip/StatusBadge';
import type { StatusBadgeColor } from '@components/chip/StatusBadge';
import EmptyState from '@components/empty';
import LoadingState from '@components/loadingState';
import SegmentedProgressBar from '@components/progress/SegmentedProgressBar';
import Skeleton from '@components/skeleton/Skeleton';
import useToast from '@components/toast/useToast';

import { ROUTES } from '@constants/path';

import { formatFloor, hasFloorPlan } from '@utils/floor';

import { setFloorGrid } from './api/floorGridApi';
import { analyzeFloor, getFloorBuildings, uploadFloor } from './api/floorPlansApi';
import { useFloorReadinessQuery } from './api/useFloorReadinessQuery';
import * as styles from './FloorPlansPage.css';
import FloorReuploadConfirmModal from './modals/FloorReuploadConfirmModal';
import FloorUploadModal from './modals/FloorUploadModal';
import GridAreaSettingModal from './modals/GridAreaSettingModal';
import { rememberPendingGridSize } from './utils/gridStorage';

import type { FloorReadiness } from './api/useFloorReadinessQuery';
import type { FloorBuilding, SegmentationStatus } from './types/floorPlans';

const NONE_STATUS_BADGE: { label: string; color: StatusBadgeColor } = {
  label: '미등록',
  color: 'neutral',
};

const STATUS_CONFIG: Record<SegmentationStatus, { label: string; color: StatusBadgeColor }> = {
  PENDING: { label: '대기중', color: 'yellow' },
  PROCESSING: { label: '처리중', color: 'blue' },
  DONE: { label: '완료', color: 'green' },
  FAILED: { label: '실패', color: 'red' },
};

const AiStatusText = ({ status }: { status: SegmentationStatus | null }) => {
  if (status === 'DONE') return <span className={styles.metaValueDone}>완료</span>;
  if (status === 'PENDING') return <span className={styles.metaValuePending}>대기중</span>;
  if (status === 'PROCESSING') return <span className={styles.metaValuePending}>처리중</span>;
  if (status === 'FAILED') return <span className={styles.metaValueFailed}>실패</span>;
  return <span className={styles.metaValue}>—</span>;
};

interface ReadinessProgressProps {
  readiness: FloorReadiness;
}

// 항목별 내역(시작 노드·최종 탈출구·탈출 경로)은 상세보기에서 보여주고, 카드에서는 구간형
// 진행바로 "3개 중 몇 개 완료"만 한눈에 보여줌 — 3/3이면 완료와 같은 초록, 일부만 됐으면
// 진행중과 같은 주황, 하나도 안 됐으면 무채색(공용 컴포넌트: SegmentedProgressBar)
const ReadinessProgress = ({ readiness }: ReadinessProgressProps) => {
  // 카드마다 조회가 따로 돌아 완료 시점이 제각각이라, 로딩 중엔 빈 값(—) 대신 자리표시자를
  // 보여줘서 도착한 카드부터 하나씩 팝업하는 느낌 대신 "다 같이 준비 중"으로 보이게 함
  if (readiness.isLoading) {
    return <Skeleton width="4rem" height="0.5rem" className={styles.readinessProgressBar} />;
  }
  // 조회 자체가 실패한 경우 "0/3 미완료"처럼 보이면 실제로 요건이 하나도 없는 것과 헷갈림 —
  // 별도로 실패를 알려주고 0/3으로 단정하지 않음
  if (readiness.isError) {
    return (
      <span className={styles.metaValueFailed} title="등록 요건을 불러오지 못했어요">
        조회 실패
      </span>
    );
  }
  const doneCount = [
    readiness.hasStartNode,
    readiness.hasFinalExit,
    readiness.hasRouteToExit,
  ].filter(Boolean).length;
  const tone = doneCount === 3 ? 'done' : doneCount === 0 ? 'neutral' : 'progress';
  return (
    <SegmentedProgressBar
      total={3}
      completed={doneCount}
      tone={tone}
      className={styles.readinessProgressBar}
      aria-label={`등록 요건 ${doneCount}/3 완료`}
    />
  );
};

interface FloorSummary {
  id: string;
  floorNum: number;
  mapImageUrl: string | null;
  segmentationStatus: SegmentationStatus;
  processedAt: string | null;
}

interface UploadTarget {
  buildingId: string;
  buildingName: string;
  floorId: string;
  floorNum: number;
  isReupload: boolean;
}
interface FloorActionTarget {
  buildingId: string;
  buildingName: string;
  floor: FloorSummary;
}
interface PendingUpload {
  buildingId: string;
  buildingName: string;
  floorId: string;
  floorNum: number;
  file: File;
  previewUrl: string;
  isReupload: boolean;
}

interface FloorCardProps {
  floor: FloorSummary;
  buildingId: string;
  buildingName: string;
  editingLocked: boolean;
  editingLockHintId: string;
  onUpload: (target: UploadTarget) => void;
  onReupload: (target: FloorActionTarget) => void;
}

const FloorCard = ({
  floor,
  buildingId,
  buildingName,
  editingLocked,
  editingLockHintId,
  onUpload,
  onReupload,
}: FloorCardProps) => {
  const navigate = useNavigate();
  const isNone = !hasFloorPlan(floor);
  const { label, color } = isNone ? NONE_STATUS_BADGE : STATUS_CONFIG[floor.segmentationStatus];
  const isDone = floor.segmentationStatus === 'DONE';
  // AI 분석이 끝나야 노드를 등록할 수 있어서, 그 전 층은 그래프를 조회할 필요가 없음
  const readiness = useFloorReadinessQuery(floor.id, isDone);

  return (
    <div className={styles.floorCard}>
      <div className={styles.cardTop}>
        <div className={styles.cardIcon}>
          <MapIcon width={16} height={16} />
        </div>
        <StatusBadge label={label} color={color} />
      </div>

      <span className={styles.floorLabel}>{formatFloor(floor.floorNum)}</span>

      <div className={styles.divider} />

      <div className={styles.cardMeta}>
        <div className={styles.metaRow}>
          <span className={styles.metaKey}>AI 분석</span>
          <AiStatusText status={isNone ? null : floor.segmentationStatus} />
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaKey}>등록 요건</span>
          {isDone ? (
            <ReadinessProgress readiness={readiness} />
          ) : (
            <span className={styles.metaValue}>—</span>
          )}
        </div>
      </div>

      {isNone ? (
        <button
          type="button"
          className={styles.uploadButton}
          disabled={editingLocked}
          aria-describedby={editingLocked ? editingLockHintId : undefined}
          onClick={() =>
            onUpload({
              buildingId,
              buildingName,
              floorId: floor.id,
              floorNum: floor.floorNum,
              isReupload: false,
            })
          }
        >
          도면 업로드
        </button>
      ) : (
        <div className={styles.cardActionRow}>
          {isDone && (
            <button
              type="button"
              className={styles.detailButton}
              onClick={() => navigate(`/floorPlans/${buildingId}/${floor.id}`)}
            >
              <EyeIcon width={14} height={14} />
              상세보기
            </button>
          )}
          <button
            type="button"
            className={styles.reuploadButton}
            disabled={editingLocked}
            aria-describedby={editingLocked ? editingLockHintId : undefined}
            onClick={() => onReupload({ buildingId, buildingName, floor })}
          >
            <UploadIcon width={14} height={14} />
            재업로드
          </button>
        </div>
      )}
    </div>
  );
};

const FloorPlansPage = () => {
  const navigate = useNavigate();
  const { show } = useToast();
  const { data: runningSessions = [] } = useGetTrainingSessionsQuery(
    TRAINING_SESSION_STATUS.RUNNING,
  );
  const lockedBuildingIds = useMemo(
    () =>
      new Set(
        runningSessions.flatMap((session) => (session.buildingId ? [session.buildingId] : [])),
      ),
    [runningSessions],
  );
  const [buildings, setBuildings] = useState<FloorBuilding[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null);
  const [reuploadTarget, setReuploadTarget] = useState<FloorActionTarget | null>(null);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 미리보기 objectURL이 명시적으로 취소/제출되지 않고 화면을 벗어나는 경우(뒤로가기 등)를 대비한 안전망
  useEffect(() => {
    return () => {
      if (pendingUpload) URL.revokeObjectURL(pendingUpload.previewUrl);
    };
  }, [pendingUpload]);

  const loadFloorBuildings = useCallback(() => {
    setLoading(true);
    setHasLoadError(false);
    return getFloorBuildings()
      .then(setBuildings)
      .catch(() => {
        setHasLoadError(true);
        show({ title: '도면 목록을 불러오지 못했습니다.', variant: 'error' });
      })
      .finally(() => setLoading(false));
  }, [show]);

  useEffect(() => {
    void loadFloorBuildings();
  }, [loadFloorBuildings]);

  // 목록을 보고 있는 사이 훈련이 시작되면 열려 있던 업로드 흐름도 닫는다. 실제 요청 시점의
  // 경합은 서버 FLOOR004가 한 번 더 막는다.
  useEffect(() => {
    if (uploadTarget && lockedBuildingIds.has(uploadTarget.buildingId)) setUploadTarget(null);
    if (reuploadTarget && lockedBuildingIds.has(reuploadTarget.buildingId)) {
      setReuploadTarget(null);
    }
    setPendingUpload((current) => {
      if (!current || !lockedBuildingIds.has(current.buildingId)) return current;
      URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  }, [lockedBuildingIds, reuploadTarget, uploadTarget]);

  const handleOpenFloorUpload = (target: FloorActionTarget) => {
    setUploadTarget({
      buildingId: target.buildingId,
      buildingName: target.buildingName,
      floorId: target.floor.id,
      floorNum: target.floor.floorNum,
      isReupload: true,
    });
  };

  const handleReuploadConfirm = () => {
    if (reuploadTarget) handleOpenFloorUpload(reuploadTarget);
    setReuploadTarget(null);
  };

  // 파일 선택 단계 — 실제 업로드는 다음 단계(가로/세로 입력)에서 함께 이뤄짐
  const handleFileSelected = (file: File) => {
    if (!uploadTarget || lockedBuildingIds.has(uploadTarget.buildingId)) return;
    setPendingUpload({ ...uploadTarget, file, previewUrl: URL.createObjectURL(file) });
    setUploadTarget(null);
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
    if (!pendingUpload || isUploading || lockedBuildingIds.has(pendingUpload.buildingId)) return;
    const { buildingId, buildingName, floorNum, file, previewUrl, isReupload } = pendingUpload;
    setIsUploading(true);
    uploadFloor(buildingId, floorNum, file, params.realWidthM, params.realHeightM)
      .then(async (newFloor) => {
        // 그리드 배율을 지금 설정해도, 뒤이어 실행되는 AI 분석이 그리드 셀을 재생성하면서
        // cellSizeMeter가 사라지는 경우가 있음. 그래서 값을 남겨두고(새로고침에도 살아남음)
        // 상세 화면에서 분석 완료 후 한 번 더 PUT 하게 함 — pending으로 남기고 값 자체도
        // 기억해둬서 이후 CCTV 등록 때 사용자에게 다시 묻지 않게 함
        rememberPendingGridSize(newFloor.id, params.cellSizeCm);
        // 상세 화면의 1회성 그리드 조회가 빈 결과를 캐싱하지 않도록, 이동 전에 한 번은 설정 시도
        try {
          await setFloorGrid(newFloor.id, params.cellSizeCm);
        } catch {
          show({
            title: '그리드 설정에 실패했습니다. 분석 완료 후 자동으로 다시 시도합니다.',
            variant: 'warning',
          });
        }
        setBuildings((prev) =>
          prev.map((b) => {
            if (b.id !== buildingId) return b;
            const exists = b.floors.some((f) => f.floorNum === floorNum);
            return {
              ...b,
              floors: exists
                ? b.floors.map((f) => (f.floorNum === floorNum ? newFloor : f))
                : [...b.floors, newFloor],
            };
          }),
        );
        show({
          title: '도면이 업로드되었습니다.',
          description: `${buildingName} · ${formatFloor(floorNum)} AI 분석이 진행 중입니다.\n완료되면 상세 화면에 자동으로 반영됩니다.`,
          variant: 'success',
        });
        if (isReupload) {
          show({
            title: '도면 관련 설정을 다시 확인해 주세요.',
            description:
              'AI 분석 완료 후 유도등 안내 설정·담당 CCTV와 시나리오 시작 지점을 다시 설정해야 할 수 있습니다.',
            variant: 'warning',
            duration: 10000,
          });
        }
        URL.revokeObjectURL(previewUrl);
        setPendingUpload(null);
        setIsUploading(false);
        void navigate(`/floorPlans/${buildingId}/${newFloor.id}`);
        // 분석 요청은 서버에서 오래 걸려 타임아웃되거나(ECONNABORTED), 업로드가 이미 분석을
        // 트리거해 재요청이 5xx로 떨어질 수 있다. 어느 쪽이든 여기서 "실패"로 단정하지 않는다 —
        // 실제 진행 상태는 상세 화면이 폴링하며, 필요하면 그곳에서 재시도할 수 있다.
        analyzeFloor(newFloor.id).catch((error: unknown) => {
          const timedOut = isAxiosError(error) && error.code === 'ECONNABORTED';
          const serverMessage = extractApiError(error).message;
          show({
            title: timedOut
              ? 'AI 분석이 진행 중입니다. 상세 화면에서 완료 여부를 확인해주세요.'
              : serverMessage ||
                'AI 분석 상태는 상세 화면에서 확인할 수 있어요. 완료되지 않았다면 그곳에서 다시 시도해주세요.',
            variant: 'warning',
          });
        });
      })
      .catch((error: unknown) => {
        // 미리보기와 입력값을 유지해 모달을 닫지 않고 바로 재시도할 수 있게 함
        setIsUploading(false);
        const serverMessage = extractApiError(error).message;
        show({
          title: '업로드에 실패했습니다.',
          description: serverMessage || '다시 시도해주세요.',
          variant: 'error',
        });
      });
  };

  const hasFloors = buildings.some((building) => building.floors.length > 0);

  return (
    <>
      <div className={styles.container}>
        {loading && <LoadingState />}
        {!loading && hasLoadError ? (
          <EmptyState
            className={styles.emptyState}
            icon={<BuildingIcon />}
            title="도면 목록을 불러오지 못했습니다."
            action={
              <Button type="button" variant="ghost" onClick={() => void loadFloorBuildings()}>
                다시 시도
              </Button>
            }
          />
        ) : null}
        {!loading && !hasLoadError && !hasFloors ? (
          <EmptyState
            className={styles.emptyState}
            icon={<BuildingIcon />}
            title="등록된 도면이 없습니다."
            description="건물과 층 정보를 등록한 뒤 도면을 업로드해 주세요."
            action={
              <Button type="button" onClick={() => void navigate(ROUTES.BUILDINGS)}>
                건물 등록하러 가기
              </Button>
            }
          />
        ) : null}
        {!loading &&
          !hasLoadError &&
          hasFloors &&
          buildings.map((building) => (
            <section key={building.id} className={styles.buildingSection}>
              <div className={styles.buildingHeader}>
                <div className={styles.buildingDot} aria-hidden="true" />
                <span className={styles.buildingName}>{building.name}</span>
                <span className={styles.buildingCount}>{building.floors.length}개 층</span>
                {lockedBuildingIds.has(building.id) && (
                  <span id={`floor-edit-lock-${building.id}`} className={styles.editingLockBadge}>
                    훈련 진행 중 · 편집 잠금
                  </span>
                )}
              </div>

              <div className={styles.floorGrid}>
                {[...building.floors]
                  .sort((a, b) => a.floorNum - b.floorNum)
                  .map((floor) => (
                    <FloorCard
                      key={floor.id}
                      floor={floor}
                      buildingId={building.id}
                      buildingName={building.name}
                      editingLocked={lockedBuildingIds.has(building.id)}
                      editingLockHintId={`floor-edit-lock-${building.id}`}
                      onUpload={setUploadTarget}
                      onReupload={setReuploadTarget}
                    />
                  ))}
              </div>
            </section>
          ))}
      </div>

      {uploadTarget && (
        <FloorUploadModal
          open
          onClose={() => setUploadTarget(null)}
          buildingName={uploadTarget.buildingName}
          floorNum={uploadTarget.floorNum}
          onConfirm={handleFileSelected}
        />
      )}

      {reuploadTarget && (
        <FloorReuploadConfirmModal
          open
          onClose={() => setReuploadTarget(null)}
          buildingName={reuploadTarget.buildingName}
          floorNum={reuploadTarget.floor.floorNum}
          onConfirm={handleReuploadConfirm}
        />
      )}

      {pendingUpload && (
        <GridAreaSettingModal
          open
          onClose={handleCloseUploadDimensionsModal}
          mapImageUrl={pendingUpload.previewUrl}
          onConfirm={handleUploadDimensionsConfirm}
          isSubmitting={isUploading}
        />
      )}
    </>
  );
};

export default FloorPlansPage;
