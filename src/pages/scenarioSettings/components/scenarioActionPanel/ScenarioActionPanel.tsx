import TrainingPreviewCard from '@pages/scenarioSettings/components/cards/trainingPreviewCard/TrainingPreviewCard';
import {
  draftButton,
  sideColumn,
  startActionPanel,
  startRestrictionNotice,
  trainingDurationNotice,
} from '@pages/scenarioSettings/ScenarioSettingsPage.css';
import type { PreviewMetric, PreviewStatus } from '@pages/scenarioSettings/types/scenarioSettings';

import PlayIcon from '@assets/icons/ic-play.svg?react';

import { Button } from '@components/Button';

export type ScenarioActionMode = 'create' | 'edit' | 'start';

const START_RESTRICTION_ID = 'scenario-start-restriction';

interface ScenarioStartState {
  disabled: boolean;
  restrictionMessage?: string;
  showPreview: boolean;
  canEdit: boolean;
  metrics: PreviewMetric[];
  previewStatus: PreviewStatus;
  diagnosisMetrics: PreviewMetric[];
  previewDescription?: string;
  warningMessage?: string;
  floorPlanPath?: string;
}

interface ScenarioActionHandlers {
  onSaveDraft: () => void;
  onComplete: () => void;
  onStart: () => void;
  onEdit: () => void;
}

interface ScenarioActionPanelProps {
  mode: ScenarioActionMode;
  isSavingDraft: boolean;
  isCompleting: boolean;
  showDraftSave: boolean;
  completeLabel: string;
  startState: ScenarioStartState;
  handlers: ScenarioActionHandlers;
}

// 훈련 전 시나리오 상태에 맞는 생성·저장·시작 액션 표시
const ScenarioActionPanel = ({
  mode,
  isSavingDraft,
  isCompleting,
  showDraftSave,
  completeLabel,
  startState,
  handlers,
}: ScenarioActionPanelProps) => {
  if (mode === 'create' || mode === 'edit') {
    return (
      <aside className={sideColumn}>
        <Button
          type="button"
          size="lg"
          fullWidth
          isLoading={isCompleting}
          onClick={handlers.onComplete}
        >
          {completeLabel}
        </Button>
        {showDraftSave && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            fullWidth
            className={draftButton}
            isLoading={isSavingDraft}
            onClick={handlers.onSaveDraft}
          >
            {mode === 'create' ? '임시 저장' : '변경사항 임시 저장'}
          </Button>
        )}
      </aside>
    );
  }

  return (
    <aside className={startActionPanel}>
      <Button
        type="button"
        size="lg"
        fullWidth
        leftIcon={<PlayIcon />}
        disabled={startState.disabled}
        aria-describedby={startState.restrictionMessage ? START_RESTRICTION_ID : undefined}
        isLoading={isCompleting}
        onClick={handlers.onStart}
      >
        시나리오 시작
      </Button>

      <p className={trainingDurationNotice}>
        훈련은 최대 10분간 진행되며, 제한 시간 초과 시 종료됩니다.
      </p>

      {startState.restrictionMessage && (
        <p id={START_RESTRICTION_ID} className={startRestrictionNotice} role="status">
          {startState.restrictionMessage}
        </p>
      )}

      {startState.showPreview && (
        <TrainingPreviewCard
          status={startState.previewStatus}
          metrics={startState.metrics}
          diagnosisMetrics={startState.diagnosisMetrics}
          description={startState.previewDescription}
          warning={
            startState.warningMessage
              ? {
                  message: startState.warningMessage,
                  linkLabel: '도면 관리로 이동',
                  linkTo: startState.floorPlanPath,
                }
              : undefined
          }
        />
      )}

      {startState.canEdit && (
        <Button type="button" variant="ghost" size="md" fullWidth onClick={handlers.onEdit}>
          수정하기
        </Button>
      )}
    </aside>
  );
};

export default ScenarioActionPanel;
