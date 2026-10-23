import { DEVICE_COLOR } from './deviceColors';

// 'iot'는 API 없이 화면에만 찍히는 더미 노드였어서 제거함 — 실제 장비는 CCTV와 유도등뿐
// 'start'는 서버에 남아있을 수 있는 기존 START 타입 노드를 표시하기 위한 값이고, 새 시작
// 후보는 이 타입으로 생성하지 않음 — 문·출입구 노드의 isStartCandidate 플래그만 토글해서
// 지정한다(BE PR #225). 실제 훈련 시작점 선택은 시나리오 설정 화면에서 발화점 셀과 함께 확정한다.
export type PlacingDeviceType = 'cctv' | 'light' | 'door' | 'stair' | 'hallway' | 'start';
export type PlacingEquipmentType = Exclude<
  PlacingDeviceType,
  'door' | 'stair' | 'hallway' | 'start'
>;

export const DEVICE_PLACE_CONFIG: Record<PlacingDeviceType, { label: string; color: string }> = {
  cctv: { label: 'CCTV', color: DEVICE_COLOR.cctv },
  light: { label: '유도등', color: DEVICE_COLOR.light },
  door: { label: '문 · 출입구', color: DEVICE_COLOR.door },
  stair: { label: '계단', color: DEVICE_COLOR.stair },
  hallway: { label: '복도', color: DEVICE_COLOR.hallway },
  // "시작 노드"가 아니라 "시작 후보"로 부름 — 실제 훈련 시작점 확정은 시나리오설정에서 함
  start: { label: '시작 후보', color: DEVICE_COLOR.start },
};

export type AddedDevice = {
  id: string;
  type: 'cctv' | 'iot';
  placeType: PlacingEquipmentType;
  label: string;
  x: number; // %
  y: number; // %
  status: 'online';
  zone: string;
};
