import type { ReactNode } from 'react';

import FileTextIcon from '@assets/icons/ic-filetext.svg?react';

import { Button } from '@components/Button';
import StatusBadge from '@components/chip/StatusBadge';
import EmptyState from '@components/empty';

import * as styles from './RecentTrainingSection.css';
import { HOME_GRADE_BADGE_COLOR, HOME_RECENT_TRAINING_TABLE_HEADERS } from '../../constants/home';

import type { TrainingRecord } from '../../types/home';

type RecentTrainingSectionProps = {
  records: TrainingRecord[];
  actionIcon: ReactNode;
  onViewAll: () => void;
  onOpenReport: (reportId: string) => void;
};

const RecentTrainingSection = ({
  records,
  actionIcon,
  onViewAll,
  onOpenReport,
}: RecentTrainingSectionProps) => (
  <section className={styles.recordsSection}>
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>최근 훈련 기록</h2>

      <Button
        type="button"
        variant="outlined"
        size="sm"
        rightIcon={actionIcon}
        className={styles.headerActionButton}
        onClick={onViewAll}
      >
        전체 보기
      </Button>
    </div>

    {records.length > 0 ? (
      <div className={styles.tableScroll}>
        <table className={styles.recordsTable}>
          <thead>
            <tr>
              {HOME_RECENT_TRAINING_TABLE_HEADERS.map((header) => (
                <th key={header} className={styles.tableHeadCell}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const reportId = record.reportId;

              return (
                <tr key={record.id} className={styles.tableRow({ interactive: Boolean(reportId) })}>
                  <td className={styles.tableCell({ tone: 'emphasis' })}>
                    {reportId ? (
                      <button
                        type="button"
                        className={styles.reportButton}
                        aria-label={`${record.name} 분석 보고서 보기`}
                        onClick={() => onOpenReport(reportId)}
                      >
                        {record.name}
                      </button>
                    ) : (
                      record.name
                    )}
                  </td>
                  <td className={styles.tableCell({ tone: 'date' })}>{record.date}</td>
                  <td className={styles.tableCell()}>{record.participants}</td>
                  <td className={styles.tableCell({ tone: 'emphasis' })}>
                    {record.evacuationTime}
                  </td>
                  <td className={styles.tableCell()}>{record.survivalRate}</td>
                  <td className={styles.tableCell()}>
                    <StatusBadge
                      label={record.grade}
                      color={HOME_GRADE_BADGE_COLOR[record.grade] ?? 'neutral'}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <EmptyState
        className={styles.emptyState}
        icon={<FileTextIcon />}
        title="아직 훈련 기록이 없습니다."
        description="훈련을 완료하면 결과가 이곳에 표시됩니다."
      />
    )}
  </section>
);

export default RecentTrainingSection;
