import clsx from 'clsx';

import CameraIcon from '@assets/icons/ic-camera.svg?react';

import * as styles from './CameraSidebar.css';
import { groupCamerasByFloor } from '../../utils/trainingAnalysis';
import StableMonitoringImage from '../StableMonitoringImage/StableMonitoringImage';

import type { MonitoringCamera } from '../../types/trainingAnalysis';

interface CameraSidebarProps {
  cameras: MonitoringCamera[];
  activeCctvId: string;
  onSelect: (camera: MonitoringCamera) => void;
}

// 상세 화면에서 "다른 카메라"로 넘어가는 자리 — 이전엔 상단 가로 탭이었는데, 건물 하나에
// 카메라가 여러 층 여러 대 있을 수 있는 걸 감안하면 가로 탭은 몇 개만 넘어도 잘려서 스크롤을
// 해야 하고 "몇 대가 더 있는지" 한눈에 안 보임. 실제 CCTV 관제 화면들이 흔히 쓰는 형태(왼쪽
// 세로 카메라 목록, 층별로 묶어서)로 바꿔서 목록 전체를 한 번에 훑을 수 있게 함.
//
// camera.capturedAt은 "이미지가 첨부된 프레임이 있는지"만 나타냄(CameraCard와 동일 — 실측
// 확인됨) — 그래서 여기서도 없다고 비활성화하지 않고, 대신 옆 점 색으로만 참고 정보를 줌
const CameraSidebar = ({ cameras, activeCctvId, onSelect }: CameraSidebarProps) => {
  const floorGroups = groupCamerasByFloor(cameras);

  return (
    <nav className={styles.sidebar} aria-label="카메라 선택">
      {floorGroups.map(([floorName, floorCameras]) => (
        <div key={floorName} className={styles.group}>
          <span className={styles.groupLabel}>{floorName}</span>
          {floorCameras.map((camera) => {
            const active = camera.cctvId === activeCctvId;
            const hasThumbnail = camera.capturedAt !== null;
            return (
              <button
                key={camera.cctvId}
                type="button"
                aria-current={active ? 'page' : undefined}
                className={clsx(styles.item, active && styles.itemActive)}
                onClick={() => onSelect(camera)}
              >
                <span className={styles.itemThumb}>
                  {camera.thumbnailUrl ? (
                    <StableMonitoringImage
                      src={camera.thumbnailUrl}
                      resourceKey={`${camera.cctvId}:${camera.capturedAt ?? 'unknown'}`}
                      expiresAt={camera.urlExpiresAt}
                      alt=""
                      className={styles.itemThumbImg}
                    />
                  ) : (
                    <CameraIcon width={14} height={14} className={styles.itemThumbIcon} />
                  )}
                </span>
                <span className={styles.itemText}>
                  <span className={styles.itemCodeRow}>
                    <span
                      className={clsx(styles.itemStatusDot, hasThumbnail && styles.itemStatusDotOn)}
                      aria-hidden="true"
                    />
                    <span className={styles.srOnly}>
                      {hasThumbnail ? '최근 프레임 있음' : '최근 프레임 없음'}
                    </span>
                    <span className={styles.itemCode}>{camera.code}</span>
                  </span>
                  <span className={styles.itemLocation}>{camera.location}</span>
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
};

export default CameraSidebar;
