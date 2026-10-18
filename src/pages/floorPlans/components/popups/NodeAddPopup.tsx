import { useState } from 'react';

import clsx from 'clsx';

import Dropdown from '@components/dropdown';

import LightGuidanceFields from './LightGuidanceFields';
import * as styles from './popup.css';
import SidebarPopup from './SidebarPopup';
import { DEVICE_PLACE_CONFIG } from '../../constants/devicePlacement';
import { isStructureNodeType } from '../../constants/structureNode';

import type { LightGuidanceValue } from './LightGuidanceFields';
import type { PlacingDeviceType } from '../../constants/devicePlacement';
import type { LightPickFieldName } from '../../utils/lightPick';

// 유도등 추가 팝업에서 같이 받는 담당 CCTV·가이던스 값 — DeviceEditForm과 필드 구성은 같지만
// label이 없고(장치 ID 입력이 대신함) 전부 빈 문자열이면 "아직 안 정함"으로 취급해 생략 가능함
export type LightAddFields = {
  cctvId: string;
  decisionNodeId: string;
  leftEdgeId: string;
  rightEdgeId: string;
};

// 유도등 담당 CCTV·갈림길·좌우 통로 입력 — 갈림길·통로 값은 캔버스 클릭으로도 채워져서 부모가 가짐
interface NodeAddLightProps {
  lightNodeOptions: { id: string; label: string }[];
  lightEdgeOptions: { id: string; label: string; fromNodeId: string; toNodeId: string }[];
  lightCctvOptions: { id: string; label: string }[];
  // 갈림길 위치·좌우 통로 값은 부모가 갖고 있음(캔버스 클릭으로도 같은 값을 채울 수 있어야
  // 해서 이 팝업 로컬 state로 두면 캔버스↔팝업 양방향 동기화가 번거로워짐 — DeviceCard의
  // editForm과 같은 방식으로 통일). 담당 CCTV는 캔버스에서 고를 대상이 아니라 포함하지 않음
  lightFields: LightGuidanceValue;
  onLightFieldsChange: (fields: LightGuidanceValue) => void;
  lightPickField: LightPickFieldName | null;
  onStartLightPick: (field: LightPickFieldName) => void;
}

interface NodeAddPopupProps {
  type: PlacingDeviceType;
  onTypeChange: (type: PlacingDeviceType) => void;
  stage: 'entry' | 'fov';
  hasPosition: boolean;
  selectedCellCount: number;
  onCancel: () => void;
  onBack: () => void;
  onSubmitEntry: (type: PlacingDeviceType, deviceId: string, lightFields: LightAddFields) => void;
  onFinalize: (deviceId: string) => void;
  light: NodeAddLightProps;
}

/* ── 장비 추가 팝업 ──
 * 정보 입력과 위치 지정을 같은 화면(입력 단계)에서 함께 진행 — 도면을 클릭하면 위치가 잡히고,
 * 다시 클릭하면 위치를 옮길 수 있음. CCTV만 이후 시야 범위 지정 단계가 추가로 붙어 총 2단계.
 * 종료 버튼 규칙: 아직 생성되지 않는 중간 단계는 "다음", 실제로 저장되는 마지막 클릭만 "추가"로 통일
 * (구역추가 팝업과도 동일한 규칙 — 툴바의 "+ 노드 추가"/"+ 구역 추가"와 같은 동사로 시작·종료되게 함).
 */
