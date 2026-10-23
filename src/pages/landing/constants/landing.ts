import type { FunctionComponent, SVGProps } from 'react';

import CameraIcon from '@assets/icons/ic-camera.svg?react';
import LayersIcon from '@assets/icons/ic-layers.svg?react';
import MapIcon from '@assets/icons/ic-map.svg?react';
import WifiIcon from '@assets/icons/ic-wifi.svg?react';

type FeatureTone = 'blue' | 'purple' | 'green' | 'yellow';
type FeatureIcon = FunctionComponent<SVGProps<SVGSVGElement>>;

interface LandingFeature {
  title: string;
  description: string;
  Icon: FeatureIcon;
  tone: FeatureTone;
}

export const LANDING_FEATURES = [
  {
    title: '실시간 CCTV 모니터링',
    description: 'AI 비전 분석을 통한 실시간 군중 밀집도 모니터링',
    Icon: CameraIcon,
    tone: 'blue',
  },
  {
    title: 'IoT 유도등 연동',
    description: '도면에 유도등을 등록하고 대피 안내 방향 관리',
    Icon: WifiIcon,
    tone: 'purple',
  },
  {
    title: 'AI 기반 경로 분석',
    description: '혼잡 상황에 따른 대피 경로 재탐색 및 권장 경로 검토',
    Icon: MapIcon,
    tone: 'green',
  },
  {
    title: '도면 기반 훈련 설정',
    description: '층별 도면과 발화 위치를 바탕으로 훈련 시나리오 구성',
    Icon: LayersIcon,
    tone: 'yellow',
  },
] as const satisfies readonly LandingFeature[];
