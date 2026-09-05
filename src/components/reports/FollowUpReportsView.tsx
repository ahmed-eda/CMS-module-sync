import React, { useState, useMemo } from 'react';
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
  Hourglass,
  FileSpreadsheet,
  FileDown,
  Loader2,
  Printer,
  Calendar,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  QrCode,
  Sparkles
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
import { WorkItem } from '../../types/domain';
import { exportFollowUpReportCsv, exportFollowUpReportPdf } from '../../utils/dashboardExportUtils';
import { toast } from '../notifications/ToastContext';
import { CorrespondenceProcessingTimeline } from './CorrespondenceProcessingTimeline';
import { FollowUpFilterBar, FollowUpFilterState } from './FollowUpFilterBar';

interface FollowUpReportsViewProps {
  locale: 'ar' | 'en';
  onOpenDetails?: (item: WorkItem) => void;
}

export const FollowUpReportsView: React.FC<FollowUpReportsViewProps> = ({ locale, onOpenDetails }) => {
  const isAr = locale === 'ar';
  const workItems = appRepository.getWorkItems();
  const departments = appRepository.getDepartments();
  const sites = appRepository.getSites();

  // Filter State: Date range and department scoping
  const [filters, setFilters] = useState<FollowUpFilterState>({
    datePreset: 'all',
    startDate: '',
    endDate: '',
    departmentId: 'all'
  });

  const employees = useMemo(() => appRepository.getEmployees(), []);

  // Map of workItemId -> Set of related department IDs
  const workItemDeptMap = useMemo(() => {
    const map = new Map<number, Set<number>>();
    for (const item of workItems) {
      const deptIds = new Set<number>();

      // 1. Sender department ID
      if (item.correspondence.senderDepartmentId) {
        deptIds.add(item.correspondence.senderDepartmentId);
      }

      // 2. Receiver employee department
      const receiver = employees.find(e => e.id === item.receiverId);
      if (receiver?.departmentId) {
        deptIds.add(receiver.departmentId);
      }

      // 3. Routes associated with correspondence
      const routes = appRepository.getRoutesForCorr(item.corrId);
      for (const r of routes) {
        if (r.toDepartmentId) deptIds.add(r.toDepartmentId);
        if (r.fromDepartmentNameAr) {
          const matched = departments.find(d => d.nameAr === r.fromDepartmentNameAr);
          if (matched) deptIds.add(matched.id);
        }
        if (r.toDepartmentNameAr) {
          const matched = departments.find(d => d.nameAr === r.toDepartmentNameAr);
          if (matched) deptIds.add(matched.id);
        }
      }

      // 4. Sender department name matching
      if (item.correspondence.senderDepartmentNameAr) {
        const matched = departments.find(d => d.nameAr === item.correspondence.senderDepartmentNameAr);
        if (matched) deptIds.add(matched.id);
      }

      map.set(item.id, deptIds);
    }
    return map;
  }, [workItems, employees, departments]);

  // Total items affiliated with each department for filter badges
  const departmentItemCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const d of departments) counts[d.id] = 0;
    for (const item of workItems) {
      const depts = workItemDeptMap.get(item.id);
      if (depts) {
        for (const deptId of depts) {
          counts[deptId] = (counts[deptId] || 0) + 1;
        }
      }
    }
    return counts;
  }, [departments, workItems, workItemDeptMap]);

  // Real-time Scoped Work Items
  const filteredWorkItems = useMemo(() => {
    return workItems.filter(item => {
      // 1. Department Filter
      if (filters.departmentId !== 'all') {
        const selectedDeptId = Number(filters.departmentId);
        const depts = workItemDeptMap.get(item.id);
        if (!depts || !depts.has(selectedDeptId)) {
          return false;
        }
      }

      // 2. Date Range Filter
      const rawDate = item.receiveDate || item.correspondence.registerDate || item.correspondence.deliveryDate;
      if (rawDate) {
        const itemDate = rawDate.substring(0, 10);
        if (filters.startDate && itemDate < filters.startDate) {
          return false;
        }
        if (filters.endDate && itemDate > filters.endDate) {
          return false;
        }
      }

      return true;
    });
  }, [workItems, filters, workItemDeptMap]);

  // Reset all filters handler
  const handleResetFilters = () => {
    setFilters({
      datePreset: 'all',
      startDate: '',
      endDate: '',
      departmentId: 'all'
    });
    toast.info(
      isAr ? 'تمت استعادة النطاق الكامل لكافة المعاملات والإدارات' : 'Filters reset to show all transactions and departments',
      {
        titleAr: 'إعادة ضبط الفلاتر',
        titleEn: 'Filters Reset',
        duration: 2000
      }
    );
  };

  // Derived metrics dynamically scoped to filteredWorkItems
  const totalCount = filteredWorkItems.length;
  const completedCount = filteredWorkItems.filter(w => w.status === WorkItemStatus.Completed).length;
  const inProgressCount = filteredWorkItems.filter(w => w.status === WorkItemStatus.InProgress).length;
  const newCount = filteredWorkItems.filter(w => (w.status === WorkItemStatus.New || !w.isRead) && w.status !== WorkItemStatus.Completed).length;
  const pendingReplyCount = filteredWorkItems.filter(
    w =>
      w.status === WorkItemStatus.PendingReply ||
      (w.correspondence.expectedResponseDate && !w.correspondence.isReplied && w.status !== WorkItemStatus.Completed)
  ).length;
  const archivedCount = filteredWorkItems.filter(w => w.status === WorkItemStatus.Archived).length;
  const urgentCount = filteredWorkItems.filter(w => w.correspondence.priorityLevel >= PriorityLevel.Urgent).length;
  const slaPendingCount = filteredWorkItems.filter(
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

  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [printTimestamp, setPrintTimestamp] = useState<Date>(() => new Date());
  const [isPrintPreview, setIsPrintPreview] = useState(false);

  // Formatted date & time strings
  const formatPrintTimestamp = (date: Date) => {
    try {
      return new Intl.DateTimeFormat(isAr ? 'ar-SA' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(date);
    } catch {
      return date.toLocaleString();
    }
  };

  const formatIsoTimestamp = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    const s = pad(date.getSeconds());
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
  };

  const reportRefCode = useMemo(() => {
    const y = printTimestamp.getFullYear();
    const m = String(printTimestamp.getMonth() + 1).padStart(2, '0');
    const d = String(printTimestamp.getDate()).padStart(2, '0');
    const code = printTimestamp.getTime().toString().slice(-4);
    return `LF-RPT-SLA-${y}${m}${d}-${code}`;
  }, [printTimestamp]);

  // Handle Print Action
  const handlePrint = (previewOnly: boolean = false) => {
    const now = new Date();
    setPrintTimestamp(now);
    if (previewOnly) {
      setIsPrintPreview(prev => {
        const nextState = !prev;
        toast.info(
          nextState
            ? isAr
              ? 'تم تفعيل وضع المعاينة الطباعية مع الترويسة والختم الزمني'
              : 'Print preview mode activated with official header and timestamp'
            : isAr
            ? 'تم إغلاق وضع المعاينة الطباعية والعودة للوحة التفاعلية'
            : 'Print preview closed',
          {
            titleAr: 'معاينة الطباعة',
            titleEn: 'Print Preview',
            duration: 2500
          }
        );
        return nextState;
      });
      return;
    }

    toast.info(
      isAr
        ? 'جاري تجهيز لوحة المتابعة للطباعة بتنسيق ورقي رسمي...'
        : 'Preparing follow-up dashboard for official printing...',
      {
        titleAr: 'طباعة لوحة المتابعة',
        titleEn: 'Print Dashboard',
        duration: 2000
      }
    );

    // Short timeout to ensure DOM updates and timestamp are committed before printing
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Export handlers
  const handleExportCsv = () => {
    try {
      setIsExportingCsv(true);
      const metrics = {
        totalCount,
        completedCount,
        inProgressCount,
        newCount,
        pendingReplyCount,
        archivedCount,
        urgentCount,
        slaPendingCount,
        completionRate
      };
      const { filename } = exportFollowUpReportCsv(
        filteredWorkItems,
        departments,
        metrics,
        statusDistributionData,
        locale
      );
      toast.success(
        isAr
          ? `تم تصدير ملف بيانات المتابعة (${filename}) بنجاح`
          : `Dashboard data successfully exported as CSV (${filename})`,
        {
          titleAr: 'تصدير ملف CSV',
          titleEn: 'CSV Export Completed',
          messageEn: `File ${filename} downloaded to your device`
        }
      );
    } catch (error) {
      console.error('Failed to export CSV:', error);
      toast.error(
        isAr ? 'فشل تصدير ملف CSV، يرجى المحاولة مرة أخرى' : 'Failed to export CSV file, please try again',
        {
          titleAr: 'خطأ في التصدير',
          titleEn: 'Export Error'
        }
      );
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const metrics = {
        totalCount,
        completedCount,
        inProgressCount,
        newCount,
        pendingReplyCount,
        archivedCount,
        urgentCount,
        slaPendingCount,
        completionRate
      };
      const { filename } = await exportFollowUpReportPdf(
        filteredWorkItems,
        departments,
        metrics,
        statusDistributionData,
        locale
      );
      toast.success(
        isAr
          ? `تم إنشاء وتنزيل تقرير المتابعة الرسمي (${filename}) بنجاح`
          : `Official PDF follow-up report (${filename}) generated successfully`,
        {
          titleAr: 'تصدير تقرير PDF',
          titleEn: 'PDF Report Generated',
          messageEn: `Executive report ${filename} downloaded to your device`
        }
      );
    } catch (error) {
      console.error('Failed to generate PDF report:', error);
      toast.error(
        isAr ? 'تعذر توليد تقرير PDF، يرجى إعادة المحاولة' : 'Failed to generate PDF report, please try again',
        {
          titleAr: 'خطأ في التقرير',
          titleEn: 'PDF Generation Error'
        }
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div
      id="dashboard-view-container"
      className={`flex-1 overflow-y-auto p-6 space-y-6 select-none transition-all duration-200 ${
        isPrintPreview
          ? 'bg-slate-100 dark:bg-slate-900/90 text-slate-900 max-w-6xl mx-auto shadow-2xl rounded-3xl my-4 p-8 border-2 border-emerald-500/40'
          : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100'
      } print:p-0 print:m-0 print:overflow-visible print:bg-white print:text-black print:space-y-4`}
    >
      {/* Official Printer-Friendly Header - Shown when printing or in print preview */}
      <div
        id="dashboard-print-header"
        className={`${
          isPrintPreview
            ? 'block bg-white text-slate-900 border-2 border-slate-300 rounded-2xl p-6 shadow-sm mb-6'
            : 'hidden print:block mb-6 print:p-0 print:border-b-2 print:border-slate-800 print:pb-4'
        }`}
      >
        {/* Institutional Top Bar */}
        <div className="flex items-center justify-between border-b-2 border-slate-900/90 pb-4 mb-4">
          {/* Kingdom Emblem & Entity Details */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white flex flex-col items-center justify-center font-bold shadow-xs p-1 shrink-0">
              <span className="text-[9px] font-mono tracking-tighter uppercase font-bold">KSA</span>
              <Building className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-950 uppercase tracking-wide">
                {isAr ? 'المملكة العربية السعودية' : 'Kingdom of Saudi Arabia'}
              </div>
              <div className="text-[11px] font-bold text-emerald-800">
                {isAr ? 'منظومة الاتصالات الإدارية الموحدة (LinkFlow Enterprise)' : 'Unified Administrative Communications Platform'}
              </div>
              <div className="text-[10px] text-slate-600 font-medium">
                {isAr ? 'الإدارة العامة للمتابعة ومراقبة مؤشرات الأداء (SLA Monitoring & Compliance)' : 'General Directorate for Performance & SLA Oversight'}
              </div>
            </div>
          </div>

          {/* Center Reference Code Badge */}
          <div className="text-center hidden sm:block">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-mono font-bold border border-slate-300 mb-1">
              <Activity className="w-3.5 h-3.5 text-emerald-700" />
              <span>{reportRefCode}</span>
            </div>
            <div className="text-xs font-black text-slate-900">
              {isAr ? 'وثيقة تقرير متابعة الأداء المعتمدة' : 'Certified SLA Performance Report'}
            </div>
          </div>

          {/* Digital Verification & Stamp Info */}
          <div className="flex items-center gap-3">
            <div className="text-end hidden md:block">
              <div className="text-[10px] text-slate-500 font-mono font-bold">
                {isAr ? 'الختم الأمني الرقمي' : 'Digital Security Seal'}
              </div>
              <div className="text-[10px] font-mono font-bold text-emerald-700">SHA256: 446-SLA-VERIFIED</div>
              <div className="text-[9px] text-slate-500">
                {isAr ? 'تصنيف: سري ومحمي إدارياً' : 'Classification: Official / Internal'}
              </div>
            </div>
            <div className="w-12 h-12 border border-slate-300 rounded-lg p-1 flex items-center justify-center bg-slate-50 shrink-0">
              <QrCode className="w-10 h-10 text-slate-800" />
            </div>
          </div>
        </div>

        {/* Document Title & Live Timestamp Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-slate-50 print:bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <h1 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>{isAr ? 'تقرير مؤشرات الأداء ومتابعة المراسلات الإدارية' : 'Executive Correspondence Follow-Up & SLA Analytics Report'}</span>
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              {isAr
                ? 'سجل تحليلي ورصد موثق لقيود الوارد والصادر، زمن الاستجابة، ومعدلات إنجاز الإدارات ومراحل المعالجة'
                : 'Analytical audit log of incoming/outgoing correspondence velocity, SLA compliance, and processing milestones'}
            </p>
          </div>

          {/* Exact Print Timestamp Display */}
          <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 shadow-2xs shrink-0">
            <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
            <div className="text-xs">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">
                {isAr ? 'تاريخ ووقت الطباعة والاعتماد:' : 'Current Print Timestamp:'}
              </span>
              <div className="font-bold text-slate-950 font-mono">
                {formatPrintTimestamp(printTimestamp)}
              </div>
            </div>
          </div>
        </div>

        {/* Executive Snapshot Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 block font-semibold">{isAr ? 'إجمالي المعاملات في النطاق:' : 'Scoped Volume:'}</span>
            <div className="font-mono font-black text-slate-900 text-sm mt-0.5">
              {totalCount} / {workItems.length} {isAr ? 'معاملة' : 'Items'}
            </div>
            <span className="text-[9px] text-emerald-700 font-bold">
              {totalCount === workItems.length ? (isAr ? 'تغطية شاملة 100%' : 'Full Coverage') : (isAr ? 'بيانات مصفاة ومطابقة' : 'Filtered Subset')}
            </span>
          </div>

          <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 block font-semibold">{isAr ? 'نسبة الإنجاز في النطاق:' : 'Resolution Rate:'}</span>
            <div className="font-mono font-black text-teal-700 text-sm mt-0.5">{completionRate}% ({completedCount} {isAr ? 'معاملة' : 'Items'})</div>
            <span className="text-[9px] text-teal-700 font-bold">{isAr ? 'مقفلة ومؤرشفة' : 'Completed & Closed'}</span>
          </div>

          <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 block font-semibold">{isAr ? 'النطاق الزمني:' : 'Date Scope:'}</span>
            <div className="font-mono font-bold text-slate-900 text-xs mt-0.5 truncate">
              {filters.startDate && filters.endDate
                ? `${filters.startDate} ~ ${filters.endDate}`
                : filters.datePreset !== 'all'
                ? (isAr ? 'فترة زمنية محددة' : 'Preset Period')
                : (isAr ? 'كافة الفترات المسجلة' : 'All Historical')}
            </div>
            <span className="text-[9px] text-slate-500 font-bold">{isAr ? 'سجلات حية' : 'Live Data'}</span>
          </div>

          <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 block font-semibold">{isAr ? 'الإدارة المشمولة:' : 'Department Scope:'}</span>
            <div className="font-mono font-bold text-slate-900 text-xs mt-0.5 truncate">
              {filters.departmentId === 'all'
                ? (isAr ? `كافة الإدارات (${departments.length})` : `All Departments (${departments.length})`)
                : departments.find(d => String(d.id) === filters.departmentId)?.nameAr || (isAr ? 'إدارة محددة' : 'Selected Dept')}
            </div>
            <span className="text-[9px] text-slate-500 font-bold">
              {filters.departmentId === 'all' ? (isAr ? 'تغطية مؤسسية' : 'Institutional') : (isAr ? 'مخصص' : 'Custom')}
            </span>
          </div>
        </div>
      </div>

      {/* Print Preview Mode Banner (Only displayed when preview is toggled on screen) */}
      {isPrintPreview && (
        <div
          id="print-preview-banner"
          className="bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 print:hidden"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                <span>{isAr ? 'وضع المعاينة الطباعية المعتمدة (Print Preview Mode)' : 'Print Preview Mode Active'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold font-mono">
                  {isAr ? 'تنسيق ورقي رسمي' : 'Official Paper Format'}
                </span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                {isAr
                  ? `الختم الزمني المعتمد للتقرير: ${formatPrintTimestamp(printTimestamp)}`
                  : `Certified Print Timestamp: ${formatPrintTimestamp(printTimestamp)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setPrintTimestamp(new Date())}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={isAr ? 'تحديث الختم الزمني للوقت الحالي' : 'Update timestamp to current time'}
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? 'تحديث الوقت' : 'Refresh Time'}</span>
            </button>

            <button
              id="btn-print-preview-now"
              onClick={() => handlePrint(false)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer active:scale-98"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'طباعة الآن (Print Now)' : 'Print Now'}</span>
            </button>

            <button
              onClick={() => setIsPrintPreview(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>{isAr ? 'إغلاق المعاينة' : 'Exit Preview'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Header with Administrative Export & Print Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4 print:hidden">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{isAr ? 'لوحة مؤشرات الأداء ومتابعة المراسلات (SLA Analytics)' : 'Executive Analytics & SLA Dashboard'}</span>
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
            {isAr
              ? 'رصد قيود الوارد والصادر، زمن الاستجابة، ومعدلات إنجاز الإدارات وتوثيق التقارير'
              : 'Operational KPIs, resolution velocity, departmental compliance, and documentation'}
          </p>
        </div>

        {/* Action Buttons: Export CSV, Export PDF, Print, & Print Preview */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-export-followup-csv"
            onClick={handleExportCsv}
            disabled={isExportingCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition shadow-2xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title={isAr ? 'تصدير بيانات المؤشرات وجرد المعاملات كملف CSV' : 'Export dashboard KPIs & inventory as CSV'}
          >
            {isExportingCsv ? (
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>{isAr ? 'تصدير (CSV)' : 'Export CSV'}</span>
          </button>

          <button
            id="btn-export-followup-pdf"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs hover:shadow-sm transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title={isAr ? 'توليد وتنزيل تقرير المتابعة الرسمي كملف PDF موثق' : 'Generate and download official certified PDF report'}
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <FileDown className="w-4 h-4 text-white" />
            )}
            <span>{isAr ? 'تقرير (PDF)' : 'Export PDF'}</span>
          </button>

          {/* New Print Button */}
          <button
            id="btn-print-followup-dashboard"
            onClick={() => handlePrint(false)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition shadow-2xs active:scale-[0.98] cursor-pointer"
            title={isAr ? 'طباعة لوحة المتابعة بتنسيق ورقي رسمي مع الترويسة والختم الزمني' : 'Print dashboard with official header and current timestamp'}
          >
            <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{isAr ? 'طباعة (Print)' : 'Print Dashboard'}</span>
          </button>

          {/* Print Preview Toggle */}
          <button
            id="btn-preview-print-followup"
            onClick={() => handlePrint(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition shadow-2xs active:scale-[0.98] cursor-pointer ${
              isPrintPreview
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-600 font-bold'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title={isAr ? 'معاينة التنسيق الطباعي والترويسة الرسمية على الشاشة' : 'Preview printer-friendly format on screen'}
          >
            {isPrintPreview ? (
              <EyeOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Eye className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            )}
            <span className="hidden sm:inline">{isAr ? 'معاينة التنسيق' : 'Preview'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Date-Range Picker and Department Filter Component */}
      <FollowUpFilterBar
        locale={locale}
        filters={filters}
        onFilterChange={setFilters}
        departments={departments}
        totalAvailableCount={workItems.length}
        filteredCount={filteredWorkItems.length}
        departmentItemCounts={departmentItemCounts}
        onReset={handleResetFilters}
      />

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

          {/* Quick Summary Pill & Card Export Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {isAr ? 'إجمالي المعاملات:' : 'Total Items:'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-mono font-bold text-xs">
              {totalCount} {isAr ? 'معاملة' : 'Correspondences'}
            </span>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />
            <button
              id="card-btn-export-csv"
              onClick={handleExportCsv}
              disabled={isExportingCsv}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
              title={isAr ? 'تصدير جدول التوزيع وجرد المعاملات كملف CSV' : 'Export distribution data as CSV'}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>CSV</span>
            </button>
            <button
              id="card-btn-export-pdf"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition cursor-pointer disabled:opacity-50"
              title={isAr ? 'تصدير التقرير الرسمي كملف PDF' : 'Export official report as PDF'}
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>PDF</span>
            </button>
            <button
              id="card-btn-print-followup"
              onClick={() => handlePrint(false)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer print:hidden"
              title={isAr ? 'طباعة لوحة المؤشرات' : 'Print dashboard'}
            >
              <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isAr ? 'طباعة' : 'Print'}</span>
            </button>
          </div>
        </div>

        {/* Recharts Bar Chart Area */}
        {totalCount === 0 ? (
          <div className="w-full h-72 sm:h-80 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <Activity className="w-8 h-8 text-slate-400" />
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'لا توجد معاملات مسجلة تطابق محددات الفلترة' : 'No correspondence records match selected filters'}
            </div>
            <p className="text-[11px] text-slate-500 max-w-sm">
              {isAr
                ? 'يرجى تجربة توسيع النطاق الزمني أو اختيار كافة الإدارات لعرض توزيع الحالات.'
                : 'Try expanding the date range or selecting all departments.'}
            </p>
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
            >
              {isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
            </button>
          </div>
        ) : (
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
        )}

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

      {/* Processing Milestones Vertical Step Timeline View */}
      <CorrespondenceProcessingTimeline
        locale={locale}
        workItems={filteredWorkItems}
        departments={departments}
        onOpenDetails={onOpenDetails}
      />

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>{isAr ? 'توزيع المعاملات حسب الإدارات المختصة' : 'Department Volume Distribution'}</span>
            </h2>
            {filters.departmentId !== 'all' && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {isAr ? 'نطاق محدد' : 'Filtered Dept'}
              </span>
            )}
          </div>
          <div className="space-y-3">
            {departments.map((d) => {
              const count = filteredWorkItems.filter(item => {
                const depts = workItemDeptMap.get(item.id);
                return depts?.has(d.id);
              }).length;
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              const isSelected = String(d.id) === filters.departmentId;

              return (
                <div
                  key={d.id}
                  onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      departmentId: prev.departmentId === String(d.id) ? 'all' : String(d.id)
                    }));
                  }}
                  className={`space-y-1 p-2 rounded-xl transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                  title={isAr ? 'انقر للتصفية السريعة لهذه الإدارة' : 'Click to filter by this department'}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className={`truncate max-w-[280px] ${isSelected ? 'text-emerald-700 dark:text-emerald-300 font-bold' : ''}`}>
                      {isAr ? d.nameAr : d.nameEn}
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">
                      {count} {isAr ? 'معاملات' : 'items'} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSelected ? 'bg-emerald-600' : 'bg-slate-700 dark:bg-slate-300'
                      }`}
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

      {/* Official Printer-Friendly Footer - Shown when printing or in print preview */}
      <div
        id="dashboard-print-footer"
        className={`${
          isPrintPreview
            ? 'flex flex-col sm:flex-row items-center justify-between gap-3 mt-8 pt-4 border-t-2 border-slate-300 text-xs text-slate-600 bg-white p-4 rounded-xl shadow-xs'
            : 'hidden print:flex flex-col sm:flex-row items-center justify-between gap-2 mt-8 pt-4 border-t-2 border-slate-900 text-[10px] text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            {isAr
              ? 'وثيقة رسمية مستخرجة آلياً من منظومة الاتصالات الإدارية LinkFlow Enterprise ولا تتطلب توقيعاً يدوياً لاحتوائها على الختم الرقمي.'
              : 'Official computer-generated record from LinkFlow Enterprise. Does not require physical signature.'}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
          <span>{reportRefCode}</span>
          <span>•</span>
          <span>{formatIsoTimestamp(printTimestamp)}</span>
          <span>•</span>
          <span>{isAr ? 'صفحة 1 من 1' : 'Page 1 of 1'}</span>
        </div>
      </div>
    </div>
  );
};
