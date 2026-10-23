import * as styles from './ScenarioRouteLegend.css';

const LEGEND_ITEMS = [
  { id: 'start', label: '선택한 훈련 시작 지점' },
  { id: 'exit', label: '탈출구' },
  { id: 'initial-route', label: '처음 경로' },
  { id: 'recalculated-route', label: '재탐색 후 경로' },
  { id: 'unreachable-exit', label: '갈 수 없는 탈출구' },
  { id: 'undesignated-stair', label: '탈출구 미지정 계단' },
] as const;

type LegendItemId = (typeof LEGEND_ITEMS)[number]['id'];

const LegendIcon = ({ type }: { type: LegendItemId }) => {
  if (type === 'start') {
    return (
      <svg viewBox="0 0 22 14" aria-hidden="true">
        <circle className={styles.startNode} cx="11" cy="7" r="4" />
      </svg>
    );
  }
  if (type === 'exit') {
    return (
      <svg viewBox="0 0 22 14" aria-hidden="true">
        <path className={styles.exitNode} d="M11 2 16 12H6Z" />
      </svg>
    );
  }
  if (type === 'initial-route' || type === 'recalculated-route') {
    return (
      <svg viewBox="0 0 22 14" aria-hidden="true">
        <line
          className={type === 'initial-route' ? styles.initialRoute : styles.recalculatedRoute}
          x1="2"
          y1="7"
          x2="20"
          y2="7"
        />
      </svg>
    );
  }
  if (type === 'unreachable-exit') {
    return (
      <svg viewBox="0 0 22 14" aria-hidden="true">
        <path className={styles.neutralNode} d="M11 2 16 12H6Z" />
        <path className={styles.unreachableMark} d="m7 3 8 8m0-8-8 8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 22 14" aria-hidden="true">
      <path className={styles.undesignatedNode} d="M11 2 16 12H6Z" />
    </svg>
  );
};

const ScenarioRouteLegend = () => (
  <ul className={styles.legend} aria-label="대피 경로 범례">
    {LEGEND_ITEMS.map((item) => (
      <li key={item.id} className={styles.item}>
        <span className={styles.icon}>
          <LegendIcon type={item.id} />
        </span>
        <span>{item.label}</span>
      </li>
    ))}
  </ul>
);

export default ScenarioRouteLegend;
