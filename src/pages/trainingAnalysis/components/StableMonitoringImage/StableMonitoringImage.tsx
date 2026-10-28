import { memo } from 'react';
import type { ImgHTMLAttributes } from 'react';

// 새 presigned URL을 받아 실제 이미지가 바뀌기 전에 갱신할 여유 시간
const URL_REFRESH_BUFFER_MS = 30_000;

interface StableMonitoringImageProps {
  resourceKey: string;
  src: string;
  expiresAt: number | null;
  alt: string;
  className?: string;
  loading?: ImgHTMLAttributes<HTMLImageElement>['loading'];
}

// 카메라·프레임 조회 때마다 동일한 이미지에도 새 presigned URL이 내려올 수 있음. 그대로 <img>
// src에 넣으면 브라우저는 다른 URL로 판단해 이미 표시한 프레임까지 반복 다운로드하므로, 논리적인
// 이미지 키가 같고 현재 URL이 유효한 동안에는 기존 src를 유지함
const StableMonitoringImage = memo(
  ({ src, alt, className, loading }: StableMonitoringImageProps) => (
    <img src={src} alt={alt} className={className} loading={loading} />
  ),
  (previous, next) => {
    if (
      previous.resourceKey !== next.resourceKey ||
      previous.alt !== next.alt ||
      previous.className !== next.className ||
      previous.loading !== next.loading
    ) {
      return false;
    }

    if (previous.src === next.src) return true;
    if (previous.expiresAt === null) return next.expiresAt === null;

    return previous.expiresAt > Date.now() + URL_REFRESH_BUFFER_MS;
  },
);

StableMonitoringImage.displayName = 'StableMonitoringImage';

export default StableMonitoringImage;
