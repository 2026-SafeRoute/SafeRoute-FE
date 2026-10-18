import { sideCardTitle } from '@pages/scenarioSettings/ScenarioSettingsPage.css';
import type { PreviewMetric, PreviewStatus } from '@pages/scenarioSettings/types/scenarioSettings';

import StatusBadge from '@components/chip/StatusBadge';

import * as styles from './TrainingPreviewCard.css';

interface TrainingPreviewCardProps {
  title?: string;
  status: PreviewStatus;
  metrics: PreviewMetric[];
  diagnosisMetrics?: PreviewMetric[];
  description?: string;
  warning?: {
    message: string;
    linkLabel: string;
    onLinkClick: () => void;
  };
}

const TrainingPreviewCard = ({
  title = '훈련 미리보기',
  status,
  metrics,
  diagnosisMetrics = [],
  description,
  warning,
}: TrainingPreviewCardProps) => (
  <section className={styles.card}>
    <div className={styles.header}>
      <h2 className={sideCardTitle}>{title}</h2>
      <StatusBadge label={status.label} color={status.color} dot={status.dot} />
    </div>

    <div className={styles.metricList}>
      {metrics.map((metric) => (
        <div key={metric.id} className={styles.metricRow}>
          <span className={styles.metricLabel}>{metric.label}</span>
          <span className={styles.metricValue({ tone: metric.tone ?? 'default' })}>
            {metric.value}
          </span>
        </div>
      ))}

      {diagnosisMetrics.length > 0 && <div className={styles.divider} />}

      {diagnosisMetrics.map((metric) => (
        <div key={metric.id} className={styles.metricRow}>
          <span className={styles.metricLabel}>{metric.label}</span>
          <span className={styles.metricValue({ tone: metric.tone ?? 'default' })}>
            {metric.value}
          </span>
        </div>
      ))}
    </div>

    {warning && (
      <div className={styles.warningBox}>
        <p>{warning.message}</p>
        <button type="button" className={styles.warningLink} onClick={warning.onLinkClick}>
          {warning.linkLabel} ›
        </button>
      </div>
    )}

    {description && <p className={styles.description}>{description}</p>}
  </section>
);

export default TrainingPreviewCard;
