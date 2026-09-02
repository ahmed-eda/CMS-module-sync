import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building,
  Shield,
  Layers,
  Activity,
  Archive,
  Hourglass
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { appRepository } from '../../services/store';
import { PriorityLevel, WorkItemStatus } from '../../types/enums';

interface FollowUpReportsViewProps {
  locale: 'ar' | 'en';
}

export const FollowUpReportsView: React.FC<FollowUpReportsViewProps> = ({ locale }) => {
  const isAr = locale === 'ar';
  const workItems = appRepository.getWorkItems();
  const departments = appRepository.getDepartments();
  const sites = appRepository.getSites();

  const totalCount = workItems.length;
  const completedCount = workItems.filter(w => w.status === WorkItemStatus.Completed).length;
  const inProgressCount = workItems.filter(w => w.status === WorkItemStatus.InProgress).length;
  const newCount = workItems.filter(w => (w.status === WorkItemStatus.New || !w.isRead) && w.status !== WorkItemStatus.Completed).length;
  const pendingReplyCount = workItems.filter(
    w =>
      w.status === WorkItemStatus.PendingReply ||
      (w.correspondence.expectedResponseDate && !w.correspondence.isReplied && w.status !== WorkItemStatus.Completed)
  ).length;
  const archivedCount = workItems.filter(w => w.status === WorkItemStatus.Archived).length;
  const urgentCount = workItems.filter(w => w.correspondence.priorityLevel >= PriorityLevel.Urgent).length;
  const slaPendingCount = workItems.filter(
    w => w.correspondence.expectedResponseDate && !w.correspondence.isReplied
  ).length;

  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

  // Status distribution dataset for Recharts Bar Chart
  const statusDistributionData = [
    {
      key: 'new',
      status: WorkItemStatus.New,
      name: isAr ? 'جديد وغير مقروء' : 'New / Unread',
      shortName: isAr ? 'جديد' : 'New',
      count: newCount,
      color: '#3b82f6', // blue-500
      bgClass: 'bg-blue-500',
      description: isAr ? 'معاملات واردة حديثاً بانتظار المراجعة والتوجيه' : 'Newly received items awaiting review',
      percentage: totalCount > 0 ? Math.round((newCount / totalCount) * 100) : 0
    },
    {
      key: 'inProgress',
      status: WorkItemStatus.InProgress,
      name: isAr ? 'قيد المعالجة والدراسة' : 'In-Progress',
      shortName: isAr ? 'قيد المعالجة' : 'In Progress',
      count: inProgressCount,
      color: '#f59e0b', // amber-500
      bgClass: 'bg-amber-500',
      description: isAr ? 'تخضع للدراسة الفنية وصياغة الإفادة والتأشير' : 'Under active technical review & drafting',
      percentage: totalCount > 0 ? Math.round((inProgressCount / totalCount) * 100) : 0
    },
    {
      key: 'pending',
      status: WorkItemStatus.PendingReply,
      name: isAr ? 'بانتظار الرد (SLA)' : 'Pending Reply',
      shortName: isAr ? 'بانتظار الرد' : 'Pending',
      count: pendingReplyCount,
      color: '#8b5cf6', // violet-500
      bgClass: 'bg-violet-500',
      description: isAr ? 'محالة لجهات خارجية أو فرعية بانتظار الإفادة' : 'Referred to external entities awaiting SLA reply',
      percentage: totalCount > 0 ? Math.round((pendingReplyCount / totalCount) * 100) : 0
    },
    {
      key: 'completed',
      status: WorkItemStatus.Completed,
      name: isAr ? 'مكتملة ومنجزة' : 'Completed',
      shortName: isAr ? 'مكتملة' : 'Completed',
      count: completedCount,
      color: '#10b981', // emerald-500
      bgClass: 'bg-emerald-500',
      description: isAr ? 'تم إنهاء الإجراء وإصدار الرد الرسمي والاعتماد' : 'Resolved, officially replied, and finalized',
      percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    },
    {
      key: 'archived',
      status: WorkItemStatus.Archived,
      name: isAr ? 'مؤرشفة ومحفوظة' : 'Archived',
      shortName: isAr ? 'مؤرشفة' : 'Archived',
      count: archivedCount,
      color: '#64748b', // slate-500
      bgClass: 'bg-slate-500',
      description: isAr ? 'محفوظة في الأرشيف الإلكتروني الدائم والملفات' : 'Preserved in long-term digital filing archives',
      percentage: totalCount > 0 ? Math.round((archivedCount / totalCount) * 100) : 0
    }
  ];

  // Custom Tooltip for Recharts
  const CustomStatusTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-2 z-50 min-w-[220px]">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
              <span>{data.name}</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {data.percentage}%
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-mono">
            <span>{isAr ? 'عدد المعاملات:' : 'Total Volume:'}</span>
            <span className="font-bold text-base text-slate-900 dark:text-slate-100">
              {data.count} {isAr ? 'معاملة' : 'items'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            {data.description}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none">
      {/* Header */}
      <div>
        <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>{isAr ? 'لوحة مؤشرات الأداء ومتابعة المراسلات (SLA Analytics)' : 'Executive Analytics & SLA Dashboard'}</span>
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
          {isAr
            ? 'رصد قيود الوارد والصادر، زمن الاستجابة، ومعدلات إنجاز الإدارات'
            : 'Operational KPIs, resolution velocity, and departmental compliance'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-400 text-xs">
            <span>{isAr ? 'إجمالي المعاملات النشطة' : 'Total Active'}</span>
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">{totalCount}</div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{isAr ? '+14% مقارنة بالشهر السابق' : '+14% vs last month'}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-400 text-xs">
            <span>{isAr ? 'المعاملات المنجزة والمقفلة' : 'Completed'}</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">{completedCount}</div>
          <div className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold font-mono">
            {completionRate}% {isAr ? 'نسبة الإنجاز الكلية' : 'Completion Rate'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-400 text-xs">
            <span>{isAr ? 'قيد المعالجة والدراسة' : 'In Progress'}</span>
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">{inProgressCount}</div>
          <div className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold">
            {isAr ? 'متوسط زمن المعالجة: 1.8 يوم' : 'Avg Time: 1.8 Days'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-400 text-xs">
            <span>{isAr ? 'المعاملات العاجلة والطوارئ' : 'Urgent & Immediate'}</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{urgentCount}</div>
          <div className="text-[10px] text-rose-700 dark:text-rose-400 font-semibold">
            {slaPendingCount} {isAr ? 'معاملة ضمن مهلة SLA' : 'within SLA'}
          </div>
        </div>
      </div>

      {/* Correspondence Status Distribution Dashboard Card (Recharts) */}
      <div
        id="correspondence-status-distribution-card"
        className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isAr ? 'توزيع المعاملات حسب حالة المعالجة' : 'Correspondence Status Distribution'}</span>
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {isAr
                ? 'رصد بياني فوري لحجم المعاملات الموزعة بين الجديد، قيد المعالجة، بانتظار الرد، والمكتمل'
                : 'Real-time volume tracking across New, In-Progress, Pending, Completed, and Archived'}
            </p>
          </div>

          {/* Quick Summary Pill */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {isAr ? 'إجمالي المعاملات:' : 'Total Items:'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-mono font-bold text-xs">
              {totalCount} {isAr ? 'معاملة' : 'Correspondences'}
            </span>
          </div>
        </div>

        {/* Recharts Bar Chart Area */}
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={statusDistributionData}
              margin={{ top: 16, right: 16, left: isAr ? 16 : 0, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#94a3b8"
                strokeOpacity={0.18}
              />
              <XAxis
                dataKey="shortName"
                tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 500 }}
                axisLine={{ stroke: '#94a3b8', strokeOpacity: 0.2 }}
                tickLine={false}
                dy={8}
                reversed={isAr}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: 'currentColor', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                orientation={isAr ? 'right' : 'left'}
                dx={isAr ? 8 : -8}
              />
              <Tooltip
                content={<CustomStatusTooltip />}
                cursor={{ fill: 'currentColor', opacity: 0.04 }}
              />
              <Bar
                dataKey="count"
                radius={[8, 8, 0, 0]}
                maxBarSize={56}
                animationDuration={900}
              >
                {statusDistributionData.map(entry => (
                  <Cell key={`cell-${entry.key}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Breakdown Legend & Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {statusDistributionData.map(item => {
            let IconComponent = FileText;
            if (item.key === 'inProgress') IconComponent = Clock;
            if (item.key === 'pending') IconComponent = Hourglass;
            if (item.key === 'completed') IconComponent = CheckCircle2;
            if (item.key === 'archived') IconComponent = Archive;

            return (
              <div
                key={item.key}
                className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5 transition hover:shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate font-semibold text-[11px]">{item.shortName}</span>
                  </div>
                  <IconComponent className="w-3.5 h-3.5 opacity-60 shrink-0" />
                </div>
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                    {item.count}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>{isAr ? 'توزيع المعاملات حسب الإدارات المختصة' : 'Department Volume Distribution'}</span>
          </h2>
          <div className="space-y-3">
            {departments.map((d, i) => {
              const count = Math.max(1, 4 - i);
              const pct = Math.round((count / 10) * 100);
              return (
                <div key={d.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="truncate max-w-[280px]">{d.nameAr}</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">{count} معاملات ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority & Delivery Channels */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>{isAr ? 'قنوات الربط والأسبقية الأمنية' : 'Channels & Security Distribution'}</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-400 dark:text-slate-400 block text-[10px]">الربط الحكومي (GSB):</span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">78%</span>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">تراسل إلكتروني مشفر</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-400 dark:text-slate-400 block text-[10px]">التوقيع الإلكتروني الرقمي:</span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">100%</span>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">شهادات معتمدة SHA256</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-400 dark:text-slate-400 block text-[10px]">سرية المعاملات:</span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">62% عادي / 38% سري</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">خاضعة لمصفوفة الصلاحيات</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-400 dark:text-slate-400 block text-[10px]">الالتزام بـ SLA:</span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">96.4%</span>
              <p className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold">ضمن المهلة القانونية</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
