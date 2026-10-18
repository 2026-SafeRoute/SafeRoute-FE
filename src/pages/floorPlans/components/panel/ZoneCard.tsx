import clsx from 'clsx';

import CheckIcon from '@assets/icons/ic-check.svg?react';
import EditIcon from '@assets/icons/ic-edit.svg?react';
import TrashIcon from '@assets/icons/ic-trash.svg?react';

import * as styles from './panelCard.css';
import { EDITING_LOCK_HINT_ID } from '../../constants/floorEditor';

import type { ZoneEntry } from '../../types/canvasSelection';

// 카드에서 일어나는 동작
interface ZoneCardActions {
  onSelect: (id: string) => void;
  onStartEdit: (zone: ZoneEntry) => void;
  onSaveLabel: (id: string) => void;
  onDelete: (zone: ZoneEntry) => void;
}

interface ZoneCardProps {
  zone: ZoneEntry;
  selected: boolean;
  editing: boolean;
  editLabel: string;
  // 수정 중 도면에서 다시 고른 칸 수
  draftCellCount: number;
  editingLocked: boolean;
  onEditLabelChange: (label: string) => void;
  actions: ZoneCardActions;
}

/* ── 우측 패널 구역 카드 ── */
const ZoneCard = ({
  zone,
  selected,
  editing,
  editLabel,
  draftCellCount,
  editingLocked,
  onEditLabelChange,
  actions,
}: ZoneCardProps) => {
  const { onSelect, onStartEdit, onSaveLabel, onDelete } = actions;
  const editingLockHintId = EDITING_LOCK_HINT_ID;
  const lockHintId = editingLocked ? editingLockHintId : undefined;

  return (
    <div
      data-panel-id={zone.id}
      className={clsx(styles.deviceCard, selected && styles.deviceCardSelected)}
      onClick={() => onSelect(zone.id)}
    >
      <div className={styles.zoneCardHeader}>
        <span className={styles.zoneCardTitleGroup}>
          <span className={clsx(styles.zoneCardDot, styles.zoneCardDotGeneral)} />
          {editing ? (
            <input
              className={styles.deviceCardNameInput}
              aria-label="구역 이름"
              value={editLabel}
              disabled={editingLocked}
              onChange={(e) => onEditLabelChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={styles.deviceCardName}>{zone.label}</span>
          )}
        </span>
        <span className={styles.zoneCardHeaderActions}>
          <button
            type="button"
            aria-label={editing ? '수정 완료' : '수정'}
            className={editing ? styles.zoneCardIconBtnDone : styles.zoneCardIconBtn}
            disabled={editingLocked}
            aria-describedby={lockHintId}
            onClick={(e) => {
              e.stopPropagation();
              if (editing) {
                onSaveLabel(zone.id);
              } else {
                onStartEdit(zone);
              }
            }}
          >
            {editing ? <CheckIcon width={14} height={14} /> : <EditIcon width={14} height={14} />}
          </button>
          <button
            type="button"
            aria-label="삭제"
            className={styles.zoneCardIconBtnDelete}
            disabled={editingLocked}
            aria-describedby={lockHintId}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(zone);
            }}
          >
            <TrashIcon width={14} height={14} />
          </button>
        </span>
      </div>
      {/* 감시 영역(CCTV 카드)과 같은 자리·같은 모양 — 수정 중이 아닐 때도 정보를 보여줘서
          수정 모드로 들어갈 때 카드 규격이 갑자기 늘어나 보이지 않게 함. 수정을 누르면 바로
          도면 드래그가 켜지므로(handleStartEditZone) 별도 "재설정" 버튼 없이 여기는
          지금 고른 칸 수만 실시간으로 보여줌 */}
      <div
        className={styles.deviceCardRow}
        title={editing ? '도면에서 칸을 클릭하거나 드래그하면 영역이 바로 바뀌어요' : undefined}
      >
        <span className={styles.deviceCardKey}>구역 범위</span>
        <span className={styles.deviceCardValue}>
          {editing ? draftCellCount : zone.cellIds.length}칸
        </span>
      </div>
    </div>
  );
};

export default ZoneCard;
