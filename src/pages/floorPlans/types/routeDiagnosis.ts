export interface FloorRouteDiagnosisHighlight {
  unreachableNodeIds: readonly string[];
  limitedExitStartNodeIds: readonly string[];
  undesignatedStairNodeIds: readonly string[];
}
