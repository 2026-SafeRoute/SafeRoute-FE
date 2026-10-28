/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export type AckData = LightCommandAckResponse;

export interface AckLightCommandRequest {
  failReason?: string;
  success: boolean;
}

export interface AllUserZoneResponse {
  userzones?: UserZoneResponse[];
}

export type AnalyzeData = any;

export interface ApiResponseAllUserZoneResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: AllUserZoneResponse;
}

export interface ApiResponseBuildingResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: BuildingResponse;
}

export interface ApiResponseCctvRegistrationResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: CctvRegistrationResponse;
}

export interface ApiResponseCctvResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: CctvResponse;
}

export interface ApiResponseCongestionImageUrlResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: CongestionImageUrlResponse;
}

export interface ApiResponseCurrentRouteResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: CurrentRouteResponse;
}

export interface ApiResponseDashboardStatsResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: DashboardStatsResponse;
}

export interface ApiResponseDeviceTokenIssueResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: DeviceTokenIssueResponse;
}

export interface ApiResponseEvacuationRouteResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: EvacuationRouteResponse;
}

export interface ApiResponseFloorGraphResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: FloorGraphResponse;
}

export interface ApiResponseFloorGridCellPageResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: FloorGridCellPageResponse;
}

export interface ApiResponseFloorGridResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: FloorGridResponse;
}

export interface ApiResponseFloorImageUrlResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: FloorImageUrlResponse;
}

export interface ApiResponseFloorResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: FloorResponse;
}

export interface ApiResponseFloorRouteDiagnosisResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: FloorRouteDiagnosisResponse;
}

export interface ApiResponseIoTLightResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: IoTLightResponse;
}

export interface ApiResponseLightDirectionResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: LightDirectionResponse;
}

export interface ApiResponseListBuildingResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: BuildingResponse[];
}

export interface ApiResponseListCctvResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: CctvResponse[];
}

export interface ApiResponseListFloorResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: FloorResponse[];
}

export interface ApiResponseListIoTLightResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: IoTLightResponse[];
}

export interface ApiResponseListRecentTrainingReportResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: RecentTrainingReportResponse[];
}

export interface ApiResponseListRouteRecalculationSummaryResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: RouteRecalculationSummaryResponse[];
}

export interface ApiResponseLoginResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: LoginResponse;
}

export interface ApiResponseMapEdgeResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: MapEdgeResponse;
}

export interface ApiResponseMapNodeResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: MapNodeResponse;
}

export interface ApiResponseReissueResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: ReissueResponse;
}

export interface ApiResponseRouteDeviationResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: RouteDeviationResponse;
}

export interface ApiResponseRouteRecalculationDetailResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: RouteRecalculationDetailResponse;
}

export interface ApiResponseRouteRecalculationResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: RouteRecalculationResponse;
}

export interface ApiResponseS3UploadResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: S3UploadResponse;
}

export interface ApiResponseScenarioRouteDiagnosisResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: ScenarioRouteDiagnosisResponse;
}

export interface ApiResponseSignupResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: SignupResponse;
}

export interface ApiResponseTrainingSessionResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  /** 훈련 세션 생성/시작/종료/강제종료 API의 공통 응답 */
  result?: TrainingSessionResponse;
}

export interface ApiResponseTrainingStatusResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: TrainingStatusResponse;
}

export interface ApiResponseUserProfileResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: UserProfileResponse;
}

export interface ApiResponseUserZoneCellsResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: UserZoneCellsResponse;
}

export interface ApiResponseUserZoneResponse {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: UserZoneResponse;
}

export interface ApiResponseVoid {
  code?: string;
  isSuccess?: boolean;
  message?: string;
  result?: any;
}

export type ApproveData = ApiResponseRouteRecalculationResponse;

export type AssignCctvData = ApiResponseIoTLightResponse;

export interface AssignCctvRequest {
  /** @format uuid */
  cctvId: string;
}

export interface BuildingResponse {
  address?: string;
  /** @format int32 */
  basementFloorCount?: number;
  buildingType?: "CLASSROOM" | "CAFETERIA" | "LIBRARY" | "DORMITORY" | "GYM";
  /** @format date-time */
  createdAt?: string;
  /** @format int32 */
  groundFloorCount?: number;
  /** @format uuid */
  id?: string;
  isActive?: boolean;
  /** @format date-time */
  lastTrainedAt?: string;
  name?: string;
  schoolName?: string;
  /** @format int32 */
  totalFloors?: number;
  /** @format date-time */
  updatedAt?: string;
}

export interface CctvGridCellResponse {
  /** @format double */
  centerX?: number;
  /** @format double */
  centerY?: number;
  /** @format int32 */
  columnIndex?: number;
  /** @format uuid */
  id?: string;
  /** @format int32 */
  rowIndex?: number;
  walkable?: boolean;
}

export interface CctvRegistrationResponse {
  cctv?: CctvResponse;
  deviceToken?: string;
}

export interface CctvResponse {
  /** @format double */
  monitoredAreaM2?: number;
  code?: string;
  /** @format uuid */
  customNodeId?: string;
  enabled?: boolean;
  /** @format uuid */
  floorId?: string;
  /** @format double */
  gridCellSizeMeter?: number;
  gridCells?: CctvGridCellResponse[];
  /** @format uuid */
  id?: string;
  /** @format int32 */
  monitoredGridCellCount?: number;
  name?: string;
  /** @format double */
  x?: number;
  /** @format double */
  y?: number;
}

export interface CellResponse {
  /** @format uuid */
  cellId?: string;
  /** @format int32 */
  columnIndex?: number;
  /** @format int32 */
  rowIndex?: number;
}

export type ChangeDirectionData = ApiResponseLightDirectionResponse;

export interface ChangeLightDirectionRequest {
  direction: "LEFT" | "RIGHT" | "BOTH" | "OFF";
}

export type ClearFloorMapData = ApiResponseFloorResponse;

export interface ConfigureCctvGridCellsRequest {
  /** @minItems 1 */
  gridCellIds: string[];
}

export type ConfigureGridCellsData = ApiResponseCctvResponse;

export type ConfigureGuidanceData = ApiResponseIoTLightResponse;

export interface ConfigureGuidanceRequest {
  /** @format uuid */
  decisionNodeId: string;
  /** @format uuid */
  leftEdgeId: string;
  /** @format uuid */
  rightEdgeId: string;
}

export interface CongestionConfigQueryResponse {
  /** @format double */
  monitoredAreaM2?: number;
  cctvCode?: string;
  /** @format int64 */
  configVersion?: number;
  congestionThresholds?: CongestionThresholdsResponse;
  eventDetection?: EventDetectionResponse;
  /** @format int32 */
  snapshotIntervalSec?: number;
  /** @format int32 */
  targetInferenceFps?: number;
  trainingActive?: boolean;
  trainingSessionId?: string;
}

export interface CongestionEventResponse {
  cctvCode?: string;
  /** @format int64 */
  configVersion?: number;
  congestionLevel?: "NORMAL" | "CAUTION" | "CROWDED" | "VERY_CROWDED";
  /** @format double */
  density?: number;
  /** @format int64 */
  detectedAt?: number;
  eventId?: string;
  eventImageKey?: string;
  eventStatus?: "RECEIVED" | "PROCESSING" | "PROCESSED" | "FAILED";
  eventType?: "CONGESTION_STARTED" | "CONGESTION_LEVEL_UP" | "CONGESTION_ENDED";
  /** @format int32 */
  headcount?: number;
  imageUploadStatus?: "PENDING" | "COMPLETED" | "FAILED" | "UPLOADED";
  localCongestionLevel?: "NORMAL" | "CAUTION" | "CROWDED" | "VERY_CROWDED";
  /** @format double */
  localDensity?: number;
  trainingSessionId?: string;
}

