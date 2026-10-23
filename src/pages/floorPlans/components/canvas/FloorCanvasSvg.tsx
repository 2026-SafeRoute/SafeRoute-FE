import { useLayoutEffect, useRef, useState } from 'react';

import TriangleIcon from '@assets/icons/ic-triangle.svg?react';

import { vars } from '@styles/global.css';

import { CANVAS_W, buildZoneOutlinePath } from '@utils/floorCanvas';

import GridOverlayLines from './GridOverlayLines';
import { DEVICE_COLOR } from '../../constants/deviceColors';
import { STRUCTURE_NODE_COLOR } from '../../constants/structureNode';
import { hasExistingEdge } from '../../utils/hasExistingEdge';
import { rafThrottle } from '../../utils/rafThrottle';

import type { FloorGridCell } from '../../api/floorGridApi';
import type { MapEdge, MapNode } from '../../api/mapGraphApi';
import type { StructureNode } from '../../constants/structureNode';
import type { ZoneEntry, ZoneRect, ZoneRefSelection } from '../../types/canvasSelection';
import type { FloorRouteDiagnosisHighlight } from '../../types/routeDiagnosis';
import type { LightPickFieldName } from '../../utils/lightPick';

// 맵그래프 노드 중 문/계단이 아닌 나머지(ROOM/HALLWAY/EXIT/CUSTOM) — 조회 전용, 아직 편집 대상 아님
const GRAPH_NODE_COLOR: Record<'ROOM' | 'HALLWAY' | 'EXIT' | 'CUSTOM', string> = {
  ROOM: vars.color.gray300,
  HALLWAY: vars.color.gray300,
  EXIT: vars.color.success,
  CUSTOM: '#7c3aed',
};

// 계단 노드 삼각형 아이콘 크기 — 글자(▲)는 위치마다 픽셀 정렬이 달라 크기가 들쭉날쭉해 보여 도형으로 고정
const STAIR_ICON_SIZE = 7;

// 그래프 노드 진단 강조 링 반지름 — 엣지 체인 선택 링(9)보다 바깥에 그려 둘 다 보이게 함
const GRAPH_DIAGNOSIS_RING_RADIUS = 11;

interface FloorCanvasSvgProps {
  mapImageUrl: string | null;
  canvasH: number;
  placingActive: boolean;
  zoneAddActive: boolean;
  onZoneDraftChange: (rect: ZoneRect | null) => void;
  onZoneDragEnd: () => void;
  onZoneDraggingChange: (dragging: boolean) => void;
  savedZones: ZoneEntry[];
  structureNodes: StructureNode[];
  graphNodes: MapNode[];
  graphEdges: MapEdge[];
  edgeAddActive: boolean;
  onNodeClickForEdge: (id: string) => void;
  // 순서대로 클릭해 쌓은 엣지 체인 — 골라둔 노드 강조·구간 미리보기에 씀
  edgeChainNodeIds: string[];
  selectedEdgeId: string | null;
  onEdgeSelect: (id: string) => void;
  onEdgeDelete: (id: string) => void;
  editingStructureId: string | null;
  onStructureNodeMove: (id: string, x: number, y: number) => void;
  onStructureNodeMoveEnd: (id: string, x: number, y: number) => void;
  selectedZoneRef: ZoneRefSelection | null;
  onZoneRefSelect: (ref: ZoneRefSelection) => void;
  cctvGridCellsMode: 'hidden' | 'selecting' | 'viewing' | 'browsing';
  floorGridCells: FloorGridCell[];
  selectedGridCellIds: string[];
  gridCellPxSize: { w: number; h: number };
  onGridCellToggle: (cellId: string) => void;
  onMapClick: (x: number, y: number) => void;
  onBackgroundClick: () => void;
  // 유도등 추가·수정 중 드롭다운으로 고른 갈림길 위치·왼쪽/오른쪽 통로를 캔버스에 바로
  // 보여주기 위함 — "뭘 고른 건지 캔버스에서 안 보여서 불친절하다"는 피드백 반영
  lightPreviewNodeId?: string;
  lightPreviewLeftEdgeId?: string;
  lightPreviewRightEdgeId?: string;
  // "캔버스에서 선택" 모드 — 켜져 있으면 노드/엣지 클릭이 평소 동작(선택·삭제·엣지연결 등) 대신
  // 유도등 갈림길 위치·좌우 통로 지정으로 대체됨
  lightPickField?: LightPickFieldName | null;
  onLightPick?: (id: string) => void;
  editingLocked?: boolean;
  routeDiagnosisHighlight?: FloorRouteDiagnosisHighlight;
}

