import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy
} from 'lucide-react';
import { useToast, ToastItem, ToastType } from './ToastContext';

interface ToastContainerProps {
  locale?: 'ar' | 'en';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  locale = 'ar',
  position
}) => {
  const isAr = locale === 'ar';
  const { toasts, dismissToast, dismissAll, pauseToast, resumeToast } = useToast();

  // Determine optimal position based on language if not explicitly provided
  const resolvedPosition =
    position || (isAr ? 'bottom-left' : 'bottom-right');

  const getPositionClasses = () => {
    switch (resolvedPosition) {
      case 'top-right':
        return 'top-4 right-4 items-end';
      case 'top-left':
        return 'top-4 left-4 items-start';
      case 'bottom-left':
        return 'bottom-4 left-4 items-start';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4 items-end';
    }
  };

  const getToastStyling = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          accentBg: 'bg-emerald-500',
          badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
          border: 'border-emerald-500/40 dark:border-emerald-500/30',
          progressBg: 'bg-gradient-to-r from-emerald-500 to-teal-400',
          glow: 'shadow-emerald-500/10 dark:shadow-emerald-950/40'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
          accentBg: 'bg-rose-500',
          badgeBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
          border: 'border-rose-500/40 dark:border-rose-500/30',
          progressBg: 'bg-gradient-to-r from-rose-500 to-red-600',
          glow: 'shadow-rose-500/10 dark:shadow-rose-950/40'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
          accentBg: 'bg-amber-500',
          badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
          border: 'border-amber-500/40 dark:border-amber-500/30',
          progressBg: 'bg-gradient-to-r from-amber-500 to-yellow-400',
          glow: 'shadow-amber-500/10 dark:shadow-amber-950/40'
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
          accentBg: 'bg-sky-500',
          badgeBg: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
          border: 'border-sky-500/40 dark:border-sky-500/30',
          progressBg: 'bg-gradient-to-r from-sky-500 to-indigo-500',
          glow: 'shadow-sky-500/10 dark:shadow-sky-950/40'
        };
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      dir={isAr ? 'rtl' : 'ltr'}
      className={`fixed z-[9999] pointer-events-none flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full p-2 sm:p-0 ${getPositionClasses()}`}
    >
      {/* Multi-toast dismiss-all control */}
      {toasts.length > 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="pointer-events-auto self-center sm:self-end flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 dark:bg-slate-800/90 text-white rounded-full text-[11px] shadow-lg backdrop-blur-md border border-slate-700/60 mb-0.5 select-none"
        >
          <span>
            {isAr
              ? `${toasts.length} إشعارات نشطة`
              : `${toasts.length} active notifications`}
          </span>
          <button
            onClick={dismissAll}
            className="text-slate-300 hover:text-rose-400 font-bold underline cursor-pointer ml-1"
          >
            {isAr ? 'مسح الكل' : 'Clear all'}
          </button>
        </motion.div>
      )}

      {/* Floating Toast Items */}
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => {
          const styling = getToastStyling(toast.type);
          const progressPercent =
            toast.duration > 0
              ? Math.max(0, Math.min(100, (toast.remainingTime / toast.duration) * 100))
              : 0;

          const title = isAr ? (toast.titleAr || toast.titleEn) : (toast.titleEn || toast.titleAr);
          const message = isAr ? (toast.messageAr || toast.messageEn) : (toast.messageEn || toast.messageAr);

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              onMouseEnter={() => pauseToast(toast.id)}
              onMouseLeave={() => resumeToast(toast.id)}
              className={`pointer-events-auto group relative w-full overflow-hidden rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border ${styling.border} shadow-xl ${styling.glow} text-slate-900 dark:text-slate-100 transition-all select-text`}
            >
              {/* Colored side accent bar */}
              <div
                className={`absolute top-0 bottom-0 ${
                  isAr ? 'right-0' : 'left-0'
                } w-1.5 ${styling.accentBg}`}
              />

              {/* Main Content Layout */}
              <div className="p-3.5 sm:p-4 flex items-start gap-3">
                {/* Custom Icon or Default Themed Icon Badge */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${styling.badgeBg}`}
                >
                  {toast.icon || styling.icon}
                </div>

                {/* Body Text */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {title}
                    </h4>

                    {/* Corr Number Tag if available */}
                    {toast.corrNumber && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold shrink-0 border border-slate-200 dark:border-slate-700">
                        {toast.corrNumber}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words font-medium">
                    {message}
                  </p>

                  {/* Interactive Action button */}
                  {toast.action && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        onClick={() => {
                          toast.action?.onClick();
                          dismissToast(toast.id);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                          toast.type === 'success'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : toast.type === 'error'
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : toast.type === 'warning'
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {toast.action.icon}
                        <span>{isAr ? toast.action.labelAr : toast.action.labelEn}</span>
                        {isAr ? (
                          <ChevronLeft className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={() => dismissToast(toast.id)}
                  aria-label={isAr ? 'إغلاق الإشعار' : 'Close notification'}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Bar (Countdown to auto-dismiss) */}
              {toast.duration > 0 && (
                <div className="h-1 w-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
                  <div
                    className={`h-full ${styling.progressBg} transition-all duration-100 ease-linear`}
                    style={{
                      width: `${progressPercent}%`,
                      transformOrigin: isAr ? 'right' : 'left'
                    }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
