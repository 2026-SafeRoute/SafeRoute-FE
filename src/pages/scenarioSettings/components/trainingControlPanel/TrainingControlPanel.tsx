import RecommendationCard from '@pages/scenarioSettings/components/cards/recommendationCard/RecommendationCard';
import TrainingPreviewCard from '@pages/scenarioSettings/components/cards/trainingPreviewCard/TrainingPreviewCard';
import { LIVE_STATUS } from '@pages/scenarioSettings/constants/scenarioSettings';
import { sideColumn } from '@pages/scenarioSettings/ScenarioSettingsPage.css';
import type { PreviewMetric } from '@pages/scenarioSettings/types/scenarioSettings';

import { MAX_TRAINING_DURATION_MS } from '@apis/trainingSessions/trainingSessionConstants';

import PauseIcon from '@assets/icons/ic-pause.svg?react';
import SparklesIcon from '@assets/icons/ic-sparkles.svg?react';

import { Button } from '@components/Button';

import useElapsedTrainingTime from '@hooks/useElapsedTrainingTime';

import * as styles from './TrainingControlPanel.css';

interface RouteProposal {
  status: 'PENDING' | 'CANCELLED';
  message: string;
  previousRoute: string;
  candidateRoute: string;
}

interface RouteDecision {
  proposal: RouteProposal | null;
  isApplying: boolean;
  isRejecting: boolean;
  onReject: () => void;
  onApply: () => void;
}

interface TrainingControlPanelProps {
  startedAt: number;
  timerStoppedAt: number | null;
  currentRoute: string;
  liveMetrics: PreviewMetric[];
  isEnding: boolean;
  isForceEnding: boolean;
  onEnd: () => void;
  onForceEnd: () => void;
  routeDecision: RouteDecision;
}

const TrainingControlPanel = ({
  startedAt,
  timerStoppedAt,
  currentRoute,
  liveMetrics,
  isEnding,
  isForceEnding,
  onEnd,
  onForceEnd,
  routeDecision,
}: TrainingControlPanelProps) => {
  const elapsedTime = useElapsedTrainingTime(startedAt, timerStoppedAt);
  const isAwaitingServerEnd =
    timerStoppedAt === null && Date.now() >= startedAt + MAX_TRAINING_DURATION_MS;
  const { proposal, isApplying, isRejecting, onReject, onApply } = routeDecision;
  const isPending = isApplying || isRejecting;
  const isExpired = proposal?.status === 'CANCELLED';

  return (
    <aside className={sideColumn}>
      <div className={styles.trainingActions}>
        <Button
          type="button"
          variant="danger"
          size="lg"
          fullWidth
          leftIcon={<PauseIcon />}
          onClick={onEnd}
          isLoading={isEnding}
          disabled={isForceEnding}
        >
          종료
        </Button>
        <button
          type="button"
          className={styles.forceEndLink}
          onClick={onForceEnd}
          disabled={isEnding || isForceEnding}
        >
          {isForceEnding ? '중단 중...' : '훈련 강제 종료'}
        </button>
      </div>

      <div className={styles.elapsedTimer}>
        <span className={styles.timerLabel}>
          <span className={styles.dangerDot} aria-hidden="true" />
          훈련 진행 시간
        </span>
        <strong className={styles.timerValue}>{elapsedTime}</strong>
      </div>
      <p className={styles.durationNotice} role={isAwaitingServerEnd ? 'status' : undefined}>
        {isAwaitingServerEnd
          ? '10분 경과 · 서버 종료 상태를 확인 중입니다.'
          : '훈련은 최대 10분이며, 종료까지 잠시 걸릴 수 있습니다.'}
      </p>

      <RecommendationCard icon={<SparklesIcon />} title="현재 경로" message={currentRoute} />

      {proposal && (
        <section className={styles.proposalCard({ expired: isExpired })}>
          <div className={styles.proposalHeader}>
            <h2 className={styles.proposalTitle}>
              {!isExpired && <span className={styles.warningDot} aria-hidden="true" />}
              경로 변경 제안
            </h2>
            {isExpired && <span className={styles.expiredBadge}>만료됨</span>}
          </div>
          {isExpired ? (
            <div className={styles.expiredReason}>
              <span className={styles.expiredReasonLabel}>만료 이유</span>
              <p className={styles.expiredReasonMessage}>{proposal.message}</p>
            </div>
          ) : (
            <>
              <p className={styles.proposalMessage}>{proposal.message}</p>
              <dl className={styles.routeComparison}>
                <div>
                  <dt>기존</dt>
                  <dd>{proposal.previousRoute}</dd>
                </div>
                <div>
                  <dt>제안</dt>
                  <dd>{proposal.candidateRoute}</dd>
                </div>
              </dl>
              <div className={styles.proposalActions}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onReject}
                  disabled={isPending}
                  isLoading={isRejecting}
                >
                  거부
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={onApply}
                  disabled={isPending}
                  isLoading={isApplying}
                >
                  승인 및 경로 적용
                </Button>
              </div>
            </>
          )}
        </section>
      )}

      <TrainingPreviewCard title="등록된 도면 상태" status={LIVE_STATUS} metrics={liveMetrics} />

      <div className={styles.lockNotice}>
        🔒 훈련 진행 중에는 도면의 노드·구역 편집이 제한됩니다
      </div>
    </aside>
  );
};

export default TrainingControlPanel;
