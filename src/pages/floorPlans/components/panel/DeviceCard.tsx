import { useState } from 'react';

import clsx from 'clsx';

import TrashIcon from '@assets/icons/ic-trash.svg?react';

import StatusBadge from '@components/chip/StatusBadge';
import Dropdown from '@components/dropdown';

import { formatAreaM2 } from '@utils/format';

import * as styles from './panelCard.css';
import { EDITING_LOCK_HINT_ID } from '../../constants/floorEditor';
import LightGuidanceFields from '../popups/LightGuidanceFields';

import type { DeviceEditForm, PanelItem } from '../../types/panelItem';
import type { LightPickFieldName } from '../../utils/lightPick';

// 카드에서 일어나는 동작
interface DeviceCardActions {
  onSelect: (item: PanelItem) => void;
  onStartEdit: (item: PanelItem) => void;
  onSaveEdit: (item: PanelItem) => void;
  onCancelEdit: (item: PanelItem) => void;
  onDelete: (item: PanelItem) => void;
  onToggleEnabled: (item: PanelItem) => void;
  onEditCctvCells: (item: PanelItem) => void;
}

// 유도등 담당 CCTV·갈림길·좌우 통로 선택지와 "캔버스에서 선택" 모드
interface DeviceCardLightProps {
  lightNodeOptions: { id: string; label: string }[];
  lightEdgeOptions: { id: string; label: string; fromNodeId: string; toNodeId: string }[];
  lightCctvOptions: { id: string; label: string }[];
  // "캔버스에서 선택" — 드롭다운 대신 도면에서 직접 클릭해 갈림길 위치·좌우 통로를 고르는 대안
  lightPickField: LightPickFieldName | null;
  onStartLightPick: (field: LightPickFieldName) => void;
}

interface DeviceCardProps {
  item: PanelItem;
  selected: boolean;
  editing: boolean;
  editForm: DeviceEditForm;
  // 폼이 원본과 달라졌는지 — "완료" 버튼을 실제로 바뀐 게 있을 때만 눌리게 하는 데 씀
  hasChanges: boolean;
  editingLocked?: boolean;
  onEditFormChange: (form: DeviceEditForm) => void;
  actions: DeviceCardActions;
  light: DeviceCardLightProps;
}

