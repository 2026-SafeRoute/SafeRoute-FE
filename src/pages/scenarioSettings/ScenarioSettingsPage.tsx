import { useEffect, useState } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router';

import type { GenerateReportRequest } from '@apis/__generated__/data-contracts';
import { useGetBuildingsQuery } from '@apis/buildings/useBuildingsQuery';
import { extractApiError } from '@apis/errors/apiError';
import { useGenerateTrainingReportMutation } from '@apis/reports/useReports';
import { SCENARIO_STATUS } from '@apis/scenarios/scenarioTypes';
import type { Scenario } from '@apis/scenarios/scenarioTypes';
import {
  useCreateScenarioDraftMutation,
  useReadyScenarioMutation,
  useUpdateScenarioMutation,
} from '@apis/scenarios/useScenarioMutations';
import { useGetScenarioQuery } from '@apis/scenarios/useScenariosQuery';
import { useMyProfileQuery } from '@apis/users/useMyProfileQuery';

import EmptyState from '@components/empty';
import LoadingState from '@components/loadingState';
import useToast from '@components/toast/useToast';

import { ROUTES, getReportPath, getScenarioDetailPath } from '@constants/path';

import ScenarioActionPanel from './components/scenarioActionPanel/ScenarioActionPanel';
import ScenarioSetupForm from './components/scenarioSetupForm/ScenarioSetupForm';
import TrainingControlPanel from './components/trainingControlPanel/TrainingControlPanel';
import TrainingEndModal from './components/trainingEndModal/TrainingEndModal';
import TrainingForceEndModal from './components/trainingForceEndModal/TrainingForceEndModal';
import { useScenarioFloorView } from './hooks/useScenarioFloorView';
import { useScenarioForm } from './hooks/useScenarioForm';
import { useScenarioTraining } from './hooks/useScenarioTraining';
import * as styles from './ScenarioSettingsPage.css';

import type { ScenarioActionMode } from './components/scenarioActionPanel/ScenarioActionPanel';

interface ScenarioSettingsContentProps {
  scenario?: Scenario;
}

const getScenarioActionMode = (
  scenario: Scenario | undefined,
  isEditing: boolean,
): ScenarioActionMode => {
  if (!scenario) return 'create';
  if (scenario.status === SCENARIO_STATUS.DRAFT || isEditing) return 'edit';
  return 'start';
};

const getStartRestrictionMessage = ({
  scenario,
  isSetupPending,
  isSetupError,
  isConfigured,
  floorStatusMessage,
}: {
  scenario?: Scenario;
  isSetupPending: boolean;
  isSetupError: boolean;
  isConfigured: boolean;
  floorStatusMessage?: string;
}) => {
  if (
    scenario?.status === SCENARIO_STATUS.COMPLETED ||
    scenario?.status === SCENARIO_STATUS.ERROR ||
    scenario?.status === SCENARIO_STATUS.TIMEOUT_FAILED
  ) {
    return '완료되었거나 실패한 훈련은 다시 시작할 수 없습니다. 새 시나리오를 생성해 주세요.';
  }
  if (isSetupPending) return '발화 위치와 시작 지점 설정을 확인하고 있습니다.';
  if (isSetupError) return '대피 설정을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.';
  if (scenario?.status === SCENARIO_STATUS.READY && !isConfigured) {
    return '도면에서 발화 위치와 START 후보를 선택해 저장해 주세요.';
  }
  if (scenario?.status === SCENARIO_STATUS.READY && floorStatusMessage) {
    return floorStatusMessage;
  }
  return undefined;
};

