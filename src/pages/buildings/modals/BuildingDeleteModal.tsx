import type { Building } from '@apis/buildings/buildingTypes';

import { Button } from '@components/Button';
import Modal from '@components/modal';

interface BuildingDeleteModalProps {
  open: boolean;
  onClose: () => void;
  building: Building;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

const BuildingDeleteModal = ({
  open,
  onClose,
  building,
  onConfirm,
  isSubmitting = false,
}: BuildingDeleteModalProps) => (
  <Modal
    variant="confirm"
    open={open}
    onClose={onClose}
    title="건물 삭제"
    description={`'${building.name}' 건물을 삭제하시겠습니까?`}
    warning={'건물과 관련된 모든 도면 데이터가 영구적으로 삭제됩니다.'}
    footer={
      <>
        <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
          취소
        </Button>
        <Button variant="danger" onClick={onConfirm} isLoading={isSubmitting}>
          삭제
        </Button>
      </>
    }
  />
);

export default BuildingDeleteModal;
