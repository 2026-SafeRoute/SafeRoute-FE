import { useEffect, useState, type FormEvent } from 'react';

import type { GenerateReportRequest } from '@apis/__generated__/data-contracts';

import { Button } from '@components/Button';
import TextField from '@components/inputField/TextField';
import Modal from '@components/modal/Modal';

import * as styles from './TrainingEndModal.css';

interface TrainingEndModalProps {
  open: boolean;
  completed: boolean;
  participantCount: number;
  isSubmitting: boolean;
  canClose: boolean;
  onClose: () => void;
  onSubmit: (values: GenerateReportRequest) => Promise<void>;
  onHome: () => void;
  onReport: () => void;
}

interface FieldErrors {
  participantCount?: string;
  survivorCount?: string;
}

const TrainingEndModal = ({
  open,
  completed,
  participantCount,
  isSubmitting,
  canClose,
  onClose,
  onSubmit,
  onHome,
  onReport,
}: TrainingEndModalProps) => {
  const [survivorCount, setSurvivorCount] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!open) return;

    setSurvivorCount('');
    setErrors({});
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedSurvivorCount = survivorCount.trim();
    let parsedSurvivorCount: number | undefined;
    const nextErrors: FieldErrors = {};

    if (!Number.isInteger(participantCount) || participantCount < 1) {
      nextErrors.participantCount = '총 참가 인원을 1명 이상 입력해 주세요.';
    }

    if (!normalizedSurvivorCount) {
      nextErrors.survivorCount = '대피 완료 인원을 입력해 주세요.';
    } else {
      parsedSurvivorCount = Number(normalizedSurvivorCount);
    }

    if (
      parsedSurvivorCount !== undefined &&
      (!Number.isInteger(parsedSurvivorCount) || parsedSurvivorCount < 0)
    ) {
      nextErrors.survivorCount = '대피 완료 인원을 0명 이상 입력해 주세요.';
    } else if (
      parsedSurvivorCount !== undefined &&
      Number.isInteger(participantCount) &&
      parsedSurvivorCount > participantCount
    ) {
      nextErrors.survivorCount = '대피 완료 인원은 총 참가 인원보다 많을 수 없습니다.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || parsedSurvivorCount === undefined) return;

    await onSubmit({
      participantCount,
      survivorCount: parsedSurvivorCount,
    });
  };

  if (completed) {
    return (
      <Modal
        open={open}
        onClose={() => undefined}
        size="lg"
        variant="confirm"
        className={styles.modal}
        confirmBodyClassName={styles.confirmBody}
        icon={<span className={styles.successIcon}>✓</span>}
        title="훈련이 완료되었습니다"
        description="훈련 결과가 저장되었으며 분석 보고서가 생성되었습니다."
        footer={
          <div className={styles.actions}>
            <Button type="button" variant="ghost" size="lg" onClick={onHome}>
              홈으로
            </Button>
            <Button type="button" size="lg" onClick={onReport}>
              분석 보고서 보러 가기
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <Modal
      open={open}
      onClose={canClose && !isSubmitting ? onClose : () => undefined}
      showCloseButton={canClose && !isSubmitting}
      size="lg"
      className={styles.modal}
      title="훈련 결과 입력"
      description="총 참가 인원을 확인하고 대피 완료 인원을 입력해 주세요."
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={onClose}
            disabled={!canClose || isSubmitting}
          >
            취소
          </Button>
          <Button type="submit" size="lg" form="training-result-form" isLoading={isSubmitting}>
            훈련 종료 및 보고서 생성
          </Button>
        </>
      }
    >
      <form id="training-result-form" className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGrid}>
          <TextField
            label="총 참가 인원"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            placeholder="예: 52"
            value={participantCount}
            errorMessage={errors.participantCount}
            readOnly
          />
          <TextField
            label="대피 완료 인원"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="예: 50"
            value={survivorCount}
            errorMessage={errors.survivorCount}
            onChange={(event) => setSurvivorCount(event.target.value)}
            disabled={isSubmitting}
            autoFocus
          />
        </div>
        <p className={styles.helperText}>
          총 참가 인원은 시나리오의 예상 참가 인원이며, 대피 완료 인원에는 안전하게 대피를 완료한
          인원을 입력해 주세요.
        </p>
      </form>
    </Modal>
  );
};

export default TrainingEndModal;
