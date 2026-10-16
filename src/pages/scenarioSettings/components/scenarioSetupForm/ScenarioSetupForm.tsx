import FireLocationGrid from '@pages/scenarioSettings/components/fireLocationGrid/FireLocationGrid';
import DateTimeField from '@pages/scenarioSettings/components/inputField/dateTimeField/DateTimeField';
import ScenarioField from '@pages/scenarioSettings/components/inputField/scenarioField/ScenarioField';
import type { ScenarioFieldOption } from '@pages/scenarioSettings/components/inputField/scenarioField/ScenarioField';
import {
  FIRE_SPREAD_OPTIONS,
  SCENARIO_NAME_MAX_LENGTH,
  SCENARIO_NAME_MIN_LENGTH,
} from '@pages/scenarioSettings/constants/scenarioSettings';
import type { ScenarioFloorMapView } from '@pages/scenarioSettings/hooks/useScenarioFloorView';
import * as pageStyles from '@pages/scenarioSettings/ScenarioSettingsPage.css';
import type { BasicInfo } from '@pages/scenarioSettings/types/scenarioSettings';

import UsersIcon from '@assets/icons/ic-multi-user.svg?react';

import { Button } from '@components/Button';
import TextField from '@components/inputField/TextField';

import * as styles from './ScenarioSetupForm.css';

interface ScenarioSetupValue {
  basicInfo: BasicInfo;
  fireSpreadLabel: string;
}

interface ScenarioSetupMode {
  isRunning: boolean;
  readOnly: boolean;
  buildingReadOnly: boolean;
}

interface ScenarioSetupHandlers {
  onBasicInfoChange: (key: keyof BasicInfo, value: string) => void;
  onFireSpreadChange: (value: string) => void;
}

interface EvacuationSetupControl {
  floorOptions: readonly ScenarioFieldOption[];
  selectedFloorId: string;
  persistedStartNodeId?: string | null;
  editable: boolean;
  configured: boolean;
  canSave: boolean;
  isSaving: boolean;
  onFloorChange: (floorId: string) => void;
  onFireCellSelect: (cellId: string) => void;
  onStartNodeSelect: (nodeId: string) => void;
  onSave: () => void;
}

interface ScenarioSetupFormProps {
  value: ScenarioSetupValue;
  buildingOptions: readonly ScenarioFieldOption[];
  floorMap: ScenarioFloorMapView;
  mode: ScenarioSetupMode;
  handlers: ScenarioSetupHandlers;
  evacuationSetup: EvacuationSetupControl;
}

const TRAINING_LOCK_MESSAGE = '🔒 잠금 · 훈련 중 수정 불가';

type SetupStepState = 'active' | 'blocked' | 'complete' | 'pending';

const getFireStepState = (hasFireLocation: boolean, isMapUnavailable: boolean): SetupStepState => {
  if (hasFireLocation) return 'complete';
  if (isMapUnavailable) return 'pending';
  return 'active';
};

const getFireStepDescription = (state: SetupStepState) => {
  if (state === 'complete') return '화재 시작 위치를 선택했습니다.';
  if (state === 'pending') return '도면 정보를 확인한 뒤 선택할 수 있습니다.';
  return '도면에서 화재가 시작될 보행 영역을 선택해 주세요.';
};

const getStartStepState = ({
  hasFireLocation,
  hasStartLocation,
  hasStartCandidates,
  isMapUnavailable,
}: {
  hasFireLocation: boolean;
  hasStartLocation: boolean;
  hasStartCandidates: boolean;
  isMapUnavailable: boolean;
}): SetupStepState => {
  if (isMapUnavailable) return 'pending';
  if (hasStartLocation) return 'complete';
  if (!hasStartCandidates) return 'blocked';
  if (hasFireLocation) return 'active';
  return 'pending';
};