const NodeAddPopup = ({
  type,
  onTypeChange,
  stage,
  hasPosition,
  selectedCellCount,
  onCancel,
  onBack,
  onSubmitEntry,
  onFinalize,
  light,
}: NodeAddPopupProps) => {
  const {
    lightNodeOptions,
    lightEdgeOptions,
    lightCctvOptions,
    lightFields,
    onLightFieldsChange,
    lightPickField,
    onStartLightPick,
  } = light;
  const [deviceId, setDeviceId] = useState('');
  // 담당 CCTV는 캔버스에서 고를 대상이 아니라(그래프 노드/엣지가 아님) 계속 이 팝업 로컬
  // state로 둠 — 수정 카드(DeviceCard)와 채워야 하는 값이 서로 달라 등록 직후엔 "훈련 준비"에
  // 필요한 guidanceConfigured/cctvId가 항상 비어있던 문제. 도면에 아직 판단 노드·엣지·CCTV가
  // 없을 수도 있어 필수로 막지는 않음(비워두면 등록 후 카드에서 마저 채움)
  const [lightCctvId, setLightCctvId] = useState('');
  const {
    decisionNodeId: lightDecisionNodeId,
    leftEdgeId: lightLeftEdgeId,
    rightEdgeId: lightRightEdgeId,
  } = lightFields;

  const isStructureNode = isStructureNodeType(type);
  const isCctv = type === 'cctv';
  const isLight = type === 'light';
  const totalSteps = isCctv ? 2 : 1;
  const stepNumber = stage === 'entry' ? 1 : totalSteps;

  if (stage === 'fov') {
    return (
      <SidebarPopup
        title={`${DEVICE_PLACE_CONFIG[type].label} 시야 범위 지정`}
        badge={`${stepNumber}/${totalSteps}`}
        hint={
          selectedCellCount > 0
            ? `${selectedCellCount}칸 선택됨. 다시 드래그하면 그 영역으로 새로 잡히고, 칸을 클릭하면 하나씩 켜고 끌 수 있어요.`
            : '도면을 드래그해서 카메라 시야 구역에 해당하는 칸을 선택해주세요'
        }
        actions={[
          { label: '이전', variant: 'back', onClick: onBack },
          { label: '취소', variant: 'cancel', onClick: onCancel },
          {
            label: '추가',
            variant: 'submit',
            disabled: selectedCellCount === 0,
            onClick: () => onFinalize(deviceId),
          },
        ]}
      />
    );
  }

  const canSubmit = hasPosition && (isStructureNode || !!deviceId.trim());

  return (
    <SidebarPopup
      title="노드 추가"
      badge={`${stepNumber}/${totalSteps}`}
      hint={
        hasPosition
          ? '위치가 지정됐어요. 다른 곳을 클릭하면 위치를 옮길 수 있어요.'
          : '도면을 클릭해서 위치를 지정해주세요'
      }
      actions={[
        { label: '취소', variant: 'cancel', onClick: onCancel },
        {
          label: isCctv ? '다음' : '추가',
          variant: 'submit',
          disabled: !canSubmit,
          onClick: () =>
            onSubmitEntry(type, deviceId.trim(), {
              cctvId: lightCctvId,
              decisionNodeId: lightDecisionNodeId,
              leftEdgeId: lightLeftEdgeId,
              rightEdgeId: lightRightEdgeId,
            }),
        },
      ]}
    >
      <div className={styles.nodeAddField}>
        <span className={styles.nodeAddLabel}>노드 종류</span>
        <div className={styles.deviceTypeChips}>
          {/* 시작 후보(START)는 새 노드로 만들지 않고, 문·출입구 카드에서 지정한다(BE PR #225) */}
          {(['cctv', 'light', 'door', 'stair', 'hallway'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={clsx(styles.deviceTypeChip, type === t && styles.deviceTypeChipActive)}
              onClick={() => onTypeChange(t)}
            >
              {DEVICE_PLACE_CONFIG[t].label}
            </button>
          ))}
        </div>
      </div>

      {!isStructureNode && (
        <>
          <div className={styles.nodeAddField}>
            <span className={styles.nodeAddLabel}>장치 ID</span>
            <input
              className={styles.nodeAddInput}
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder={isCctv ? 'CCTV-A3-05' : 'IOT-A3-05'}
            />
          </div>

          {/* 담당 CCTV·가이던스(판단 노드/좌우 엣지) — 장비 카드 수정에서만 채울 수 있던 값이라
              등록 직후엔 항상 비어있던 문제(훈련 준비의 guidanceConfigured가 안 채워짐). 도면에
              아직 판단 노드·엣지·CCTV가 없을 수도 있어 필수는 아니고, 비워두면 등록 후 카드에서
              마저 채울 수 있음 */}
          {isLight && (
            <>
              <div className={styles.nodeAddField}>
                <span className={styles.nodeAddLabel}>담당 CCTV</span>
                <Dropdown
                  shape="rounded"
                  fullWidth
                  ariaLabel="담당 CCTV"
                  options={lightCctvOptions.map((c) => ({ value: c.id, label: c.label }))}
                  value={lightCctvId}
                  onChange={setLightCctvId}
                  placeholder="미지정"
                />
              </div>
              <LightGuidanceFields
                value={lightFields}
                onChange={onLightFieldsChange}
                nodeOptions={lightNodeOptions}
                edgeOptions={lightEdgeOptions}
                pickField={lightPickField}
                onStartPick={onStartLightPick}
              />
            </>
          )}
        </>
      )}
    </SidebarPopup>
  );
};

export default NodeAddPopup;
