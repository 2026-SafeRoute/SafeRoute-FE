import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import ToastContainer from './ToastContainer';
import { ToastContext } from './useToast';

import type { ToastProps } from './Toast';
import type { ShowToastOptions } from './useToast';

type ToastItem = Omit<ToastProps, 'onClose' | 'leaving'>;
type NormalizedToastOptions = Omit<ToastItem, 'id' | 'variant' | 'duration'> & {
  variant: NonNullable<ToastItem['variant']>;
  duration: number;
};

const LEAVE_DURATION = 300;
const MAX_TOASTS = 3;

interface ToastProviderProps {
  children: ReactNode;
}

const normalizeToastOptions = ({
  title,
  description,
  variant = 'default',
  duration = 3000,
  actionLabel,
  onAction,
  icon,
  descriptionNoWrap,
}: ShowToastOptions): NormalizedToastOptions => ({
  title,
  description,
  variant,
  duration,
  actionLabel,
  onAction,
  icon,
  descriptionNoWrap,
});

const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [leavingIds, setLeavingIds] = useState<Set<string>>(new Set());
  const toastsRef = useRef<ToastItem[]>([]);
  const autoDismissTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const leaveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const autoDismissTimers = autoDismissTimersRef.current;
    const leaveTimers = leaveTimersRef.current;

    return () => {
      autoDismissTimers.forEach((timer) => clearTimeout(timer));
      leaveTimers.forEach((timer) => clearTimeout(timer));
      autoDismissTimers.clear();
      leaveTimers.clear();
    };
  }, []);

  const syncToasts = useCallback((updater: (prev: ToastItem[]) => ToastItem[]) => {
    toastsRef.current = updater(toastsRef.current);
    setToasts([...toastsRef.current]);
  }, []);

  const remove = useCallback(
    (id: string) => {
      const autoDismissTimer = autoDismissTimersRef.current.get(id);
      const leaveTimer = leaveTimersRef.current.get(id);

      if (autoDismissTimer) clearTimeout(autoDismissTimer);
      if (leaveTimer) clearTimeout(leaveTimer);
      autoDismissTimersRef.current.delete(id);
      leaveTimersRef.current.delete(id);

      syncToasts((prev) => prev.filter((toast) => toast.id !== id));
      setLeavingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [syncToasts],
  );

  const dismiss = useCallback(
    (id: string) => {
      if (leaveTimersRef.current.has(id)) return;

      const autoDismissTimer = autoDismissTimersRef.current.get(id);
      if (autoDismissTimer) clearTimeout(autoDismissTimer);
      autoDismissTimersRef.current.delete(id);

      setLeavingIds((prev) => new Set(prev).add(id));
      const leaveTimer = setTimeout(() => remove(id), LEAVE_DURATION);
      leaveTimersRef.current.set(id, leaveTimer);
    },
    [remove],
  );

  const scheduleRemoval = useCallback(
    (id: string, duration: number) => {
      const existing = autoDismissTimersRef.current.get(id);
      if (existing) clearTimeout(existing);

      if (duration > 0) {
        const timer = setTimeout(() => {
          autoDismissTimersRef.current.delete(id);
          dismiss(id);
        }, duration);
        autoDismissTimersRef.current.set(id, timer);
      }
    },
    [dismiss],
  );

  const show = useCallback(
    (options: ShowToastOptions) => {
      const toastOptions = normalizeToastOptions(options);
      const { title, description, variant, duration } = toastOptions;
      const existing = toastsRef.current.find(
        (toast) =>
          toast.title === title &&
          toast.description === description &&
          toast.variant === variant &&
          !leaveTimersRef.current.has(toast.id),
      );
      if (existing) {
        syncToasts((prev) =>
          prev.map((toast) => (toast.id === existing.id ? { ...toast, ...toastOptions } : toast)),
        );
        scheduleRemoval(existing.id, duration);
        return existing.id;
      }

      if (toastsRef.current.length >= MAX_TOASTS) {
        const evicted = toastsRef.current[0];
        remove(evicted.id);
      }

      const id = `toast-${Date.now()}-${Math.random()}`;
      syncToasts((prev) => [...prev, { id, ...toastOptions }]);
      scheduleRemoval(id, duration);
      return id;
    },
    [remove, scheduleRemoval, syncToasts],
  );

  const update = useCallback(
    (id: string, options: ShowToastOptions) => {
      if (leaveTimersRef.current.has(id) || !toastsRef.current.some((toast) => toast.id === id)) {
        return false;
      }

      const toastOptions = normalizeToastOptions(options);
      syncToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { id, ...toastOptions } : toast)),
      );
      scheduleRemoval(id, toastOptions.duration);
      return true;
    },
    [scheduleRemoval, syncToasts],
  );

  const contextValue = useMemo(() => ({ show, update, dismiss }), [dismiss, show, update]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} leavingIds={leavingIds} onClose={dismiss} />
    </ToastContext.Provider>
  );
};

export default ToastProvider;
