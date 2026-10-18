import type { PreviewStatus } from '@pages/scenarioSettings/types/scenarioSettings';

import type { ScenarioResponse } from '@apis/__generated__/data-contracts';
import { SCENARIO_STATUS } from '@apis/scenarios/scenarioTypes';

type FireSpreadSpeed = NonNullable<ScenarioResponse['fireSpreadSpeed']>;

export const SCENARIO_STATUS_FILTER_OPTIONS = [
  { label: '전체 상태', value: 'ALL' },
  { label: '임시저장', value: SCENARIO_STATUS.DRAFT },
  { label: '준비완료', value: SCENARIO_STATUS.READY },
  { label: '진행중', value: SCENARIO_STATUS.IN_PROGRESS },
  { label: '완료', value: SCENARIO_STATUS.COMPLETED },
  { label: '오류', value: SCENARIO_STATUS.ERROR },
  { label: '훈련 실패', value: SCENARIO_STATUS.TIMEOUT_FAILED },
] as const;

export const FIRE_SPREAD_OPTIONS = ['느림', '중간', '빠름'] as const;

export const SCENARIO_NAME_MIN_LENGTH = 2;
export const SCENARIO_NAME_MAX_LENGTH = 20;

export const FIRE_SPREAD_LABEL = {
  SLOW: '느림',
  MEDIUM: '중간',
  FAST: '빠름',
} as const satisfies Record<FireSpreadSpeed, string>;

export type FireSpreadLabel = (typeof FIRE_SPREAD_LABEL)[FireSpreadSpeed];

export const FIRE_SPREAD_VALUE = {
  느림: 'SLOW',
  중간: 'MEDIUM',
  빠름: 'FAST',
} as const satisfies Record<FireSpreadLabel, FireSpreadSpeed>;

export const PREVIEW_STATUS: PreviewStatus = {
  label: '준비 완료',
  color: 'green',
  dot: true,
};

export const PREVIEW_WARNING_STATUS: PreviewStatus = {
  label: '확인 필요',
  color: 'yellow',
  dot: true,
};

export const LIVE_STATUS: PreviewStatus = {
  label: '진행중',
  color: 'green',
  dot: true,
};