/* ── 장비 카드 ── */
const DeviceCard = ({
  item,
  selected,
  editing,
  editForm,
  hasChanges,
  editingLocked = false,
  onEditFormChange,
  actions,
  light,
}: DeviceCardProps) => {
  const {
    onSelect,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    onToggleEnabled,
    onEditCctvCells,
  } = actions;
  const { lightNodeOptions, lightEdgeOptions, lightCctvOptions, lightPickField, onStartLightPick } =
    light;
  const editingLockHintId = EDITING_LOCK_HINT_ID;
  // 가이던스·방향처럼 자주 안 건드리는 항목은 접어둬서, 수정 모드로 들어갈 때 카드가
  // 일반 모드보다 과하게 길어지는 걸 줄임
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div
      data-panel-id={item.id}
      role="button"
      tabIndex={0}
      className={clsx(styles.deviceCard, selected && styles.deviceCardSelected)}
      // 수정 중엔 카드 배경 클릭이 선택 토글로 이어져서, 이미 선택된 카드를 다시 누르면
      // editingItemId까지 같이 풀려버렸음(완료를 누른 것처럼 보이는 버그) — 수정 중엔 무시함
      onClick={() => {
        if (!editing) onSelect(item);
      }}
      // 카드 자체가 role="button"이라 키보드로도 선택할 수 있어야 함 — 다만 안쪽 입력·버튼이
      // 이벤트를 버블링시킨 경우(e.target !== e.currentTarget)는 그쪽 자체 키 처리에 맡기고 무시
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        if (!editing) onSelect(item);
      }}
    >
      <div className={styles.deviceCardNameRow}>
        {editing ? (
          <input
            className={styles.deviceCardNameInput}
            aria-label="장치 이름"
            value={editForm.label}
            onChange={(e) => onEditFormChange({ ...editForm, label: e.target.value })}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={styles.deviceCardName}>{item.label}</span>
        )}
        <button
          type="button"
          aria-label="삭제"
          aria-describedby={editingLocked ? editingLockHintId : undefined}
          disabled={editingLocked}
          className={styles.zoneCardIconBtnDelete}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item);
          }}
        >
          <TrashIcon width={14} height={14} />
        </button>
      </div>
      <div className={styles.deviceCardRow}>
        <span className={styles.deviceCardKey}>장치 코드</span>
        <span
          className={styles.deviceCardValue}
          title={item.code ? '서버가 자동으로 부여하는 값이라 수정할 수 없어요' : undefined}
        >
          {item.code ?? item.id.toUpperCase()}
        </span>
      </div>
      <div className={styles.deviceCardRow}>
        <span className={styles.deviceCardKey}>상태</span>
        {item.type === 'cctv' || item.type === 'light' ? (
          <span className={styles.cctvEnableRow}>
            <span className={styles.deviceCardValue}>
              {item.statusOnline ? '활성화' : '비활성화'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={item.statusOnline}
              aria-label={
                item.statusOnline
                  ? '활성화됨 — 클릭하면 비활성화로 전환'
                  : '비활성화됨 — 클릭하면 활성화로 전환'
              }
              className={clsx(
                styles.cctvEnableSwitch,
                item.statusOnline && styles.cctvEnableSwitchOn,
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleEnabled(item);
              }}
            >
              <span className={styles.cctvEnableSwitchThumb} />
            </button>
          </span>
        ) : (
          <StatusBadge
            label={item.statusText}
            color={item.statusOnline ? 'green' : 'neutral'}
            dot
          />
        )}
      </div>
      <div className={styles.deviceCardRow}>
        <span className={styles.deviceCardKey}>설치 위치</span>
        <span
          className={styles.deviceCardValue}
          title={
            item.type === 'cctv'
              ? '감시 영역에서 자동으로 계산돼요'
              : '도면 위 실제 좌표예요 — 캔버스에서 위치를 옮기면 여기도 함께 바뀌어요'
          }
        >
          {item.zone}
        </span>
      </div>
      {item.type === 'light' && (
        <>
          <div className={styles.deviceCardRow}>
            <span className={styles.deviceCardKey}>담당 CCTV</span>
            {!editing && (
              <span className={styles.deviceCardValue}>{item.cctvName ?? '미지정'}</span>
            )}
          </div>
          {editing && (
            <div onClick={(e) => e.stopPropagation()}>
              <Dropdown
                shape="rounded"
                fullWidth
                ariaLabel="담당 CCTV"
                options={lightCctvOptions.map((c) => ({ value: c.id, label: c.label }))}
                value={editForm.cctvId}
                onChange={(v) => onEditFormChange({ ...editForm, cctvId: v })}
                placeholder="미지정"
              />
            </div>
          )}
          <div
            className={styles.deviceCardRow}
            title="화재 시 이 유도등이 서 있는 갈림길에서 왼쪽/오른쪽 중 어느 통로로 사람들을 안내할지 정해요"
          >
            <span className={styles.deviceCardKey}>경로 · 방향</span>
            {editing ? (
              <button
                type="button"
                className={styles.deviceCardFieldEditBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailsOpen((v) => !v);
                }}
              >
                {item.guidanceConfigured ? '설정됨' : '미설정'} · {detailsOpen ? '접기' : '펼치기'}
              </button>
            ) : (
              <span className={styles.deviceCardValue}>
                {item.guidanceConfigured ? '설정됨' : '미설정'}
              </span>
            )}
          </div>
          {editing && detailsOpen && (
            <div className={styles.lightFieldGroup} onClick={(e) => e.stopPropagation()}>
              <LightGuidanceFields
                value={editForm}
                onChange={(guidance) => onEditFormChange({ ...editForm, ...guidance })}
                nodeOptions={lightNodeOptions}
                edgeOptions={lightEdgeOptions}
                pickField={lightPickField}
                onStartPick={onStartLightPick}
              />
            </div>
          )}
        </>
      )}
      {item.type === 'cctv' && (
        <div className={styles.deviceCardRow}>
          <span className={styles.deviceCardKey}>감시 영역</span>
          {editing ? (
            // 버튼 3개가 난잡해 보인다는 피드백으로, 별도 액션 버튼 대신 이 값 자체를
            // 눌러서 재선택하도록 함 — "설치 위치"가 수정 중엔 입력창으로 바뀌는 것과 같은 결
            <button
              type="button"
              className={styles.deviceCardFieldEditBtn}
              onClick={(e) => {
                e.stopPropagation();
                onEditCctvCells(item);
              }}
            >
              {item.monitoredArea
                ? `${item.monitoredArea.cellCount}칸 · ${formatAreaM2(item.monitoredArea.areaM2)}㎡`
                : '미지정'}{' '}
              · 재선택
            </button>
          ) : (
            <span className={styles.deviceCardValue}>
              {item.monitoredArea
                ? `${item.monitoredArea.cellCount}칸 · ${formatAreaM2(item.monitoredArea.areaM2)}㎡`
                : '미지정'}
            </span>
          )}
        </div>
      )}
      <div className={styles.deviceCardActions}>
        {editing ? (
          <>
            <button
              type="button"
              className={styles.deviceCardEditBtn}
              onClick={(e) => {
                e.stopPropagation();
                onCancelEdit(item);
              }}
            >
              취소
            </button>
            <button
              type="button"
              className={styles.deviceCardDoneBtn}
              disabled={!hasChanges}
              title={hasChanges ? undefined : '변경된 내용이 없어요'}
              onClick={(e) => {
                e.stopPropagation();
                onSaveEdit(item);
              }}
            >
              완료
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles.deviceCardEditBtn}
            aria-describedby={editingLocked ? editingLockHintId : undefined}
            disabled={editingLocked}
            onClick={(e) => {
              e.stopPropagation();
              onStartEdit(item);
            }}
          >
            수정
          </button>
        )}
      </div>
    </div>
  );
};

export default DeviceCard;