// 실제 데이터를 그리는 도면 캔버스 SVG — 이름은 초기 프로토타입 시절("3층 목업")에서 남은 것
const FloorCanvasSvg = ({
  mapImageUrl,
  canvasH,
  placingActive,
  zoneAddActive,
  onZoneDraftChange,
  onZoneDragEnd,
  onZoneDraggingChange,
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
  cctvGridCellsMode,
  floorGridCells,
  selectedGridCellIds,
  gridCellPxSize,
  onGridCellToggle,
  onMapClick,
  onBackgroundClick,
  lightPreviewNodeId,
  lightPreviewLeftEdgeId,
  lightPreviewRightEdgeId,
  lightPickField,
  onLightPick,
  editingLocked = false,
  routeDiagnosisHighlight,
}: FloorCanvasSvgProps) => {
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const structureDragMovedRef = useRef(false);
  const editingLockedRef = useRef(editingLocked);
  const cancelZoneDragRef = useRef<(() => void) | null>(null);
  const cancelStructureDragRef = useRef<(() => void) | null>(null);
  // 구역 드래그 중엔 포인터가 격자 셀·구조 노드 위를 지나가도 그 위에 걸린 개별 커서(pointer 등)로
  // 안 바뀌고 항상 십자선(crosshair)으로 보여야 함 — 드래그가 아닐 땐 칸 클릭·노드 선택이 여전히
  // 동작해야 하므로 zoneAddActive 내내가 아니라 실제 드래그 중(mousedown~mouseup)에만 그 레이어의
  // 포인터 이벤트를 꺼서 아래 svg 배경의 crosshair가 그대로 보이게 함
  const [isZoneDragging, setIsZoneDragging] = useState(false);

  useLayoutEffect(() => {
    editingLockedRef.current = editingLocked;
    if (!editingLocked) return;
    cancelZoneDragRef.current?.();
    cancelStructureDragRef.current?.();
  }, [editingLocked]);

  // 엣지(선) 양 끝 좌표를 찾기 위한 노드 id → SVG 좌표 조회 (구조 노드 + 그 외 그래프 노드 통합)
  const nodePositionById = new Map<string, { x: number; y: number }>();
  structureNodes.forEach((n) => nodePositionById.set(n.id, { x: n.x, y: n.y }));
  graphNodes.forEach((n) => nodePositionById.set(n.id, { x: n.x * CANVAS_W, y: n.y * canvasH }));

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (editingLockedRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // 캔버스 경계 밖 클릭이 0~1 범위를 벗어난 좌표로 저장되지 않도록 클램프 (백엔드 x,y 검증: 0~1)
    const x = Math.round(
      Math.max(0, Math.min(CANVAS_W, ((e.clientX - rect.left) / rect.width) * CANVAS_W)),
    );
    const y = Math.round(
      Math.max(0, Math.min(canvasH, ((e.clientY - rect.top) / rect.height) * canvasH)),
    );
    if (placingActive) {
      onMapClick(x, y);
      return;
    }
    if (zoneAddActive) return;
    onBackgroundClick();
  };

  // 클릭/드래그 지점을 캔버스(560 x canvasH) 좌표로 그대로 변환 — 격자 스냅 없이 포인터를 정확히 따라감.
  // 구역 드래그는 이 사각형과 겹치는 실제 그리드 셀이 선택되고(handleZoneDragEnd), 노드는 이 좌표에 그대로 배치됨
  const svgPoint = (clientX: number, clientY: number, svgEl: SVGSVGElement) => {
    const rect = svgEl.getBoundingClientRect();
    const rawX = ((clientX - rect.left) / rect.width) * CANVAS_W;
    const rawY = ((clientY - rect.top) / rect.height) * canvasH;
    return {
      x: Math.max(0, Math.min(CANVAS_W, rawX)),
      y: Math.max(0, Math.min(canvasH, rawY)),
    };
  };

  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (editingLockedRef.current || !zoneAddActive) return;
    e.preventDefault();
    const svgEl = e.currentTarget;
    const start = svgPoint(e.clientX, e.clientY, svgEl);
    dragStartRef.current = start;
    setIsZoneDragging(true);
    onZoneDraggingChange(true);
    onZoneDraftChange({ x: start.x, y: start.y, w: 0, h: 0 });
    let lastRect = { x: start.x, y: start.y, w: 0, h: 0 };
    const applyRect = rafThrottle((rect: typeof lastRect) => onZoneDraftChange(rect));

    const cleanup = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      cancelZoneDragRef.current = null;
    };

    const cancelDrag = () => {
      dragStartRef.current = null;
      setIsZoneDragging(false);
      onZoneDraggingChange(false);
      applyRect.cancel();
      onZoneDraftChange(null);
      cleanup();
    };

    const onMove = (mv: MouseEvent) => {
      if (editingLockedRef.current) {
        cancelDrag();
        return;
      }
      if (!dragStartRef.current) return;
      const cur = svgPoint(mv.clientX, mv.clientY, svgEl);
      const x = Math.min(dragStartRef.current.x, cur.x);
      const y = Math.min(dragStartRef.current.y, cur.y);
      const w = Math.abs(cur.x - dragStartRef.current.x);
      const h = Math.abs(cur.y - dragStartRef.current.y);
      lastRect = { x, y, w, h };
      applyRect(lastRect);
    };
    const onUp = () => {
      if (editingLockedRef.current) {
        cancelDrag();
        return;
      }
      dragStartRef.current = null;
      setIsZoneDragging(false);
      onZoneDraggingChange(false);
      // onZoneDragEnd가 마지막으로 반영된 사각형을 기준으로 셀을 계산하므로, 대기 중인 갱신을
      // 취소하고 마지막 사각형을 먼저 동기 반영한 뒤에 종료 처리함
      applyRect.cancel();
      onZoneDraftChange(lastRect);
      cleanup();
      onZoneDragEnd();
    };
    cancelZoneDragRef.current = cancelDrag;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleStructureMouseDown = (e: React.MouseEvent<SVGGElement>, structureId: string) => {
    if (editingLockedRef.current || structureId !== editingStructureId) return;
    e.stopPropagation();
    e.preventDefault();
    structureDragMovedRef.current = false;
    const svgEl = e.currentTarget.ownerSVGElement;
    if (!svgEl) return;
    let lastPoint: { x: number; y: number } | null = null;
    const applyMove = rafThrottle((x: number, y: number) => onStructureNodeMove(structureId, x, y));

    const cleanup = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      cancelStructureDragRef.current = null;
    };

    const cancelDrag = () => {
      applyMove.cancel();
      cleanup();
    };

    const onMove = (mv: MouseEvent) => {
      if (editingLockedRef.current) {
        cancelDrag();
        return;
      }
      structureDragMovedRef.current = true;
      const point = svgPoint(mv.clientX, mv.clientY, svgEl);
      lastPoint = point;
      applyMove(point.x, point.y);
    };
    const onUp = () => {
      if (editingLockedRef.current) {
        cancelDrag();
        return;
      }
      applyMove.cancel();
      cleanup();
      if (lastPoint) {
        onStructureNodeMove(structureId, lastPoint.x, lastPoint.y);
        onStructureNodeMoveEnd(structureId, lastPoint.x, lastPoint.y);
      }
    };
    cancelStructureDragRef.current = cancelDrag;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // 맵그래프 노드(방·출구 등) 클릭 — 유도등 갈림길 선택 또는 엣지 연결
  const handleGraphNodeClick = (e: React.MouseEvent, id: string) => {
    if (lightPickField === 'decisionNode') {
      e.stopPropagation();
      onLightPick?.(id);
      return;
    }
    if (!edgeAddActive) return;
    e.stopPropagation();
    onNodeClickForEdge(id);
  };

  // 구조 노드(문·계단·복도) 클릭 — 유도등 갈림길 선택, 엣지 연결, 또는 카드 선택
  const handleStructureNodeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (lightPickField === 'decisionNode') {
      onLightPick?.(id);
      return;
    }
    if (edgeAddActive) {
      onNodeClickForEdge(id);
      return;
    }
    if (structureDragMovedRef.current) {
      structureDragMovedRef.current = false;
      return;
    }
    if (editingStructureId) return;
    onZoneRefSelect({ kind: 'node', id });
  };

  const svgCursor = placingActive || zoneAddActive || edgeAddActive ? 'crosshair' : 'default';
  // 탈출구 도달 불가 노드 ID 집합
  const unreachableNodeIds = new Set(routeDiagnosisHighlight?.unreachableNodeIds);
  // 도달 가능 탈출구 부족 시작 후보 ID 집합
  const limitedExitStartNodeIds = new Set(routeDiagnosisHighlight?.limitedExitStartNodeIds);
  // 탈출구 미지정 계단 노드 ID 집합
  const undesignatedStairNodeIds = new Set(routeDiagnosisHighlight?.undesignatedStairNodeIds);

  return (
    <svg
      viewBox={`0 0 ${CANVAS_W} ${canvasH}`}
      width={700}
      height={(700 * canvasH) / CANVAS_W}
      xmlns="http://www.w3.org/2000/svg"
      style={{ cursor: svgCursor }}
      onClick={handleSvgClick}
      onMouseDown={handleSvgMouseDown}
    >
      {/* 배경 — 실제 업로드된 도면 원본 이미지. 벽은 별도 데이터가 아니라 이 이미지 자체에 포함되어 있음.
          viewBox 높이(canvasH)를 도면 실제 비율에 맞춰 잡으므로, 이미지를 preserveAspectRatio="none"로
          꽉 채워도 늘어나지 않고 격자·노드·드래그 좌표(0~1 정규화)와 정확히 일치함 */}
      <rect width={CANVAS_W} height={canvasH} fill={vars.color.gray25} />
      {mapImageUrl && (
        <image
          href={mapImageUrl}
          x={0}
          y={0}
          width={CANVAS_W}
          height={canvasH}
          preserveAspectRatio="none"
        />
      )}

      {/* 맵그래프 엣지 — 편집모드 아닐 땐 클릭해서 선택 후 삭제 가능 */}
      {graphEdges.map((edge) => {
        const from = nodePositionById.get(edge.fromNodeId);
        const to = nodePositionById.get(edge.toNodeId);
        if (!from || !to) return null;
        const isSelected = selectedEdgeId === edge.id;
        const canSelect = !editingLocked && !edgeAddActive && !placingActive && !zoneAddActive;
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        // 유도등 추가·수정 중 드롭다운으로 왼쪽/오른쪽 통로를 고르면 캔버스에서도 바로 어느
        // 구간인지 보이게 함 — 색만으로는 헷갈릴 수 있어 라벨도 같이 띄움
        const isLeftPreview = !!lightPreviewLeftEdgeId && edge.id === lightPreviewLeftEdgeId;
        const isRightPreview = !!lightPreviewRightEdgeId && edge.id === lightPreviewRightEdgeId;
        const previewColor = isLeftPreview ? '#0ea5e9' : isRightPreview ? vars.color.warning : null;
        // "캔버스에서 선택" 중엔 갈림길 위치에 실제로 연결된 엣지만 고를 수 있어야 함 — 드롭다운의
        // 필터 기준(연결 여부 + 반대쪽이 이미 고른 엣지 제외)을 그대로 따름
        const isEdgePickMode = lightPickField === 'leftEdge' || lightPickField === 'rightEdge';
        const isPickableEdge =
          isEdgePickMode &&
          !!lightPreviewNodeId &&
          (edge.fromNodeId === lightPreviewNodeId || edge.toNodeId === lightPreviewNodeId) &&
          edge.id !==
            (lightPickField === 'leftEdge' ? lightPreviewRightEdgeId : lightPreviewLeftEdgeId);
        return (
          <g key={edge.id}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="transparent"
              strokeWidth="10"
              style={{
                cursor: canSelect || isPickableEdge ? 'pointer' : 'default',
                pointerEvents: canSelect || isPickableEdge ? 'stroke' : 'none',
              }}
              onClick={(e) => {
                if (isPickableEdge) {
                  e.stopPropagation();
                  onLightPick?.(edge.id);
                  return;
                }
                if (!canSelect) return;
                e.stopPropagation();
                onEdgeSelect(edge.id);
              }}
            />
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={previewColor ?? (isSelected ? vars.color.primary : vars.color.gray300)}
              strokeWidth={previewColor ? '3' : isSelected ? '2.5' : '1.5'}
              strokeDasharray={previewColor ? undefined : '3 3'}
              style={{ pointerEvents: 'none' }}
            />
            {previewColor && (
              <g style={{ pointerEvents: 'none' }}>
                <rect
                  x={midX - 13}
                  y={midY - 8}
                  width={26}
                  height={13}
                  rx={3}
                  fill={previewColor}
                />
                <text
                  x={midX}
                  y={midY + 2}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="700"
                  fill="white"
                  fontFamily="sans-serif"
                >
                  {isLeftPreview ? '왼쪽' : '오른쪽'}
                </text>
              </g>
            )}
            {isSelected && !editingLocked && (
              <g
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdgeDelete(edge.id);
                }}
              >
                <circle cx={midX} cy={midY} r="8" fill={vars.color.danger} />
                <text
                  x={midX}
                  y={midY + 3}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="white"
                  fontFamily="sans-serif"
                  style={{ pointerEvents: 'none' }}
                >
                  ×
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* 순서대로 클릭해 쌓는 중인 엣지 체인 미리보기 — 이미 있는 구간은 회색, 새로 만들 구간은
          파란 점선으로 구분해서 검토 화면까지 안 가도 겹치는지 바로 알 수 있게 함 */}
      {edgeChainNodeIds.length > 1 &&
        edgeChainNodeIds.slice(0, -1).map((fromId, i) => {
          const toId = edgeChainNodeIds[i + 1];
          const from = nodePositionById.get(fromId);
          const to = nodePositionById.get(toId);
          if (!from || !to) return null;
          const alreadyExists = hasExistingEdge(graphEdges, fromId, toId);
          return (
            <line
              key={`edge-chain-preview-${fromId}-${toId}-${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={alreadyExists ? vars.color.gray300 : vars.color.primary}
              strokeWidth="2"
              strokeDasharray="4 3"
              style={{ pointerEvents: 'none' }}
            />
          );
        })}

      {/* 노드 클릭 히트영역 — 엣지 연결·유도등 갈림길 선택 모드에선 작은 점을 정확히 겨냥하기
          어려워 넓은 투명 원을 깔아 둔다. 노드 점들보다 아래 층에 그려야 함 — 각 노드 안에 두면
          나중에 그려지는 구조 노드의 넓은 원이 바로 옆 노드(특히 출구와 끊겨 문 옆에 붙어 있는
          방 노드)의 점까지 덮어서, 그 노드를 눌러도 옆 노드가 선택되던 문제가 있었음 */}
      {(edgeAddActive || lightPickField === 'decisionNode') &&
        graphNodes.map((n) => (
          <circle
            key={`graph-hit-${n.id}`}
            cx={n.x * CANVAS_W}
            cy={n.y * canvasH}
            r={13}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onClick={(e) => handleGraphNodeClick(e, n.id)}
          />
        ))}
      {edgeAddActive &&
        structureNodes
          .filter((n) => n.id !== editingStructureId)
          .map((n) => (
            <circle
              key={`structure-hit-${n.id}`}
              cx={n.x}
              cy={n.y}
              r={16}
              fill="transparent"
              style={{
                cursor: 'pointer',
                pointerEvents:
                  isZoneDragging || lightPickField === 'leftEdge' || lightPickField === 'rightEdge'
                    ? 'none'
                    : 'auto',
              }}
              onClick={(e) => handleStructureNodeClick(e, n.id)}
            />
          ))}

      {/* 맵그래프 노드 중 ROOM/HALLWAY/EXIT/CUSTOM — 엣지 연결 모드에서만 클릭 가능.
          ROOM/HALLWAY는 경로 계산용 내부 포인트라 엣지 연결 모드일 때만 화면에 표시 —
          평소엔 클릭도 안 되는데 캔버스만 지저분하게 만들어서 숨김. EXIT/CUSTOM은 정보성이라 항상 표시 */}
      {graphNodes.map((n) => {
        const isRoomOrHallway = n.type === 'ROOM' || n.type === 'HALLWAY';
        const isLightPreview = !!lightPreviewNodeId && n.id === lightPreviewNodeId;
        const isDiagnosisNode =
          unreachableNodeIds.has(n.id) ||
          limitedExitStartNodeIds.has(n.id) ||
          undesignatedStairNodeIds.has(n.id);
        // "캔버스에서 선택" 중엔 갈림길 위치로 아무 노드나 고를 수 있어야 해서, ROOM/HALLWAY도
        // 엣지 연결 모드가 아니어도 이때는 보여줌(유도등의 갈림길 위치로 이미 고른 노드도 동일)
        const isNodePickMode = lightPickField === 'decisionNode';
        if (
          isRoomOrHallway &&
          !edgeAddActive &&
          !isLightPreview &&
          !isNodePickMode &&
          !isDiagnosisNode
        )
          return null;
        const x = n.x * CANVAS_W;
        const y = n.y * canvasH;
        const color = GRAPH_NODE_COLOR[n.type as 'ROOM' | 'HALLWAY' | 'EXIT' | 'CUSTOM'];
        // 탈출구 도달 불가 노드 여부
        const isUnreachable = unreachableNodeIds.has(n.id);
        // 도달 가능 탈출구 부족 시작 후보 여부
        const isLimitedExitStart = limitedExitStartNodeIds.has(n.id);
        // 탈출구 미지정 계단 노드 여부
        const isUndesignatedStair = undesignatedStairNodeIds.has(n.id);
        return (
          <g
            key={n.id}
            style={{
              pointerEvents: edgeAddActive || isNodePickMode ? 'auto' : 'none',
              cursor: 'pointer',
            }}
            onClick={(e) => handleGraphNodeClick(e, n.id)}
          >
            {/* 체인에 이미 골라둔 노드는 테두리로 강조해서 클릭했다는 걸 바로 알 수 있게 함 */}
            {edgeChainNodeIds.includes(n.id) && (
              <circle cx={x} cy={y} r={9} fill="none" stroke={vars.color.primary} strokeWidth="2" />
            )}
            {/* 유도등 갈림길 위치로 고른 노드 강조 — 노란 점선 링(유도등 색과 맞춤) */}
            {isLightPreview && (
              <circle
                cx={x}
                cy={y}
                r={11}
                fill="none"
                stroke={DEVICE_COLOR.light}
                strokeWidth="2"
                strokeDasharray="3 2"
              />
            )}
            {isUnreachable && (
              <circle
                cx={x}
                cy={y}
                r={GRAPH_DIAGNOSIS_RING_RADIUS}
                fill="none"
                stroke={vars.color.danger}
                strokeWidth="2"
              />
            )}
            {!isUnreachable && isLimitedExitStart && (
              <circle
                cx={x}
                cy={y}
                r={GRAPH_DIAGNOSIS_RING_RADIUS}
                fill="none"
                stroke={vars.color.warning}
                strokeWidth="2"
              />
            )}
            {!isUnreachable && !isLimitedExitStart && isUndesignatedStair && (
              <circle
                cx={x}
                cy={y}
                r={GRAPH_DIAGNOSIS_RING_RADIUS}
                fill="none"
                stroke={vars.color.gray300}
                strokeWidth="2"
                strokeDasharray="3 2"
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={n.type === 'EXIT' ? 6 : edgeAddActive || isLightPreview || isNodePickMode ? 5 : 3}
              fill={isUnreachable ? vars.color.danger : color}
            />
            {n.type === 'EXIT' && (
              <text
                x={x}
                y={y - 12}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill={color}
                fontFamily="sans-serif"
              >
                {n.name}
              </text>
            )}
          </g>
        );
      })}

      {/* 구조 노드 — 계단 · 문/출입구 (AI 세그멘테이션 결과, 사용자가 위치 보정 가능 · 최종 탈출구 지정은 우측 패널에서만) */}
      {structureNodes.map((n) => {
        const isEditingThis = n.id === editingStructureId;
        const isSelected = selectedZoneRef?.kind === 'node' && selectedZoneRef.id === n.id;
        const isStair = n.type === 'stair';
        const baseColor = STRUCTURE_NODE_COLOR[n.type];
        const isLightPreview = !!lightPreviewNodeId && n.id === lightPreviewNodeId;
        // 왼쪽/오른쪽 통로(엣지)를 캔버스에서 고르는 중엔 노드는 고를 대상이 아닌데, 이 원이
        // 계속 클릭을 가로채고 있었음 — 엣지가 노드 바로 옆에 붙어있으면 SVG 상 나중에 그려지는
        // 이 노드 원이 클릭을 먼저 받아가서 엣지를 못 고르던 문제의 원인
        const isEdgePickMode = lightPickField === 'leftEdge' || lightPickField === 'rightEdge';
        // 탈출구 도달 불가 구조 노드 여부
        const isUnreachable = unreachableNodeIds.has(n.id);
        // 도달 가능 탈출구 부족 시작 후보 여부
        const isLimitedExitStart = limitedExitStartNodeIds.has(n.id);
        // 탈출구 미지정 계단 노드 여부
        const isUndesignatedStair = undesignatedStairNodeIds.has(n.id);
        // 진단 강조 테두리 반지름
        const diagnosisRingRadius = (n.isFinalExit ? 7 : isStair ? 6 : 5) + 5;
        return (
          <g
            key={n.id}
            onMouseDown={(e) => handleStructureMouseDown(e, n.id)}
            onClick={(e) => handleStructureNodeClick(e, n.id)}
            style={{
              cursor: isEditingThis ? 'grab' : 'pointer',
              pointerEvents: isZoneDragging || isEdgePickMode ? 'none' : 'auto',
            }}
          >
            {isSelected && (
              <circle
                cx={n.x}
                cy={n.y}
                r={(n.isFinalExit ? 7 : isStair ? 6 : 4) + 5}
                fill="none"
                stroke={vars.color.primary}
                strokeWidth="2"
                strokeDasharray="3 2"
              />
            )}
            {/* 체인에 이미 골라둔 노드는 테두리로 강조 — isSelected 링과 헷갈리지 않게 실선으로 구분 */}
            {edgeChainNodeIds.includes(n.id) && (
              <circle
                cx={n.x}
                cy={n.y}
                r={(n.isFinalExit ? 7 : isStair ? 6 : 4) + 4}
                fill="none"
                stroke={vars.color.primary}
                strokeWidth="2"
              />
            )}
            {/* 유도등 갈림길 위치로 고른 노드 강조 — 노란 점선 링(유도등 색과 맞춤) */}
            {isLightPreview && (
              <circle
                cx={n.x}
                cy={n.y}
                r={(n.isFinalExit ? 7 : isStair ? 6 : 4) + 6}
                fill="none"
                stroke={DEVICE_COLOR.light}
                strokeWidth="2"
                strokeDasharray="3 2"
              />
            )}
            {isUnreachable && (
              <circle
                cx={n.x}
                cy={n.y}
                r={diagnosisRingRadius}
                fill="none"
                stroke={vars.color.danger}
                strokeWidth="2"
              />
            )}
            {!isUnreachable && isLimitedExitStart && (
              <circle
                cx={n.x}
                cy={n.y}
                r={diagnosisRingRadius}
                fill="none"
                stroke={vars.color.warning}
                strokeWidth="2"
              />
            )}
            {!isUnreachable && !isLimitedExitStart && isUndesignatedStair && (
              <circle
                cx={n.x}
                cy={n.y}
                r={diagnosisRingRadius}
                fill="none"
                stroke={vars.color.gray300}
                strokeWidth="2"
                strokeDasharray="3 2"
              />
            )}
            <circle
              cx={n.x}
              cy={n.y}
              r={n.isFinalExit ? 7 : n.isStartCandidate ? 6 : isEditingThis ? 6 : isStair ? 5 : 4}
              fill={
                isUnreachable
                  ? vars.color.danger
                  : !isLimitedExitStart && isUndesignatedStair
                    ? 'none'
                    : n.isFinalExit
                      ? vars.color.success
                      : n.isStartCandidate
                        ? DEVICE_COLOR.start
                        : baseColor
              }
              stroke={
                isEditingThis
                  ? vars.color.warning
                  : n.isFinalExit || n.isStartCandidate
                    ? vars.color.white
                    : 'none'
              }
              strokeWidth={isEditingThis ? 3 : n.isFinalExit || n.isStartCandidate ? 2 : 0}
            />
            {isStair && (
              <TriangleIcon
                x={n.x - STAIR_ICON_SIZE / 2}
                y={n.y - STAIR_ICON_SIZE / 2}
                width={STAIR_ICON_SIZE}
                height={STAIR_ICON_SIZE}
                color={
                  !isUnreachable && !isLimitedExitStart && isUndesignatedStair
                    ? vars.color.gray300
                    : vars.color.white
                }
                style={{ pointerEvents: 'none' }}
              />
            )}
            {n.isFinalExit && (
              <text
                x={n.x}
                y={n.y - 14}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill={vars.color.success}
                fontFamily="sans-serif"
                style={{ pointerEvents: 'none' }}
              >
                최종 탈출구
              </text>
            )}
            {n.isStartCandidate && !n.isFinalExit && (
              <text
                x={n.x}
                y={n.y - 14}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill={DEVICE_COLOR.start}
                fontFamily="sans-serif"
                style={{ pointerEvents: 'none' }}
              >
                시작 후보
              </text>
            )}
          </g>
        );
      })}

      {/* 저장된 일반 구역 — 백엔드 저장 단위가 그리드 셀 집합이라, 셀들의 합집합 윤곽을
          단일 path로 그려 하나의 면적으로 보이게 함(내부 격자선·이음매 없음).
          구역마다 매번 floorGridCells를 선형 탐색하지 않도록 id→셀 매핑을 한 번만 만들어 재사용 */}
      {(() => {
        const floorGridCellById = new Map(floorGridCells.map((c) => [c.id, c]));
        return savedZones.map((z) => {
          const cells = z.cellIds
            .map((id) => floorGridCellById.get(id))
            .filter((c): c is FloorGridCell => !!c);
          if (cells.length === 0) return null;
          const isSelected = selectedZoneRef?.kind === 'zone' && selectedZoneRef.id === z.id;
          const xs = cells.map((c) => c.centerX * CANVAS_W);
          const ys = cells.map((c) => c.centerY * canvasH);
          const labelX = (Math.min(...xs) + Math.max(...xs)) / 2;
          const labelY = (Math.min(...ys) + Math.max(...ys)) / 2;

          return (
            <g
              key={z.id}
              onClick={(e) => {
                if (zoneAddActive) return;
                e.stopPropagation();
                onZoneRefSelect({ kind: 'zone', id: z.id });
              }}
              style={{ cursor: zoneAddActive ? 'inherit' : 'pointer' }}
            >
              <path
                d={buildZoneOutlinePath(cells, gridCellPxSize, canvasH)}
                fillRule="evenodd"
                fill="rgba(107,114,128,0.15)"
                stroke={isSelected ? vars.color.primary : '#6b7280'}
                strokeWidth={isSelected ? '2' : '1'}
              />
              <text
                x={labelX}
                y={labelY + 3}
                textAnchor="middle"
                fill="#374151"
                fontSize="10"
                fontFamily="sans-serif"
                style={{ pointerEvents: 'none' }}
              >
                {z.label}
              </text>
            </g>
          );
        });
      })()}

      {/* 그리드 배경 — 도면 위에 얹는 균일한 모눈종이 격자선(선만, 채움 없음). 선택/조회 중이든
          아니든(browsing/selecting/viewing 어느 모드든) 항상 그림 — CCTV 카드를 눌러서 보기만
          해도(viewing) 배경 그리드가 사라지면 안 되는데, 예전엔 viewing이 이 조건에서 빠져있어서
          CCTV 카드를 클릭할 때마다 그리드가 사라지던 버그였음 */}
      <GridOverlayLines cells={floorGridCells} size={gridCellPxSize} canvasH={canvasH} />

      {/* 그리드 셀 선택 — CCTV 신규 등록 중(선택 가능) 또는 기존 CCTV 감시 영역(조회 전용).
          셀마다 테두리를 그리면 원고지처럼 보여서, 얇은 균일 격자선 위에 선택된 셀만
          하나의 면적(채움+외곽선)으로 표시하고, 클릭 판정은 투명 히트영역이 담당함 */}
      {(cctvGridCellsMode === 'selecting' || cctvGridCellsMode === 'viewing') && (
        <>
          {(() => {
            const selectedCells = floorGridCells.filter((c) => selectedGridCellIds.includes(c.id));
            if (selectedCells.length === 0) return null;
            return (
              <path
                d={buildZoneOutlinePath(selectedCells, gridCellPxSize, canvasH)}
                fillRule="evenodd"
                fill="rgba(139,92,246,0.3)"
                stroke={vars.color.purple}
                strokeWidth="1.5"
                style={{ pointerEvents: 'none' }}
              />
            );
          })()}

          {cctvGridCellsMode === 'selecting' &&
            floorGridCells.map((cell) => (
              <rect
                key={cell.id}
                x={cell.centerX * CANVAS_W - gridCellPxSize.w / 2}
                y={cell.centerY * canvasH - gridCellPxSize.h / 2}
                width={gridCellPxSize.w}
                height={gridCellPxSize.h}
                fill="transparent"
                style={{
                  cursor: 'pointer',
                  pointerEvents: isZoneDragging ? 'none' : 'auto',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onGridCellToggle(cell.id);
                }}
              />
            ))}
        </>
      )}
    </svg>
  );
};

export default FloorCanvasSvg;
