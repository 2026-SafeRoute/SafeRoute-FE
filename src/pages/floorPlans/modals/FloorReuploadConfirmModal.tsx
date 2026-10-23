import { Button } from '@components/Button';
import Modal from '@components/modal';

import { formatFloor } from '@utils/floor';

interface FloorReuploadConfirmModalProps {
  open: boolean;
  onClose: () => void;
  buildingName: string;
  floorNum: number;
  onConfirm: () => void;
}

const FloorReuploadConfirmModal = ({
  open,
  onClose,
  buildingName,
  floorNum,
  onConfirm,
}: FloorReuploadConfirmModalProps) => (
  <Modal
    variant="confirm"
    open={open}
    onClose={onClose}
    title="도면 재업로드"
    description={`'${buildingName}'의 ${formatFloor(floorNum)} 도면을 재업로드하시겠습니까?`}
    warning={'재업로드 시 현재 도면에 지정된 노드·구역 등 모든 편집 내용이 영구적으로 삭제됩니다.'}
    footer={
      <>
        <Button variant="ghost" onClick={onClose}>
          취소
        </Button>
        <Button onClick={onConfirm}>재업로드</Button>
      </>
    }
  />
);

export default FloorReuploadConfirmModal;