export interface CongestionImageUrlResponse {
  /** @format date-time */
  expiresAt?: string;
  imageUrl?: string;
}

export interface CongestionThresholdsResponse {
  /** @format double */
  CAUTION_FROM?: number;
  /** @format double */
  CROWDED_FROM?: number;
  /** @format double */
  VERY_CROWDED_FROM?: number;
}

export type ConnectEventImageData = any;

export interface ConnectEventImageRequest {
  /** @minLength 1 */
  eventImageKey: string;
  /** @format int64 */
  uploadedAt: number;
}

export type CreateBuildingData = ApiResponseBuildingResponse;

export interface CreateBuildingRequest {
  /**
   * @minLength 8
   * @maxLength 100
   */
  address: string;
  buildingType: "CLASSROOM" | "CAFETERIA" | "LIBRARY" | "DORMITORY" | "GYM";
  /**
   * @minLength 2
   * @maxLength 20
   */
  name: string;
}

export type CreateCctvData = ApiResponseCctvRegistrationResponse;

export interface CreateCctvRequest {
  /** @format uuid */
  floorId: string;
  /** @minItems 1 */
  gridCellIds: string[];
  /**
   * @minLength 0
   * @maxLength 100
   */
  name: string;
  /**
   * @format double
   * @min 0
   * @max 1
   */
  x: number;
  /**
   * @format double
   * @min 0
   * @max 1
   */
  y: number;
}

export type CreateDraftData = ScenarioResponse;

export type CreateEdgeData = ApiResponseMapEdgeResponse;

export type CreateFloorData = ApiResponseFloorResponse;

export interface CreateFloorRequest {
  /** @format int32 */
  floorNum: number;
}

export interface CreateIoTLightRequest {
  /** @format uuid */
  floorId: string;
  /** @minLength 1 */
  name: string;
  /** @format double */
  x: number;
  /** @format double */
  y: number;
}

export type CreateLightData = ApiResponseIoTLightResponse;

export interface CreateMapEdgeRequest {
  bidirectional: boolean;
  /** @format double */
  distance: number;
  /** @format uuid */
  fromNodeId: string;
  /** @format uuid */
  toNodeId: string;
}

export interface CreateMapNodeRequest {
  /** @minLength 1 */
  code: string;
  isExitTarget?: boolean;
  /** @minLength 1 */
  name: string;
  type: "STAIR" | "ROOM" | "HALLWAY" | "DOOR" | "EXIT" | "START" | "CUSTOM";
  /** @format double */
  x: number;
  /** @format double */
  y: number;
}

export type CreateNodeData = ApiResponseMapNodeResponse;

export type CreateOrRegenerateGridData = ApiResponseFloorGridResponse;

export interface CreateOrUpdateFloorGridRequest {
  /** @format double */
  cellSizeMeter?: number;
}

export interface CreatePresignedImageUrlRequest {
  /** @format int64 */
  capturedAt: number;
  /**
   * @minLength 1
   * @pattern [A-Za-z0-9_-]+
   */
  cctvCode: string;
  /**
   * @minLength 1
   * @pattern image/jpeg
   */
  contentType: string;
  imageType: "MONITORING" | "CONGESTION_EVENT";
  /** @format uuid */
  referenceId: string;
  /** @format uuid */
  requestId: string;
  /** @format uuid */
  trainingSessionId: string;
}

export type CreatePresignedUrlData = PresignedImageUrlResponse;

export interface CreateScenarioDraftRequest {
  /** @format uuid */
  buildingId?: string;
  /** @format int32 */
  expectedParticipants?: number;
  fireSpreadSpeed?: "SLOW" | "MEDIUM" | "FAST";
  isTemplate?: boolean;
  /**
   * @minLength 2
   * @maxLength 20
   */
  name?: string;
  /** @format date-time */
  scheduledAt?: string;
}

export interface CreateScenarioEvacuationSetupRequest {
  /** @format uuid */
  fireOriginGridCellId: string;
  /** @format uuid */
  startNodeId: string;
}

export interface CreateSessionRequest {
  /**
   * 세션을 생성할 관리자 ID
   * @format uuid
   * @example "8d40b5e1-40f8-4dd4-a11c-f1ed418b73d1"
   */
  adminId: string;
}

export type CreateTrainingSessionData = TrainingSessionResponse;

export type CreateUserZoneData = ApiResponseUserZoneResponse;

export interface CumulativeEvacuationPointResponse {
  /** @format int32 */
  cumulativeCount?: number;
  /** @format int32 */
  elapsedSec?: number;
}

/** CCTV별 현재 혼잡 상태 목록의 공통 API 응답 스키마 */
export interface CurrentCctvStateListApiResponse {
  /**
   * 응답 코드
   * @example "TRAINING_SUCCESS_010"
   */
  code?: string;
  /**
   * 요청 성공 여부
   * @example true
   */
  isSuccess?: boolean;
  /**
   * 응답 메시지
   * @example "CCTV 현재 혼잡 상태 조회에 성공했습니다."
   */
  message?: string;
  /** CCTV별 현재 혼잡 상태 목록 */
  result?: CurrentCctvStateListResponse;
}

/** 훈련 세션의 CCTV별 현재 혼잡 상태 목록 */
export interface CurrentCctvStateListResponse {
  /**
   * 이 응답을 만든 시각(Unix epoch milliseconds)
   * @format int64
   * @example 1787722095000
   */
  observedAt?: number;
  /**
   * 조회한 훈련 세션 ID
   * @format uuid
   * @example "d669294e-55e1-4c00-bf67-229d89b76948"
   */
  sessionId?: string;
  states?: CurrentCctvStateResponse[];
}

/** CCTV 한 대의 현재 혼잡 상태 */
export interface CurrentCctvStateResponse {
  /**
   * 최근 관측 구간의 평균 인원. 상태가 없으면 null
   * @format double
   * @example 8.6
   */
  avgHeadcount?: number;
  /**
   * CCTV가 설치된 건물명
   * @example "A동"
   */
  buildingName?: string;
  /**
   * CCTV 고유 코드
   * @example "CCTV_001"
   */
  cctvCode?: string;
  /**
   * CCTV ID
   * @format uuid
   * @example "67b86e33-7874-494c-855f-e591e7847c09"
   */
  cctvId?: string;
  /**
   * 관리자가 지정한 CCTV 이름
   * @example "CAM-1"
   */
  cctvName?: string;
  /**
   * 상태가 저장될 때 적용된 혼잡 설정 버전. 상태가 없으면 null
   * @format int64
   * @example 3
   */
  configVersion?: number;
  /**
   * 혼잡 단계. 상태가 없으면 null
   * @example "CROWDED"
   */
  congestionLevel?: "NORMAL" | "CAUTION" | "CROWDED" | "VERY_CROWDED";
  /**
   * 밀집도(㎡당 인원). 상태가 없으면 null
   * @format double
   * @example 0.42
   */
  density?: number;
  /**
   * 화면 표시용 층 이름
   * @example "3층"
   */
  floorName?: string;
  /**
   * 상태를 마지막으로 관측한 시각(Unix epoch milliseconds). 상태가 없으면 null
   * @format int64
   * @example 1787722095000
   */
  lastDetectedAt?: number;
  /**
   * 건물명과 층 이름을 조합한 표시 위치
   * @example "A동 3층"
   */
  location?: string;
  /**
   * 최근 관측 구간의 순간 최대 인원. 상태가 없으면 null
   * @format int32
   * @example 12
   */
  peakHeadcount?: number;
  /**
   * stateStaleAfterSec를 초과해 오래됐거나 상태가 아직 없으면 true. true일 때는 congestionLevel 등을 NORMAL로 오인하지 말고 '정보 없음/오래됨'으로 표시해야 한다
   * @example false
   */
  stale?: boolean;
}

