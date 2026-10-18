import { useMemo } from 'react';

import type { ScenarioRouteDiagnosisResponse } from '@apis/__generated__/data-contracts';
import type { FloorGraph } from '@apis/floors/mapGraphApi';

import { CANVAS_W } from '@utils/floorCanvas';

import * as styles from './FireLocationGrid.css';

interface ScenarioRouteDiagnosisOverlayProps {
  graph?: FloorGraph | null;
  mapHeight: number;
  diagnosis: ScenarioRouteDiagnosisResponse;
}

const getRoutePolylinePoints = (
  nodeIds: readonly string[] | undefined,
  nodeById: ReadonlyMap<string, { x: number; y: number }>,
  mapHeight: number,
) =>
  (nodeIds ?? [])
    .map((nodeId) => nodeById.get(nodeId))
    .filter((node): node is { x: number; y: number } => Boolean(node))
    .map((node) => `${node.x * CANVAS_W},${node.y * mapHeight}`)
    .join(' ');

const getLastNodeId = (nodeIds?: readonly string[]) => nodeIds?.[nodeIds.length - 1];

const ScenarioRouteDiagnosisOverlay = ({
  graph,
  mapHeight,
  diagnosis,
}: ScenarioRouteDiagnosisOverlayProps) => {
  const nodeById = useMemo(
    () => new Map(graph?.nodes.map((node) => [node.id, node]) ?? []),
    [graph?.nodes],
  );
  // 최초 재탐색 경로
  const recalculatedRouteNodeIds = diagnosis.events?.find(
    (event) => event.type === 'RECALCULATED',
  )?.routeNodeIds;
  const initialRoutePolylinePoints = getRoutePolylinePoints(
    diagnosis.initialRouteNodeIds,
    nodeById,
    mapHeight,
  );
  const recalculatedRoutePolylinePoints = getRoutePolylinePoints(
    recalculatedRouteNodeIds,
    nodeById,
    mapHeight,
  );
  const routeExitNodeIds = new Set(
    [getLastNodeId(diagnosis.initialRouteNodeIds), getLastNodeId(recalculatedRouteNodeIds)].filter(
      (nodeId): nodeId is string => Boolean(nodeId),
    ),
  );
  // 진단 대상 탈출구·미지정 계단
  const unreachableExitNodeIds = new Set(diagnosis.unreachableExitNodeIds ?? []);
  const undesignatedStairNodeIds = new Set(diagnosis.undesignatedStairNodeIds ?? []);

  return (
    <>
      {initialRoutePolylinePoints && (
        <polyline className={styles.initialRoute} points={initialRoutePolylinePoints} />
      )}
      {recalculatedRoutePolylinePoints && (
        <polyline className={styles.recalculatedRoute} points={recalculatedRoutePolylinePoints} />
      )}

      {graph?.nodes.map((node) => {
        const x = node.x * CANVAS_W;
        const y = node.y * mapHeight;
        if (unreachableExitNodeIds.has(node.id)) {
          return (
            <g key={`unreachable-${node.id}`} transform={`translate(${x} ${y})`}>
              <path className={styles.unreachableExit} d="M0-8 7 7H-7Z" />
              <path className={styles.unreachableExitMark} d="m-4-5 8 9m0-9-8 9" />
            </g>
          );
        }
        if (undesignatedStairNodeIds.has(node.id)) {
          return (
            <path
              key={`undesignated-${node.id}`}
              className={styles.undesignatedStair}
              d="M0-8 7 7H-7Z"
              transform={`translate(${x} ${y})`}
            />
          );
        }
        if (routeExitNodeIds.has(node.id)) {
          return (
            <path
              key={`exit-${node.id}`}
              className={styles.routeExit}
              d="M0-8 7 7H-7Z"
              transform={`translate(${x} ${y})`}
            />
          );
        }
        return null;
      })}
    </>
  );
};

export default ScenarioRouteDiagnosisOverlay;
