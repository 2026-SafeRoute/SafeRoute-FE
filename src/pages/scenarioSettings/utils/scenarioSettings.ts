import type { BasicInfo, PreviewMetric } from '@pages/scenarioSettings/types/scenarioSettings';

import type { ScenarioRouteDiagnosisResponse } from '@apis/__generated__/data-contracts';
import type { Scenario } from '@apis/scenarios/scenarioTypes';

// 시나리오 상세 데이터로 기본 정보 폼의 초기값 구성
export const getInitialBasicInfo = (scenario?: Scenario): BasicInfo => ({
  scenarioName: scenario?.name ?? '',
  targetBuilding: scenario?.buildingId ?? '',
  scheduledAt: scenario?.scheduledAt ?? '',
  expectedParticipants: scenario?.expectedParticipants ? String(scenario.expectedParticipants) : '',
});

// 오늘 날짜의 00시 00분 00초 반환
export const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// 로컬 날짜·시간 입력값을 API 전송용 ISO 문자열로 변환
export const toScheduledAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date < getStartOfToday()) return null;
  return date.toISOString();
};

// 시나리오 실시 일시를 목록 화면용 날짜·시간 문자열로 포맷
export const formatScenarioScheduledAt = (scheduledAt?: string) => {
  if (!scheduledAt) return '일시 미정';
  const date = new Date(scheduledAt);

  if (Number.isNaN(date.getTime())) return scheduledAt;

  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

const formatEstimatedTime = (seconds: number) => {
  if (seconds < 60) return `약 ${seconds}초 후`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds === 0 ? `약 ${minutes}분 후` : `약 ${minutes}분 ${remainingSeconds}초 후`;
};

// 시나리오 진단 예상치 표시
export const getRouteDiagnosisMetrics = (
  diagnosis: ScenarioRouteDiagnosisResponse,
): PreviewMetric[] => {
  const recalculationCount = diagnosis.recalculationCount ?? 0;
  const firstRecalculation = diagnosis.events?.find((event) => event.type === 'RECALCULATED');
  const recalculationTime =
    typeof firstRecalculation?.afterSeconds === 'number'
      ? ` · ${formatEstimatedTime(firstRecalculation.afterSeconds)}`
      : '';
  const blockedTime =
    typeof diagnosis.blockedAfterSeconds === 'number'
      ? formatEstimatedTime(diagnosis.blockedAfterSeconds)
      : '10분 안에 막히지 않음';
  // 대체 경로 부재 경고 강조
  const tone = diagnosis.hasAlternativeRoute === false ? 'danger' : 'default';

  return [
    {
      id: 'route-recalculation',
      label: '경로 재탐색 예상',
      value: `${recalculationCount}회${recalculationTime}`,
      tone,
    },
    {
      id: 'route-blocked',
      label: '경로 막힘 예상',
      value: blockedTime,
      tone,
    },
  ];
};