export interface CurrentRouteResponse {
  /** @format uuid */
  buildingId?: string;
  /** @format uuid */
  floorId?: string;
  path?: NodePoint[];
  /** @format uuid */
  scenarioId?: string;
  /** @format uuid */
  sessionId?: string;
  source?: "INITIAL" | "RECALCULATED";
  /** @format uuid */
  startNodeId?: string;
  /** @format double */
  totalWeight?: number;
  /** @format date-time */
  updatedAt?: string;
}

export interface DashboardStatsResponse {
  /** @format double */
  avgEvacuationSec?: number;
  /** @format double */
  avgSurvivalRate?: number;
  /** @format int64 */
  totalParticipants?: number;
  /** @format int64 */
  totalSessions?: number;
}

export type DeactivateBuildingData = ApiResponseVoid;

export type DeleteBuildingData = ApiResponseVoid;

export type DeleteCctvData = ApiResponseVoid;

export type DeleteEdgeData = ApiResponseVoid;

export type DeleteFloorData = ApiResponseVoid;

export type DeleteLightData = ApiResponseVoid;

export type DeleteNodeData = ApiResponseVoid;

export type DeleteScenarioData = any;

export type DeleteUserZoneData = any;

export interface DeviceTokenIssueResponse {
  deviceToken?: string;
}

export type DiagnoseFloorData = ApiResponseFloorRouteDiagnosisResponse;

export type DiagnoseScenarioData = ApiResponseScenarioRouteDiagnosisResponse;

export type DisableCctvData = ApiResponseCctvResponse;

export type DisableLightData = ApiResponseIoTLightResponse;

/** @format byte */
export type DownloadReportPdfData = Blob;

export type EnableCctvData = ApiResponseCctvResponse;

export type EnableLightData = ApiResponseIoTLightResponse;

export type EndTrainingSessionData = ApiResponseTrainingSessionResponse;

export interface EvacuationRouteResponse {
  path?: MapNodeResponse[];
  /** @format double */
  totalWeight?: number;
}

export interface Event {
  /**
   * 훈련 시작 후 예상 시점(초)
   * @format int64
   */
  afterSeconds?: number;
  /** RECALCULATED일 때 바뀐 경로의 노드 ID 목록. BLOCKED면 빈 목록 */
  routeNodeIds?: string[];
  /** RECALCULATED: 재탐색으로 경로가 바뀜 / BLOCKED: 우회 경로가 없어 경로가 막힘 */
  type?: "RECALCULATED" | "BLOCKED";
}

export interface EventDetectionResponse {
  /** @format int32 */
  cooldownSec?: number;
  /** @format int32 */
  recoveryConsecutiveFrames?: number;
  /** @format int32 */
  requiredConsecutiveFrames?: number;
}

export type FindAllUserZoneData = ApiResponseAllUserZoneResponse;

export type FindUserZoneData = ApiResponseUserZoneCellsResponse;

export interface FireOrigin {
  /** @format double */
  centerX?: number;
  /** @format double */
  centerY?: number;
  /** @format int32 */
  columnIndex?: number;
  /** @format uuid */
  fireZoneId?: string;
  /** @format uuid */
  gridCellId?: string;
  /** @format int32 */
  rowIndex?: number;
}

export interface FireZoneResponse {
  /** @format date-time */
  addedAt?: string;
  /** @format uuid */
  floorId?: string;
  /** @format uuid */
  gridCellId?: string;
  /** @format uuid */
  id?: string;
  isManualAdd?: boolean;
  /** @format uuid */
  scenarioId?: string;
  /** @format int32 */
  spreadGeneration?: number;
}

export interface FloorGraphResponse {
  edges?: MapEdgeResponse[];
  nodes?: MapNodeResponse[];
}

