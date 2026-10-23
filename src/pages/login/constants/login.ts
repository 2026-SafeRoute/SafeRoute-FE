import type { FunctionComponent, SVGProps } from 'react';

import CameraIcon from '@assets/icons/ic-camera.svg?react';
import SparklesIcon from '@assets/icons/ic-sparkles.svg?react';
import WifiIcon from '@assets/icons/ic-wifi.svg?react';

type LoginFeatureIcon = FunctionComponent<SVGProps<SVGSVGElement>>;

interface LoginFeature {
  title: string;
  Icon: LoginFeatureIcon;
}

export const LOGIN_FEATURES = [
  {
    title: 'CCTV AI 비전 분석',
    Icon: CameraIcon,
  },
  {
    title: 'IoT 유도등 대피 안내',
    Icon: WifiIcon,
  },
  {
    title: 'AI 자동 평가 보고서 생성',
    Icon: SparklesIcon,
  },
] as const satisfies readonly LoginFeature[];
