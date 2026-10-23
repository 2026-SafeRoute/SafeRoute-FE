import { DEVICE_COLOR } from './deviceColors';
import * as styles from '../components/panel/panelCard.css';

import type { MapNodeType } from '../api/mapGraphApi';

/* 도면 위 구조 노드 — 실제 API의 MapNodeResponse.type(DOOR/STAIR 등)과 대응되는 점 좌표 노드.
   isFinalExit은 계단에서만 의미 있음(문/출입구는 층 사이를 잇는 탈출 경로가 아니라 최종
   탈출구로 지정할 수 없음. 복도·시작 후보도 항상 false — 시작 후보는 서버가
   isExitTarget=false로 강제 저장함). 'start' 타입은 서버에 남아있을 수 있는 기존 START
   노드를 표시하기 위한 값이고, 새 시작 후보는 문·출입구 노드의 isStartCandidate 플래그만
   토글해서 지정한다(BE PR #225) — 층 단위로 등록해두는 후보일 뿐, 실제 "이 시나리오의
   시작점" 확정은 시나리오 설정에서 발화점 셀과 함께 처리함) */
export type StructureNodeType = 'door' | 'stair' | 'hallway' | 'start';

export type StructureNode = {
  id: string;
  type: StructureNodeType;
  x: number;
  y: number;
  isFinalExit: boolean;
  // DOOR 노드를 훈련 시작 후보로 지정했는지 (문 카드에서 토글). 그 외 타입은 항상 false
  isStartCandidate: boolean;
};

export const STRUCTURE_NODE_LABEL: Record<StructureNodeType, string> = {
  door: '문 · 출입구',
  stair: '계단',
  hallway: '복도',
  start: '시작 후보',
};

// 구조 노드 여부 판정 — STRUCTURE_NODE_LABEL을 단일 소스로 삼아, 새 구조 노드 타입이 추가될 때
// 이 판정만 따로 놓쳐서 어긋나는 일이 없게 함
export const isStructureNodeType = (type: string): type is StructureNodeType =>
  type in STRUCTURE_NODE_LABEL;

// 구조 노드 ↔ 맵그래프 노드 타입 매핑 (API MapNodeResponse.type)
export const STRUCTURE_NODE_API_TYPE = {
  door: 'DOOR',
  stair: 'STAIR',
  hallway: 'HALLWAY',
  start: 'START',
} as const satisfies Record<StructureNodeType, MapNodeType>;

export const API_TYPE_TO_STRUCTURE: Partial<Record<MapNodeType, StructureNodeType>> = {
  DOOR: 'door',
  STAIR: 'stair',
  HALLWAY: 'hallway',
  START: 'start',
  // 최종 탈출구로 지정하면 서버 노드 타입이 EXIT로 올라옴 — 편집기에선 계속 계단 카드로 다뤄
  // '최종 탈출구' 배지·해제 토글이 유지되게 함(해제 시 STAIR로 복원)
  EXIT: 'stair',
};

export const STRUCTURE_NODE_COLOR: Record<StructureNodeType, string> = {
  door: DEVICE_COLOR.door,
  stair: DEVICE_COLOR.stair,
  hallway: DEVICE_COLOR.hallway,
  start: DEVICE_COLOR.start,
};

// 우측 패널 구조 노드 카드의 점 색상 클래스 — 위 색상표를 그대로 벡터-엑스트랙트 클래스로 옮긴 것
export const ZONE_CARD_DOT_CLASS: Record<StructureNodeType, string> = {
  door: styles.zoneCardDotDoor,
  stair: styles.zoneCardDotStair,
  hallway: styles.zoneCardDotHallway,
  start: styles.zoneCardDotStart,
};
