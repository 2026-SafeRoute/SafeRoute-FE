import { Button } from '@components/Button';
import Modal from '@components/modal';

interface EquipmentDeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  label: string;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

const EquipmentDeleteConfirmModal = ({
  open,
  onClose,
  label,
  onConfirm,
  isSubmitting = false,
}: EquipmentDeleteConfirmModalProps) => (
  <Modal
    variant="confirm"
    open={open}
    // 삭제 요청이 진행 중일 때는 ESC나 바깥 클릭으로 모달만 닫히고 요청은 계속 도는 상태를 방지
    onClose={() => {
      if (!isSubmitting) onClose();
    }}
    title="장비 삭제"
    description={`'${label}' 장비를 삭제하시겠습니까?`}
    warning={'도면에서 해당 장비 노드가 제거되며, \n이 작업은 되돌릴 수 없습니다.'}
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

export default EquipmentDeleteConfirmModal;
