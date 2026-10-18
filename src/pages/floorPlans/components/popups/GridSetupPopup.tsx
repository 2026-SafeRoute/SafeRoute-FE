import * as styles from './popup.css';
import SidebarPopup from './SidebarPopup';

interface GridSetupPopupProps {
  // 슬라이더 입력값(cm) — 부모가 업로드 때 정한 값으로 미리 채워둠
  cellSizeCm: string;
  onCellSizeChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/* ── 그리드 설정 팝업 — CCTV 등록·구역 추가 전에 그리드가 없으면 셀 크기부터 받음 ── */
const GridSetupPopup = ({
  cellSizeCm,
  onCellSizeChange,
  onCancel,
  onConfirm,
}: GridSetupPopupProps) => {
  const isValid = Number(cellSizeCm) > 0 && Number(cellSizeCm) < 500;

  return (
    <SidebarPopup
      title="그리드 설정 필요"
      hint="이 층에는 아직 그리드가 없어요. 셀 크기를 정하고 설정해주세요."
      actions={[
        { label: '취소', variant: 'cancel', onClick: onCancel },
        { label: '설정', variant: 'submit', disabled: !isValid, onClick: onConfirm },
      ]}
    >
      <div className={styles.nodeAddField}>
        <div className={styles.gridSizeLabelRow}>
          <span className={styles.nodeAddLabel}>셀 크기</span>
          <span className={styles.gridSizeValue}>{Number(cellSizeCm || 1)}cm</span>
        </div>
        <input
          type="range"
          className={styles.gridSizeSlider}
          aria-label="그리드 셀 크기(cm)"
          min={1}
          max={499}
          step={1}
          value={Number(cellSizeCm || 1)}
          onChange={(e) => onCellSizeChange(e.target.value)}
        />
      </div>
    </SidebarPopup>
  );
};

export default GridSetupPopup;
