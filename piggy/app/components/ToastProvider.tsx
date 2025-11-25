'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';

type ToastVariant = 'info' | 'success' | 'error';

type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue>({
  showToast: () => undefined
});

export const useToast = () => useContext(ToastContext);

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const [canRenderPortal, setCanRenderPortal] = useState(false);

  useEffect(() => {
    const timersMap = timers.current;
    return () => {
      timersMap.forEach((timeout) => clearTimeout(timeout));
      timersMap.clear();
    };
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, message, variant }]);

      const timer = setTimeout(() => removeToast(id), 3200);
      timers.current.set(id, timer);
    },
    [removeToast]
  );

  useEffect(() => {
    setCanRenderPortal(true);
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  // 根据变体获取样式
  const getToastStyle = (variant: ToastVariant) => {
    switch (variant) {
      case 'error':
        return 'bg-white border-black';
      case 'success':
        return 'bg-[#ffd6e7] border-black';
      default:
        return 'bg-white border-black';
    }
  };

  // 根据变体获取图标
  const getToastIcon = (variant: ToastVariant) => {
    switch (variant) {
      case 'error':
        return '😿';
      case 'success':
        return '😻';
      default:
        return '🐱';
    }
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {canRenderPortal &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex flex-col items-center gap-2 px-4">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`w-full max-w-xs rounded-2xl px-4 py-3 border-3 shadow-[4px_4px_0_#1a1a1a] animate-bounce-in ${getToastStyle(toast.variant)}`}
              >
                <div className="flex items-center gap-2 text-sm font-bold text-black">
                  <span className="text-lg">{getToastIcon(toast.variant)}</span>
                  <p>{toast.message}</p>
                </div>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
