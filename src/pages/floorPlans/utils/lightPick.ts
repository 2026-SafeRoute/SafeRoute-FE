export type LightPickFieldName = 'decisionNode' | 'leftEdge' | 'rightEdge';

interface LightPickHint {
  text: string;
  isWarning: boolean;
}

// 갈림길 위치에 이어진 통로가 없으면 캔버스에서 고를 대상도 없으므로, 선택 단계에 맞는
// 안내와 진행 불가 사유를 공통으로 만든다.
export const getLightPickHint = (
  pickField: LightPickFieldName | null,
  decisionNodeId: string,
  edgeOptions: readonly { fromNodeId: string; toNodeId: string }[],
): LightPickHint => {
  if (!pickField) {
    return {
      text: '이 유도등이 서 있는 갈림길 위치와, 화재 시 왼쪽·오른쪽 중 어느 통로로 안내할지 정해주세요',
      isWarning: false,
    };
  }
  if (pickField === 'decisionNode') {
    return { text: '도면에서 갈림길이 될 노드를 클릭해주세요', isWarning: false };
  }
  const hasConnectedEdge = edgeOptions.some(
    (edge) => edge.fromNodeId === decisionNodeId || edge.toNodeId === decisionNodeId,
  );
  if (!hasConnectedEdge) {
    return {
      text: '이 갈림길에 연결된 통로(엣지)가 없어요. "+ 추가 → 엣지 추가"로 통로를 먼저 만들어주세요',
      isWarning: true,
    };
  }
  return {
    text:
      pickField === 'leftEdge'
        ? '도면에서 왼쪽 통로가 될 구간(선)을 클릭해주세요'
        : '도면에서 오른쪽 통로가 될 구간(선)을 클릭해주세요',
    isWarning: false,
  };
};
