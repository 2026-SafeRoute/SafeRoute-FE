import type { Floor } from '@pages/floorPlans/types/floorPlans';

import { Button } from '@components/Button';
import Modal from '@components/modal';

import { formatFloor, hasFloorPlan } from '@utils/floor';

interface FloorSyncWarningModalProps {
  open: boolean;
  onClose: () => void;
  buildingName: string;
  floorsToDelete: Floor[];
  onConfirm: () => void;
  isSubmitting?: boolean;
}

const FloorSyncWarningModal = ({
  open,
  onClose,
  buildingName,
  floorsToDelete,
  onConfirm,
  isSubmitting = false,
}: FloorSyncWarningModalProps) => {
  const sortedFloorsToDelete = [...floorsToDelete].sort((a, b) => b.floorNum - a.floorNum);
  const floorLabels = sortedFloorsToDelete.map((f) => formatFloor(f.floorNum)).join(', ');
  const floorsWithData = sortedFloorsToDelete.filter(hasFloorPlan);
  const dataFloorLabels = floorsWithData.map((f) => formatFloor(f.floorNum)).join(', ');

  let description = `'${buildingName}'의 ${floorLabels}이 삭제됩니다.`;
  if (floorsWithData.length > 0 && floorsWithData.length < sortedFloorsToDelete.length) {
    description += `\n도면이 등록된 층: ${dataFloorLabels}`;
  }

  return (
    <Modal
      variant="confirm"
      open={open}
      onClose={onClose}
      title="층수 변경으로 인한 도면 데이터 삭제"
      description={description}
      warning={'삭제 대상의 도면과 장비 설정이 모두 영구적으로 삭제됩니다.\n계속하시겠습니까?'}
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
};

export default FloorSyncWarningModal;
