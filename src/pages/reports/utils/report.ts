import type { ReportResponse } from '@apis/__generated__/data-contracts';

import { formatDuration } from '@utils/format';

import type {
  RecommendationItem,
  ReportScoreColor,
  ReportScoreItem,
  ReportSummary,
  TrendPoint,
} from '../types/report';

const toPercent = (value: number) => (value <= 1 ? value * 100 : value);

const toScoreItem = (
  label: string,
  weight: string,
  score: number | undefined,
  color: ReportScoreColor,
): ReportScoreItem | null =>
  score === undefined ? null : { label, weight, score: Math.round(toPercent(score)), color };

const isNotNull = <T>(value: T | null): value is T => value !== null;

export const getReportPdfFileName = (trainingName?: string) => {
  const date = new Date();
  const dateText = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((value) => String(value).padStart(2, '0'))
    .join('');
  const safeTrainingName = trainingName?.replace(/[\\/:*?"<>|]/g, '').trim();

  return `SafeRoute_${safeTrainingName || '훈련분석보고서'}_${dateText}.pdf`;
};

export const formatTrainingDate = (value?: string) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
};

export const toReportSummary = (report: ReportResponse): ReportSummary => ({
  grade: report.grade ?? '-',
  scoreText:
    report.overallScore === undefined ? '- / 100점' : `${report.overallScore.toFixed(1)} / 100점`,
});

export const toReportScores = (report: ReportResponse): ReportScoreItem[] =>
  [
    toScoreItem('대피 성공률', '30%', report.survivalRate, 'success'),
    toScoreItem('평균 대피 시간', '35%', report.evacuationScore, 'primary'),
    toScoreItem('병목 회피율', '20%', report.bottleneckScore, 'primary'),
    toScoreItem('경로 이탈률', '15%', report.deviationScore, 'primary'),
  ].filter(isNotNull);

export const toCumulativeEvacuation = (report: ReportResponse): TrendPoint[] =>
  (report.charts?.cumulativeEvacuation ?? []).flatMap((point) =>
    point.elapsedSec === undefined || point.cumulativeCount === undefined
      ? []
      : [{ label: formatDuration(point.elapsedSec), value: point.cumulativeCount }],
  );

export const toRecentEvacuationTimes = (report: ReportResponse): TrendPoint[] =>
  (report.charts?.recentEvacuationTimes ?? []).flatMap((point) =>
    point.ordinal === undefined || point.evacuationSec === undefined
      ? []
      : [{ label: `${point.ordinal}회`, value: point.evacuationSec }],
  );

const priorityMap = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export const toRecommendations = (report: ReportResponse): RecommendationItem[] =>
  (report.recommendations ?? []).flatMap((item, index) =>
    item.priority && item.title && item.description
      ? [
          {
            id: `${item.priority}-${index}`,
            level: priorityMap[item.priority],
            title: item.title,
            description: item.description,
          },
        ]
      : [],
  );
