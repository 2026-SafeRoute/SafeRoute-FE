import { matchPath, type Location } from 'react-router';

import type { GNBProps } from '@components/gnb/GNB';

import { ROUTES } from '@constants/path';

type GNBConfig = Pick<GNBProps, 'breadcrumbs' | 'title' | 'description'>;

const DEFAULT_GNB_CONFIG = {
  title: 'SAFE ROUTE',
  description: '화재 대피 훈련 관리 시스템',
} as const satisfies GNBConfig;

const SCENARIO_SETTINGS_GNB_CONFIG = {
  title: '시나리오 설정',
  description: '발화 위치와 대피 경로를 설정하고 훈련을 진행합니다',
} as const satisfies GNBConfig;

const GNB_CONFIGS = [
  {
    path: ROUTES.HOME,
    config: {
      title: '홈',
      description: '화재 대피 훈련 현황을 한눈에 확인하세요.',
    },
  },
  {
    path: ROUTES.SCENARIO_CREATE,
    config: SCENARIO_SETTINGS_GNB_CONFIG,
  },
  {
    path: ROUTES.SCENARIO_DETAIL,
    config: SCENARIO_SETTINGS_GNB_CONFIG,
  },
  {
    path: ROUTES.SCENARIO_LIST,
    config: {
      title: '시나리오 설정',
      description: '등록된 훈련 시나리오를 확인하고 관리합니다',
    },
  },
  {
    path: ROUTES.BUILDINGS,
    config: {
      breadcrumbs: [{ label: '관리' }],
      title: '건물 관리',
      description: '등록된 건물과 시설을 관리합니다',
    },
  },
  {
    path: ROUTES.FLOOR_PLANS,
    config: {
      breadcrumbs: [{ label: '관리' }],
      title: '도면 관리',
      description: '등록된 건물별 도면을 확인하고 관리할 수 있습니다',
    },
  },
  {
    path: ROUTES.FLOOR_PLANS_DETAIL,
    config: {
      breadcrumbs: [{ label: '관리' }, { label: '도면 관리' }],
      title: '도면 관리 상세',
      description: '층별 도면을 확인하고 관리합니다',
    },
  },
  {
    // 진행 중인 훈련으로 바로 리다이렉트되는 화면이라 거의 순간적으로만 보임 — 그래도 잠깐
    // 보일 로딩/빈 상태는 카메라 목록(진짜 홈)과 같은 톤으로 맞춰둠
    path: ROUTES.TRAINING_ANALYSIS,
    config: {
      // 더 상위 단계가 없는 화면이라 빈 배열로 둠 — GNB가 이 경우 "훈련 모니터링"(title)
      // 하나만 브레드크럼으로 보여주고, "훈련 모니터링 › 훈련 모니터링"처럼 중복되지 않게 함
      breadcrumbs: [],
      title: '훈련 모니터링',
      description: '진행 중인 훈련의 CCTV 프레임을 실시간으로 확인합니다',
    },
  },
  {
    // 훈련모니터링의 실질적인 첫 화면(더 이상 목록 페이지가 없음) — 위와 같은 이유로 빈 배열
    path: ROUTES.TRAINING_CAMERAS,
    config: {
      breadcrumbs: [],
      title: '훈련 모니터링',
      description: '선택한 훈련에서 카메라별로 수집된 프레임을 확인합니다',
    },
  },
  {
    // 카메라 목록에서 한 단계 더 들어간 화면이라 "훈련 모니터링" 브레드크럼 아래 별도 타이틀을 둠
    path: ROUTES.TRAINING_CAMERA_FRAMES,
    config: {
      breadcrumbs: [{ label: '훈련 모니터링' }],
      title: '영상 상세',
      description: '선택한 카메라의 CCTV 프레임을 확인합니다',
    },
  },
  {
    path: ROUTES.REPORTS,
    config: {
      title: '분석 보고서',
      description: '훈련 분석 보고서를 확인합니다',
    },
  },
] as const satisfies readonly { path: string; config: GNBConfig }[];

export const getGNBConfig = (location: Location): GNBConfig =>
  GNB_CONFIGS.find(({ path }) => matchPath({ path, end: true }, location.pathname))?.config ??
  DEFAULT_GNB_CONFIG;
