import { useRef, useState } from 'react';

import AlertIcon from '@assets/icons/ic-alert.svg?react';
import BellIcon from '@assets/icons/ic-bell.svg?react';
import CheckCircleIcon from '@assets/icons/ic-check-circle.svg?react';
import InfoIcon from '@assets/icons/ic-info.svg?react';
import XCircleIcon from '@assets/icons/ic-x-circle.svg?react';
import XIcon from '@assets/icons/ic-x.svg?react';

import * as styles from './Toast.css';

export type ToastVariant = 'default' | 'success' | 'warning' | 'error';
export type ToastIcon = 'notification' | 'info';

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ToastIcon;
  descriptionNoWrap?: boolean;
  leaving?: boolean;
  onClose: (id: string) => void;
}

const ICONS: Record<ToastVariant, React.ReactElement> = {
  default: <BellIcon width={22} height={22} />,
  success: <CheckCircleIcon width={22} height={22} />,
  warning: <AlertIcon width={22} height={22} />,
  error: <XCircleIcon width={22} height={22} />,
};

const SWIPE_THRESHOLD = 80;

const Toast = ({
  id,
  title,
  description,
  variant = 'default',
  duration = 3000,
  actionLabel,
  onAction,
  icon = 'notification',
  descriptionNoWrap = false,
  leaving = false,
  onClose,
}: ToastProps) => {
  const [dragX, setDragX] = useState(0);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (leaving) return;
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const delta = e.clientX - startXRef.current;
    if (delta > 0) setDragX(delta);
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (dragX >= SWIPE_THRESHOLD) {
      onClose(id);
    } else {
      setDragX(0);
    }
  };

  const handlePointerCancel = () => {
    isDraggingRef.current = false;
    setDragX(0);
  };

  const isDragging = dragX > 0;
  const dragOpacity = isDragging ? Math.max(0, 1 - dragX / 160) : undefined;

  return (
    <div
      className={styles.container({ variant, leaving, wide: descriptionNoWrap })}
      role="alert"
      aria-live="polite"
      style={{
        transform: isDragging ? `translateX(${dragX}px)` : undefined,
        opacity: dragOpacity,
        transition:
          !isDragging && !isDraggingRef.current
            ? 'transform 0.25s ease, opacity 0.25s ease'
            : undefined,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <span className={styles.iconWrapper({ variant })}>
        {icon === 'info' ? <InfoIcon width={22} height={22} /> : ICONS[variant]}
      </span>
      <div className={styles.body}>
        <span className={styles.title({ variant })}>{title}</span>
        {description && (
          <span className={styles.description({ variant, noWrap: descriptionNoWrap })}>
            {description}
          </span>
        )}
        {actionLabel && onAction && (
          <button
            type="button"
            className={styles.actionButton({ variant })}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => {
              onAction();
              onClose(id);
            }}
          >
            {actionLabel}
          </button>
        )}
      </div>
      <button
        type="button"
        className={styles.closeButton({ variant })}
        aria-label="닫기"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => onClose(id)}
      >
        <XIcon width={14} height={14} />
      </button>
      {duration > 0 && (
        <div
          className={`${styles.progressBar} ${styles.progressBarVariant({ variant })}`}
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
};

export default Toast;
