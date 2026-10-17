import { useCallback, useRef, useState } from 'react';

import clsx from 'clsx';

import InfoIcon from '@assets/icons/ic-info.svg?react';

import useClickOutside from '@hooks/useClickOutside';

import * as styles from '../FloorPlansDetailPage.css';

/* ── 노드/구역 종류 안내 — 인포 아이콘을 눌렀을 때만 팝오버로 보여주고 바깥을 클릭하면 닫힘
   (항상 떠 있는 범례가 도면을 가린다는 피드백을 받아 지도 툴들에서 흔한 "on-demand 팝오버"
   패턴으로 바꿈) ── */
interface NodeTypeLegendInfoProps {
  diagnosisVisible?: boolean;
}

const NodeTypeLegendInfo = ({ diagnosisVisible = false }: NodeTypeLegendInfoProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(
    containerRef,
    open,
    useCallback(() => setOpen(false), []),
  );

  return (
    <div ref={containerRef} className={styles.legendInfoContainer}>
      <button
        type="button"
        className={styles.legendInfoButton}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="노드·구역 표시 안내"
        onClick={() => setOpen((prev) => !prev)}
      >
        <InfoIcon width={18} height={18} />
      </button>

      {open && (
        <div className={styles.legendPopover} role="dialog" aria-label="노드·구역 표시 안내">
          <div className={styles.nodeTypeLegendSection}>
            <span className={styles.zoneLegendTitle}>노드 종류</span>
            <div className={styles.zoneLegendItem}>
              <span className={styles.nodeTypeCctvBadge}>CC</span>
              <span className={styles.zoneLegendLabel}>CCTV</span>
            </div>
            <div className={styles.zoneLegendItem}>
              <span className={clsx(styles.nodeTypeDot, styles.nodeTypeDotLight)} />
              <span className={styles.zoneLegendLabel}>유도등</span>
            </div>
            <div className={styles.zoneLegendItem}>
              <span className={clsx(styles.nodeTypeDot, styles.nodeTypeDotDoor)} />
              <span className={styles.zoneLegendLabel}>문 · 출입구</span>
            </div>
            <div className={styles.zoneLegendItem}>
              <span className={clsx(styles.nodeTypeDot, styles.nodeTypeDotStair)} />
              <span className={styles.zoneLegendLabel}>계단</span>
            </div>
            <div className={styles.zoneLegendItem}>
              <span className={clsx(styles.nodeTypeDot, styles.nodeTypeDotHallway)} />
              <span className={styles.zoneLegendLabel}>복도</span>
            </div>
            <div className={styles.zoneLegendItem}>
              <span className={clsx(styles.nodeTypeDot, styles.nodeTypeDotStart)} />
              <span className={styles.zoneLegendLabel}>시작 후보</span>
            </div>
          </div>

          <div className={styles.nodeTypeLegendDivider} />

          <div className={styles.nodeTypeLegendSection}>
            <span className={styles.zoneLegendTitle}>구역 종류</span>
            <div className={styles.zoneLegendItem}>
              <span className={clsx(styles.nodeTypeAreaSwatch, styles.nodeTypeAreaSwatchGeneral)} />
              <span className={styles.zoneLegendLabel}>일반 구역</span>
            </div>
            <div className={styles.zoneLegendItem}>
              <span className={clsx(styles.nodeTypeAreaSwatch, styles.nodeTypeAreaSwatchCamera)} />
              <span className={styles.zoneLegendLabel}>카메라 시야</span>
            </div>
          </div>

          {diagnosisVisible && (
            <>
              <div className={styles.nodeTypeLegendDivider} />
              <div className={styles.nodeTypeLegendSection}>
                <span className={styles.zoneLegendTitle}>진단 결과</span>
                <div className={styles.zoneLegendItem}>
                  <span
                    className={clsx(
                      styles.diagnosisLegendMarker,
                      styles.diagnosisLegendMarkerDanger,
                    )}
                    aria-hidden="true"
                  >
                    <span
                      className={clsx(styles.diagnosisLegendNode, styles.diagnosisLegendNodeDanger)}
                    />
                  </span>
                  <span className={styles.zoneLegendLabel}>출구와 끊긴 노드</span>
                </div>
                <div className={styles.zoneLegendItem}>
                  <span
                    className={clsx(
                      styles.diagnosisLegendMarker,
                      styles.diagnosisLegendMarkerWarning,
                    )}
                    aria-hidden="true"
                  >
                    <span
                      className={clsx(styles.diagnosisLegendNode, styles.diagnosisLegendNodeStart)}
                    />
                  </span>
                  <span className={styles.zoneLegendLabel}>탈출구가 1곳 이하인 시작 후보</span>
                </div>
                <div className={styles.zoneLegendItem}>
                  <span
                    className={clsx(
                      styles.diagnosisLegendMarker,
                      styles.diagnosisLegendMarkerNeutral,
                    )}
                    aria-hidden="true"
                  >
                    <span
                      className={clsx(styles.diagnosisLegendNode, styles.diagnosisLegendNodeStair)}
                    >
                      ▲
                    </span>
                  </span>
                  <span className={styles.zoneLegendLabel}>탈출구 미지정 계단</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NodeTypeLegendInfo;
