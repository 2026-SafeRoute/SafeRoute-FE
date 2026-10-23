import { SCENARIO_STATUS_VIEW } from '@pages/scenarioSettings/types/scenarioList';
import { formatScenarioScheduledAt } from '@pages/scenarioSettings/utils/scenarioSettings';

import type { Scenario } from '@apis/scenarios/scenarioTypes';

import FileTextIcon from '@assets/icons/ic-filetext.svg?react';
import TrashIcon from '@assets/icons/ic-trash.svg?react';

import { Button } from '@components/Button';
import StatusBadge from '@components/chip/StatusBadge';
import Tooltip from '@components/tooltip/Tooltip';

import * as styles from './ScenarioListRow.css';

interface ScenarioListRowProps {
  scenario: Scenario;
  buildingName?: string;
  onOpen: (scenario: Scenario) => void;
  onOpenReport: (reportId: string) => void;
  onDelete: (scenario: Scenario) => void;
}

const DELETE_DISABLED_MESSAGE = '훈련 이력이 있어 삭제할 수 없습니다';

const ScenarioListRow = ({
  scenario,
  buildingName,
  onOpen,
  onOpenReport,
  onDelete,
}: ScenarioListRowProps) => {
  const statusView = SCENARIO_STATUS_VIEW[scenario.status];
  const scenarioName = scenario.name ?? '이름 없는 시나리오';
  const deleteButton = (
    <Button
      type="button"
      variant={scenario.deletable ? 'dangerOutlined' : 'ghost'}
      size="sm"
      iconOnly
      aria-disabled={scenario.deletable ? undefined : true}
      className={scenario.deletable ? styles.deleteButton : styles.disabledDeleteButton}
      aria-label={`${scenarioName} 삭제`}
      onClick={() => {
        if (!scenario.deletable) return;
        onDelete(scenario);
      }}
    >
      <TrashIcon />
    </Button>
  );

  return (
    <article className={styles.row}>
      <button type="button" className={styles.mainButton} onClick={() => onOpen(scenario)}>
        <span className={styles.titleRow}>
          <strong className={styles.title}>{scenarioName}</strong>
          <StatusBadge label={statusView.label} color={statusView.color} dot />
        </span>
        <span className={styles.detail}>
          {buildingName ?? '건물 정보 없음'} · {formatScenarioScheduledAt(scenario.scheduledAt)} ·
          예상 {scenario.expectedParticipants ? `${scenario.expectedParticipants}명` : '인원 미정'}
        </span>
      </button>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="outlined"
          size="sm"
          iconOnly
          disabled={!scenario.reportId}
          className={styles.reportButton}
          aria-label={`${scenarioName} 보고서`}
          onClick={() => {
            if (!scenario.reportId) return;
            onOpenReport(scenario.reportId);
          }}
        >
          <FileTextIcon />
        </Button>
        {scenario.deletable ? (
          deleteButton
        ) : (
          <Tooltip content={DELETE_DISABLED_MESSAGE}>{deleteButton}</Tooltip>
        )}
      </div>
    </article>
  );
};

export default ScenarioListRow;
