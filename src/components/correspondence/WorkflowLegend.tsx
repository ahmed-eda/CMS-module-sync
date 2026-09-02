import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Send,
  Workflow,
  FileCheck2,
  FolderArchive,
  Info,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface WorkflowLegendProps {
  locale: 'ar' | 'en';
  defaultExpanded?: boolean;
  className?: string;
}

export const WorkflowLegend: React.FC<WorkflowLegendProps> = ({
  locale,
  defaultExpanded = false,
  className = ''
}) => {
  const isAr = locale === 'ar';
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  const statusLegend = [
    {
      id: 'completed',
      labelAr: 'مرحلة مكتملة ومنجزة',
      labelEn: 'Completed Stage',
      descAr: 'تم تنفيذ كافة الإجراءات والتأشيرات واعتمادها نظامياً',
      descEn: 'All procedures and directives completed and signed off',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
      dotColor: 'bg-emerald-500',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'active',
      labelAr: 'المرحلة النشطة الحالية',
      labelEn: 'Current Active Stage',
      descAr: 'المعاملة قيد المعالجة الآن لدى الإدارة أو الموظف المعني',
      descEn: 'Under active review/action by the designated department or officer',
      badgeColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-500/40',
      dotColor: 'bg-blue-500 animate-ping',
      icon: <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
    },
    {
      id: 'pending',
      labelAr: 'مرحلة مستقبلية معلقة',
      labelEn: 'Pending / Future Stage',
      descAr: 'خطوة لاحقة في المسار النظامي تنتظر إنجاز المراحل السابقة',
      descEn: 'Next lifecycle step awaiting completion of preceding stages',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 border-dashed',
      dotColor: 'bg-slate-400',
      icon: <Workflow className="w-4 h-4 text-slate-400" />
    },
    {
      id: 'rejected',
      labelAr: 'معادة / مرفوضة',
      labelEn: 'Returned / Rejected',
      descAr: 'تمت إعادة المعاملة لطلب تعديل أو استيفاء ملاحظات',
      descEn: 'Returned to sender for clarification, remarks, or corrections',
      badgeColor: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-500/40',
      dotColor: 'bg-rose-500',
      icon: <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
    }
  ];

  const iconLegend = [
    {
      id: 'register',
      labelAr: 'القيد والتسجيل',
      labelEn: 'Registration',
      descAr: 'توثيق بيانات الوارد أو الصادر',
      descEn: 'Incoming or outgoing logging',
      icon: <FileText className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
    },
    {
      id: 'stamp',
      labelAr: 'الختم والباركود',
      labelEn: 'Stamping & Barcode',
      descAr: 'التوليد الرقمي والتكامل مع GSB',
      descEn: 'Digital barcode & GSB integration',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
    },
    {
      id: 'route',
      labelAr: 'الإحالة والتوجيه',
      labelEn: 'Action Routing',
      descAr: 'تحويل المعاملة مع أوامر العمل',
      descEn: 'Forwarding with directives',
      icon: <Send className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
    },
    {
      id: 'action',
      labelAr: 'الدراسة والإفادة',
      labelEn: 'Study & Formulation',
      descAr: 'إعداد الرأي الفني والمذكرات',
      descEn: 'Technical formulation and study',
      icon: <Workflow className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
    },
    {
      id: 'approval',
      labelAr: 'الاعتماد والتوقيع',
      labelEn: 'Executive Signature',
      descAr: 'توقيع صاحب الصلاحية الرقمي',
      descEn: 'Authorized digital signature',
      icon: <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'archive',
      labelAr: 'الأرشيف الإلكتروني',
      labelEn: 'Electronic Archiving',
      descAr: 'حفظ المعاملة وإقفال السجل',
      descEn: 'Secure file archiving & closure',
      icon: <FolderArchive className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
    }
  ];

  return (
    <div
      id="workflow-legend-container"
      className={`border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 transition-all duration-200 ${className}`}
    >
      {/* Header Bar Toggle */}
      <button
        id="workflow-legend-toggle"
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-100/70 dark:hover:bg-slate-900/60 transition cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{isAr ? 'دليل الرموز ودلالات الألوان في مخطط السير' : 'Workflow Status & Icon Legend'}</span>
          <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {isExpanded ? (isAr ? 'انقر للإخفاء' : 'Click to collapse') : (isAr ? 'انقر للعرض' : 'Click to expand')}
          </span>
        </div>

        {/* Minimized inline preview if collapsed */}
        {!isExpanded && (
          <div className="hidden md:flex items-center gap-3 text-[11px] font-medium">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{isAr ? 'مكتمل' : 'Completed'}</span>
            </span>
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>{isAr ? 'نشط حالياً' : 'Active'}</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>{isAr ? 'معلق' : 'Pending'}</span>
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{isAr ? 'معاد' : 'Returned'}</span>
            </span>
          </div>
        )}

        <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Legend Panel */}
      {isExpanded && (
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Section 1: Status Color Coding */}
          <div>
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono mb-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{isAr ? 'دلالات ألوان حالات المراحل' : 'Status & Color Indicators'}</span>
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {statusLegend.map(item => (
                <div
                  key={item.id}
                  className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${item.badgeColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor}`} />
                      <span>{isAr ? item.labelAr : item.labelEn}</span>
                    </span>
                    {item.icon}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                    {isAr ? item.descAr : item.descEn}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Icons & Functional Steps */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono mb-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>{isAr ? 'رموز وأنواع الخطوات الإجرائية' : 'Lifecycle Stage Icons'}</span>
            </h5>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {iconLegend.map(item => (
                <div
                  key={item.id}
                  className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-2 text-right"
                >
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <h6 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">
                      {isAr ? item.labelAr : item.labelEn}
                    </h6>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {isAr ? item.descAr : item.descEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
