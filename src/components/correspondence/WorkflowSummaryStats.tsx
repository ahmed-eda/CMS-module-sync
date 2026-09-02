import React from 'react';
import {
  Clock,
  Timer,
  Calendar,
  Hourglass,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Zap,
  Activity,
  Flame
} from 'lucide-react';
import { Correspondence, RouteItem } from '../../types/domain';
import { WorkItemStatus, PriorityLevel } from '../../types/enums';

interface WorkflowSummaryStatsProps {
  correspondence: Correspondence;
  routes?: RouteItem[];
  locale: 'ar' | 'en';
  className?: string;
}

export const WorkflowSummaryStats: React.FC<WorkflowSummaryStatsProps> = ({
  correspondence,
  routes = [],
  locale,
  className = ''
}) => {
  const isAr = locale === 'ar';

  // 1. Calculate time spent from registerDate to now (or completion)
  const registerTime = new Date(correspondence.registerDate).getTime();
  const isCompleted = correspondence.status === WorkItemStatus.Completed;
  
  // If completed, find completion timestamp or fallback to last route
  const lastRouteTime = routes.length > 0
    ? new Date(routes[routes.length - 1].routeDate).getTime()
    : registerTime;

  const endTime = isCompleted
    ? (correspondence.digitalSignature?.signedAt 
        ? new Date(correspondence.digitalSignature.signedAt).getTime() 
        : lastRouteTime + 3600000)
    : Date.now();

  const elapsedMs = Math.max(0, endTime - registerTime);
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const elapsedHours = Math.floor((elapsedMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const elapsedMins = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));

  const formatElapsedTime = () => {
    if (elapsedDays > 0) {
      return isAr
        ? `${elapsedDays} يوم و ${elapsedHours} ساعة`
        : `${elapsedDays}d ${elapsedHours}h`;
    }
    if (elapsedHours > 0) {
      return isAr
        ? `${elapsedHours} ساعة و ${elapsedMins} دقيقة`
        : `${elapsedHours}h ${elapsedMins}m`;
    }
    return isAr ? `${Math.max(1, elapsedMins)} دقيقة` : `${Math.max(1, elapsedMins)}m`;
  };

  // 2. Calculate Estimated Time to Completion (ETC) & SLA Deadlines
  // Target response date / deadline from correspondence or route
  let targetDeadlineMs = correspondence.expectedResponseDate
    ? new Date(correspondence.expectedResponseDate).getTime()
    : 0;

  // If no expected response date, infer from priority level
  if (!targetDeadlineMs) {
    const priorityStandardDays =
      correspondence.priorityLevel === PriorityLevel.Immediate
        ? 1
        : correspondence.priorityLevel === PriorityLevel.TopUrgent
        ? 2
        : correspondence.priorityLevel === PriorityLevel.Urgent
        ? 3
        : 7; // Normal
    targetDeadlineMs = registerTime + priorityStandardDays * 24 * 60 * 60 * 1000;
  }

  const remainingMs = targetDeadlineMs - Date.now();
  const isOverdue = !isCompleted && remainingMs < 0;
  const remainingDays = Math.abs(Math.floor(remainingMs / (1000 * 60 * 60 * 24)));
  const remainingHours = Math.abs(Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

  const formatEstimatedRemaining = () => {
    if (isCompleted) {
      return isAr ? 'تم الإنجاز بالكامل' : 'Fully Completed';
    }
    if (isOverdue) {
      return isAr
        ? `متجاوز للمهلة بـ ${remainingDays > 0 ? `${remainingDays} يوم ` : ''}${remainingHours} س`
        : `Overdue by ${remainingDays > 0 ? `${remainingDays}d ` : ''}${remainingHours}h`;
    }
    if (remainingDays > 0) {
      return isAr
        ? `متبقي ${remainingDays} يوم و ${remainingHours} ساعة`
        : `${remainingDays}d ${remainingHours}h remaining`;
    }
    return isAr ? `متبقي ${Math.max(1, remainingHours)} ساعة` : `${Math.max(1, remainingHours)}h remaining`;
  };

  // 3. Efficiency / Velocity Rating
  const totalTargetMs = Math.max(1, targetDeadlineMs - registerTime);
  const timeConsumedRatio = Math.min(1.5, elapsedMs / totalTargetMs);
  const slaHealthPercent = Math.max(0, Math.min(100, Math.round((1 - (elapsedMs / totalTargetMs)) * 100)));

  return (
    <div
      id="workflow-summary-stats"
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 ${className}`}
    >
      {/* CARD 1: Total Time Spent in Lifecycle */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
            {isAr ? 'إجمالي الوقت المنقضي' : 'Total Time Elapsed'}
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Timer className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2.5">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">
              {formatElapsedTime()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>
              {isAr ? 'من تاريخ القيد: ' : 'From: '}
              <span className="font-mono">{new Date(correspondence.registerDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
            </span>
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
      </div>

      {/* CARD 2: Estimated Time to Completion (ETC) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
            {isAr ? 'الوقت التقديري المتبقي' : 'Estimated Time to Finish'}
          </span>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            isCompleted
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              : isOverdue
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
          }`}>
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : isOverdue ? (
              <AlertCircle className="w-4 h-4 animate-bounce" />
            ) : (
              <Hourglass className="w-4 h-4 animate-pulse" />
            )}
          </div>
        </div>

        <div className="mt-2.5">
          <div className="flex items-baseline gap-2">
            <span className={`text-lg font-black font-mono ${
              isCompleted
                ? 'text-emerald-600 dark:text-emerald-400'
                : isOverdue
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}>
              {formatEstimatedRemaining()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>
              {isCompleted
                ? (isAr ? 'أغلقت المعاملة بنجاح' : 'Lifecycle closed')
                : isAr
                ? 'المهلة النظامية: ' + new Date(targetDeadlineMs).toLocaleDateString('ar-SA')
                : 'Target: ' + new Date(targetDeadlineMs).toLocaleDateString('en-US')}
            </span>
          </p>
        </div>

        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${
          isCompleted
            ? 'from-emerald-500 to-teal-500'
            : isOverdue
            ? 'from-rose-500 to-red-500'
            : 'from-amber-500 to-orange-500'
        }`} />
      </div>

      {/* CARD 3: SLA Health & Velocity Index */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
            {isAr ? 'مؤشر الالتزام باتفاقية الخدمة' : 'SLA Compliance & Pace'}
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2.5">
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">
              {isCompleted ? '100%' : `${slaHealthPercent}%`}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isCompleted || slaHealthPercent > 50
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : slaHealthPercent > 20
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
            }`}>
              {isCompleted
                ? (isAr ? 'إنجاز ممتاز' : 'Optimal')
                : slaHealthPercent > 50
                ? (isAr ? 'وتيرة ممتازة' : 'On Track')
                : (isAr ? 'يحتاج متابعة' : 'Attention')}
            </span>
          </div>

          {/* Mini progress bar */}
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCompleted || slaHealthPercent > 50
                  ? 'bg-emerald-500'
                  : slaHealthPercent > 20
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${isCompleted ? 100 : slaHealthPercent}%` }}
            />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
      </div>

      {/* CARD 4: Traversed Hops / Processing Velocity */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
            {isAr ? 'المحطات والإحالات المنفذة' : 'Traversed Routes'}
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2.5">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">
              {routes.length > 0 ? routes.length : 1}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'محطات توجيه' : 'Routing hops'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            {isAr ? 'الجهة الحالية: ' : 'Current: '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {routes.length > 0
                ? (isAr ? routes[routes.length - 1].toDepartmentNameAr : routes[routes.length - 1].toDepartmentNameAr)
                : (isAr ? correspondence.senderDepartmentNameAr || 'الإدارة المعنية' : 'Action Dept')}
            </span>
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
      </div>
    </div>
  );
};
