import clsx from 'clsx';

import CheckIcon from '@assets/icons/ic-check.svg?react';
import EditIcon from '@assets/icons/ic-edit.svg?react';
import TrashIcon from '@assets/icons/ic-trash.svg?react';

import * as styles from './panelCard.css';
import { STRUCTURE_NODE_LABEL, ZONE_CARD_DOT_CLASS } from '../../constants/structureNode';

import type { StructureNode } from '../../constants/structureNode';

interface StructureNodeCardProps {
  node: StructureNode;
  // 같은 종류 노드 중 몇 번째인지 — "복도 1", "복도 2"처럼 드롭다운·경로 라벨과 같은 번호를 붙임
  sameTypeIndex: number;
  selected: boolean;
  editing: boolean;
  diagnosisUnreachable: boolean;
  startCandidatePending: boolean;
  editingLocked: boolean;
  editingLockHintId: string;
  onSelect: (id: string) => void;
  onToggleFinalExit: (id: string) => void;
  onToggleStartCandidate: (id: string) => void;
  onStartEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/* ── 우측 패널 구조 노드(문·계단·복도·시작 후보) 카드 ── */
const StructureNodeCard = ({
  node,
  sameTypeIndex,
  selected,
  editing,
  diagnosisUnreachable,
  startCandidatePending,
  editingLocked,
  editingLockHintId,
  onSelect,
  onToggleFinalExit,
  onToggleStartCandidate,
  onStartEdit,
  onDelete,
}: StructureNodeCardProps) => {
  const lockHintId = editingLocked ? editingLockHintId : undefined;

  return (
    <div
      data-panel-id={node.id}
      className={clsx(
        styles.deviceCard,
        selected && styles.deviceCardSelected,
        diagnosisUnreachable && styles.deviceCardDiagnosisError,
      )}
      onClick={() => onSelect(node.id)}
    >
      <div className={styles.zoneCardHeader}>
        <span className={styles.zoneCardTitleGroup}>
          <span
            className={clsx(
              styles.zoneCardDot,
              node.type === 'door' && node.isStartCandidate
                ? ZONE_CARD_DOT_CLASS.start
                : ZONE_CARD_DOT_CLASS[node.type],
            )}
          />
          <span className={styles.zoneCardTitleText}>
            <span className={styles.deviceCardName}>
              {STRUCTURE_NODE_LABEL[node.type]} {sameTypeIndex + 1}
            </span>
            {diagnosisUnreachable && (
              <span className={styles.diagnosisCardHint}>출구와 연결 안 됨</span>
            )}
          </span>
        </span>
        <span className={styles.zoneCardHeaderActions}>
          {/* 최종 탈출구는 계단에서만 지정 — 문/출입구는 층 내부 통로라 제외 */}
          {node.type === 'stair' && (
            <button
              type="button"
              className={node.isFinalExit ? styles.finalExitBadge : styles.finalExitToggle}
              disabled={editingLocked}
              aria-describedby={lockHintId}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFinalExit(node.id);
              }}
            >
              {node.isFinalExit ? '최종 탈출구' : '탈출구로 지정'}
            </button>
          )}
          {/* 훈련 시작 후보는 문·출입구 노드에서 지정(BE 정책) */}
          {node.type === 'door' && (
            <button
              type="button"
              className={node.isStartCandidate ? styles.finalExitBadge : styles.finalExitToggle}
              disabled={editingLocked || startCandidatePending}
              aria-describedby={lockHintId}
              onClick={(e) => {
                e.stopPropagation();
                onToggleStartCandidate(node.id);
              }}
            >
              {node.isStartCandidate ? '시작 후보' : '시작 후보로 지정'}
            </button>
          )}
          <button
            type="button"
            aria-label={editing ? '수정 완료' : '수정'}
            className={editing ? styles.zoneCardIconBtnDone : styles.zoneCardIconBtn}
            disabled={editingLocked}
            aria-describedby={lockHintId}
            onClick={(e) => {
              e.stopPropagation();
              onStartEdit(node.id);
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
              onDelete(node.id);
            }}
          >
            <TrashIcon width={14} height={14} />
          </button>
        </span>
      </div>
    </div>
  );
};

export default StructureNodeCard;