const getActionErrorMessage = (error: unknown, fallback: string) => {
  const serverMessage = extractApiError(error).message;
  if (serverMessage) return serverMessage;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

// 시나리오 작성·대피 설정·훈련 제어의 순서를 조정하는 화면 컨테이너
const ScenarioSettingsContent = ({ scenario }: ScenarioSettingsContentProps) => {
  const navigate = useNavigate();
  const { state: navigationState } = useLocation();
  const { show } = useToast();

  // 폼 선택지와 세션 등록에 필요한 사용자·건물 정보
  const { data: buildings = [] } = useGetBuildingsQuery();
  const { data: currentUser } = useMyProfileQuery();

  // DRAFT 생성·수정·READY 전환 요청 상태
  const createDraftMutation = useCreateScenarioDraftMutation();
  const updateScenarioMutation = useUpdateScenarioMutation();
  const readyScenarioMutation = useReadyScenarioMutation();
  const generateTrainingReportMutation = useGenerateTrainingReportMutation();

  // 기본 정보 편집과 훈련 종료 모달은 독립적인 화면 상태
  const [isEditing, setIsEditing] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isForceEndModalOpen, setIsForceEndModalOpen] = useState(false);
  const [trainingTimerStoppedAt, setTrainingTimerStoppedAt] = useState<number | null>(null);
  const [hasEndedSession, setHasEndedSession] = useState(false);
  const [isTrainingCompleted, setIsTrainingCompleted] = useState(false);
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(null);

  const isCreatePage = scenario === undefined;
  const isDraft = scenario?.status === SCENARIO_STATUS.DRAFT;
  const isScenarioReady = scenario?.status === SCENARIO_STATUS.READY;
  const actionMode = getScenarioActionMode(scenario, isEditing);

  // 기본 정보 폼과 세션 생명주기를 각각 도메인 훅에서 관리
  const scenarioForm = useScenarioForm({ scenario, defaultBuildingId: buildings[0]?.id });
  const training = useScenarioTraining({ scenario, adminId: currentUser?.id });
  const buildingOptions = buildings.map((building) => ({
    label: building.name,
    value: building.id,
  }));

  // 선택 건물의 층·도면·START 후보·발화 격자와 저장된 대피 설정을 함께 조회
  const floorView = useScenarioFloorView({
    scenarioId: scenario?.id,
    buildingId: scenarioForm.selectedBuildingId,
    enabled: Boolean(scenario) && !isDraft,
    isRunning: training.isRunning,
    routeFloorId: training.route.routeFloorId,
    routePoints: training.route.routePoints,
  });

  const canStartTraining =
    isScenarioReady && floorView.isConfigured && !floorView.floorMap.statusMessage;
  const startRestrictionMessage = getStartRestrictionMessage({
    scenario,
    isSetupPending: floorView.isSetupPending,
    isSetupError: floorView.isSetupError,
    isConfigured: floorView.isConfigured,
    floorStatusMessage: floorView.floorMap.statusMessage,
  });
  const isCompleting =
    createDraftMutation.isPending ||
    updateScenarioMutation.isPending ||
    readyScenarioMutation.isPending ||
    training.isStarting;

  // 일부 값만 채운 새 시나리오도 DRAFT로 만들고, 기존 DRAFT는 PATCH로 갱신
  const handleSaveDraft = async () => {
    const payload = scenarioForm.getDraftPayload();

    try {
      if (!scenario) {
        const createdScenario = await createDraftMutation.mutateAsync(payload);
        show({ title: '임시 저장되었습니다.', variant: 'success' });
        void navigate(getScenarioDetailPath(createdScenario.id), { replace: true });
        return;
      }

      await updateScenarioMutation.mutateAsync({ scenarioId: scenario.id, body: payload });
      show({ title: '임시 저장되었습니다.', variant: 'success' });
    } catch {
      show({ title: '임시 저장에 실패했습니다.', variant: 'error' });
    }
  };

  // 필수값을 저장한 뒤 새 DRAFT 또는 기존 DRAFT를 READY로 전환
  const handleComplete = async () => {
    const payload = scenarioForm.getReadyPayload();
    if (!payload) {
      show({ title: '시나리오 정보를 모두 올바르게 입력해 주세요.', variant: 'error' });
      return;
    }

    try {
      const savedScenario = scenario
        ? await updateScenarioMutation.mutateAsync({ scenarioId: scenario.id, body: payload })
        : await createDraftMutation.mutateAsync(payload);
      const completedScenario =
        savedScenario.status === SCENARIO_STATUS.DRAFT
          ? await readyScenarioMutation.mutateAsync(savedScenario.id)
          : savedScenario;

      setIsEditing(false);
      show({
        title: isScenarioReady ? '변경 사항이 저장되었습니다.' : '작성이 완료되었습니다.',
        variant: 'success',
      });
      if (isCreatePage) {
        void navigate(getScenarioDetailPath(completedScenario.id), { replace: true });
      }
    } catch {
      show({ title: '시나리오 저장에 실패했습니다.', variant: 'error' });
    }
  };

  // 발화 셀과 START 후보를 한 번에 저장한 뒤 SCHEDULED 세션과 초기 경로를 준비
  const handleSaveEvacuationSetup = async () => {
    if (!scenario || !currentUser?.id) {
      show({ title: '사용자 정보를 불러온 후 다시 시도해 주세요.', variant: 'error' });
      return;
    }

    try {
      await floorView.saveEvacuationSetup();
      try {
        await training.ensureScheduledSession(scenario.id);
      } catch {
        show({
          title: '대피 설정은 저장됐지만 훈련 세션 준비에 실패했습니다.',
          description: '시나리오 시작 시 다시 시도할 수 있습니다.',
          variant: 'error',
        });
        return;
      }
      show({ title: '발화 위치와 시작 지점이 저장되었습니다.', variant: 'success' });
    } catch {
      show({ title: '발화 위치와 시작 지점 저장에 실패했습니다.', variant: 'error' });
    }
  };

  // 예약 세션을 재사용하거나 준비한 뒤 훈련 시작
  const handleStartTraining = async () => {
    if (training.areSessionsPending || !canStartTraining) return;
    if (!scenario || !currentUser?.id) {
      show({ title: '사용자 정보를 불러온 후 다시 시도해 주세요.', variant: 'error' });
      return;
    }

    try {
      await training.startTraining();
      show({ title: '훈련이 시작되었습니다.', variant: 'success' });
    } catch (error) {
      show({
        title: '훈련 시작에 실패했습니다.',
        description: getActionErrorMessage(error, '잠시 후 다시 시도해 주세요.'),
        variant: 'error',
      });
    }
  };

  const routedTimedOutSessionId =
    navigationState &&
    typeof navigationState === 'object' &&
    'timedOutSessionId' in navigationState &&
    typeof navigationState.timedOutSessionId === 'string'
      ? navigationState.timedOutSessionId
      : null;
  const timeLimitSessionId = training.timedOutSessionId ?? routedTimedOutSessionId;

  // 서버에서 시간 초과 종료가 확인된 경우에만 결과 입력 모달을 표시
  useEffect(() => {
    if (!timeLimitSessionId) return;
    setIsEndModalOpen(true);
    show({
      title: '최대 훈련 시간이 초과되었습니다.',
      description: '대피 완료 인원을 입력해 분석 보고서를 생성해 주세요.',
      variant: 'default',
    });
  }, [show, timeLimitSessionId]);

  useEffect(() => {
    if (training.endedAt === null) return;
    setTrainingTimerStoppedAt(training.endedAt);
    setIsForceEndModalOpen(false);
  }, [training.endedAt]);

  // 일반 오류는 시간 초과 결과 입력과 구분한다.
  useEffect(() => {
    if (scenario?.status !== SCENARIO_STATUS.ERROR) return;
    setTrainingTimerStoppedAt((stoppedAt) => stoppedAt ?? Date.now());
    setIsEndModalOpen(false);
    setIsForceEndModalOpen(false);
    show({ title: '오류로 인해 훈련이 종료되었습니다.', variant: 'error' });
  }, [scenario?.status, show]);

  // 페이지 내부 수신 또는 다른 페이지에서 전달된 실패 세션은 종료 API를 중복 호출하지 않음
  useEffect(() => {
    if (!timeLimitSessionId) return;
    setHasEndedSession(true);
  }, [timeLimitSessionId]);

  // 입력받은 결과로 훈련을 종료한 뒤 분석 보고서 생성
  const handleCompleteTraining = async (values: GenerateReportRequest) => {
    if (scenario?.status === SCENARIO_STATUS.ERROR) return;
    const sessionId = training.sessionId ?? timeLimitSessionId;
    if (!sessionId) return;
    let sessionEnded = hasEndedSession || Boolean(timeLimitSessionId);

    try {
      if (!sessionEnded) {
        const endStatus = await training.endTraining();
        if (endStatus === SCENARIO_STATUS.ERROR) return;
        sessionEnded = true;
        setHasEndedSession(true);
      }

      const report = await generateTrainingReportMutation.mutateAsync({
        sessionId,
        body: values,
      });
      if (!report.reportId) throw new Error('생성된 분석 보고서 ID가 없습니다.');

      setGeneratedReportId(report.reportId);
      setIsTrainingCompleted(true);
    } catch (error) {
      show({
        title: sessionEnded
          ? '분석 보고서 생성에 실패했습니다. 다시 시도해 주세요.'
          : getActionErrorMessage(error, '훈련 종료에 실패했습니다.'),
        variant: 'error',
      });
    }
  };

  const handleForceEndTraining = async () => {
    try {
      await training.forceEndTraining();
      setIsForceEndModalOpen(false);
      setIsEndModalOpen(false);
    } catch (error) {
      show({
        title: '훈련 중단에 실패했습니다.',
        description: getActionErrorMessage(error, '잠시 후 다시 시도해 주세요.'),
        variant: 'error',
      });
    }
  };

  const handleRejectRouteProposal = async () => {
    try {
      await training.route.rejectRouteProposal();
    } catch (error) {
      show({
        title: '경로 변경 제안 거부에 실패했습니다.',
        description: getActionErrorMessage(error, '잠시 후 다시 시도해 주세요.'),
        variant: 'error',
      });
    }
  };

  const handleApplyRouteProposal = async () => {
    try {
      await training.route.approveRouteProposal();
    } catch (error) {
      show({
        title: '경로 변경 제안 승인에 실패했습니다.',
        description: getActionErrorMessage(error, '잠시 후 다시 시도해 주세요.'),
        variant: 'error',
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentGrid}>
        <ScenarioSetupForm
          value={scenarioForm.value}
          buildingOptions={buildingOptions}
          floorMap={floorView.floorMap}
          mode={{
            isRunning: training.isRunning,
            readOnly: actionMode === 'start' && !training.isRunning,
            buildingReadOnly: floorView.isConfigured,
          }}
          handlers={{
            onBasicInfoChange: scenarioForm.handleBasicInfoChange,
            onFireSpreadChange: scenarioForm.handleFireSpreadChange,
          }}
          evacuationSetup={{
            floorOptions: floorView.floorOptions,
            selectedFloorId: floorView.selectedFloorId,
            persistedStartNodeId: floorView.persistedStartNodeId,
            editable: isScenarioReady,
            configured: floorView.isConfigured,
            canSave: floorView.canSaveSetup,
            isSaving: floorView.isSavingSetup || training.isScheduling,
            onFloorChange: floorView.chooseFloor,
            onFireCellSelect: floorView.chooseFireCell,
            onStartNodeSelect: floorView.chooseStartNode,
            onSave: () => void handleSaveEvacuationSetup(),
          }}
        />

        {training.isRunning && training.startedAt !== null ? (
          <TrainingControlPanel
            startedAt={training.startedAt}
            timerStoppedAt={trainingTimerStoppedAt}
            currentRoute={training.route.currentRouteMessage}
            liveMetrics={floorView.previewMetrics}
            isEnding={training.isEnding}
            isForceEnding={training.isForceEnding}
            onEnd={() => setIsEndModalOpen(true)}
            onForceEnd={() => setIsForceEndModalOpen(true)}
            routeDecision={{
              proposal: training.route.routeProposal,
              isApplying: training.route.isApplyingRouteProposal,
              isRejecting: training.route.isRejectingRouteProposal,
              onReject: () => void handleRejectRouteProposal(),
              onApply: () => void handleApplyRouteProposal(),
            }}
          />
        ) : (
          <ScenarioActionPanel
            mode={actionMode}
            isSavingDraft={createDraftMutation.isPending || updateScenarioMutation.isPending}
            isCompleting={isCompleting}
            showDraftSave={isCreatePage || isDraft}
            completeLabel={isScenarioReady ? '변경 저장' : '다음'}
            startState={{
              disabled:
                training.areSessionsPending ||
                floorView.isSetupPending ||
                floorView.isSetupError ||
                !canStartTraining,
              restrictionMessage: startRestrictionMessage,
              showPreview: canStartTraining,
              canEdit: isScenarioReady,
              metrics: floorView.previewMetrics,
            }}
            handlers={{
              onSaveDraft: () => void handleSaveDraft(),
              onComplete: () => void handleComplete(),
              onStart: () => void handleStartTraining(),
              onEdit: () => setIsEditing(true),
            }}
          />
        )}
      </div>

      <TrainingEndModal
        open={isEndModalOpen}
        completed={isTrainingCompleted}
        participantCount={scenario?.expectedParticipants ?? 0}
        isSubmitting={training.isEnding || generateTrainingReportMutation.isPending}
        canClose={!hasEndedSession && !timeLimitSessionId}
        onClose={() => {
          setTrainingTimerStoppedAt(null);
          setIsEndModalOpen(false);
        }}
        onSubmit={handleCompleteTraining}
        onHome={() => void navigate(ROUTES.HOME)}
        onReport={() => {
          if (!generatedReportId) return;
          void navigate(getReportPath(generatedReportId));
        }}
      />
      <TrainingForceEndModal
        open={isForceEndModalOpen}
        isSubmitting={training.isForceEnding}
        onClose={() => setIsForceEndModalOpen(false)}
        onConfirm={() => void handleForceEndTraining()}
      />
    </div>
  );
};

// 상세 조회 상태를 처리하고 검증된 시나리오만 콘텐츠에 전달
const ScenarioSettingsPage = () => {
  const { scenarioId } = useParams();
  const { data: scenario, isPending, isError } = useGetScenarioQuery(scenarioId);

  if (scenarioId && isPending) {
    return <LoadingState message="시나리오를 불러오는 중..." />;
  }

  if (scenarioId && (isError || !scenario)) {
    return <EmptyState className={styles.pageState} title="시나리오를 불러오지 못했습니다." />;
  }

  return <ScenarioSettingsContent key={scenarioId ?? 'new'} scenario={scenario} />;
};

export default ScenarioSettingsPage;
