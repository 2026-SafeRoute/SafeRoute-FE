import MapIcon from '@assets/icons/ic-map.svg?react';

import { Button } from '@components/Button';
import EmptyState from '@components/empty';
import LoadingState from '@components/loadingState';

import { CANVAS_W } from '@utils/floorCanvas';

import AddedDevicePin from './AddedDevicePin';
import * as styles from './canvas.css';
import DevicePin from './DevicePin';
import FloorCanvasSvg from './FloorCanvasSvg';
import { EDITING_LOCK_HINT_ID } from '../../constants/floorEditor';

import type { FloorGridCell } from '../../api/floorGridApi';
import type { MapEdge, MapNode } from '../../api/mapGraphApi';
import type { AddedDevice } from '../../constants/devicePlacement';
import type { StructureNode } from '../../constants/structureNode';
import type {
  SelectedItem,
  ZoneEntry,
  ZoneRect,
  ZoneRefSelection,
} from '../../types/canvasSelection';
import type { DeviceMarker, Floor } from '../../types/floorPlans';
import type { FloorRouteDiagnosisHighlight } from '../../types/routeDiagnosis';
import type { LightPickFieldName } from '../../utils/lightPick';

const CANVAS_RENDER_WIDTH = 700;

// 장비 마커(CCTV·유도등) 표시·선택·드래그 이동
interface FloorCanvasDeviceProps {
  addedDevices: AddedDevice[];
  devicePositions: Record<string, { x: number; y: number }>;
  selected: SelectedItem | null;
  editingItemId: string | null;
  stagedCameraPosition: { x: number; y: number } | null;
  onSelectDevice: (d: DeviceMarker) => void;
  onDeviceMoved: (id: string, x: number, y: number) => void;
}

// 도면을 드래그해 그리드 칸을 고르는 중(구역·CCTV 감시 영역)
interface FloorCanvasZoneDragProps {
  zoneAddActive: boolean;
  isZoneDragging: boolean;
  onZoneDraftChange: (rect: ZoneRect | null) => void;
  onZoneDragEnd: () => void;
  onZoneDraggingChange: (dragging: boolean) => void;
}

// 노드·엣지·구역 표시와 선택·이동·연결
interface FloorCanvasGraphProps {
  savedZones: ZoneEntry[];
  structureNodes: StructureNode[];
  editingStructureId: string | null;
  onStructureNodeMove: (id: string, x: number, y: number) => void;
  onStructureNodeMoveEnd: (id: string, x: number, y: number) => void;
  graphNodes: MapNode[];
  graphEdges: MapEdge[];
  edgeAddActive: boolean;
  onNodeClickForEdge: (id: string) => void;
  edgeChainNodeIds: string[];
  selectedEdgeId: string | null;
  onEdgeSelect: (id: string) => void;
  onEdgeDelete: (id: string) => void;
  selectedZoneRef: ZoneRefSelection | null;
  onZoneRefSelect: (ref: ZoneRefSelection) => void;
  routeDiagnosisHighlight?: FloorRouteDiagnosisHighlight;
}

// 그리드 칸 표시·선택(CCTV 감시 영역·구역 범위)
interface FloorCanvasGridProps {
  cctvGridCellsMode: 'hidden' | 'selecting' | 'viewing' | 'browsing';
  floorGridCells: FloorGridCell[];
  selectedGridCellIds: string[];
  gridCellPxSize: { w: number; h: number };
  onGridCellToggle: (cellId: string) => void;
}

// 유도등 갈림길·좌우 통로 미리보기와 "캔버스에서 선택"
interface FloorCanvasLightPickProps {
  lightPreviewNodeId?: string;
  lightPreviewLeftEdgeId?: string;
  lightPreviewRightEdgeId?: string;
  lightPickField?: LightPickFieldName | null;
  onLightPick?: (id: string) => void;
}

