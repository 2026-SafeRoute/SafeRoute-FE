export const API_V1 = '/api/v1';
export const DASHBOARD_API = '/api/dashboard';

export const API_ENDPOINTS = {
  // 사용자
  AUTH: {
    LOGIN: `${API_V1}/auth/login`,
    LOGOUT: `${API_V1}/auth/logout`,
    REISSUE: `${API_V1}/auth/reissue`,
    SIGNUP: `${API_V1}/auth/signup`,
  },

  USERS: {
    ME: `${API_V1}/users/me`,
  },

  // 건물
  BUILDINGS: {
    ROOT: `${API_V1}/buildings`,
    DETAIL: (buildingId: string) => `${API_V1}/buildings/${buildingId}`,
    DEACTIVATE: (buildingId: string) => `${API_V1}/buildings/${buildingId}/deactivate`,
  },

  // 층/도면, AI 분석
  FLOORS: {
    ROOT: (buildingId: string) => `${API_V1}/buildings/${buildingId}/floors`,
    // GET(상세) · PATCH(층 정보 수정) · DELETE(층 삭제) 공용
    DETAIL: (buildingId: string, floorId: string) =>
      `${API_V1}/buildings/${buildingId}/floors/${floorId}`,
    // 층은 남기고 업로드된 도면 이미지만 삭제
    MAP: (buildingId: string, floorId: string) =>
      `${API_V1}/buildings/${buildingId}/floors/${floorId}/map`,
    UPLOAD: (buildingId: string) => `${API_V1}/buildings/${buildingId}/floors/upload`,
    ANALYZE: (floorId: string) => `${API_V1}/${floorId}/analyse`,
    IMAGE_URL: (buildingId: string, floorId: string) =>
      `${API_V1}/buildings/${buildingId}/floors/${floorId}/image-url`,
    ROUTE_DIAGNOSIS: (floorId: string) => `${API_V1}/floors/${floorId}/route-diagnosis`,
  },

  // S3 파일 업로드
  FILES: {
    UPLOAD: `${API_V1}/s3/upload`,
  },

  // 훈련 세션
  TRAINING_SESSIONS: {
    ROOT: `${API_V1}/sessions`,
    CREATE: (scenarioId: string) => `${API_V1}/sessions/${scenarioId}`,
    START: (sessionId: string) => `${API_V1}/sessions/${sessionId}/start`,
    END: (sessionId: string) => `${API_V1}/sessions/${sessionId}/end`,
    FORCE_END: (sessionId: string) => `${API_V1}/sessions/${sessionId}/force-end`,
    CURRENT_ROUTE: (sessionId: string) => `${API_V1}/sessions/${sessionId}/current-route`,
    // 훈련분석(모니터링): 종료된 세션의 카메라별 최신 캡처/프레임 목록/이벤트 타임라인
    MONITORING_CONTEXT: (sessionId: string) => `${API_V1}/sessions/${sessionId}/monitoring/context`,
    MONITORING_CAMERAS: (sessionId: string) => `${API_V1}/sessions/${sessionId}/monitoring/cameras`,
    MONITORING_CURRENT_STATES: (sessionId: string) =>
      `${API_V1}/sessions/${sessionId}/monitoring/current-states`,
    MONITORING_FRAMES: (sessionId: string, cctvId: string) =>
      `${API_V1}/sessions/${sessionId}/monitoring/cameras/${cctvId}/frames`,
    MONITORING_EVENTS: (sessionId: string) => `${API_V1}/sessions/${sessionId}/monitoring/events`,
  },

  // 훈련 시나리오
  SCENARIOS: {
    ROOT: `${API_V1}/scenarios`,
    DRAFTS: `${API_V1}/scenarios/drafts`,
    DETAIL: (scenarioId: string) => `${API_V1}/scenarios/${scenarioId}`,
    READY: (scenarioId: string) => `${API_V1}/scenarios/${scenarioId}/ready`,
    // GET 전용(화재구역 전체 조회) — POST(최초 발화점 등록)는 백엔드에서 제거됨(팀 전달사항,
    // 2026-09-03). 발화점 등록은 이제 EVACUATION_SETUP으로 통합됨
    FIRE_ZONES: (scenarioId: string) => `${API_V1}/scenarios/${scenarioId}/fire-zones`,
    // 최초 발화점(fireOriginGridCellId) + 훈련 시작점(startNodeId)을 한 번에 조회/설정.
    // POST는 스웨거상 둘 다 필수 — 하나만 보낼 수 없음
    EVACUATION_SETUP: (scenarioId: string) => `${API_V1}/scenarios/${scenarioId}/evacuation-setup`,
  },

  // 훈련 리포트
  TRAINING_REPORTS: {
    CREATE: (sessionId: string) => `${API_V1}/analysis/trainings/${sessionId}`,
    DETAIL: (reportId: string) => `${API_V1}/reports/${reportId}`,
  },

  // 대시보드
  DASHBOARD: {
    STATS: `${DASHBOARD_API}/stats`,
    RECENT_TRAININGS: `${DASHBOARD_API}/trainings`,
    TRAINING_STATUS: (sessionId: string) => `${DASHBOARD_API}/training-status/${sessionId}`,
  },

  // IoT 유도등
  IOT_LIGHTS: {
    ROOT: `${API_V1}/lights`,
    DETAIL: (lightId: string) => `${API_V1}/lights/${lightId}`,
    PI_ENDPOINT: (lightId: string) => `${API_V1}/lights/${lightId}/pi-endpoint`,
    GUIDANCE: (lightId: string) => `${API_V1}/lights/${lightId}/guidance`,
    ENABLE: (lightId: string) => `${API_V1}/lights/${lightId}/enable`,
    DISABLE: (lightId: string) => `${API_V1}/lights/${lightId}/disable`,
    DIRECTION: (lightId: string) => `${API_V1}/lights/${lightId}/direction`,
    // 유도등이 참고할 CCTV 연결
    CCTV: (lightId: string) => `${API_V1}/lights/${lightId}/cctv`,
    // 안내 방향과 실제 대피 흐름의 이탈률
    DEVIATION: (lightId: string) => `${API_V1}/lights/${lightId}/deviation`,
  },

  // CCTV
  CCTV: {
    ROOT: `${API_V1}/cctvs`,
    DETAIL: (cctvId: string) => `${API_V1}/cctvs/${cctvId}`,
    GRID_CELLS: (cctvId: string) => `${API_V1}/cctvs/${cctvId}/grid-cells`,
    DEVICE_TOKEN: (cctvId: string) => `${API_V1}/cctvs/${cctvId}/device-token`,
    ENABLE: (cctvId: string) => `${API_V1}/cctvs/${cctvId}/enable`,
    DISABLE: (cctvId: string) => `${API_V1}/cctvs/${cctvId}/disable`,
  },

  // 층 그리드 (CCTV 시야 구역 등에서 참조하는 셀 단위)
  FLOOR_GRID: {
    ROOT: (floorId: string) => `${API_V1}/floors/${floorId}/grid`,
    CELLS: (floorId: string) => `${API_V1}/floors/${floorId}/grid/cells`,
  },

  // 맵 그래프, 맵 그래프 편집
  MAP_GRAPH: {
    DETAIL: (floorId: string) => `${API_V1}/floors/${floorId}/graph`,
    CREATE_NODE: (floorId: string) => `${API_V1}/floors/${floorId}/nodes`,
    NODE: (nodeId: string) => `${API_V1}/nodes/${nodeId}`,
    NODE_START_CANDIDATE: (nodeId: string) => `${API_V1}/nodes/${nodeId}/start-candidate`,
    CREATE_EDGE: `${API_V1}/edges`,
    EDGE: (edgeId: string) => `${API_V1}/edges/${edgeId}`,
  },

  // 사용자 지정 영역 (그리드 셀 집합)
  USER_ZONES: {
    ROOT: (floorId: string) => `${API_V1}/floors/${floorId}/user-zones`,
    DETAIL: (floorId: string, userZoneId: string) =>
      `${API_V1}/floors/${floorId}/user-zones/${userZoneId}`,
  },

  // 대피 경로
  EVACUATION_ROUTES: {
    SHORTEST: (floorId: string) => `${API_V1}/floors/${floorId}/routes`,
  },

  // 혼잡 이벤트/관측 이미지 — 목록 조회 API는 없고, 이벤트 id로 이미지 presigned URL만 받는다
  // (혼잡 이벤트 자체는 훈련 세션 모니터링 타임라인 MONITORING_EVENTS로 조회)
  CONGESTION: {
    EVENT_IMAGE_URL: (eventId: string) => `${API_V1}/congestion-events/${eventId}/image-url`,
    OBSERVATION_IMAGE_URL: (eventId: string) =>
      `${API_V1}/congestion-observations/${eventId}/image-url`,
  },

  // 재탐색 — 훈련 중 서버가 자동 생성한 요청을 조회하고 승인/거부
  ROUTE_RECALCULATIONS: {
    ROOT: `${API_V1}/route-recalculations`,
    DETAIL: (recalculationId: string) => `${API_V1}/route-recalculations/${recalculationId}`,
    APPROVE: (recalculationId: string) =>
      `${API_V1}/route-recalculations/${recalculationId}/approve`,
    REJECT: (recalculationId: string) => `${API_V1}/route-recalculations/${recalculationId}/reject`,
  },

  // 훈련 보고서 조회
  REPORTS: {
    DETAIL: (reportId: string) => `${API_V1}/reports/${reportId}`,
    PDF: (reportId: string) => `${API_V1}/reports/${reportId}/pdf`,
  },
} as const;
