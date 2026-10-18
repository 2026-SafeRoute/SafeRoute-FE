import type { Dispatch, ReactNode, RefObject, SetStateAction } from 'react';

import clsx from 'clsx';

import ChevronRightIcon from '@assets/icons/ic-chevron-right.svg?react';

import { Button } from '@components/Button';

import * as styles from './DevicePanel.css';

import type { PanelDeviceTypeFilter, PanelTopFilter } from '../../types/panelItem';

interface DevicePanelProps {
  panelRef: RefObject<HTMLDivElement>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  topFilter: PanelTopFilter;
  onTopFilterChange: Dispatch<SetStateAction<PanelTopFilter>>;
  deviceTypeFilter: PanelDeviceTypeFilter[];
  onDeviceTypeFilterChange: Dispatch<SetStateAction<PanelDeviceTypeFilter[]>>;
  // 필터를 통과한 노드·장비·구역 카드 목록
  children: ReactNode;
}

/* ── 우측 장비 목록 패널 — 접기/펼치기, 상위 탭·하위 칩 필터, 카드 목록 영역 ── */
const DevicePanel = ({
  panelRef,
  isOpen,
  onOpenChange,
  topFilter,
  onTopFilterChange: setTopFilter,
  deviceTypeFilter,
  onDeviceTypeFilterChange: setDeviceTypeFilter,
  children,
}: DevicePanelProps) => (
  <aside
    ref={panelRef}
    className={clsx(styles.devicePanel, !isOpen && styles.devicePanelCollapsed)}
    aria-label="장비 목록"
  >
    <div className={styles.devicePanelHeader}>
      {isOpen && <span className={styles.devicePanelHeading}>장비 목록</span>}
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        aria-label={isOpen ? '장비 목록 접기' : '장비 목록 펼치기'}
        aria-expanded={isOpen}
        aria-controls="floor-device-panel-content"
        onClick={() => onOpenChange(!isOpen)}
      >
        <ChevronRightIcon className={isOpen ? undefined : styles.devicePanelToggleExpand} />
      </Button>
    </div>
    <div
      id="floor-device-panel-content"
      className={clsx(styles.devicePanelInner, !isOpen && styles.devicePanelInnerHidden)}
    >
      <div className={styles.devicePanelSticky}>
        <div className={styles.filterTabs}>
          {(
            [
              { key: 'all', label: '전체' },
              { key: 'device', label: '노드' },
              { key: 'zone', label: '구역' },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={clsx(styles.filterTab, topFilter === key && styles.filterTabActive)}
              onClick={() => {
                // 유도등 등 하위 필터 칩을 고른 채로 "전체"를 누르면 그 필터가 그대로
                // 남아서 전체가 아니라 필터링된 목록만 보이는 문제가 있었음 — 탭을
                // 바꿀 때마다 하위 필터도 같이 초기화함
                setTopFilter(key);
                setDeviceTypeFilter([]);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {topFilter === 'device' && (
          <div className={styles.subFilterChips}>
            {(
              [
                { key: 'cctv', label: 'CCTV' },
                { key: 'light', label: '유도등' },
                { key: 'door', label: '문 · 출입구' },
                { key: 'stair', label: '계단' },
                { key: 'hallway', label: '복도' },
                { key: 'start', label: '시작 후보' },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={clsx(
                  styles.subFilterChip,
                  deviceTypeFilter.includes(key) && styles.subFilterChipActive,
                )}
                onClick={() =>
                  setDeviceTypeFilter((prev) =>
                    prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
                  )
                }
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.devicePanelList}>{children}</div>
    </div>
  </aside>
);

export default DevicePanel;
