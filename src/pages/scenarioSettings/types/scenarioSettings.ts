import type { NodePoint } from '@apis/__generated__/data-contracts';

import type { StatusBadgeColor } from '@components/chip/StatusBadge';

export interface BasicInfo {
  scenarioName: string;
  targetBuilding: string;
  scheduledAt: string;
  expectedParticipants: string;
}

export interface PreviewMetric {
  id: string;
  label: string;
  value: string;
  tone?: 'default' | 'danger';
}

export interface PreviewStatus {
  label: string;
  color: StatusBadgeColor;
  dot?: boolean;
}

// 서버 current-route 좌표를 도면에 그릴 때 필요한 필드만 필수로 좁힌 렌더링 타입
export type RoutePoint = Required<Pick<NodePoint, 'x' | 'y'>>;
