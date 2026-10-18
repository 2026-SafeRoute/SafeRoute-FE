import type { ReactNode } from 'react';

import clsx from 'clsx';

import StatusBadge from '@components/chip/StatusBadge';

import { formatFloor, hasFloorPlan } from '@utils/floor';

import * as styles from './FloorSidebar.css';
import { EDITING_LOCK_HINT_ID } from '../constants/floorEditor';

import type { Floor } from '../types/floorPlans';

interface FloorSidebarProps {
  editingLocked: boolean;
  isRunningSessionsPending: boolean;
  floors: Floor[];
  selectedFloorId: string;
  onFloorChange: (floorId: string) => void;
  // 층 목록 아래에 이어 붙는 체크리스트·추가/설정 팝업
  children?: ReactNode;
}

/* ── 좌측 사이드바 — 편집 잠금 안내, 층 목록, 그 아래 체크리스트·팝업 ── */
const FloorSidebar = ({
  editingLocked,
  isRunningSessionsPending,
  floors,
  selectedFloorId,
  onFloorChange,
  children,
}: FloorSidebarProps) => (
  <aside className={styles.sidebar}>
    <div className={styles.sidebarInner} style={{ padding: '2rem 2rem 2.4rem' }}>
      <div
        id={EDITING_LOCK_HINT_ID}
        className={editingLocked ? styles.editingLockNotice : undefined}
        role="status"
      >
        {editingLocked
          ? isRunningSessionsPending
            ? '훈련 진행 여부를 확인하는 동안 도면 편집을 잠시 사용할 수 없습니다.'
            : '훈련 진행 중에는 도면·노드·구역·기기 설정을 변경할 수 없습니다. 기기 활성화·비활성화는 계속 사용할 수 있습니다.'
          : ''}
      </div>

      {/* 층 목록 */}
      <div className={styles.floorNavCard}>
        <div className={styles.floorNavHeader}>층 목록</div>
        <div className={styles.floorNavList}>
          {[...floors]
            .sort((a, b) => b.floorNum - a.floorNum)
            .map((f) => {
              const isCurrent = f.id === selectedFloorId;
              const isNone = !hasFloorPlan(f);
              return (
                <button
                  key={f.id}
                  type="button"
                  className={clsx(styles.floorNavItem, isCurrent && styles.floorNavItemActive)}
                  onClick={() => onFloorChange(f.id)}
                >
                  <span>{formatFloor(f.floorNum)}</span>
                  {isNone && <StatusBadge label="미등록" color="neutral" />}
                </button>
              );
            })}
        </div>
      </div>

      {children}
    </div>
  </aside>
);

export default FloorSidebar;
