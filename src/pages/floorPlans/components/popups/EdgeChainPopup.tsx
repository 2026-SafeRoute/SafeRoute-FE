import { useState } from 'react';

import * as styles from './popup.css';
import SidebarPopup from './SidebarPopup';

interface EdgeChainSegment {
  fromId: string;
  toId: string;
  fromLabel: string;
  toLabel: string;
  // 두 노드 좌표 + 그리드 배율로 계산한 추정 거리(m). 없으면 수동 입력
  suggestedDistanceM: number | null;
  // 다른 경로와 겹쳐서 이미 존재하는 구간 — 입력 없이 생성 대상에서만 제외함
  alreadyExists: boolean;
}

interface EdgeChainRow {
  fromId: string;
  toId: string;
  fromLabel: string;
  toLabel: string;
  distanceM: number;
  bidirectional: boolean;
}

interface EdgeChainReviewProps {
  segments: EdgeChainSegment[];
  onBack: () => void;
  onSubmit: (rows: EdgeChainRow[]) => void;
}

/* 구간 검토 단계 — 검토로 넘어올 때마다 새로 마운트돼 추정 거리로 입력값을 다시 채움 */
const EdgeChainReview = ({ segments, onBack, onSubmit }: EdgeChainReviewProps) => {
  // 실내 노드 간 거리는 1m 미만도 흔해서 cm로 입력받음(정수로 편하게 입력, 저장은 m로 환산)
  const [distancesCm, setDistancesCm] = useState(() =>
    segments.map((s) =>
      s.suggestedDistanceM !== null ? String(Math.round(s.suggestedDistanceM * 100)) : '',
    ),
  );
  const [bidirectional, setBidirectional] = useState(true);

  const handleDistanceChange = (index: number, raw: string) => {
    // 완성된 숫자만 허용하면 편집 중간 상태(끝자리 삭제 등)가 거부돼 편집이 막히던 문제 —
    // 타이핑 도중 상태(끝에 점만 있거나 소수부가 빈 경우)도 허용
    if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;
    setDistancesCm((prev) => prev.map((v, i) => (i === index ? raw : v)));
  };

  const newSegmentCount = segments.filter((s) => !s.alreadyExists).length;
  const allValid =
    newSegmentCount > 0 && segments.every((s, i) => s.alreadyExists || Number(distancesCm[i]) > 0);

  const handleSubmit = () => {
    const rows: EdgeChainRow[] = [];
    segments.forEach((s, i) => {
      if (s.alreadyExists) return;
      rows.push({
        fromId: s.fromId,
        toId: s.toId,
        fromLabel: s.fromLabel,
        toLabel: s.toLabel,
        distanceM: Number(distancesCm[i]) / 100,
        bidirectional,
      });
    });
    onSubmit(rows);
  };

  return (
    <SidebarPopup
      title="연결 구간 확인"
      badge={
        newSegmentCount < segments.length
          ? `신규 ${newSegmentCount}개 · 기존 ${segments.length - newSegmentCount}개`
          : `${segments.length}개 구간`
      }
      hint={
        newSegmentCount === 0
          ? '선택한 구간이 모두 이미 연결되어 있어요'
          : '새로 만들 구간의 거리(cm)를 확인하고, 필요하면 고쳐주세요'
      }
      actions={[
        { label: '이전', variant: 'cancel', onClick: onBack },
        {
          label: `${newSegmentCount}개 연결 추가`,
          variant: 'submit',
          disabled: !allValid,
          onClick: handleSubmit,
        },
      ]}
    >
      <div className={styles.edgeChainList}>
        {segments.map((s, i) => (
          <div key={`${s.fromId}-${s.toId}-${i}`} className={styles.edgeChainRow}>
            <span className={styles.edgeChainRowLabel}>
              {s.fromLabel} → {s.toLabel}
            </span>
            {s.alreadyExists ? (
              <span className={styles.edgeChainExistingTag}>이미 연결됨</span>
            ) : (
              <input
                className={styles.edgeChainDistanceInput}
                type="text"
                inputMode="decimal"
                value={distancesCm[i]}
                onChange={(e) => handleDistanceChange(i, e.target.value)}
                placeholder="350"
              />
            )}
          </div>
        ))}
      </div>

      <label className={styles.edgeBidirectionalField}>
        <input
          type="checkbox"
          checked={bidirectional}
          onChange={(e) => setBidirectional(e.target.checked)}
        />
        전체 양방향 통행 가능
      </label>
    </SidebarPopup>
  );
};

interface EdgeChainPopupProps {
  // 클릭한 순서대로 쌓인 노드 라벨
  nodeLabels: string[];
  // true면 구간 검토 단계
  reviewing: boolean;
  segments: EdgeChainSegment[];
  onClear: () => void;
  onNext: () => void;
  onCancel: () => void;
  onBack: () => void;
  onSubmit: (rows: EdgeChainRow[]) => void;
}

/* ── 엣지 연결 팝업 — 노드를 순서대로 클릭해 경로를 쌓은 뒤(선택 단계), 구간별 거리를 한 번에
   검토·확정함(검토 단계). 구간이 1개(노드 2개)여도 같은 흐름을 씀. 경로 하나를 확정하면 모드도
   같이 끝나므로 선택 단계는 항상 "아직 아무 것도 안 만든 상태"만 보여줌 ── */
const EdgeChainPopup = ({
  nodeLabels,
  reviewing,
  segments,
  onClear,
  onNext,
  onCancel,
  onBack,
  onSubmit,
}: EdgeChainPopupProps) => {
  if (reviewing) return <EdgeChainReview segments={segments} onBack={onBack} onSubmit={onSubmit} />;

  return (
    <SidebarPopup
      title="엣지 연결"
      hint={
        nodeLabels.length === 0
          ? '연결할 노드를 순서대로 클릭하세요'
          : `계속 클릭해서 경로를 잇거나, 다음을 눌러 ${nodeLabels.length - 1}개 구간을 확정하세요`
      }
      actions={[
        ...(nodeLabels.length > 0
          ? [{ label: '다시 선택', variant: 'cancel' as const, onClick: onClear }]
          : []),
        nodeLabels.length >= 2
          ? { label: '다음', variant: 'submit' as const, onClick: onNext }
          : { label: '취소', variant: 'cancel' as const, onClick: onCancel },
      ]}
    >
      {nodeLabels.length > 0 && (
        <span className={styles.edgeChainPath}>{nodeLabels.join(' → ')}</span>
      )}
    </SidebarPopup>
  );
};

export default EdgeChainPopup;
