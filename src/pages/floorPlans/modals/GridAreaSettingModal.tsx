import { useId, useState } from 'react';

import MapIcon from '@assets/icons/ic-map.svg?react';

import { Button } from '@components/Button';
import EmptyState from '@components/empty';
import Modal from '@components/modal';

import * as styles from './GridAreaSettingModal.css';

interface GridAreaSettingModalProps {
  open: boolean;
  onClose: () => void;
  mapImageUrl: string | null;
  onConfirm: (params: { realWidthM: number; realHeightM: number; cellSizeCm: number }) => void;
  isSubmitting?: boolean;
}

const GridAreaSettingModal = ({
  open,
  onClose,
  mapImageUrl,
  onConfirm,
  isSubmitting = false,
}: GridAreaSettingModalProps) => {
  const [realWidthM, setRealWidthM] = useState('');
  const [realHeightM, setRealHeightM] = useState('');
  const [cellSizeCm, setCellSizeCm] = useState(100);
  const widthInputId = useId();
  const heightInputId = useId();
  const cellSizeInputId = useId();
  const realWidthMValue = Number(realWidthM);
  const realHeightMValue = Number(realHeightM);

  const makeDimensionChangeHandler =
    (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // 중간 입력 상태("20.", ".5")도 허용해서 타이핑이 막히지 않게 함
      if (raw === '' || /^\d*(\.\d*)?$/.test(raw)) setter(raw);
    };

  const handleClose = () => {
    setRealWidthM('');
    setRealHeightM('');
    setCellSizeCm(100);
    onClose();
  };

  const isDimensionsValid =
    Number.isFinite(realWidthMValue) &&
    realWidthMValue > 0 &&
    Number.isFinite(realHeightMValue) &&
    realHeightMValue > 0 &&
    cellSizeCm > 0 &&
    cellSizeCm < 500;

  const handleSubmit = () => {
    if (!isDimensionsValid || isSubmitting) return;
    // 요청이 실패해도 모달이 닫히지 않을 수 있으므로(부모가 open을 유지) 값은 리셋하지 않고 재시도할 수 있게 둠
    onConfirm({
      realWidthM: realWidthMValue,
      realHeightM: realHeightMValue,
      cellSizeCm,
    });
  };

  // 가로/세로(m)가 입력되면 그 실측 비율대로 %로 그려서 도면관리 상세의 실제 그리드 배율과
  // 맞게 보여줌 — background-size %는 요소 자신의 박스 기준으로 계산되므로 미리보기 박스의
  // 실제 px 너비를 몰라도 됨. 아직 입력 전(0 또는 빈 값)에는 셀 크기만으로 대략치를 보여줌
  const hasRealSize = realWidthMValue > 0 && realHeightMValue > 0;
  // background-size에 값을 하나만 주면 height는 'auto'(그라디언트는 intrinsic 크기가 없어 100%로
  // 처리됨)가 되어 세로선이 통째로 한 번만 그려짐(가로선 없이 줄무늬로 보임) — 가로/세로 둘 다 명시
  const approxCellPx = Math.max(6, Math.min(120, cellSizeCm / 5));
  const gridBackgroundSize = hasRealSize
    ? `${cellSizeCm / realWidthMValue}% ${cellSizeCm / realHeightMValue}%`
    : `${approxCellPx}px ${approxCellPx}px`;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      className={styles.wideModal}
      title="그리드 배율 · 실측 크기 설정"
      description="도면의 실제 가로/세로 길이와 그리드 배율을 입력하면 다음 단계에서 도면이 자동 분석됩니다"
      footer={
        <div className={styles.footer}>
          <Button
            variant="ghost"
            className={styles.cancelButton}
            onClick={handleClose}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            className={styles.confirmButton}
            disabled={!isDimensionsValid || isSubmitting}
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            입력하기
          </Button>
        </div>
      }
    >
      <div
        className={styles.preview}
        style={mapImageUrl ? { backgroundImage: `url(${mapImageUrl})` } : undefined}
      >
        {mapImageUrl ? (
          <div
            className={styles.gridOverlay}
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(37,99,235,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,0.25) 1px, transparent 1px)',
              backgroundSize: gridBackgroundSize,
            }}
          />
        ) : (
          <div className={styles.previewEmpty}>
            <EmptyState
              size="compact"
              icon={<MapIcon />}
              title="도면 이미지를 불러올 수 없습니다"
            />
          </div>
        )}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.dimensionFields}>
          <div className={styles.areaField}>
            <label className={styles.fieldLabel} htmlFor={widthInputId}>
              가로 (m)
            </label>
            <div className={styles.areaInputShell}>
              <input
                id={widthInputId}
                className={styles.areaInput}
                type="text"
                inputMode="decimal"
                placeholder="20"
                value={realWidthM}
                onChange={makeDimensionChangeHandler(setRealWidthM)}
              />
              <span className={styles.areaUnit}>m</span>
            </div>
          </div>

          <div className={styles.areaField}>
            <label className={styles.fieldLabel} htmlFor={heightInputId}>
              세로 (m)
            </label>
            <div className={styles.areaInputShell}>
              <input
                id={heightInputId}
                className={styles.areaInput}
                type="text"
                inputMode="decimal"
                placeholder="15"
                value={realHeightM}
                onChange={makeDimensionChangeHandler(setRealHeightM)}
              />
              <span className={styles.areaUnit}>m</span>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.scaleField}>
          <div className={styles.scaleLabelRow}>
            <label className={styles.fieldLabel} htmlFor={cellSizeInputId}>
              그리드 셀 크기
            </label>
            <span className={styles.scaleValue}>{cellSizeCm}cm</span>
          </div>
          <input
            id={cellSizeInputId}
            type="range"
            className={styles.scaleSlider}
            min={1}
            max={499}
            step={1}
            value={cellSizeCm}
            onChange={(e) => setCellSizeCm(Number(e.target.value))}
          />
        </div>
      </div>
    </Modal>
  );
};

export default GridAreaSettingModal;
