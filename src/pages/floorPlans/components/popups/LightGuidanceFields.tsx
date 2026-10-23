import clsx from 'clsx';

import XIcon from '@assets/icons/ic-x.svg?react';

import * as styles from './popup.css';
import { getLightPickHint } from '../../utils/lightPick';

import type { LightPickFieldName } from '../../utils/lightPick';

export interface LightGuidanceValue {
  decisionNodeId: string;
  leftEdgeId: string;
  rightEdgeId: string;
}

interface LightPickFieldProps {
  label: string;
  fieldName: LightPickFieldName;
  pickField: LightPickFieldName | null;
  disabled?: boolean;
  // 옵션 목록에서 찾은 현재 값의 표시용 라벨 — undefined면 아직 선택 안 된 상태
  displayLabel?: string;
  emptyText: string;
  onStartPick: () => void;
  onClear: () => void;
}

// 갈림길 위치·왼쪽 통로·오른쪽 통로 — 같은 이름 노드가 많아 드롭다운으로는 뭐가 뭔지 구분이
// 안 된다는 QA 피드백으로 드롭다운 자체를 없애고 도면(캔버스) 클릭으로만 고르게 함. 이 컴포넌트는
// 값을 고르는 UI가 아니라 "캔버스에서 선택" 버튼 + 현재 값 표시 + 지우기 버튼만 담당함
const LightPickField = ({
  label,
  fieldName,
  pickField,
  disabled = false,
  displayLabel,
  emptyText,
  onStartPick,
  onClear,
}: LightPickFieldProps) => {
  const picking = pickField === fieldName;
  return (
    <div className={styles.nodeAddField}>
      <div className={styles.nodeAddLabelRow}>
        <span className={styles.nodeAddLabel}>{label}</span>
        <button
          type="button"
          className={styles.nodeAddPickBtn}
          disabled={disabled}
          onClick={onStartPick}
        >
          {picking ? '선택 취소' : '캔버스에서 선택'}
        </button>
      </div>
      <div
        className={clsx(
          styles.nodeAddPickDisplay,
          !displayLabel && styles.nodeAddPickDisplayEmpty,
          picking && styles.nodeAddPickDisplayActive,
        )}
      >
        {displayLabel ?? emptyText}
        {displayLabel && (
          <button
            type="button"
            aria-label={`${label} 선택 해제`}
            className={styles.nodeAddPickClearBtn}
            onClick={onClear}
          >
            <XIcon width={14} height={14} />
          </button>
        )}
      </div>
    </div>
  );
};

interface LightGuidanceFieldsProps {
  value: LightGuidanceValue;
  onChange: (value: LightGuidanceValue) => void;
  nodeOptions: { id: string; label: string }[];
  edgeOptions: { id: string; label: string; fromNodeId: string; toNodeId: string }[];
  pickField: LightPickFieldName | null;
  onStartPick: (field: LightPickFieldName) => void;
}

/* ── 유도등 갈림길 위치·왼쪽/오른쪽 통로 입력 — 추가 팝업과 장비 카드 수정이 같이 씀.
   "판단 노드"·"경로 엣지"란 용어가 와닿지 않는다는 QA 피드백으로 무엇을 고르는지 문장으로 먼저
   안내하고, 값은 도면에서 직접 클릭해 고름(도면 위 강조·클릭은 부모가 처리하고 값만 내려받음) ── */
const LightGuidanceFields = ({
  value,
  onChange,
  nodeOptions,
  edgeOptions,
  pickField,
  onStartPick,
}: LightGuidanceFieldsProps) => {
  const { decisionNodeId, leftEdgeId, rightEdgeId } = value;
  const hint = getLightPickHint(pickField, decisionNodeId, edgeOptions);

  return (
    <>
      <span className={clsx(styles.nodeAddHint, hint.isWarning && styles.nodeAddHintWarning)}>
        {hint.text}
      </span>
      <LightPickField
        label="갈림길 위치"
        fieldName="decisionNode"
        pickField={pickField}
        displayLabel={nodeOptions.find((n) => n.id === decisionNodeId)?.label}
        emptyText="갈림길 위치 선택"
        onStartPick={() => onStartPick('decisionNode')}
        // 갈림길 위치를 바꾸면 이전 노드에 연결돼 있던 좌/우 통로는 더 이상 유효하지 않을 수 있어
        // (연결 안 된 엣지를 저장 시점에야 서버가 거부하던 문제) 같이 비움
        onClear={() => onChange({ decisionNodeId: '', leftEdgeId: '', rightEdgeId: '' })}
      />
      {/* 갈림길 위치에 실제로 연결된 통로(엣지)만 후보 — 캔버스 픽 모드에서 걸러줌 */}
      <LightPickField
        label="왼쪽 통로"
        fieldName="leftEdge"
        pickField={pickField}
        disabled={!decisionNodeId}
        displayLabel={edgeOptions.find((e) => e.id === leftEdgeId)?.label}
        emptyText={decisionNodeId ? '왼쪽 통로 선택' : '갈림길 위치를 먼저 선택'}
        onStartPick={() => onStartPick('leftEdge')}
        onClear={() => onChange({ ...value, leftEdgeId: '' })}
      />
      <LightPickField
        label="오른쪽 통로"
        fieldName="rightEdge"
        pickField={pickField}
        disabled={!decisionNodeId}
        displayLabel={edgeOptions.find((e) => e.id === rightEdgeId)?.label}
        emptyText={decisionNodeId ? '오른쪽 통로 선택' : '갈림길 위치를 먼저 선택'}
        onStartPick={() => onStartPick('rightEdge')}
        onClear={() => onChange({ ...value, rightEdgeId: '' })}
      />
    </>
  );
};

export default LightGuidanceFields;
