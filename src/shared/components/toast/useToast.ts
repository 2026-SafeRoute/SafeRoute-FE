import { createContext, useContext } from 'react';

import type { ToastIcon, ToastVariant } from './Toast';

export interface ShowToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ToastIcon;
  descriptionNoWrap?: boolean;
}

export interface ToastContextValue {
  show: (options: ShowToastOptions) => string;
  update: (id: string, options: ShowToastOptions) => boolean;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast는 ToastProvider 내부에서 사용해야 합니다.');
  }

  return context;
};

export default useToast;
