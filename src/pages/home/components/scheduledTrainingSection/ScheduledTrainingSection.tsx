import type { ReactNode } from 'react';

import type { ScheduledTraining } from '@pages/home/types/home';

import { SCENARIO_STATUS } from '@apis/scenarios/scenarioTypes';
import { TRAINING_SESSION_STATUS } from '@apis/trainingSessions/trainingSessionConstants';

import { Button } from '@components/Button';

import useElapsedTrainingTime from '@hooks/useElapsedTrainingTime';

import * as styles from './ScheduledTrainingSection.css';

interface ScheduledTrainingSectionProps {
  training: ScheduledTraining | null;
  onAction: () => void;
  isLoading?: boolean;
  sectionIcon?: ReactNode;
  actionIcon: ReactNode;
}

const ScheduledTrainingSection = ({
  training,
  onAction,
  isLoading = false,
  sectionIcon,
  actionIcon,
}: ScheduledTrainingSectionProps) => {
  const isInProgress = training?.status === TRAINING_SESSION_STATUS.RUNNING;
  const needsPreparation = training?.status === SCENARIO_STATUS.READY;
  const startedAt = isInProgress && training?.startedAt ? Date.parse(training.startedAt) : null;
  const elapsedTime = useElapsedTrainingTime(
    startedAt !== null && !Number.isNaN(startedAt) ? startedAt : null,
  );
  const sectionTitle = isInProgress ? '훈련 진행 중' : '예정된 훈련';
  const timeLabel = isInProgress ? '진행 시간' : '일시';
  const timeValue = isInProgress
    ? elapsedTime
    : `${training?.date ?? '-'} ${training?.time ?? '-'}`;

  return (
    <section className={styles.scheduledCard}>
      <div className={styles.sectionTitleRow}>
        {sectionIcon ? <span className={styles.titleIcon}>{sectionIcon}</span> : null}
        <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
      </div>

      <div className={styles.scheduleInfoPanel}>
        {training ? (
          <>
            <p className={styles.subtleLabel}>
              {needsPreparation ? '시나리오 준비완료' : '훈련 시나리오'}
            </p>
            <p className={styles.schedulePlace}>{training.name}</p>

            <div className={styles.scheduleMetaGrid}>
              <div className={styles.scheduleMetaItem}>
                <span className={styles.metaLabel}>건물</span>
                <span className={styles.metaValue}>{training.building}</span>
              </div>
              <div className={styles.scheduleMetaItem}>
                <span className={styles.metaLabel}>{timeLabel}</span>
                <span className={styles.metaValue}>{timeValue}</span>
              </div>
              <div className={styles.scheduleMetaItem}>
                <span className={styles.metaLabel}>참가</span>
                <span className={styles.metaValue}>{training.participants}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className={styles.subtleLabel}>훈련 일정</p>
            <p className={styles.schedulePlace}>등록된 훈련이 없습니다</p>
          </>
        )}
      </div>

      {training && (
        <Button
          type="button"
          size="lg"
          fullWidth
          className={styles.scheduleButton}
          leftIcon={needsPreparation ? undefined : actionIcon}
          onClick={onAction}
          isLoading={isLoading}
        >
          {needsPreparation ? '훈련 준비하기' : isInProgress ? '모니터링 보기' : '훈련 시작'}
        </Button>
      )}
    </section>
  );
};

export default ScheduledTrainingSection;