interface FloorCanvasProps {
  mapWrapRef: React.RefObject<HTMLDivElement>;
  floor: Floor;
  resolvedImageUrl: string | null;
  canvasH: number;
  zoom: number;
  placingActive: boolean;
  editingLocked?: boolean;
  onMapClick: (x: number, y: number) => void;
  onBackgroundClick: () => void;
  onUpload: () => void;
  devices: FloorCanvasDeviceProps;
  zoneDrag: FloorCanvasZoneDragProps;
  graph: FloorCanvasGraphProps;
  grid: FloorCanvasGridProps;
  lightPick: FloorCanvasLightPickProps;
}

/* ── 도면 캔버스 ── */
const FloorCanvas = ({
  mapWrapRef,
  floor,
  resolvedImageUrl,
  canvasH,
  zoom,
  placingActive,
  editingLocked = false,
  onMapClick,
  onBackgroundClick,
  onUpload,
  devices,
  zoneDrag,
  graph,
  grid,
  lightPick,
}: FloorCanvasProps) => {
  const {
    addedDevices,
    devicePositions,
    selected,
    editingItemId,
    stagedCameraPosition,
    onSelectDevice,
    onDeviceMoved,
  } = devices;
  const { zoneAddActive, isZoneDragging, onZoneDraftChange, onZoneDragEnd, onZoneDraggingChange } =
    zoneDrag;
  const {
    savedZones,
    structureNodes,
    editingStructureId,
    onStructureNodeMove,
    onStructureNodeMoveEnd,
    graphNodes,
    graphEdges,
    edgeAddActive,
    onNodeClickForEdge,
    edgeChainNodeIds,
    selectedEdgeId,
    onEdgeSelect,
    onEdgeDelete,
    selectedZoneRef,
    onZoneRefSelect,
    routeDiagnosisHighlight,
  } = graph;
  const {
    cctvGridCellsMode,
    floorGridCells,
    selectedGridCellIds,
    gridCellPxSize,
    onGridCellToggle,
  } = grid;
  const {
    lightPreviewNodeId,
    lightPreviewLeftEdgeId,
    lightPreviewRightEdgeId,
    lightPickField,
    onLightPick,
  } = lightPick;
  const editingLockHintId = EDITING_LOCK_HINT_ID;
  const hasFloorPlan = floor.segmentationStatus === 'DONE';

  if (!hasFloorPlan) {
    // 이미지가 올라온 층만 "분석 중"으로 취급 — 업로드 전 층은 기존 안내를 보여줌
    const isAnalyzing =
      !!floor.mapImageUrl &&
      (floor.segmentationStatus === 'PENDING' || floor.segmentationStatus === 'PROCESSING');
    const isAnalysisFailed = floor.segmentationStatus === 'FAILED';

    return (
      <div className={styles.canvasPlaceholder}>
        {isAnalyzing ? (
          <>
            <LoadingState size="md" message="AI가 도면을 분석하고 있습니다" />
            <p className={styles.canvasPlaceholderText}>
              완료되면 이 화면에 도면과 노드가 자동으로 표시됩니다
            </p>
          </>
        ) : (
          <EmptyState
            size="compact"
            icon={<MapIcon />}
            title={isAnalysisFailed ? '도면 분석에 실패했습니다' : '등록된 도면이 없습니다'}
            description={
              isAnalysisFailed
                ? '도면을 다시 업로드해 주세요'
                : '도면을 업로드하거나 AI 영역 분할을 실행해 주세요'
            }
            action={
              <Button
                variant="primary"
                size="sm"
                disabled={editingLocked}
                aria-describedby={editingLocked ? editingLockHintId : undefined}
                onClick={onUpload}
              >
                도면 {isAnalysisFailed ? '다시 ' : ''}업로드
              </Button>
            }
          />
        )}
      </div>
    );
  }

  const scale = zoom / 100;
  const canvasRenderHeight = (CANVAS_RENDER_WIDTH * canvasH) / CANVAS_W;

  return (
    <div
      className={styles.mapScaleFrame}
      style={{
        width: `${CANVAS_RENDER_WIDTH * scale}px`,
        height: `${canvasRenderHeight * scale}px`,
      }}
    >
      <div ref={mapWrapRef} className={styles.mapWrap} style={{ transform: `scale(${scale})` }}>
        <FloorCanvasSvg
          mapImageUrl={resolvedImageUrl}
          canvasH={canvasH}
          placingActive={placingActive}
          zoneAddActive={zoneAddActive}
          onZoneDraftChange={onZoneDraftChange}
          onZoneDragEnd={onZoneDragEnd}
          onZoneDraggingChange={onZoneDraggingChange}
          savedZones={savedZones}
          structureNodes={structureNodes}
          editingStructureId={editingStructureId}
          onStructureNodeMove={onStructureNodeMove}
          onStructureNodeMoveEnd={onStructureNodeMoveEnd}
          graphNodes={graphNodes}
          graphEdges={graphEdges}
          edgeAddActive={edgeAddActive}
          onNodeClickForEdge={onNodeClickForEdge}
          edgeChainNodeIds={edgeChainNodeIds}
          selectedEdgeId={selectedEdgeId}
          onEdgeSelect={onEdgeSelect}
          onEdgeDelete={onEdgeDelete}
          selectedZoneRef={selectedZoneRef}
          onZoneRefSelect={onZoneRefSelect}
          cctvGridCellsMode={cctvGridCellsMode}
          floorGridCells={floorGridCells}
          selectedGridCellIds={selectedGridCellIds}
          gridCellPxSize={gridCellPxSize}
          onGridCellToggle={onGridCellToggle}
          onMapClick={onMapClick}
          onBackgroundClick={onBackgroundClick}
          lightPreviewNodeId={lightPreviewNodeId}
          lightPreviewLeftEdgeId={lightPreviewLeftEdgeId}
          lightPreviewRightEdgeId={lightPreviewRightEdgeId}
          lightPickField={lightPickField}
          onLightPick={onLightPick}
          editingLocked={editingLocked}
          routeDiagnosisHighlight={routeDiagnosisHighlight}
        />
        {stagedCameraPosition && (
          <div
            className={styles.stagedCameraMarker}
            style={{ left: `${stagedCameraPosition.x}%`, top: `${stagedCameraPosition.y}%` }}
          />
        )}
        {/* 구역 드래그 중엔 이 레이어(SVG 밖 HTML 마커)의 포인터 이벤트를 꺼서, 마커 위를
          지나가도 각자의 cursor(grab/pointer)로 안 바뀌고 아래 SVG 배경의 crosshair가
          그대로 보이게 함 — 이 wrapper는 position을 안 걸어서 자식들의 absolute 위치
          기준(mapWrap)에는 영향이 없음 */}
        <div style={{ pointerEvents: isZoneDragging ? 'none' : undefined }}>
          {floor.devices.map((device) => {
            // devicePositions는 드래그 중 미리보기 오버레이 — 수정 모드를 벗어나면(완료든 취소든)
            // 곧바로 원래 좌표로 되돌아가야 해서, 그 항목을 수정 중일 때만 오버레이를 반영함
            const pos =
              editingItemId === device.id && devicePositions[device.id]
                ? devicePositions[device.id]
                : { x: device.x, y: device.y };
            return (
              <DevicePin
                key={device.id}
                device={device}
                posX={pos.x}
                posY={pos.y}
                selected={selected?.kind === 'device' && selected.data.id === device.id}
                draggable={editingItemId === device.id}
                onClick={() => onSelectDevice(device)}
                onDragEnd={onDeviceMoved}
              />
            );
          })}

          {/* 사용자가 추가한 장치 마커 */}
          {addedDevices.map((d) => {
            // devicePositions는 드래그 중 미리보기 오버레이 — 수정 모드를 벗어나면(완료든 취소든)
            // 곧바로 원래 좌표로 되돌아가야 해서, 그 항목을 수정 중일 때만 오버레이를 반영함
            const pos =
              editingItemId === d.id && devicePositions[d.id]
                ? devicePositions[d.id]
                : { x: d.x, y: d.y };
            return (
              <AddedDevicePin
                key={d.id}
                device={d}
                posX={pos.x}
                posY={pos.y}
                selected={selected?.kind === 'device' && selected.data.id === d.id}
                draggable={editingItemId === d.id}
                onClick={() => onSelectDevice(d)}
                onDragEnd={onDeviceMoved}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FloorCanvas;
