import { Link } from 'react-router-dom';

import AlertIcon from '@assets/icons/ic-alert.svg?react';

import { Button } from '@components/Button';
import Modal from '@components/modal';

import * as styles from './AlternativeRouteStartModal.css';

interface AlternativeRouteStartModalProps {
  open: boolean;
  isStarting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  floorPlanPath?: string;
}

const AlternativeRouteStartModal = ({
  open,
  isStarting,
  onClose,
  onConfirm,
  floorPlanPath,
}: AlternativeRouteStartModalProps) => (
  <Modal
    open={open}
    onClose={onClose}
    variant="confirm"
    title="대체 경로 없이 시작할까요?"
    description={
      '현재 시나리오에 대한 대체 경로가 없습니다.\n화재가 안내 경로에 닿으면 경로가 재탐색되지 않고\n‘경로 막힘’ 알림만 표시돼요.'
    }
    icon={
      <span className={styles.icon} aria-hidden="true">
        <AlertIcon />
      </span>
    }
    className={styles.modal}
    confirmBodyClassName={styles.body}
    footerClassName={styles.footer}
    footer={
      <div className={styles.footerContent}>
        <div className={styles.actions}>
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>
            돌아가기
          </Button>
          <Button
            type="button"
            variant="dangerOutlined"
            fullWidth
            isLoading={isStarting}
            onClick={onConfirm}
          >
            대체 경로 없이 시작
          </Button>
        </div>
        {floorPlanPath && (
          <Link className={styles.floorPlanLink} to={floorPlanPath}>
            도면 관리에서 끊긴 노드 연결하기 ›
          </Link>
        )}
      </div>
    }
  />
);

export default AlternativeRouteStartModal;