export interface FloorGridCellPageResponse {
  /** @format double */
  cellSizeMeter?: number;
  /** @format int32 */
  columns?: number;
  content?: FloorGridCellResponse[];
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  page?: number;
  /** @format double */
  realHeight?: number;
  /** @format double */
  realWidth?: number;
  /** @format int32 */
  rows?: number;
  /** @format int32 */
  size?: number;
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface FloorGridCellResponse {
  /** @format double */
  centerX?: number;
  /** @format double */
  centerY?: number;
  /** @format int32 */
  columnIndex?: number;
  fired?: boolean;
  /** @format uuid */
  id?: string;
  /** @format int32 */
  rowIndex?: number;
  walkable?: boolean;
}

export interface FloorGridResponse {
  /** @format double */
  cellSizeMeter?: number;
  /** @format int32 */
  columns?: number;
  /** @format uuid */
  floorId?: string;
  /** @format int32 */
  rows?: number;
}

export interface FloorImageUrlResponse {
  /** @format date-time */
  expiresAt?: string;
  imageUrl?: string;
}

export interface FloorResponse {
  /** @format date-time */
  createdAt?: string;
  /** @format int32 */
  floorNum?: number;
  /** @format uuid */
  id?: string;
  mapImageKey?: string;
  /** @format date-time */
  processedAt?: string;
  segmentationStatus?: "PENDING" | "PROCESSING" | "DONE" | "FAILED";
  /** @format date-time */
  updatedAt?: string;
}

export interface FloorRouteDiagnosisResponse {
  /**
   * 진단한 층 ID
   * @format uuid
   */
  floorId?: string;
  /** 끊긴 노드가 없고 모든 시작 후보가 탈출구 2곳 이상에 닿으면 true */
  ready?: boolean;
  /** 시작 후보별 도달 가능한 탈출구 수 */
  startCandidates?: StartCandidate[];
  /** 타입이 STAIR·EXIT인데 탈출구로 지정하지 않은 노드 ID 목록. 엣지로 이어져 있으면 경로 중간에는 지날 수 있지만 대피 목적지(탈출구)로는 선택되지 않는다. 일부러 쓰지 않는 계단도 있을 수 있어 참고 정보이며 ready에는 영향이 없다 */
  undesignatedStairNodeIds?: string[];
  /** 어떤 탈출구에도 도달할 수 없는 노드 ID 목록 (CCTV·유도등 위치 노드는 제외) */
  unreachableNodeIds?: string[];
}

export type ForceEndTrainingSessionData = ApiResponseTrainingSessionResponse;

export type GenerateReportData = ReportResponse;

export interface GenerateReportRequest {
  /** @format int32 */
  participantCount: number;
  /** @format int32 */
  survivorCount: number;
}

export type GetBuildingData = ApiResponseBuildingResponse;

export type GetBuildingsData = ApiResponseListBuildingResponse;

export type GetCamerasData = MonitoringCameraListApiResponse;

export type GetCctvData = ApiResponseCctvResponse;

export type GetCctvsData = ApiResponseListCctvResponse;

export type GetConfigData = CongestionConfigQueryResponse;

export type GetContextData = MonitoringContextApiResponse;

export type GetCurrentRouteData = ApiResponseCurrentRouteResponse;

export type GetCurrentStatesData = CurrentCctvStateListApiResponse;

export type GetDeviationRateData = ApiResponseRouteDeviationResponse;

export type GetEventImageUrlData = ApiResponseCongestionImageUrlResponse;

export type GetEventsData = MonitoringEventListApiResponse;

export type GetFireOriginData = FireZoneResponse[];

export type GetFireZonesData = FireZoneResponse[];

export type GetFloorData = ApiResponseFloorResponse;

export type GetFloorImageUrlData = ApiResponseFloorImageUrlResponse;

export type GetFloorsData = ApiResponseListFloorResponse;

export type GetFramesData = MonitoringFrameListApiResponse;

export type GetGraphData = ApiResponseFloorGraphResponse;

export type GetGridCells1Data = ApiResponseFloorGridCellPageResponse;

export type GetGridCellsData = ApiResponseCctvResponse;

export type GetLightData = ApiResponseIoTLightResponse;

export type GetLightsData = ApiResponseListIoTLightResponse;

export type GetMyProfileData = ApiResponseUserProfileResponse;

export type GetObservationImageUrlData = ApiResponseCongestionImageUrlResponse;

export type GetRecalculationDetailData =
  ApiResponseRouteRecalculationDetailResponse;

export type GetRecalculationsData =
  ApiResponseListRouteRecalculationSummaryResponse;

export type GetRecentReportsData = ApiResponseListRecentTrainingReportResponse;

export type GetReportData = ReportResponse;

export type GetScenarioData = ScenarioResponse;

export type GetScenariosData = ScenarioResponse[];

export type GetSessionsData = TrainingSessionListApiResponse;

export type GetSetupData = ScenarioEvacuationSetupResponse;

export type GetShortestRouteData = ApiResponseEvacuationRouteResponse;

export type GetStatsData = ApiResponseDashboardStatsResponse;

export type GetTrainingStatusData = ApiResponseTrainingStatusResponse;

export interface IoTLightResponse {
  /** @format uuid */
  cctvId?: string;
  code?: string;
  /** @format uuid */
  decisionNodeId?: string;
  enabled?: boolean;
  /** @format uuid */
  floorId?: string;
  guidanceConfigured?: boolean;
  /** @format uuid */
  id?: string;
  /** @format uuid */
  leftEdgeId?: string;
  name?: string;
  piEndpoint?: string;
  /** @format uuid */
  rightEdgeId?: string;
  /** @format double */
  x?: number;
  /** @format double */
  y?: number;
}

export type IssueDeviceTokenData = ApiResponseDeviceTokenIssueResponse;

export interface LightCommandAckResponse {
  /** @format uuid */
  commandId?: string;
  status?: "PENDING" | "SENT" | "ACKED" | "FAILED" | "TIMED_OUT" | "SUPERSEDED";
}

export interface LightCommandListResponse {
  commands?: LightCommandResponse[];
}

export interface LightCommandResponse {
  /** @format uuid */
  commandId?: string;
  direction?: "LEFT" | "RIGHT" | "BOTH" | "OFF";
  lightCode?: string;
}

export interface LightDirectionResponse {
  direction?: "LEFT" | "RIGHT" | "BOTH" | "OFF";
  /** @format uuid */
  lightId?: string;
  /** @format date-time */
  updatedAt?: string;
}

export type LoginData = ApiResponseLoginResponse;

export interface LoginRequest {
  /** @minLength 1 */
  email: string;
  /** @minLength 1 */
  password: string;
}

export interface LoginResponse {
  accessToken?: string;
  email?: string;
  /** @format int64 */
  expiresIn?: number;
  /** @format uuid */
  id?: string;
  phoneNumber?: string;
  refreshToken?: string;
  role?: "MANAGER" | "NORMAL";
  schoolName?: string;
  tokenType?: string;
  username?: string;
}

export type LogoutData = ApiResponseVoid;

export interface MapEdgeResponse {
  bidirectional?: boolean;
  /** @format double */
  distance?: number;
  /** @format uuid */
  fromNodeId?: string;
  /** @format uuid */
  id?: string;
  /** @format uuid */
  toNodeId?: string;
}

export interface MapNodeResponse {
  code?: string;
  /** @format uuid */
  id?: string;
  isExitTarget?: boolean;
  isStartCandidate?: boolean;
  name?: string;
  type?: "STAIR" | "ROOM" | "HALLWAY" | "DOOR" | "EXIT" | "START" | "CUSTOM";
  /** @format double */
  x?: number;
  /** @format double */
  y?: number;
}

/** 카메라별 최신 캡처 목록의 공통 API 응답 스키마 */
export interface MonitoringCameraListApiResponse {
  /**
   * 응답 코드
   * @example "TRAINING_SUCCESS_006"
   */
  code?: string;
  /**
   * 요청 성공 여부
   * @example true
   */
  isSuccess?: boolean;
  /**
   * 응답 메시지
   * @example "모니터링 카메라 목록 조회에 성공했습니다."
   */
  message?: string;
  /** 카메라별 최신 캡처 목록 */
  result?: MonitoringCameraListResponse;
}

/** 훈련 세션의 모니터링 카메라 목록 */
export interface MonitoringCameraListResponse {
  cameras?: MonitoringCameraResponse[];
  /**
   * 조회한 훈련 세션 ID
   * @format uuid
   * @example "d669294e-55e1-4c00-bf67-229d89b76948"
   */
  sessionId?: string;
}

/** 훈련 모니터링 화면의 카메라 카드 */
export interface MonitoringCameraResponse {
  /**
   * CCTV가 설치된 건물명
   * @example "A동"
   */
  buildingName?: string;
  /**
   * 최신 프레임 캡처 시각(Unix epoch milliseconds). 캡처가 없으면 null
   * @format int64
   * @example 1787722095000
   */
  capturedAt?: number;
  /**
   * CCTV ID
   * @format uuid
   * @example "67b86e33-7874-494c-855f-e591e7847c09"
   */
  cctvId?: string;
  /**
   * CCTV 고유 코드
   * @example "CCTV_001"
   */
  code?: string;
  /**
   * 화면 표시용 층 이름
   * @example "3층"
   */
  floorName?: string;
  /**
   * 건물명과 층 이름을 조합한 표시 위치
   * @example "A동 3층"
   */
  location?: string;
  /**
   * 관리자가 지정한 CCTV 이름
   * @example "CAM-1"
   */
  name?: string;
  /**
   * 최신 프레임 관측값을 서버가 받은 시각(Unix epoch milliseconds). capturedAt은 Pi 시계라 지연 측정은 이 값을 기준으로 한다. 캡처가 없거나 예전 데이터면 null
   * @format int64
   * @example 1787722096200
   */
  receivedAt?: number;
  /**
   * 마지막 캡처를 서버가 받은 뒤 stateStaleAfterSec가 지났거나 캡처가 아직 없으면 true. true면 thumbnailUrl을 라이브 화면이 아니라 '끊김/오래된 이미지'로 표시해야 한다
   * @example false
   */
  stale?: boolean;
  /**
   * 최신 캡처 이미지의 S3 presigned GET URL. 캡처가 없으면 null
   * @example "https://example-bucket.s3.amazonaws.com/training/session/monitoring/CCTV_001/frame.jpg"
   */
  thumbnailUrl?: string;
  /**
   * thumbnailUrl 만료 시각(Unix epoch milliseconds). 캡처가 없으면 null
   * @format int64
   * @example 1787725695000
   */
  urlExpiresAt?: number;
}

/** 모니터링 세션 정보의 공통 API 응답 스키마 */
export interface MonitoringContextApiResponse {
  /**
   * 응답 코드
   * @example "TRAINING_SUCCESS_011"
   */
  code?: string;
  /**
   * 요청 성공 여부
   * @example true
   */
  isSuccess?: boolean;
  /**
   * 응답 메시지
   * @example "모니터링 세션 정보 조회에 성공했습니다."
   */
  message?: string;
  /** 모니터링 세션 정보 */
  result?: MonitoringContextResponse;
}

/** 모니터링 상세 화면에 필요한 세션 기본 정보 */
export interface MonitoringContextResponse {
  /**
   * 세션이 속한 건물명
   * @example "A동"
   */
  buildingName?: string;
  /**
   * 경과 시간(초). RUNNING이면 현재 시각 기준으로 계속 늘어나는 값, 종료된 세션이면 종료 시각 기준으로 고정된 값. 아직 시작 전(SCHEDULED)이면 null
   * @format int64
   * @example 95
   */
  elapsedSeconds?: number;
  /**
   * 훈련 종료 시각(Unix epoch milliseconds). 아직 종료되지 않았으면 null
   * @format int64
   * @example 1787723000000
   */
  endedAt?: number;
  /**
   * 시나리오명
   * @example "3학년 A동 화재 대피 훈련"
   */
  scenarioName?: string;
  /**
   * 조회한 훈련 세션 ID
   * @format uuid
   * @example "d669294e-55e1-4c00-bf67-229d89b76948"
   */
  sessionId?: string;
  /**
   * Pi 관측 저장 간격(초). 전역 설정값
   * @format int32
   * @example 5
   */
  snapshotIntervalSec?: number;
  /**
   * 훈련 시작 시각(Unix epoch milliseconds). 아직 시작 전(SCHEDULED)이면 null
   * @format int64
   * @example 1787722000000
   */
  startedAt?: number;
  /**
   * CCTV 현재 상태(current-states)가 stale로 판정되는 기준(초). 전역 설정값
   * @format int32
   * @example 15
   */
  stateStaleAfterSec?: number;
  /**
   * 세션 상태
   * @example "RUNNING"
   */
  status?:
    | "RUNNING"
    | "STOPPED"
    | "SCHEDULED"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED";
}

/** 이벤트 타임라인의 공통 API 응답 스키마 */
export interface MonitoringEventListApiResponse {
  /**
   * 응답 코드
   * @example "TRAINING_SUCCESS_009"
   */
  code?: string;
  /**
   * 요청 성공 여부
   * @example true
   */
  isSuccess?: boolean;
  /**
   * 응답 메시지
   * @example "모니터링 이벤트 타임라인 조회에 성공했습니다."
   */
  message?: string;
  /** 이벤트 타임라인 */
  result?: MonitoringEventListResponse;
}

/** 훈련 세션의 이벤트 타임라인 (최신순 커서 페이지네이션) */
export interface MonitoringEventListResponse {
  events?: MonitoringEventResponse[];
  /**
   * 다음 페이지 존재 여부
   * @example true
   */
  hasNext?: boolean;
  /**
   * 다음 페이지 조회에 사용할 커서. 다음 페이지가 없으면 null
   * @example "MTc4NzcyMjA5NTAwMHwzYzlmN2UyYS0zYjM5LTRmMGEtOWYwYS02YTJiNmIxZjVhMTE"
   */
  nextCursor?: string;
  /**
   * 조회한 훈련 세션 ID
   * @format uuid
   * @example "d669294e-55e1-4c00-bf67-229d89b76948"
   */
  sessionId?: string;
}

/** 이벤트 타임라인 항목 */
export interface MonitoringEventResponse {
  /**
   * 관련 CCTV 코드
   * @example "CCTV_001"
   */
  cctvCode?: string;
  /**
   * 이벤트 시점의 혼잡 단계
   * @example "CROWDED"
   */
  congestionLevel?: "NORMAL" | "CAUTION" | "CROWDED" | "VERY_CROWDED";
  /**
   * 이벤트 ID. 혼잡 이벤트는 CongestionEventItem의 eventId, 경로 재탐색은 recalculationId에 상태 접미사를 붙인 값(같은 재탐색이 요청/해소 두 항목으로 나뉠 수 있어서)
   * @example "3c9f7e2a-3b39-4f0a-9f0a-6a2b6b1f5a11"
   */
  eventId?: string;
  /**
   * 사용자 표시 문구
   * @example "혼잡 감지 · CCTV_001"
   */
  message?: string;
  /**
   * 발생 시각(Unix epoch milliseconds)
   * @format int64
   * @example 1787722095000
   */
  occurredAt?: number;
  /** 심각도 */
  severity?: "INFO" | "WARNING" | "DANGER";
  /** 이벤트 종류 */
  type?:
    | "CONGESTION_STARTED"
    | "CONGESTION_LEVEL_UP"
    | "CONGESTION_ENDED"
    | "ROUTE_RECALCULATION_REQUESTED"
    | "EVACUATION_ROUTE_UPDATED"
    | "ROUTE_RECALCULATION_REJECTED"
    | "ROUTE_RECALCULATION_CANCELLED"
    | "AI_ANALYSIS_STARTED"
    | "ROUTE_DEVIATION_DETECTED";
}

/** 카메라별 프레임 목록의 공통 API 응답 스키마 */
export interface MonitoringFrameListApiResponse {
  /**
   * 응답 코드
   * @example "TRAINING_SUCCESS_007"
   */
  code?: string;
  /**
   * 요청 성공 여부
   * @example true
   */
  isSuccess?: boolean;
  /**
   * 응답 메시지
   * @example "카메라별 프레임 목록 조회에 성공했습니다."
   */
  message?: string;
  /** 카메라별 프레임 목록 */
  result?: MonitoringFrameListResponse;
}

/** 카메라별 프레임 목록 (최신순 커서 페이지네이션) */
export interface MonitoringFrameListResponse {
  /**
   * 조회한 CCTV ID
   * @format uuid
   * @example "67b86e33-7874-494c-855f-e591e7847c09"
   */
  cctvId?: string;
  frames?: MonitoringFrameResponse[];
  /**
   * 다음 페이지 존재 여부
   * @example true
   */
  hasNext?: boolean;
  /**
   * 다음 페이지 조회에 사용할 커서. 다음 페이지가 없으면 null
   * @example "MTc4NzcyMjA5NTAwMA"
   */
  nextCursor?: string;
  /**
   * 조회한 훈련 세션 ID
   * @format uuid
   * @example "d669294e-55e1-4c00-bf67-229d89b76948"
   */
  sessionId?: string;
  /**
   * 이 세션+CCTV 조합의 전체 저장 프레임(Observation) 개수
   * @format int64
   * @example 137
   */
  totalCount?: number;
}

/** 상세 모니터링 화면의 프레임 한 장 */
export interface MonitoringFrameResponse {
  /**
   * 프레임 캡처 시각(Unix epoch milliseconds)
   * @format int64
   * @example 1787722095000
   */
  capturedAt?: number;
  /**
   * 이미지 Snapshot 밀집도 기준 혼잡 단계
   * @example "CROWDED"
   */
  congestionLevel?: "NORMAL" | "CAUTION" | "CROWDED" | "VERY_CROWDED";
  /**
   * 이미지 Snapshot 인원수 기준 밀집도
   * @format double
   * @example 0.42
   */
  density?: number;
  /**
   * 프레임(Observation) ID
   * @example "3c9f7e2a-3b39-4f0a-9f0a-6a2b6b1f5a11"
   */
  frameId?: string;
  /**
   * 이미지 Snapshot의 인원수
   * @format int32
   * @example 12
   */
  headcount?: number;
  /**
   * 프레임 이미지의 S3 presigned GET URL. 이미지 업로드가 아직 끝나지 않았으면 null
   * @example "https://example-bucket.s3.amazonaws.com/training/session/monitoring/CCTV_001/frame.jpg"
   */
  imageUrl?: string;
  /**
   * 이 프레임 관측값을 서버가 받은 시각(Unix epoch milliseconds). capturedAt은 Pi 시계라 지연 측정은 이 값을 기준으로 한다. 예전 데이터면 null
   * @format int64
   * @example 1787722096200
   */
  receivedAt?: number;
  /**
   * imageUrl 만료 시각(Unix epoch milliseconds). imageUrl이 없으면 null
   * @format int64
   * @example 1787725695000
   */
  urlExpiresAt?: number;
  /**
   * 이 프레임이 속한 분석 구간의 종료 시각(Unix epoch milliseconds)
   * @format int64
   * @example 1787722095000
   */
  windowEnd?: number;
  /**
   * 이 프레임이 속한 분석 구간의 시작 시각(Unix epoch milliseconds)
   * @format int64
   * @example 1787722094000
   */
  windowStart?: number;
}

export interface NodePoint {
  name?: string;
  /** @format uuid */
  nodeId?: string;
  type?: "STAIR" | "ROOM" | "HALLWAY" | "DOOR" | "EXIT" | "START" | "CUSTOM";
  /** @format double */
  x?: number;
  /** @format double */
  y?: number;
}

export interface ObservationResponse {
  /** @format double */
  avgHeadcount?: number;
  /** @format int64 */
  capturedAt?: number;
  cctvCode?: string;
  /** @format int64 */
  configVersion?: number;
  congestionLevel?: "NORMAL" | "CAUTION" | "CROWDED" | "VERY_CROWDED";
  /** @format double */
  density?: number;
  eventId?: string;
  /** @format int64 */
  expiresAt?: number;
  monitoringImageKey?: string;
  /** @format int32 */
  peakHeadcount?: number;
  /** @format int32 */
  sampleCount?: number;
  trainingSessionId?: string;
  /** @format int64 */
  windowEnd?: number;
  /** @format int64 */
  windowStart?: number;
}

export type PollCommandsData = LightCommandListResponse;

export interface PresignedImageUrlResponse {
  /** @format int64 */
  expiresAt?: number;
  objectKey?: string;
  uploadUrl?: string;
}

export type ReadyScenarioData = ScenarioResponse;

export interface RecentEvacuationResponse {
  /** @format int32 */
  evacuationSec?: number;
  /** @format int32 */
  ordinal?: number;
}

export interface RecentTrainingReportResponse {
  /** @format int32 */
  avgEvacuationSec?: number;
  grade?: "A" | "B" | "C" | "D" | "F";
  /** @format int32 */
  participantCount?: number;
  reportId?: string;
  scenarioName?: string;
  /** @format date-time */
  startedAt?: string;
  survivalRate?: number;
}

export interface RecommendationResponse {
  description?: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  title?: string;
}

export type ReissueData = ApiResponseReissueResponse;

export interface ReissueRequest {
  /** @minLength 1 */
  refreshToken: string;
}

export interface ReissueResponse {
  accessToken?: string;
  /** @format int64 */
  expiresIn?: number;
  refreshToken?: string;
  tokenType?: string;
}

export type RejectData = ApiResponseRouteRecalculationResponse;

export interface RejectRouteRecalculationRequest {
  reason?: string;
}

export interface ReportChartsResponse {
  cumulativeEvacuation?: CumulativeEvacuationPointResponse[];
  recentEvacuationTimes?: RecentEvacuationResponse[];
  zoneDensities?: ZoneDensityResponse[];
}

export type ReportCongestionEventData = CongestionEventResponse;

export interface ReportCongestionEventRequest {
  /** @minLength 1 */
  cctvCode: string;
  /** @format int64 */
  configVersion: number;
  /** @format int64 */
  detectedAt: number;
  /** @format uuid */
  eventId: string;
  eventType: "CONGESTION_STARTED" | "CONGESTION_LEVEL_UP" | "CONGESTION_ENDED";
  /** @format int32 */
  headcount: number;
  localCongestionLevel: "NORMAL" | "CAUTION" | "CROWDED" | "VERY_CROWDED";
  /** @format double */
  localDensity: number;
  /** @format uuid */
  trainingSessionId: string;
}

export type ReportObservationData = ObservationResponse;

export interface ReportObservationRequest {
  /** @format double */
  avgHeadcount: number;
  /** @format int64 */
  capturedAt: number;
  capturedAtValid?: boolean;
  /** @minLength 1 */
  cctvCode: string;
  /** @format int64 */
  configVersion: number;
  /** @format uuid */
  eventId: string;
  /** @format int32 */
  frameHeadcount?: number;
  headcountValid?: boolean;
  monitoringImageKey?: string;
  /** @format int32 */
  peakHeadcount: number;
  /** @format int32 */
  sampleCount: number;
  /** @format uuid */
  trainingSessionId: string;
  /** @format int64 */
  windowEnd: number;
  /** @format int64 */
  windowStart: number;
  windowValid?: boolean;
}

export interface ReportResponse {
  /** @format int32 */
  avgEvacuationSec?: number;
  /**
   * 병목(혼잡) 발생 횟수. 혼잡 이벤트의 상태 전환 개수가 아니라, 실제로 병목 구간이 시작된 횟수를 의미한다 - CONGESTION_STARTED이면서 최종 판정된 congestionLevel이 CROWDED 또는 VERY_CROWDED인 경우만 1회로 집계하며, 같은 구간의 CONGESTION_LEVEL_UP/CONGESTION_ENDED는 포함하지 않는다.
   * @format int32
   * @example 3
   */
  bottleneckCount?: number;
  /** @format int32 */
  bottleneckScore?: number;
  charts?: ReportChartsResponse;
  /** @format double */
  deviationRate?: number;
  /** @format int32 */
  deviationScore?: number;
  /** @format int32 */
  evacuationScore?: number;
  grade?: "A" | "B" | "C" | "D" | "F";
  /** @format double */
  overallScore?: number;
  /** @format int32 */
  participantCount?: number;
  pdfUrl?: string;
  recommendations?: RecommendationResponse[];
  reportId?: string;
  /** @format double */
  riskIndex?: number;
  /**
   * 화재 확산으로 시작 지점에서 출구로 가는 대피 경로가 모두 막히기까지 걸린 시간(초, 훈련 시작 기준). 훈련 중 한 번도 막히지 않았으면 null. 점수에는 반영하지 않는 참고 지표다 - 시스템은 이 층 그래프 밖(아래층 계단 등)의 대피 수단과 실제 사람 위치를 모르므로 실패 판정 근거로 쓰지 않는다. 이 필드가 추가되기 전에 생성된 리포트는 null이다.
   * @format int32
   * @example 95
   */
  routeBlockedAfterSec?: number;
  summaryText?: string;
  survivalRate?: number;
  /** @format int32 */
  survivorCount?: number;
}

export interface RouteDeviationResponse {
  /** @format int64 */
  deviatedWindows?: number;
  /** @format double */
  deviationRate?: number;
  /** @format uuid */
  lightId?: string;
  /** @format int64 */
  totalObservedWindows?: number;
  /** @format uuid */
  trainingSessionId?: string;
}

export interface RouteRecalculationDetailResponse {
  cancelReason?: string;
  candidateRoute?: RouteSegment;
  cctvCode?: string;
  congestionLevel?: "NORMAL" | "CAUTION" | "CROWDED" | "VERY_CROWDED";
  /** @format double */
  density?: number;
  densityUnit?: "PERSON_PER_SQUARE_METER";
  /** @format uuid */
  floorId?: string;
  /** @format int32 */
  floorNum?: number;
  locationName?: string;
  previousRoute?: RouteSegment;
  /** @format uuid */
  recalculationId?: string;
  rejectReason?: string;
  /** @format date-time */
  requestedAt?: string;
  /** @format date-time */
  resolvedAt?: string;
  resolvedBy?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  /** @format uuid */
  trainingSessionId?: string;
  /** @format uuid */
  triggerEdgeId?: string;
  triggerType?: "STARTED" | "LEVEL_UP" | "ENDED" | "FIRE_SPREAD";
}

export interface RouteRecalculationResponse {
  congestionLevel?: "NORMAL" | "CAUTION" | "CROWDED" | "VERY_CROWDED";
  /** @format uuid */
  id?: string;
  recalculatedNodeIds?: string[];
  rejectReason?: string;
  /** @format date-time */
  requestedAt?: string;
  /** @format date-time */
  resolvedAt?: string;
  resolvedBy?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  /** @format double */
  totalWeight?: number;
  /** @format uuid */
  trainingSessionId?: string;
  /** @format uuid */
  triggerEdgeId?: string;
}

export interface RouteRecalculationSummaryResponse {
  cctvCode?: string;
  congestionLevel?: "NORMAL" | "CAUTION" | "CROWDED" | "VERY_CROWDED";
  /** @format double */
  density?: number;
  densityUnit?: "PERSON_PER_SQUARE_METER";
  /** @format uuid */
  floorId?: string;
  /** @format int32 */
  floorNum?: number;
  locationName?: string;
  /** @format uuid */
  recalculationId?: string;
  /** @format date-time */
  requestedAt?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  /** @format uuid */
  trainingSessionId?: string;
  /** @format uuid */
  triggerEdgeId?: string;
  triggerType?: "STARTED" | "LEVEL_UP" | "ENDED" | "FIRE_SPREAD";
}

export interface RouteSegment {
  nodeIds?: string[];
  /** @format double */
  totalWeight?: number;
}

export interface S3UploadResponse {
  s3Uri?: string;
  bucket?: string;
  contentType?: string;
  key?: string;
  /** @format int64 */
  size?: number;
}

export interface ScenarioEvacuationSetupResponse {
  /** @format uuid */
  buildingId?: string;
  /** @format date-time */
  configuredAt?: string;
  fireOrigin?: FireOrigin;
  /** @format uuid */
  floorId?: string;
  /** @format uuid */
  scenarioId?: string;
  startNode?: StartNode;
}

export interface ScenarioResponse {
  /** @format uuid */
  adminId?: string;
  /** @format uuid */
  buildingId?: string;
  /** @format date-time */
  createdAt?: string;
  deletable?: boolean;
  /** @format int32 */
  expectedParticipants?: number;
  fireSpreadSpeed?: "SLOW" | "MEDIUM" | "FAST";
  /** @format uuid */
  id?: string;
  isTemplate?: boolean;
  name?: string;
  reportId?: string;
  /** @format date-time */
  scheduledAt?: string;
  /** @format uuid */
  startNodeId?: string;
  status?:
    | "DRAFT"
    | "READY"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "ERROR"
    | "TIMEOUT_FAILED";
  /** @format int32 */
  targetEvacuationSec?: number;
  /** @format date-time */
  updatedAt?: string;
}

export interface ScenarioRouteDiagnosisResponse {
  /**
   * 모든 경로가 막히는 예상 시점(초). 제한 시간 안에 막히지 않으면 null
   * @format int64
   */
  blockedAfterSeconds?: number;
  /** 시간순 예상 이벤트 */
  events?: Event[];
  /** 시나리오 화재 확산 속도 */
  fireSpreadSpeed?: "SLOW" | "MEDIUM" | "FAST";
  /**
   * 시나리오 시작 지점이 있는 층 ID
   * @format uuid
   */
  floorId?: string;
  /** 화재가 안내 경로에 처음 닿았을 때 재탐색이 일어나면 true. 닿자마자 막히면 false (시나리오 시작 확인창 기준) */
  hasAlternativeRoute?: boolean;
  /** 훈련 시작 시 처음 안내되는 경로의 노드 ID 목록 (출발 -> 도착) */
  initialRouteNodeIds?: string[];
  /**
   * 예상 재탐색 횟수
   * @format int32
   */
  recalculationCount?: number;
  /**
   * 시나리오 ID
   * @format uuid
   */
  scenarioId?: string;
  /**
   * 계산한 최대 시간(초). 훈련 제한 시간과 같다
   * @format int64
   */
  simulatedUntilSeconds?: number;
  /**
   * 시나리오 시작 지점 노드 ID
   * @format uuid
   */
  startNodeId?: string;
  /**
   * 화재가 한 칸 번지는 간격(초)
   * @format int64
   */
  tickSeconds?: number;
  /** 타입이 STAIR·EXIT인데 탈출구로 지정하지 않은 노드 ID 목록. 엣지로 이어져 있으면 경로 중간에는 지날 수 있지만 대피 목적지(탈출구)로는 선택되지 않는다 */
  undesignatedStairNodeIds?: string[];
  /** 탈출구로 지정됐지만 훈련 시작 시점(최초 발화 지점만 막힌 상태)에 시작 지점에서 갈 수 없는 탈출구 노드 ID 목록. 모두 갈 수 있으면 빈 목록 */
  unreachableExitNodeIds?: string[];
}

export type SetupData = ScenarioEvacuationSetupResponse;

export type SignupData = ApiResponseSignupResponse;

export interface SignupRequest {
  /** @minLength 1 */
  email: string;
  /**
   * @minLength 8
   * @maxLength 100
   */
  password: string;
  /** @pattern ^$|^[0-9-]{9,20}$ */
  phoneNumber?: string;
  role?: "MANAGER" | "NORMAL";
  /**
   * @minLength 5
   * @maxLength 20
   */
  schoolName: string;
  /**
   * @minLength 2
   * @maxLength 20
   */
  username: string;
}

export interface SignupResponse {
  /** @format date-time */
  createdAt?: string;
  email?: string;
  /** @format uuid */
  id?: string;
  phoneNumber?: string;
  role?: "MANAGER" | "NORMAL";
  schoolName?: string;
  username?: string;
}

export interface StartCandidate {
  /**
   * 시작 후보 노드 ID
   * @format uuid
   */
  nodeId?: string;
  /**
   * 이 후보에서 갈 수 있는 탈출구 수
   * @format int32
   */
  reachableExitCount?: number;
}

export interface StartNode {
  code?: string;
  name?: string;
  /** @format uuid */
  nodeId?: string;
  type?: "STAIR" | "ROOM" | "HALLWAY" | "DOOR" | "EXIT" | "START" | "CUSTOM";
  /** @format double */
  x?: number;
  /** @format double */
  y?: number;
}

export type StartTrainingSessionData = ApiResponseTrainingSessionResponse;

/** 훈련 세션 목록의 공통 API 응답 스키마 */
export interface TrainingSessionListApiResponse {
  /**
   * 응답 코드
   * @example "TRAINING_SUCCESS_008"
   */
  code?: string;
  /**
   * 요청 성공 여부
   * @example true
   */
  isSuccess?: boolean;
  /**
   * 응답 메시지
   * @example "훈련 세션 목록 조회에 성공했습니다."
   */
  message?: string;
  /** 훈련 세션 목록 */
  result?: TrainingSessionListResponse;
}

/** 조건에 맞는 훈련 세션 목록 */
export interface TrainingSessionListResponse {
  sessions?: TrainingSessionSummaryResponse[];
}

/** 훈련 세션 생성/시작/종료/강제종료 API의 공통 응답 */
export interface TrainingSessionResponse {
  /**
   * 세션을 생성한 관리자 이름
   * @example "박현지"
   */
  adminName?: string;
  /**
   * 훈련 종료 시각(정상 종료 또는 강제 종료). RUNNING이거나 아직 시작되지 않았으면 null. end/force-end 응답에는 방금 종료 처리된 시각이 그대로 담깁니다.
   * @format date-time
   */
  endedAt?: string;
  /**
   * 세션 ID
   * @format uuid
   * @example "d669294e-55e1-4c00-bf67-229d89b76948"
   */
  id?: string;
  /**
   * 훈련 시나리오명
   * @example "3학년 A동 화재 대피 훈련"
   */
  scenarioName?: string;
  /**
   * 훈련 시작 시각. 아직 시작되지 않았으면(SCHEDULED) null
   * @format date-time
   */
  startedAt?: string;
  /**
   * 세션 상태
   * @example "COMPLETED"
   */
  status?:
    | "RUNNING"
    | "STOPPED"
    | "SCHEDULED"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED";
}

/** 훈련 세션 목록의 항목 하나 */
export interface TrainingSessionSummaryResponse {
  /**
   * 훈련이 진행되는 건물 ID
   * @format uuid
   * @example "b5a6e5b0-1e3a-4b8a-9b8a-6a2b6b1f5a11"
   */
  buildingId?: string;
  /**
   * 훈련이 진행되는 건물명
   * @example "A동"
   */
  buildingName?: string;
  /**
   * 훈련 시나리오 ID
   * @format uuid
   * @example "746d0249-c6c2-4a61-a233-44f35c04dc49"
   */
  scenarioId?: string;
  /**
   * 훈련 시나리오 이름
   * @example "3학년 A동 화재 대피 훈련"
   */
  scenarioName?: string;
  /**
   * 훈련 세션 ID
   * @format uuid
   * @example "d669294e-55e1-4c00-bf67-229d89b76948"
   */
  sessionId?: string;
  /**
   * 훈련 시작 시각
   * @format date-time
   * @example "2026-08-26T05:26:00Z"
   */
  startedAt?: string;
  /**
   * 훈련 세션 상태
   * @example "RUNNING"
   */
  status?:
    | "RUNNING"
    | "STOPPED"
    | "SCHEDULED"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED";
}

export type TrainingStatusResponse = any;

export type UpdateBuildingData = ApiResponseBuildingResponse;

export interface UpdateBuildingRequest {
  /**
   * @minLength 8
   * @maxLength 100
   */
  address: string;
  buildingType: "CLASSROOM" | "CAFETERIA" | "LIBRARY" | "DORMITORY" | "GYM";
  /**
   * @minLength 2
   * @maxLength 20
   */
  name: string;
}

export type UpdateCctvData = ApiResponseCctvResponse;

export interface UpdateCctvRequest {
  /**
   * @minLength 0
   * @maxLength 100
   */
  name: string;
  /**
   * @format double
   * @min 0
   * @max 1
   */
  x: number;
  /**
   * @format double
   * @min 0
   * @max 1
   */
  y: number;
}

export type UpdateFloorData = ApiResponseFloorResponse;

export interface UpdateFloorRequest {
  /** @format int32 */
  floorNum: number;
}

export interface UpdateIoTLightRequest {
  /** @minLength 1 */
  name: string;
  /** @format double */
  x: number;
  /** @format double */
  y: number;
}

export type UpdateLightData = ApiResponseIoTLightResponse;

export interface UpdateMapNodePositionRequest {
  isExitTarget?: boolean;
  type?: "STAIR" | "ROOM" | "HALLWAY" | "DOOR" | "EXIT" | "START" | "CUSTOM";
  /** @format double */
  x: number;
  /** @format double */
  y: number;
}

export interface UpdateMapNodeStartCandidateRequest {
  isStartCandidate: boolean;
}

export type UpdateMyProfileData = ApiResponseUserProfileResponse;

export type UpdateNodePositionData = ApiResponseMapNodeResponse;

export type UpdatePiEndpointData = ApiResponseIoTLightResponse;

export interface UpdatePiEndpointRequest {
  /** @minLength 1 */
  piEndpoint: string;
}

export type UpdateScenarioData = ScenarioResponse;

export interface UpdateScenarioRequest {
  /** @format uuid */
  buildingId?: string;
  /** @format int32 */
  expectedParticipants?: number;
  fireSpreadSpeed?: "SLOW" | "MEDIUM" | "FAST";
  isTemplate?: boolean;
  name?: string;
  /** @format date-time */
  scheduledAt?: string;
}

export type UpdateStartCandidateData = ApiResponseMapNodeResponse;

export interface UpdateUserProfileRequest {
  /**
   * @minLength 1
   * @maxLength 255
   */
  email?: string;
  /** @pattern ^$|^[0-9-]{9,20}$ */
  phoneNumber?: string;
  /**
   * @minLength 5
   * @maxLength 20
   */
  schoolName?: string;
  /**
   * @minLength 2
   * @maxLength 20
   */
  username?: string;
}

export type UploadData = ApiResponseS3UploadResponse;

export type UploadFloorData = ApiResponseFloorResponse;

export interface UploadFloorRequest {
  /** @format binary */
  file: File;
  /** @format int32 */
  floorNum: number;
  /** @format double */
  realHeight: number;
  /** @format double */
  realWidth: number;
}

export interface UploadPayload {
  /** @format binary */
  file: File;
}

export interface UserProfileResponse {
  email?: string;
  /** @format uuid */
  id?: string;
  phoneNumber?: string;
  role?: "MANAGER" | "NORMAL";
  schoolName?: string;
  username?: string;
}

export interface UserZoneCellsResponse {
  cells?: CellResponse[];
  response?: UserZoneResponse;
}

export interface UserZoneCreateRequest {
  /** @minItems 1 */
  cellIds: string[];
  /** @minLength 1 */
  name: string;
}

export interface UserZoneResponse {
  /** @format int32 */
  floorNum?: number;
  /** @format uuid */
  userZoneId?: string;
  userZoneName?: string;
}

export interface ZoneDensityResponse {
  /** @format double */
  avgDensityPercent?: number;
  zoneName?: string;
}
