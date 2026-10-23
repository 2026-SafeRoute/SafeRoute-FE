import CameraIcon from '@assets/icons/ic-camera.svg?react';
import ChevronRightIcon from '@assets/icons/ic-chevron-right.svg?react';

import StatusBadge from '@components/chip/StatusBadge';
import type { StatusBadgeColor } from '@components/chip/StatusBadge';

import * as styles from './CameraCard.css';
import { CONGESTION_LEVEL_LABEL } from '../../types/trainingAnalysis';
import { formatCapturedTime } from '../../utils/trainingAnalysis';

import type { CctvCurrentState, MonitoringCamera } from '../../types/trainingAnalysis';

// 혼잡 단계별 배지 색 — 세션 상태 배지(진행 중=yellow 등)와 겹치지 않게 정상은 green으로 둠
const CONGESTION_BADGE_COLOR: Record<
  NonNullable<CctvCurrentState['congestionLevel']>,
  StatusBadgeColor
> = {
  NORMAL: 'green',
  CAUTION: 'yellow',
  CROWDED: 'red',
  VERY_CROWDED: 'red',
};

interface CameraCardProps {
  camera: MonitoringCamera;
  currentState?: CctvCurrentState;
  onClick: (camera: MonitoringCamera) => void;
}

// 훈련 종료 후 카메라별 최신 캡처 프레임을 보여주는 카드.
// LIVE/fps 같은 실시간 스트리밍 지표는 API에 없어서 캡처 시각만 표시함
//
// camera.capturedAt/thumbnailUrl은 "이미지가 첨부된 프레임이 있는지"만 알려줌 — 실측으로 확인함:
// 관측치에 monitoringImageKey 없이 보내면(장비가 이미지 업로드에 실패했거나 원래 텍스트만 보내는
// 경우) 프레임 데이터(인원수·밀집도 등)는 정상 저장되는데도 이 값은 계속 null임. 그래서
// capturedAt이 null이라고 "프레임이 아예 없다"고 단정해 카드를 비활성화하면, 실제로는 조회 가능한
// 데이터가 있는 카메라도 눌러볼 수 없게 됨 — 상세 페이지(TrainingCameraFramesPage)는 이미지 없는
// 프레임도 문제없이 보여주므로(포스터 자리에 "이미지 준비 중…"만 뜸) 여기서는 항상 눌러볼 수 있게
// 하고, 진짜 프레임이 하나도 없는 경우는 상세 페이지 자체의 빈 상태("저장된 프레임이 없습니다")가
// 처리하게 맡김
const CameraCard = ({ camera, currentState, onClick }: CameraCardProps) => {
  const hasThumbnail = camera.capturedAt !== null;
  const capturedTime = formatCapturedTime(camera.capturedAt);

  // [촬영용] stale(갱신 지연) 판정만 무시 — 서버 stale/lastDetectedAt이 REST 폴링과 WS 사이에서
  // 계속 엇갈려 '갱신 지연' ↔ 혼잡 배지가 5초 주기로 깜빡였음. 혼잡 단계 값이 오면 그대로 보여주고,
  // 아직 값이 없을 때만 '정보 없음'을 표시한다.
  const congestionBadge = !currentState?.congestionLevel
    ? { label: '정보 없음', color: 'neutral' as const }
    : {
        label: CONGESTION_LEVEL_LABEL[currentState.congestionLevel],
        color: CONGESTION_BADGE_COLOR[currentState.congestionLevel],
      };

  return (
    <button type="button" className={styles.card} onClick={() => onClick(camera)}>
      <div className={styles.thumb}>
        {currentState ? (
          <StatusBadge
            className={styles.congestionBadge}
            label={congestionBadge.label}
            color={congestionBadge.color}
            dot
          />
        ) : null}
        {hasThumbnail ? (
          <>
            {camera.thumbnailUrl ? (
              <img
                className={styles.thumbImg}
                src={camera.thumbnailUrl}
                alt={`${camera.name} 최신 캡처 프레임`}
                loading="lazy"
              />
            ) : (
              <span className={styles.thumbPlaceholder} aria-hidden="true" />
            )}
            {/* 사진 위에 시각 배지가 바로 얹히면 사진에 따라 잘 안 보일 수 있어 아래쪽에
                옅은 그라데이션을 깔아 항상 읽히게 함 */}
            <span className={styles.thumbScrim} aria-hidden="true" />
            {capturedTime ? <span className={styles.timeBadge}>{capturedTime}</span> : null}
          </>
        ) : (
          <div className={styles.thumbEmpty}>
            <CameraIcon width={20} height={20} className={styles.thumbEmptyIcon} />
            <span className={styles.noFrame}>썸네일 준비 중</span>
          </div>
        )}
      </div>

      <div className={styles.info}>
        <div className={styles.infoText}>
          <div className={styles.name}>{camera.name}</div>
          <div className={styles.location}>{camera.location}</div>
        </div>
        <span className={styles.link}>
          영상 분석 보기
          <ChevronRightIcon width={12} height={12} className={styles.linkIcon} />
        </span>
      </div>
    </button>
  );
};

export default CameraCard;
