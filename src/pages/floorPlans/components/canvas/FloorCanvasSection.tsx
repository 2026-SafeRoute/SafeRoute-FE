import type { Dispatch, ReactNode, SetStateAction } from 'react';

import clsx from 'clsx';

import AlertIcon from '@assets/icons/ic-alert.svg?react';
import CheckIcon from '@assets/icons/ic-check.svg?react';
import ChevronRightIcon from '@assets/icons/ic-chevron-right.svg?react';

import { formatFloor } from '@utils/floor';

import * as styles from './canvas.css';
import NodeTypeLegendInfo from '../NodeTypeLegendInfo';

import type { Floor } from '../../types/floorPlans';

interface FloorCanvasSectionProps {
  currentFloor: Floor | null;
  buildingName: string;
  onBack: () => void;
  // 캔버스 우상단 "+ 추가" 메뉴 — 분석이 끝난 층에서만 보임
  addMenu: ReactNode;
  // 경로 진단 결과 — 통과(true)·미통과(false)·아직 없음(undefined)
  diagnosisReady: boolean | undefined;
  isDiagnosisHighlighted: boolean;
  zoom: number;
  onZoomChange: Dispatch<SetStateAction<number>>;
  // 스크롤 영역 안에 그릴 도면 캔버스(또는 로딩·빈 상태)
  children: ReactNode;
}

/* ── 중앙 캔버스 영역 — 헤더, 추가 메뉴, 진단 결과 알림, 도면, 범례·줌 컨트롤 ── */
const FloorCanvasSection = ({
  currentFloor,
  buildingName,
  onBack,
  addMenu,
  diagnosisReady,
  isDiagnosisHighlighted,
  zoom,
  onZoomChange: setZoom,
  children,
}: FloorCanvasSectionProps) => (
  <div className={styles.canvasArea}>
    {currentFloor && (
      <div className={styles.canvasHeader}>
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
          aria-label="도면 관리 목록으로"
        >
          <ChevronRightIcon width={16} height={16} className={styles.backButtonIcon} />
        </button>
        <span className={styles.canvasHeaderText}>{buildingName}</span>
        <span className={styles.canvasHeaderFloor}>{formatFloor(currentFloor.floorNum)}</span>
      </div>
    )}

    <div
      className={clsx(
        styles.canvasBody,
        currentFloor?.segmentationStatus === 'DONE' && styles.canvasBodyWithActions,
      )}
    >
      {/* 그리드는 이제 토글 없이 항상 표시함(아래 ensureFloorGridCells 자동 조회 효과 참고) */}
      {currentFloor?.segmentationStatus === 'DONE' && (
        <div className={styles.canvasTopRightRow}>{addMenu}</div>
      )}

      {(diagnosisReady === true || (isDiagnosisHighlighted && diagnosisReady === false)) && (
        <div
          className={styles.canvasDiagnosisAlert({
            tone: diagnosisReady ? 'success' : 'danger',
          })}
          role={diagnosisReady ? 'status' : 'alert'}
        >
          <span
            className={styles.canvasDiagnosisAlertIcon({
              tone: diagnosisReady ? 'success' : 'danger',
            })}
            aria-hidden="true"
          >
            {diagnosisReady ? (
              <CheckIcon width={12} height={12} />
            ) : (
              <AlertIcon width={12} height={12} />
            )}
          </span>
          <span className={styles.canvasDiagnosisAlertMessage}>
            {diagnosisReady
              ? '모든 시작 후보가 2곳 이상의 탈출구와 연결되어 있어요.'
              : '빨간색 노드는 탈출구로 이어지는 경로가 없어요. 가까운 노드와 엣지로 연결해 주세요.'}
          </span>
        </div>
      )}

      <div className={styles.canvasScrollArea}>{children}</div>
    </div>

    {/* 캔버스 우하단 — 범례 정보 아이콘을 줌 컨트롤 바로 위에 세로로 쌓음 */}
    <div className={styles.canvasBottomRightColumn}>
      {currentFloor?.segmentationStatus === 'DONE' && (
        <NodeTypeLegendInfo diagnosisVisible={isDiagnosisHighlighted} />
      )}
      <div className={styles.canvasZoomFloat}>
        <button
          type="button"
          className={styles.zoomButton}
          onClick={() => setZoom((v) => Math.max(50, v - 10))}
          disabled={zoom <= 50}
          aria-label="축소"
        >
          −
        </button>
        <button
          type="button"
          className={zoom !== 100 ? styles.zoomValueClickable : styles.zoomValue}
          onClick={() => setZoom(100)}
          title={zoom !== 100 ? '클릭해서 100% 리셋' : undefined}
        >
          {zoom}%
        </button>
        <button
          type="button"
          className={styles.zoomButton}
          onClick={() => setZoom((v) => Math.min(200, v + 10))}
          disabled={zoom >= 200}
          aria-label="확대"
        >
          +
        </button>
      </div>
    </div>
  </div>
);

export default FloorCanvasSection;
