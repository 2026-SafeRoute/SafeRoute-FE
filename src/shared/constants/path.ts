export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  LANDING: '/landing',
  SCENARIO_LIST: '/scenarioSettings',
  SCENARIO_CREATE: '/scenarioSettings/new',
  SCENARIO_DETAIL: '/scenarioSettings/:scenarioId',
  BUILDINGS: '/buildings',
  FLOOR_PLANS: '/floorPlans',
  FLOOR_PLANS_DETAIL: '/floorPlans/:buildingId/:floorId',
  // 훈련분석: 종료된 훈련 목록 → 훈련(세션)별 카메라 목록 → 카메라별 프레임 상세, 3단 drill-down
  TRAINING_ANALYSIS: '/trainingAnalysis',
  TRAINING_CAMERAS: '/trainingAnalysis/:sessionId/cameras',
  TRAINING_CAMERA_FRAMES: '/trainingAnalysis/:sessionId/cameras/:cctvId',
  REPORTS: '/reports/:reportId',
} as const;

export const getScenarioDetailPath = (scenarioId: string) =>
  ROUTES.SCENARIO_DETAIL.replace(':scenarioId', encodeURIComponent(scenarioId));

export const getFloorPlanDetailPath = (buildingId: string, floorId: string) =>
  ROUTES.FLOOR_PLANS_DETAIL.replace(':buildingId', encodeURIComponent(buildingId)).replace(
    ':floorId',
    encodeURIComponent(floorId),
  );

export const getTrainingCamerasPath = (sessionId: string) =>
  ROUTES.TRAINING_CAMERAS.replace(':sessionId', encodeURIComponent(sessionId));

export const getTrainingCameraFramesPath = (sessionId: string, cctvId: string) =>
  ROUTES.TRAINING_CAMERA_FRAMES.replace(':sessionId', encodeURIComponent(sessionId)).replace(
    ':cctvId',
    encodeURIComponent(cctvId),
  );

export const getReportPath = (reportId: string) =>
  ROUTES.REPORTS.replace(':reportId', encodeURIComponent(reportId));
