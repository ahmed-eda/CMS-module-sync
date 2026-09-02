import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Sparkles, X, Undo2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  labelAr: string;
  labelEn: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  titleAr?: string;
  titleEn?: string;
  messageAr: string;
  messageEn?: string;
  duration?: number; // ms, default 4500 (0 for sticky)
  action?: ToastAction;
  corrNumber?: string;
  icon?: React.ReactNode;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  titleAr?: string;
  titleEn?: string;
  messageAr: string;
  messageEn?: string;
  duration: number;
  action?: ToastAction;
  corrNumber?: string;
  icon?: React.ReactNode;
  createdAt: number;
  remainingTime: number;
  isPaused: boolean;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
  success: (messageAr: string, options?: Partial<ToastOptions>) => string;
  error: (messageAr: string, options?: Partial<ToastOptions>) => string;
  warning: (messageAr: string, options?: Partial<ToastOptions>) => string;
  info: (messageAr: string, options?: Partial<ToastOptions>) => string;
  pauseToast: (id: string) => void;
  resumeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Global singleton dispatcher so calls outside React tree (e.g. store listeners, API triggers) can trigger toasts
type GlobalToastListener = (action: { type: 'SHOW' | 'DISMISS' | 'DISMISS_ALL'; payload?: any }) => void;
const globalListeners: Set<GlobalToastListener> = new Set();

export const toast = {
  show: (options: ToastOptions): string => {
    const id = options.id || `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    globalListeners.forEach(listener => listener({ type: 'SHOW', payload: { ...options, id } }));
    return id;
  },
  success: (messageAr: string, options?: Partial<ToastOptions>): string => {
    return toast.show({
      type: 'success',
      titleAr: options?.titleAr || 'تمت العملية بنجاح',
      titleEn: options?.titleEn || 'Operation Successful',
      messageAr,
      messageEn: options?.messageEn,
      ...options
    });
  },
  error: (messageAr: string, options?: Partial<ToastOptions>): string => {
    return toast.show({
      type: 'error',
      titleAr: options?.titleAr || 'حدث خطأ في النظام',
      titleEn: options?.titleEn || 'System Error',
      messageAr,
      messageEn: options?.messageEn,
      duration: options?.duration || 6000,
      ...options
    });
  },
  warning: (messageAr: string, options?: Partial<ToastOptions>): string => {
    return toast.show({
      type: 'warning',
      titleAr: options?.titleAr || 'تنبيه إداري',
      titleEn: options?.titleEn || 'Administrative Alert',
      messageAr,
      messageEn: options?.messageEn,
      ...options
    });
  },
  info: (messageAr: string, options?: Partial<ToastOptions>): string => {
    return toast.show({
      type: 'info',
      titleAr: options?.titleAr || 'إشعار توجيهي',
      titleEn: options?.titleEn || 'Information Notice',
      messageAr,
      messageEn: options?.messageEn,
      ...options
    });
  },
  dismiss: (id: string) => {
    globalListeners.forEach(listener => listener({ type: 'DISMISS', payload: id }));
  },
  dismissAll: () => {
    globalListeners.forEach(listener => listener({ type: 'DISMISS_ALL' }));
  }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Subtle web audio feedback for enhanced tactile response
  const playFeedbackChime = (type: ToastType) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.04, now);

      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'error') {
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(440, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else {
        osc.frequency.setValueAtTime(659.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      }
    } catch {
      // Ignore audio failure (e.g. autoplay policy)
    }
  };

  const showToast = useCallback((options: ToastOptions): string => {
    const id = options.id || `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const duration = options.duration !== undefined ? options.duration : 4500;
    const type = options.type || 'info';

    const newItem: ToastItem = {
      id,
      type,
      titleAr: options.titleAr,
      titleEn: options.titleEn,
      messageAr: options.messageAr,
      messageEn: options.messageEn,
      duration,
      remainingTime: duration,
      isPaused: false,
      action: options.action,
      corrNumber: options.corrNumber,
      icon: options.icon,
      createdAt: Date.now()
    };

    setToasts(prev => {
      // Keep max 5 toasts on screen to prevent visual clutter
      const filtered = prev.filter(t => t.id !== id);
      if (filtered.length >= 5) {
        return [newItem, ...filtered.slice(0, 4)];
      }
      return [newItem, ...filtered];
    });

    playFeedbackChime(type);
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const pauseToast = useCallback((id: string) => {
    setToasts(prev =>
      prev.map(t => (t.id === id ? { ...t, isPaused: true } : t))
    );
  }, []);

  const resumeToast = useCallback((id: string) => {
    setToasts(prev =>
      prev.map(t => (t.id === id ? { ...t, isPaused: false } : t))
    );
  }, []);

  // Listen to global singleton triggers
  useEffect(() => {
    const listener: GlobalToastListener = action => {
      if (action.type === 'SHOW') {
        showToast(action.payload);
      } else if (action.type === 'DISMISS') {
        dismissToast(action.payload);
      } else if (action.type === 'DISMISS_ALL') {
        dismissAll();
      }
    };

    globalListeners.add(listener);
    return () => {
      globalListeners.delete(listener);
    };
  }, [showToast, dismissToast, dismissAll]);

  // Handle countdown timers with tick interval
  useEffect(() => {
    if (toasts.length === 0) return;

    const interval = setInterval(() => {
      setToasts(prev => {
        const next: ToastItem[] = [];
        for (const item of prev) {
          if (item.duration === 0) {
            // Persistent until dismissed
            next.push(item);
            continue;
          }

          if (item.isPaused) {
            next.push(item);
            continue;
          }

          const newRemaining = item.remainingTime - 100;
          if (newRemaining > 0) {
            next.push({ ...item, remainingTime: newRemaining });
          }
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [toasts.length]);

  const success = useCallback(
    (messageAr: string, options?: Partial<ToastOptions>) =>
      showToast({
        type: 'success',
        titleAr: options?.titleAr || 'تمت العملية بنجاح',
        titleEn: options?.titleEn || 'Operation Successful',
        messageAr,
        ...options
      }),
    [showToast]
  );

  const error = useCallback(
    (messageAr: string, options?: Partial<ToastOptions>) =>
      showToast({
        type: 'error',
        titleAr: options?.titleAr || 'حدث خطأ في العملية',
        titleEn: options?.titleEn || 'Operation Failed',
        messageAr,
        duration: options?.duration || 6000,
        ...options
      }),
    [showToast]
  );

  const warning = useCallback(
    (messageAr: string, options?: Partial<ToastOptions>) =>
      showToast({
        type: 'warning',
        titleAr: options?.titleAr || 'تنبيه إداري',
        titleEn: options?.titleEn || 'Administrative Alert',
        messageAr,
        ...options
      }),
    [showToast]
  );

  const info = useCallback(
    (messageAr: string, options?: Partial<ToastOptions>) =>
      showToast({
        type: 'info',
        titleAr: options?.titleAr || 'إشعار توجيهي',
        titleEn: options?.titleEn || 'Information Notice',
        messageAr,
        ...options
      }),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        dismissAll,
        success,
        error,
        warning,
        info,
        pauseToast,
        resumeToast
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
