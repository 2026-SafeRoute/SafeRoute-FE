import { memo, useEffect, useMemo, useState } from 'react';

import type { RoutePoint } from '@pages/scenarioSettings/types/scenarioSettings';

import type { ScenarioRouteDiagnosisResponse } from '@apis/__generated__/data-contracts';
import type { FloorGridCell } from '@apis/floors/floorGridApi';
import type { FloorGraph } from '@apis/floors/mapGraphApi';

import {
  CANVAS_W,
  getCanvasHeight,
  getGridCellPxSize,
  measureImageAspect,
} from '@utils/floorCanvas';

import * as styles from './FireLocationGrid.css';
import ScenarioRouteDiagnosisOverlay from './ScenarioRouteDiagnosisOverlay';
import ScenarioRouteLegend from './ScenarioRouteLegend';

const DEFAULT_CANVAS_HEIGHT = 420;

interface FireLocationGridProps {
  imageUrl?: string | null;
  graph?: FloorGraph | null;
  gridCells: readonly FloorGridCell[];
  routePoints: readonly RoutePoint[];
  routeDiagnosis?: ScenarioRouteDiagnosisResponse;
  fireCellIds: readonly string[];
  selectedFireCellId?: string | null;
  selectedStartNodeId?: string | null;
  persistedStartNodeId?: string | null;
  originCellId?: string | null;
  statusMessage?: string;
  disabled?: boolean;
  startSelectionDisabled?: boolean;
  onFireCellSelect?: (cellId: string) => void;
  onStartNodeSelect?: (nodeId: string) => void;
}

const getCellClassName = (isFireCell: boolean, isSelected: boolean) => {
  if (isFireCell) return styles.fireCell;
  if (isSelected) return styles.selectedFireCell;
  return styles.gridCell;
};

const getStartNodeClassName = (isSelected: boolean, isDisabled: boolean) => {
  if (isSelected) return styles.selectedStartNode;
  if (isDisabled) return styles.inactiveStartNode;
  return styles.startNode;
};

const FireLocationGrid = ({
  imageUrl,
  graph,
  gridCells,
  routePoints,
  routeDiagnosis,
  fireCellIds,
  selectedFireCellId,
  selectedStartNodeId,
  persistedStartNodeId,
  originCellId,
  statusMessage,
  disabled = false,
  startSelectionDisabled = false,
  onFireCellSelect,
  onStartNodeSelect,
}: FireLocationGridProps) => {
  const [imageAspect, setImageAspect] = useState<number | null>(null);

  useEffect(() => {
    setImageAspect(null);
    if (!imageUrl) return;
    let cancelled = false;
    void measureImageAspect(imageUrl).then((aspect) => {
      if (!cancelled) setImageAspect(aspect);
    });
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  const mapHeight = getCanvasHeight(gridCells, imageAspect, DEFAULT_CANVAS_HEIGHT);
  const routePolylinePoints = useMemo(
    () => routePoints.map((point) => `${point.x * CANVAS_W},${point.y * mapHeight}`).join(' '),
    [mapHeight, routePoints],
  );
  const cellSize = getGridCellPxSize(gridCells, mapHeight);
  const fireCellIdSet = useMemo(() => new Set(fireCellIds), [fireCellIds]);
  const activeStartNodeId = persistedStartNodeId ?? selectedStartNodeId;
  const canSelectStartNode = !disabled && !startSelectionDisabled;

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <svg
          className={styles.map}
          viewBox={`0 0 ${CANVAS_W} ${mapHeight}`}
          role="group"
          aria-label="발화 위치와 대피 경로가 표시된 층 도면"
        >
          {imageUrl && (
            <image href={imageUrl} width={CANVAS_W} height={mapHeight} preserveAspectRatio="none" />
          )}

          {!routeDiagnosis && routePolylinePoints && (
            <polyline className={styles.route} points={routePolylinePoints} />
          )}
          {gridCells.map((cell) => {
            const isFireCell = fireCellIdSet.has(cell.id);
            const isOrigin = cell.id === originCellId;
            const isSelected = cell.id === selectedFireCellId;
            const x = cell.centerX * CANVAS_W - cellSize.w / 2;
            const y = cell.centerY * mapHeight - cellSize.h / 2;

            const cellClassName = getCellClassName(isFireCell, isSelected);
            const cellAriaLabel = `${cell.rowIndex + 1}행 ${cell.columnIndex + 1}열${isFireCell ? ', 화재구역' : ''}`;

            return (
              <g key={cell.id} aria-label={cellAriaLabel}>
                <rect
                  className={cellClassName}
                  x={x}
                  y={y}
                  width={cellSize.w}
                  height={cellSize.h}
                  role={!disabled && cell.walkable ? 'button' : undefined}
                  tabIndex={!disabled && cell.walkable ? 0 : undefined}
                  aria-pressed={isSelected}
                  aria-label={!disabled && cell.walkable ? cellAriaLabel : undefined}
                  onClick={() => {
                    if (!disabled && cell.walkable) onFireCellSelect?.(cell.id);
                  }}
                  onKeyDown={(event) => {
                    if (disabled || !cell.walkable) return;
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    onFireCellSelect?.(cell.id);
                  }}
                />
                {isSelected && !isOrigin && (
                  <text
                    className={styles.selectedFireMarker}
                    x={cell.centerX * CANVAS_W}
                    y={cell.centerY * mapHeight}
                  >
                    🔥
                  </text>
                )}
                {isOrigin && (
                  <text
                    className={styles.fireMarker}
                    x={cell.centerX * CANVAS_W}
                    y={cell.centerY * mapHeight - 7}
                  >
                    <tspan aria-hidden="true">🔥</tspan>
                  </text>
                )}
              </g>
            );
          })}

          {routeDiagnosis && (
            <ScenarioRouteDiagnosisOverlay
              graph={graph}
              mapHeight={mapHeight}
              diagnosis={routeDiagnosis}
            />
          )}

          {graph?.nodes
            // START 타입(레거시) + isStartCandidate(BE PR #225, DOOR 등을 시작 후보로 지정) 둘 다 표시
            .filter((node) => node.type === 'START' || node.isStartCandidate)
            .map((node) => {
              const isSelectedStart = node.id === activeStartNodeId;
              const isStartNodeSelectable = canSelectStartNode;
              const nodeClassName = getStartNodeClassName(isSelectedStart, !canSelectStartNode);

              return (
                <circle
                  key={node.id}
                  className={nodeClassName}
                  cx={node.x * CANVAS_W}
                  cy={node.y * mapHeight}
                  r={isSelectedStart ? 7 : 4}
                  role={isStartNodeSelectable ? 'button' : undefined}
                  tabIndex={isStartNodeSelectable ? 0 : undefined}
                  aria-label={`${node.name} 시작 지점`}
                  aria-pressed={isSelectedStart}
                  onClick={() => {
                    if (isStartNodeSelectable) onStartNodeSelect?.(node.id);
                  }}
                  onKeyDown={(event) => {
                    if (!isStartNodeSelectable) return;
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    onStartNodeSelect?.(node.id);
                  }}
                />
              );
            })}
        </svg>

        {statusMessage && <p className={styles.statusMessage}>{statusMessage}</p>}
      </div>
      {routeDiagnosis && <ScenarioRouteLegend />}
    </div>
  );
};

export default memo(FireLocationGrid);
