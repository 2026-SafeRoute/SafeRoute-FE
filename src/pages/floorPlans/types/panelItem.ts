export type PanelItem = {
  id: string;
  kind: 'device';
  /** 우측 패널 필터 기준 — AddedDevice.placeType과 같은 체계(유도등은 'light') */
  type: 'cctv' | 'light' | 'general';
  label: string;
  statusText: string;
  statusOnline: boolean;
  zone: string;
  source: 'floor' | 'added';
  // CCTV 카드에서 감시 영역 현황을 바로 보여주기 위한 값 — CCTV가 아니면 없음
  monitoredArea?: { cellCount: number; areaM2: number };
  // 서버가 자동 채번하는 장치 코드(예: CCTV_001) — id(내부 UUID)와 다른, 사람이 보는 식별자.
  // 수정 API로도 바꿀 수 없는 값이라 CCTV가 아니면 없음
  code?: string;
  // 유도등 카드의 가이던스 현황 표시용 — 유도등이 아니면 없음
  guidanceConfigured?: boolean;
  // 유도등 카드에서 담당 CCTV를 바로 보여주기 위한 값 — 유도등이 아니거나 미배정이면 없음
  cctvName?: string;
};

// 장비 카드의 "수정" 편집 폼 — CCTV는 label만 쓰고, 유도등은 설정 모달에 있던
// 가이던스·담당 CCTV까지 전부 이 폼으로 흡수함(모달 없이 카드 안에서 편집). Pi 엔드포인트는
// 스웨거상 "참고용 메타데이터일 뿐 실제 명령 전달 경로에는 안 쓰인다"고 명시되어 있어 뺐음.
// "설치 위치"(zone)는 백엔드에 저장 필드가 없어(요청 스키마에 name/x/y뿐) 텍스트로 입력받아도
// 저장 API로 안 나가고 새로고침하면 사라지는 값이었음 — 편집 항목에서 아예 빼고, 카드엔 실제
// 좌표(formatInstallLocation)를 읽기 전용으로 보여줌(CCTV는 감시영역 문구를 그대로 씀)
export interface DeviceEditForm {
  label: string;
  decisionNodeId: string;
  leftEdgeId: string;
  rightEdgeId: string;
  cctvId: string;
}

export const EMPTY_DEVICE_EDIT_FORM: DeviceEditForm = {
  label: '',
  decisionNodeId: '',
  leftEdgeId: '',
  rightEdgeId: '',
  cctvId: '',
};

// 우측 패널 상위 탭
export type PanelTopFilter = 'all' | 'device' | 'zone';

// 우측 패널 하위 칩(노드 종류) — 여러 개를 동시에 켤 수 있고 빈 배열이면 "전체"와 같음
export type PanelDeviceTypeFilter = 'cctv' | 'light' | 'door' | 'stair' | 'hallway' | 'start';
