import React from 'react';
import { RouteItem } from '../../types/domain';
import { RouteKind } from '../../types/enums';
import { ArrowDown, CheckCircle2, Clock, User, Building } from 'lucide-react';

interface RouteHistoryTreeProps {
  routes: RouteItem[];
  locale: 'ar' | 'en';
}

export const RouteHistoryTree: React.FC<RouteHistoryTreeProps> = ({ routes, locale }) => {
  const isAr = locale === 'ar';

  const getKindBadge = (k: RouteKind) => {
    switch (k) {
      case RouteKind.ActionNeeded:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
            {isAr ? 'لاتخاذ اللازم' : 'Action Needed'}
          </span>
        );
      case RouteKind.ForInfo:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300">
            {isAr ? 'للاطلاع والإحاطة' : 'For Info'}
          </span>
        );
      case RouteKind.ForApproval:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            {isAr ? 'للاعتماد والتوقيع' : 'For Approval'}
          </span>
        );
      case RouteKind.ForStudy:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300">
            {isAr ? 'للدراسة وإبداء الرأي' : 'For Study'}
          </span>
        );
      case RouteKind.Reply:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300">
            {isAr ? 'رد رسمي' : 'Reply'}
          </span>
        );
      case RouteKind.End:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
            {isAr ? 'إنهاء وحفظ' : 'End & Archive'}
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
            {isAr ? 'إحالة وتوجيه' : 'Route'}
          </span>
        );
    }
  };

  if (routes.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
        {isAr ? 'لا توجد حركات توجيه أو تأشيرات مسجلة حتى الآن' : 'No route history records.'}
      </div>
    );
  }

  return (
    <div className="space-y-4 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700 before:z-0">
      {routes.map((route, idx) => (
        <div key={route.id} className="relative z-10 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center text-xs font-mono font-bold shrink-0 shadow-md border border-slate-700">
            {routes.length - idx}
          </div>

          <div className="flex-1 bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {getKindBadge(route.routeKind)}
                {route.isCc && (
                  <span className="text-[10px] font-mono bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800/60">
                    {isAr ? 'نسخة تعميم' : 'CC'}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400">
                {new Date(route.routeDate).toLocaleString(isAr ? 'ar-SA' : 'en-US')}
              </span>
            </div>

            {/* From -> To */}
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="text-emerald-700 dark:text-emerald-400">{route.fromDepartmentNameAr} ({route.fromEmployeeNameAr})</span>
              <span className="text-slate-400">←</span>
              <span className="text-blue-700 dark:text-blue-400">{route.toDepartmentNameAr} {route.toEmployeeNameAr ? `(${route.toEmployeeNameAr})` : ''}</span>
            </div>

            {/* Instruction Body */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
              <span className="text-[10px] text-slate-400 dark:text-slate-400 block mb-0.5 font-bold">
                {isAr ? 'نص التأشيرة / الأمر الإداري:' : 'Instruction:'}
              </span>
              {route.instructionAr}
            </div>

            {route.actionRequiredDate && (
              <div className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {isAr ? 'تاريخ الإنجاز المطلوب:' : 'Due Date:'}{' '}
                  {new Date(route.actionRequiredDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
