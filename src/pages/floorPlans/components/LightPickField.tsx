import clsx from 'clsx';

import XIcon from '@assets/icons/ic-x.svg?react';

import * as styles from '../FloorPlansDetailPage.css';

import type { LightPickFieldName } from '../utils/lightPick';

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

export default LightPickField;
