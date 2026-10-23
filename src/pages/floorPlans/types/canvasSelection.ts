import type { DeviceMarker } from './floorPlans';

export type SelectedItem = { kind: 'device'; data: DeviceMarker };

export type ZoneType = 'general';

export type ZoneRect = { x: number; y: number; w: number; h: number };

// cellIds가 실제 저장 단위(백엔드 UserZone은 그리드 셀 집합) — rect는 드래그 중 임시 표시에만 씀
export type ZoneEntry = { id: string; type: ZoneType; label: string; cellIds: string[] };

export type ZoneRefSelection = { kind: 'node'; id: string } | { kind: 'zone'; id: string };
