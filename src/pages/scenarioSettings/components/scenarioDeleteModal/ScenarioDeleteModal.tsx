import { Button } from '@components/Button';
import Modal from '@components/modal';

interface ScenarioDeleteModalProps {
  open: boolean;
  scenarioName: string;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

const ScenarioDeleteModal = ({
  open,
  scenarioName,
  onClose,
  onConfirm,
  isSubmitting = false,
}: ScenarioDeleteModalProps) => {
  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      variant="confirm"
      title="시나리오 삭제"
      description={`'${scenarioName}' 시나리오를 삭제하시겠습니까?`}
      warning={'삭제된 시나리오와 관련된 모든 설정 정보가 영구적으로 삭제됩니다.'}
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            type="button"
            variant="danger"
            size="lg"
            onClick={onConfirm}
            isLoading={isSubmitting}
          >
            삭제
          </Button>
        </>
      }
    />
  );
};

export default ScenarioDeleteModal;
