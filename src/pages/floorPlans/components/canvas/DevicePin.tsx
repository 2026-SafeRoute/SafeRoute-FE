import { useRef } from 'react';

import clsx from 'clsx';

import CameraIcon from '@assets/icons/ic-camera.svg?react';
import WifiIcon from '@assets/icons/ic-wifi.svg?react';

import * as styles from './canvas.css';
import { rafThrottle } from '../../utils/rafThrottle';

import type { DeviceMarker } from '../../types/floorPlans';

interface DevicePinProps {
  device: DeviceMarker;
  posX: number;
  posY: number;
  selected: boolean;
  draggable: boolean;
  onClick: () => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

const DevicePin = ({
  device,
  posX,
  posY,
  selected,
  draggable,
  onClick,
  onDragEnd,
}: DevicePinProps) => {
  const isDragging = useRef(false);
  const didMove = useRef(false);

  const isOffline = device.status === 'offline';
  const markerClass = clsx(
    styles.markerCircle,
    device.type === 'cctv'
      ? isOffline
        ? styles.markerCctvOffline
        : styles.markerCctv
      : styles.markerIot,
    selected && styles.markerSelected,
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable) return;
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    didMove.current = false;

    // 마커의 바로 위 부모(구역 드래그 중 포인터 이벤트만 끄는 레이어)는 일부러 position을
    // 안 걸어둬서 자식이 전부 absolute면 높이가 0으로 찌그러짐 — 그 부모 기준으로 %를 계산하면
    // rect.height가 0이라 세로 좌표가 전부 위/아래 끝으로 튐(수정 중 위치를 옮기면 마커가
    // 캔버스 맨 위로 튀던 버그의 원인). 실제 좌표 기준인 mapWrap(그 부모의 부모)을 써야 함
    const container = (e.currentTarget as HTMLElement).parentElement?.parentElement;
    if (!container) return;
    let lastPoint: { x: number; y: number } | null = null;
    const applyMove = rafThrottle((x: number, y: number) => onDragEnd(device.id, x, y));

    const onMove = (mv: MouseEvent) => {
      if (!isDragging.current) return;
      didMove.current = true;
      const rect = container.getBoundingClientRect();
      const rawX = ((mv.clientX - rect.left) / rect.width) * 100;
      const rawY = ((mv.clientY - rect.top) / rect.height) * 100;
      const clampedX = Math.max(0, Math.min(100, rawX));
      const clampedY = Math.max(0, Math.min(100, rawY));
      lastPoint = { x: clampedX, y: clampedY };
      applyMove(clampedX, clampedY);
    };

    const onUp = () => {
      isDragging.current = false;
      // 마지막 프레임이 아직 예약된 상태로 끊기지 않도록, 대기 중이던 갱신은 취소하고
      // 마지막 좌표를 바로 반영해 마우스를 뗀 위치와 어긋나지 않게 함
      applyMove.cancel();
      if (lastPoint) onDragEnd(device.id, lastPoint.x, lastPoint.y);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={device.label}
      className={styles.markerWrap}
      style={{
        left: `${posX}%`,
        top: `${posY}%`,
        cursor: draggable ? 'grab' : 'pointer',
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        if (didMove.current) {
          e.stopPropagation();
          return;
        }
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className={styles.markerPin}>
        <div className={markerClass}>
          {device.type === 'cctv' ? (
            <CameraIcon width={12} height={12} aria-hidden="true" />
          ) : (
            <WifiIcon width={12} height={12} aria-hidden="true" />
          )}
        </div>
      </div>
      {selected && (
        <span className={clsx(styles.markerLabel, styles.markerLabelPin)}>{device.label}</span>
      )}
    </div>
  );
};

export default DevicePin;
