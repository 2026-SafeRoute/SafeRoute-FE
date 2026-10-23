import { useCallback, useEffect, useRef, useState } from 'react';

import ChevronDownIcon from '@assets/icons/ic-chevron-down.svg?react';
import PlusIcon from '@assets/icons/ic-plus.svg?react';

import useClickOutside from '@hooks/useClickOutside';

import * as styles from './AddActionMenu.css';
import { EDITING_LOCK_HINT_ID } from '../constants/floorEditor';

interface AddActionMenuProps {
  disabled?: boolean;
  onAddNode: () => void;
  onAddZone: () => void;
  onAddEdge: () => void;
}

/* ── 툴바 "+ 추가" 메뉴 — 노드/구역/엣지 추가를 각각 버튼으로 늘어놓지 않고 하나로 묶음 ── */
const AddActionMenu = ({
  disabled = false,
  onAddNode,
  onAddZone,
  onAddEdge,
}: AddActionMenuProps) => {
  const disabledHintId = EDITING_LOCK_HINT_ID;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(
    containerRef,
    open,
    useCallback(() => setOpen(false), []),
  );

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const items = [
    { label: '노드 추가', onClick: onAddNode },
    { label: '구역 추가', onClick: onAddZone },
    { label: '엣지 연결', onClick: onAddEdge },
  ];

  return (
    <div ref={containerRef} className={styles.addMenuContainer}>
      <button
        type="button"
        className={styles.canvasActionButton}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-describedby={disabled ? disabledHintId : undefined}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <PlusIcon width={14} height={14} />
        추가
        <ChevronDownIcon width={14} height={14} className={styles.addMenuChevron} />
      </button>
      {open && (
        <div className={styles.addMenuPanel} role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={styles.addMenuItem}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddActionMenu;