const getStartStepDescription = ({
  state,
  hasStartCandidates,
  isMapUnavailable,
}: {
  state: SetupStepState;
  hasStartCandidates: boolean;
  isMapUnavailable: boolean;
}) => {
  if (state === 'complete') return '시작 지점을 선택했습니다.';
  if (isMapUnavailable) return '도면 정보를 확인한 뒤 선택할 수 있습니다.';
  if (!hasStartCandidates) {
    return 'START 후보가 없습니다. 도면 관리에서 먼저 등록해 주세요.';
  }
  if (state === 'active') return '분홍색 시작 지점을 선택해 주세요.';
  return '화재 시작 위치를 선택하면 다음 단계가 활성화됩니다.';
};

const ScenarioSetupForm = ({
  value,
  buildingOptions,
  floorMap,
  mode,
  handlers,
  evacuationSetup,
}: ScenarioSetupFormProps) => {
  const { basicInfo, fireSpreadLabel } = value;
  const { isRunning, readOnly, buildingReadOnly } = mode;
  const { onBasicInfoChange, onFireSpreadChange } = handlers;
  const hasFireLocation = Boolean(floorMap.selectedFireCellId || floorMap.originCellId);
  const hasStartLocation = Boolean(
    floorMap.selectedStartNodeId || evacuationSetup.persistedStartNodeId,
  );
  const isMapUnavailable = Boolean(floorMap.statusMessage);
  const canShowEvacuationSetup =
    evacuationSetup.editable || evacuationSetup.configured || isRunning;
  const fireStepState = getFireStepState(hasFireLocation, isMapUnavailable);
  const startStepState = getStartStepState({
    hasFireLocation,
    hasStartLocation,
    hasStartCandidates: floorMap.hasStartCandidates,
    isMapUnavailable,
  });
  const scenarioNameLength = basicInfo.scenarioName.trim().length;
  const scenarioNameError =
    scenarioNameLength > 0 && scenarioNameLength < SCENARIO_NAME_MIN_LENGTH
      ? `시나리오명은 ${SCENARIO_NAME_MIN_LENGTH}~${SCENARIO_NAME_MAX_LENGTH}자로 입력해 주세요.`
      : undefined;

  return (
    <div className={styles.container}>
      <section className={pageStyles.mainSectionCard}>
        <div className={pageStyles.sectionTitleRow}>
          <h2 className={pageStyles.mainSectionTitle}>1. 기본 정보</h2>
          {isRunning && <span className={pageStyles.lockBadge}>{TRAINING_LOCK_MESSAGE}</span>}
        </div>

        <div className={pageStyles.fieldGrid}>
          <TextField
            label="시나리오명"
            value={basicInfo.scenarioName}
            placeholder="시나리오명을 입력하세요"
            maxLength={SCENARIO_NAME_MAX_LENGTH}
            errorMessage={scenarioNameError}
            readOnly={readOnly}
            disabled={isRunning}
            onChange={(event) => onBasicInfoChange('scenarioName', event.target.value)}
          />
          <ScenarioField
            label="대상 건물"
            value={basicInfo.targetBuilding}
            options={buildingOptions}
            disabled={isRunning}
            readOnly={readOnly || buildingReadOnly}
            onChange={(value) => onBasicInfoChange('targetBuilding', value)}
          />
          <DateTimeField
            label="실시 일시"
            value={basicInfo.scheduledAt}
            disabled={isRunning}
            readOnly={readOnly}
            onChange={(value) => onBasicInfoChange('scheduledAt', value)}
          />
          <TextField
            label="예상 참가 인원"
            type="number"
            value={basicInfo.expectedParticipants}
            placeholder="예상 참가 인원을 입력하세요"
            leftIcon={<UsersIcon />}
            readOnly={readOnly}
            disabled={isRunning}
            onChange={(event) => onBasicInfoChange('expectedParticipants', event.target.value)}
          />
        </div>
      </section>

      <section className={pageStyles.mainSectionCard}>
        <div className={pageStyles.sectionTitleRow}>
          <h2 className={pageStyles.mainSectionTitle}>2. 화재 발생 조건</h2>
          {isRunning && <span className={pageStyles.lockBadge}>{TRAINING_LOCK_MESSAGE}</span>}
        </div>

        <div
          className={canShowEvacuationSetup ? styles.conditionFields : styles.conditionFieldsSingle}
        >
          <ScenarioField
            label="확산 속도"
            value={fireSpreadLabel}
            options={FIRE_SPREAD_OPTIONS}
            disabled={isRunning}
            readOnly={readOnly}
            onChange={onFireSpreadChange}
          />
          {canShowEvacuationSetup && (
            <ScenarioField
              label="대상 층"
              value={evacuationSetup.selectedFloorId}
              options={evacuationSetup.floorOptions}
              disabled={isRunning || evacuationSetup.configured}
              readOnly={!evacuationSetup.editable}
              onChange={evacuationSetup.onFloorChange}
            />
          )}
        </div>

        {!canShowEvacuationSetup && (
          <div className={styles.lockedSetup}>
            <div className={styles.lockedSetupCard}>
              <h3 className={styles.fireLocationLabel}>다음 단계: 발화 위치 및 시작 지점</h3>
              <p className={styles.lockedSetupDescription}>
                기본 정보를 입력한 뒤 오른쪽의 &apos;다음&apos; 버튼을 눌러 설정을 계속해 주세요.
              </p>
            </div>
          </div>
        )}

        {canShowEvacuationSetup && (
          <>
            <div className={styles.setupHeading}>
              <h3 className={styles.fireLocationLabel}>발화 위치 및 시작 지점</h3>
              <p className={styles.setupDescription}>
                도면에서 화재가 시작될 위치와 훈련 시작 지점을 순서대로 선택해 주세요.
              </p>
            </div>
            <div className={styles.setupSteps}>
              <div className={styles.setupStep[fireStepState]}>
                <span className={styles.stepNumber[fireStepState]}>1</span>
                <div>
                  <strong className={styles.stepTitle}>화재 시작 위치</strong>
                  <p className={styles.stepDescription}>{getFireStepDescription(fireStepState)}</p>
                </div>
              </div>
              <div className={styles.setupStep[startStepState]}>
                <span className={styles.stepNumber[startStepState]}>2</span>
                <div>
                  <strong className={styles.stepTitle}>훈련 시작 지점</strong>
                  <p className={styles.stepDescription}>
                    {getStartStepDescription({
                      state: startStepState,
                      hasStartCandidates: floorMap.hasStartCandidates,
                      isMapUnavailable,
                    })}
                  </p>
                </div>
              </div>
            </div>
            <FireLocationGrid
              imageUrl={floorMap.imageUrl}
              graph={floorMap.graph}
              gridCells={floorMap.gridCells}
              routePoints={floorMap.routePoints}
              fireCellIds={floorMap.fireCellIds}
              originCellId={floorMap.originCellId}
              selectedFireCellId={floorMap.selectedFireCellId}
              selectedStartNodeId={floorMap.selectedStartNodeId}
              persistedStartNodeId={evacuationSetup.persistedStartNodeId}
              statusMessage={floorMap.statusMessage}
              disabled={!evacuationSetup.editable || evacuationSetup.configured || isRunning}
              startSelectionDisabled={!hasFireLocation}
              onFireCellSelect={evacuationSetup.onFireCellSelect}
              onStartNodeSelect={evacuationSetup.onStartNodeSelect}
            />

            {evacuationSetup.configured && (
              <p className={styles.setupNotice}>
                설정이 저장되었습니다.
                <br />
                변경하려면 새 시나리오를 만들어 주세요.
              </p>
            )}
            {evacuationSetup.editable && !evacuationSetup.configured && (
              <Button
                type="button"
                className={styles.setupButton}
                disabled={!evacuationSetup.canSave}
                isLoading={evacuationSetup.isSaving}
                onClick={evacuationSetup.onSave}
              >
                시나리오 설정 완료
              </Button>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default ScenarioSetupForm;
