import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Timer,
  Flame,
  Hourglass
} from 'lucide-react';

export interface CorrespondenceCountdownTimerProps {
  expectedResponseDate?: string;
  registerDate?: string;
  isReplied?: boolean;
  isCompleted?: boolean;
  locale: 'ar' | 'en';
  variant?: 'pill' | 'badge' | 'card' | 'micro';
  className?: string;
}

export const CorrespondenceCountdownTimer: React.FC<CorrespondenceCountdownTimerProps> = ({
  expectedResponseDate,
  registerDate,
  isReplied = false,
  isCompleted = false,
  locale,
  variant = 'pill',
  className = ''
}) => {
  const isAr = locale === 'ar';
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expectedResponseDate || isReplied || isCompleted) return;

    // Live update every second for countdown precision
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [expectedResponseDate, isReplied, isCompleted]);

  if (!expectedResponseDate) return null;

  const targetDateObj = new Date(expectedResponseDate);
  const target = targetDateObj.getTime();
  if (isNaN(target)) return null;

  const isDone = isReplied || isCompleted;
  const diffMs = target - now;
  const isOverdue = diffMs <= 0 && !isDone;

  const absDiff = Math.abs(diffMs);
  const totalSeconds = Math.floor(absDiff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const liveTicker = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  // SLA percentage consumed if registerDate is available
  let progressPercent = 0;
  if (registerDate) {
    const start = new Date(registerDate).getTime();
    if (!isNaN(start) && target > start) {
      const elapsed = Math.max(0, now - start);
      const total = target - start;
      progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    }
  } else {
    // Default estimate if registerDate is missing
    progressPercent = isOverdue ? 100 : Math.min(95, Math.max(10, 100 - Math.round((diffMs / (7 * 86400 * 1000)) * 100)));
  }

  const formattedTargetDate = targetDateObj.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const fullTooltip = isAr
    ? `موعد الرد النظامي (SLA): ${targetDateObj.toLocaleDateString('ar-SA')} ${targetDateObj.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`
    : `Response Deadline (SLA): ${targetDateObj.toLocaleDateString('en-US')} ${targetDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

  // 1. REPLIED / COMPLETED STATE
  if (isDone) {
    if (variant === 'micro') {
      return (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 ${className}`}
          title={fullTooltip}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>{isAr ? 'مُنجز' : 'Done'}</span>
        </span>
      );
    }

    if (variant === 'card') {
      return (
        <div
          className={`p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5 ${className}`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isAr ? 'المهلة النظامية (SLA): تم الرد والإنجاز' : 'SLA Target: Replied & Closed'}</span>
            </div>
            <span className="text-[10px] font-mono font-semibold bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-800 dark:text-emerald-300">
              {isAr ? 'في الموعد' : 'On-Time'}
            </span>
          </div>
          <div className="text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <span>{isAr ? 'الموعد المحدد كان:' : 'Target deadline was:'} {formattedTargetDate}</span>
          </div>
        </div>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 whitespace-nowrap shrink-0 ${className}`}
        title={fullTooltip}
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>{isAr ? 'تم الرد في الموعد' : 'SLA Met'}</span>
      </span>
    );
  }

  // 2. OVERDUE STATE
  if (isOverdue) {
    const overdueText =
      days > 0
        ? isAr
          ? `متأخر ${days}ي ${hours}س`
          : `Overdue ${days}d ${hours}h`
        : isAr
        ? `متأخر ${liveTicker}`
        : `Overdue ${liveTicker}`;

    if (variant === 'micro') {
      return (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 animate-pulse font-mono ${className}`}
          title={fullTooltip}
        >
          <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          <span>{overdueText}</span>
        </span>
      );
    }

    if (variant === 'card') {
      return (
        <div
          className={`p-3 rounded-xl bg-rose-50/90 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 space-y-2 shadow-xs ${className}`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-rose-900 dark:text-rose-200">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600 dark:bg-rose-500" />
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>{isAr ? 'تجاوزت المهلة النظامية (Overdue)' : 'SLA Deadline Exceeded'}</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-rose-200 dark:bg-rose-900/80 px-2 py-0.5 rounded text-rose-900 dark:text-rose-200">
              {overdueText}
            </span>
          </div>

          <div className="w-full bg-rose-200 dark:bg-rose-900/60 h-1.5 rounded-full overflow-hidden">
            <div className="bg-rose-600 h-full w-full" />
          </div>

          <div className="text-[11px] text-rose-800 dark:text-rose-300 flex items-center justify-between font-mono">
            <span>{isAr ? 'تاريخ الاستحقاق:' : 'Due date:'} {formattedTargetDate}</span>
            <span className="font-bold">{isAr ? 'يتطلب إجراء فوري' : 'Action Required'}</span>
          </div>
        </div>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100/90 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 whitespace-nowrap shrink-0 shadow-2xs font-mono animate-pulse ${className}`}
        title={fullTooltip}
      >
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600" />
        </span>
        <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
        <span>{overdueText}</span>
      </span>
    );
  }

  // 3. PENDING COUNTDOWN (ACTIVE DEADLINE)
  const isCritical = diffMs < 6 * 3600 * 1000; // < 6 hours
  const isUrgent = diffMs < 24 * 3600 * 1000; // < 24 hours
  const isMedium = diffMs <= 3 * 86400 * 1000; // 1-3 days

  let displayText = '';
  if (isUrgent) {
    displayText = isAr ? `متبقي ${liveTicker}` : `${liveTicker} left`;
  } else if (isMedium) {
    displayText = isAr ? `متبقي ${days}ي ${hours}س` : `${days}d ${hours}h left`;
  } else {
    displayText = isAr ? `متبقي ${days} أيام` : `${days}d left`;
  }

  // Detailed Card Variant (for Inspector and Modal)
  if (variant === 'card') {
    let cardBg = 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200';
    let barBg = 'bg-amber-500';
    if (isCritical) {
      cardBg = 'bg-rose-50/90 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200';
      barBg = 'bg-rose-600';
    } else if (!isUrgent && !isMedium) {
      cardBg = 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200';
      barBg = 'bg-emerald-500';
    }

    return (
      <div className={`p-3 rounded-xl border space-y-2 shadow-2xs ${cardBg} ${className}`}>
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-1.5">
            {isCritical ? (
              <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-bounce" />
            ) : isUrgent ? (
              <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
            ) : (
              <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            )}
            <span>{isAr ? 'العد التنازلي للمهلة (SLA):' : 'Impending SLA Deadline:'}</span>
          </div>
          <span className="text-[11px] font-mono font-extrabold px-2 py-0.5 rounded bg-white/70 dark:bg-slate-900/70 border border-current/20">
            {displayText}
          </span>
        </div>

        {/* Progress meter */}
        <div className="space-y-1">
          <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${barBg}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            <span>{isAr ? 'تاريخ الرد المتوقع:' : 'Target:'} {formattedTargetDate}</span>
            <span>{progressPercent}% {isAr ? 'منقضي' : 'elapsed'}</span>
          </div>
        </div>
      </div>
    );
  }

  // Micro Variant
  if (variant === 'micro') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold ${
          isCritical
            ? 'text-rose-600 dark:text-rose-400 animate-pulse'
            : isUrgent
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-slate-600 dark:text-slate-400'
        } ${className}`}
        title={fullTooltip}
      >
        <Clock className="w-3 h-3 shrink-0" />
        <span>{displayText}</span>
      </span>
    );
  }

  // Pill & Badge Variant (Default for Rows)
  let pillStyles = '';
  let IconComponent = Clock;

  if (isCritical) {
    pillStyles =
      'bg-rose-100/90 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800 shadow-xs font-bold';
    IconComponent = Flame;
  } else if (isUrgent) {
    pillStyles =
      'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/80 shadow-2xs font-bold';
    IconComponent = Timer;
  } else if (isMedium) {
    pillStyles =
      'bg-amber-50/90 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 font-semibold';
    IconComponent = Hourglass;
  } else {
    pillStyles =
      'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 font-medium';
    IconComponent = Clock;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] border font-mono whitespace-nowrap shrink-0 transition-all ${pillStyles} ${className}`}
      title={fullTooltip}
    >
      {isUrgent && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isCritical ? 'bg-rose-400' : 'bg-amber-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
              isCritical ? 'bg-rose-600' : 'bg-amber-500'
            }`}
          />
        </span>
      )}
      <IconComponent
        className={`w-3 h-3 shrink-0 ${isUrgent ? 'animate-pulse' : ''} ${
          isCritical ? 'text-rose-600 dark:text-rose-400' : isUrgent ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
        }`}
      />
      <span>{displayText}</span>
    </span>
  );
};
