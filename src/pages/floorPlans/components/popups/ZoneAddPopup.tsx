import { useState } from 'react';

import * as styles from './popup.css';
import SidebarPopup from './SidebarPopup';

interface ZoneAddPopupProps {
  selectedCellCount: number;
  onCancel: () => void;
  onSave: (label: string) => void;
}

/* ── 새 구역 추가 팝업 — 백엔드 저장 단위가 그리드 셀 집합이라 드래그는 겹치는 셀을 고르는 용도로 씀.
   기존 구역 수정은 팝업 없이 카드(이름)와 도면(칸)에서 바로 편집함 ── */
const ZoneAddPopup = ({ selectedCellCount, onCancel, onSave }: ZoneAddPopupProps) => {
  const [zoneName, setZoneName] = useState('');
  const hasSelectedCells = selectedCellCount > 0;

  const handleSave = () => {
    onSave(zoneName.trim());
  };

  return (
    <SidebarPopup
      title="구역 설정"
      badge={hasSelectedCells ? '2/2' : '1/2'}
      hint={
        hasSelectedCells
          ? `${selectedCellCount}칸 선택됨. 다시 드래그하면 그 영역으로 새로 잡혀요. 이름을 입력하고 추가 버튼을 누르면 저장됩니다.`
          : '이름을 입력하거나 도면을 드래그해서 영역에 해당하는 칸을 선택해주세요. 어느 쪽을 먼저 하셔도 괜찮아요.'
      }
      actions={[
        { label: '취소', variant: 'cancel', onClick: onCancel },
        {
          label: '추가',
          variant: 'submit',
          disabled: !zoneName.trim() || !hasSelectedCells,
          onClick: handleSave,
        },
      ]}
    >
      <div className={styles.nodeAddField}>
        <span className={styles.nodeAddLabel}>구역 이름</span>
        <input
          className={styles.nodeAddInput}
          value={zoneName}
          onChange={(e) => setZoneName(e.target.value)}
          placeholder="3층 앞 복도 구역"
        />
      </div>
    </SidebarPopup>
  );
};

export default ZoneAddPopup;
