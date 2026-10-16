import StepProgress from '@components/progress/StepProgress';
import type { ProgressStep } from '@components/progress/StepProgress';

import * as styles from './ReadinessChecklist.css';

// 훈련 준비 — 시나리오를 재생하려면 이 층에 ①시작 노드(후보) ②최종 탈출구(계단) ③시작
// 지점에서 최종 탈출구까지 이어지는 엣지 경로가 있어야 함. 이 셋이 노드추가 팝업 안 칩,
// 우측 패널 카드 토글, 엣지 연결 모드로 흩어져 있어 뭐가 필요한지 안 보이던 문제를 여기
// 한 곳에 모아서 해결함. 순서가 있는 준비 단계라 공용 StepProgress(원형 마커 + 연결선)로
// 표시하고, 각 단계 라벨 옆에는 실제로 그 단계를 처리할 수 있는 버튼을 그대로 붙임.
//
// 발화점 항목은 뺐음 — 팀 전달사항(2026-09-03)으로 발화점 등록 API(POST
// /scenarios/{scenarioId}/fire-zones)가 백엔드에서 완전히 제거됐고, 도면관리 화면은 더 이상
// 발화점을 다루지 않음.
//
// 경로(엣지) 항목: 시작 노드·최종 탈출구가 있어도 둘을 잇는 엣지가 없으면 경로 탐색기가
// EVAC005("도달 가능한 EXIT 노드가 없습니다")로 실패함 — 세 항목이 뭐가 필요한지 한눈에
// 보이도록 앞 단계가 안 끝났어도 항목 자체는 항상 보여주고, 버튼만 비활성화해서 안내함
interface ReadinessChecklistProps {
  hasStartNode: boolean;
  hasFinalExit: boolean;
  hasStair: boolean;
  hasRouteToExit: boolean;
  editingLocked?: boolean;
  editingLockHintId?: string;
  onAddStartNode: () => void;
  onAddStair: () => void;
  onFocusDeviceCards: () => void;
  onConnectEdges: () => void;
}

const ReadinessChecklist = ({
  hasStartNode,
  hasFinalExit,
  hasStair,
  hasRouteToExit,
  editingLocked = false,
  editingLockHintId,
  onAddStartNode,
  onAddStair,
  onFocusDeviceCards,
  onConnectEdges,
}: ReadinessChecklistProps) => {
  // 시작/탈출구가 모두 준비돼야 엣지 연결 버튼을 누를 수 있음 — 그 전엔 항목은 보이되
  // 버튼을 비활성화함(안내 문구는 짧게 고정 — 뭐가 부족한지는 위 두 항목에서 이미 보임)
  const canConnectRoute = hasStartNode && hasFinalExit;

  const steps: ProgressStep[] = [
    {
      label: '시작 노드',
      status: hasStartNode ? 'done' : 'current',
      action: hasStartNode ? (
        <span className={styles.readinessDoneText}>완료</span>
      ) : (
        <button
          type="button"
          className={styles.readinessActionBtn}
          disabled={editingLocked}
          aria-describedby={editingLocked ? editingLockHintId : undefined}
          onClick={onAddStartNode}
        >
          지정하기
        </button>
      ),
    },
    {
      label: '최종 탈출구',
      status: hasFinalExit ? 'done' : 'current',
      action: hasFinalExit ? (
        <span className={styles.readinessDoneText}>완료</span>
      ) : !hasStair ? (
        <button
          type="button"
          className={styles.readinessActionBtn}
          disabled={editingLocked}
          aria-describedby={editingLocked ? editingLockHintId : undefined}
          onClick={onAddStair}
        >
          계단 추가하기
        </button>
      ) : (
        <button
          type="button"
          className={styles.readinessActionBtn}
          disabled={editingLocked}
          aria-describedby={editingLocked ? editingLockHintId : undefined}
          onClick={onFocusDeviceCards}
        >
          카드에서 지정
        </button>
      ),
    },
    {
      label: '탈출 경로',
      status: hasRouteToExit ? 'done' : canConnectRoute ? 'current' : 'upcoming',
      action: hasRouteToExit ? (
        <span className={styles.readinessDoneText}>완료</span>
      ) : canConnectRoute ? (
        <button
          type="button"
          className={styles.readinessActionBtn}
          disabled={editingLocked}
          aria-describedby={editingLocked ? editingLockHintId : undefined}
          onClick={onConnectEdges}
        >
          엣지 연결
        </button>
      ) : (
        <>
          <button
            type="button"
            className={styles.readinessActionBtnDisabled}
            disabled
            aria-describedby="readiness-edge-disabled-hint"
          >
            엣지 추가하기
          </button>
          <span id="readiness-edge-disabled-hint" className={styles.readinessDisabledHint}>
            시작 노드와 최종 탈출구를 먼저 지정해주세요
          </span>
        </>
      ),
    },
  ];

  return (
    <div className={styles.readinessCard}>
      <div className={styles.readinessHeader}>훈련 준비 체크리스트</div>
      <span className={styles.readinessHint}>
        시나리오를 재생하려면 이 층에 아래 항목이 필요해요
      </span>

      <StepProgress steps={steps} />
    </div>
  );
};

export default ReadinessChecklist;
