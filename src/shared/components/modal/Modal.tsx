import { useEffect, useRef, type ReactNode } from 'react';

import clsx from 'clsx';
import { createPortal } from 'react-dom';

import XIcon from '@assets/icons/ic-x.svg?react';

import * as styles from './Modal.css';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  size?: ModalSize;
  children?: ReactNode;
  footer?: ReactNode;
  title: string;
  description?: string;
  warning?: string;
  variant?: 'form' | 'confirm';
  icon?: ReactNode;
  className?: string;
  confirmBodyClassName?: string;
  footerClassName?: string;
  showCloseButton?: boolean;
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const Modal = ({
  open,
  onClose,
  size = 'md',
  children,
  footer,
  title,
  description,
  warning,
  variant = 'form',
  icon,
  className,
  confirmBodyClassName,
  footerClassName,
  showCloseButton = true,
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }

      // focus trap
      if (e.key !== 'Tab') return;
      const elements = Array.from(modalRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      document.body.style.paddingRight = prevPaddingRight;
      (previousFocusRef.current as HTMLElement | null)?.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={clsx(
          styles.container({ size: variant === 'confirm' && size === 'md' ? 'confirm' : size }),
          className,
        )}
        tabIndex={-1}
      >
        {variant === 'form' && (
          <div className={styles.header}>
            <div className={styles.headerText}>
              <h2 id="modal-title" className={styles.title}>
                {title}
              </h2>
              {description && <p className={styles.description}>{description}</p>}
            </div>
            {showCloseButton ? (
              <button
                type="button"
                className={styles.closeButton}
                aria-label="닫기"
                onClick={onClose}
              >
                <XIcon width={20} height={20} />
              </button>
            ) : null}
          </div>
        )}

        {variant === 'confirm' && (
          <div className={clsx(styles.confirmBody, confirmBodyClassName)}>
            {icon}
            <h2 id="modal-title" className={styles.confirmTitle}>
              {title}
            </h2>
            {description && <p className={styles.confirmDescription}>{description}</p>}
            {warning && <p className={styles.warningBox}>{warning}</p>}
          </div>
        )}

        {children && <div className={styles.body}>{children}</div>}

        {footer && <div className={clsx(styles.footer, footerClassName)}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
