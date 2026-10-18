import { formatAreaM2 } from '@utils/format';

import type { Cctv } from '../api/cctvApi';
import type { DeviceType } from '../types/floorPlans';
import type { PanelItem } from '../types/panelItem';

// CCTV 등록·시야 재선택·수정 세 곳에서 카드에 보여줄 "모니터링 N칸 · M㎡" 문구를 각자 다시
// 조립하면 한 줄이 100자를 넘기기 쉽고 표현도 어긋나기 쉬워 하나로 합침
export const formatMonitoredZone = (
  cctv: Pick<Cctv, 'monitoredGridCellCount' | 'monitoredAreaM2'>,
) => `모니터링 ${cctv.monitoredGridCellCount}칸 · ${formatAreaM2(cctv.monitoredAreaM2)}㎡`;

// "설치 위치" 카드 행 — CCTV는 감시 영역에서 계산한 실제 값(zone)이 있지만, 유도등은 그런
// 백엔드 필드가 없어(등록 팝업의 "설치 위치" 입력은 저장 API로 나가지 않음) 새로고침하면
// 사라지고 고정 문구로 되돌아가던 값이었음 — 대신 이미 갖고 있는 실제 좌표를 보여줘서
// 최소한 의미 있는 값이 뜨게 함
export const formatInstallLocation = (
  type: PanelItem['type'],
  x: number,
  y: number,
  zone: string,
) => (type === 'cctv' ? zone : `X ${Math.round(x)}% · Y ${Math.round(y)}%`);

// 도면 마커의 DeviceType('cctv'|'iot'|'fire')을 패널 필터 체계(PanelItem.type)로 변환.
// 두 군데(패널 목록 만들 때, 지도 클릭으로 필터 이동할 때)에서 각각 다시 구현하면 인식 못하는
// 값의 처리(fallback)가 서로 어긋날 수 있어 하나로 합침
export const deviceTypeToPlaceType = (type: DeviceType): PanelItem['type'] => {
  if (type === 'cctv') return 'cctv';
  if (type === 'iot') return 'light';
  return 'general';
};

// deviceTypeFilter(하위 필터 칩)는 'general' 칩이 따로 없어서, 그 값은 필터 해제(null)로 흡수함 —
// 위 매핑에서 파생시켜 fallback이 서로 다른 두 벌의 변환 로직으로 갈라지지 않게 함
export const deviceTypeToFilterChip = (type: DeviceType): 'cctv' | 'light' | null => {
  const placeType = deviceTypeToPlaceType(type);
  return placeType === 'general' ? null : placeType;
};
