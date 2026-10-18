import type { ReactNode } from 'react';

import * as styles from './popup.css';

export interface SidebarPopupAction {
  label: ReactNode;
  variant: 'back' | 'cancel' | 'submit';
  disabled?: boolean;
  onClick: () => void;
}

interface SidebarPopupProps {
  title: ReactNode;
  // 제목 옆 단계·개수 배지 (예: 1/2)
  badge?: ReactNode;
  hint: ReactNode;
  actions: SidebarPopupAction[];
  children?: ReactNode;
}

const ACTION_CLASS: Record<SidebarPopupAction['variant'], string> = {
  back: styles.nodeAddBackBtn,
  cancel: styles.nodeAddCancelBtn,
  submit: styles.nodeAddSubmitBtn,
};

/* ── 좌측 사이드바 팝업 공통 틀 — 제목·안내 문구·하단 버튼 배치를 모든 추가/설정 팝업이 같이 씀.
   예전엔 캔버스 위에 떠서 도면을 가렸는데, 도면을 보면서 입력해야 하는 흐름이라 사이드바로 옮김 ── */
const SidebarPopup = ({ title, badge, hint, actions, children }: SidebarPopupProps) => (
  <div className={styles.nodeAddPopup} onClick={(e) => e.stopPropagation()}>
    <div className={styles.nodeAddHeader}>
      <span className={styles.nodeAddTitle}>{title}</span>
      {badge !== undefined && <span className={styles.nodeAddStepBadge}>{badge}</span>}
    </div>
    <span className={styles.nodeAddHint}>{hint}</span>
    {children}
    <div className={styles.nodeAddActions}>
      {actions.map(({ label, variant, disabled, onClick }, index) => (
        <button
          key={index}
          type="button"
          className={ACTION_CLASS[variant]}
          disabled={disabled}
          onClick={onClick}
        >
          {label}
        </button>
      ))}
    </div>
  </div>
);

export default SidebarPopup;
