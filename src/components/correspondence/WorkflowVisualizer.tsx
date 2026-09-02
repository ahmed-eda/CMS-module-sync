import React, { useState, useMemo } from 'react';
import {
  GitBranch,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Send,
  Building,
  User,
  Calendar,
  Layers,
  ShieldCheck,
  FolderArchive,
  ArrowRight,
  ArrowDown,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  ChevronRight,
  FileCheck2,
  Download,
  SlidersHorizontal,
  Workflow
} from 'lucide-react';
import { Correspondence, RouteItem, WorkItem } from '../../types/domain';
import { toast } from '../notifications/ToastContext';
import { RouteKind, WorkItemStatus, SecurityLevel, PriorityLevel } from '../../types/enums';
import { WorkflowLegend } from './WorkflowLegend';
import { WorkflowSummaryStats } from './WorkflowSummaryStats';
import { D3WorkflowFlowchart } from './D3WorkflowFlowchart';
import { Play, RefreshCw, Activity } from 'lucide-react';

export interface WorkflowStep {
  id: string;
  stageNumber: number;
  stageCode: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  departmentAr: string;
  departmentEn: string;
  assigneeAr?: string;
  assigneeEn?: string;
  status: 'COMPLETED' | 'ACTIVE' | 'PENDING' | 'REJECTED';
  timestamp?: string;
  instruction?: string;
  duration?: string;
  slaDeadline?: string;
  isCurrent: boolean;
  isActualRoute?: boolean;
  routeKind?: RouteKind;
  iconType: 'register' | 'stamp' | 'route' | 'action' | 'approval' | 'archive';
}

interface WorkflowVisualizerProps {
  correspondence: Correspondence;
  routes?: RouteItem[];
  locale: 'ar' | 'en';
  onSelectRoute?: (routeId: number) => void;
  className?: string;
}

export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({
  correspondence,
  routes = [],
  locale,
  onSelectRoute,
  className = ''
}) => {
  const isAr = locale === 'ar';
  const [layoutMode, setLayoutMode] = useState<'horizontal' | 'vertical'>('horizontal');
  const [renderEngine, setRenderEngine] = useState<'d3' | 'cards'>('d3');
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState<boolean>(true);
  const [simulatedOverrides, setSimulatedOverrides] = useState<Record<string, WorkflowStep['status']>>({});

  // Synthesize comprehensive lifecycle steps from Correspondence + Route History + Target SLA
  const rawSteps: WorkflowStep[] = useMemo(() => {
    const list: WorkflowStep[] = [];
    let stepCount = 1;

    // --- STEP 1: Registration / Creation ---
    const isIncoming = correspondence.corrType === 1;
    list.push({
      id: 'step-creation',
      stageNumber: stepCount++,
      stageCode: 'REG-01',
      titleAr: isIncoming ? 'القيد والتسجيل الوارد' : 'إنشاء وإعداد الصادر',
      titleEn: isIncoming ? 'Incoming Registration' : 'Outgoing Drafting',
      subtitleAr: isIncoming
        ? `استلام من: ${correspondence.siteNameAr || 'الجهة الخارجية'}`
        : `إعداد: ${correspondence.senderDepartmentNameAr || 'الإدارة الطالبة'}`,
      subtitleEn: isIncoming
        ? `Received from: ${correspondence.siteNameAr || 'External Entity'}`
        : `Drafted by: ${correspondence.senderDepartmentNameAr || 'Department'}`,
      departmentAr: correspondence.senderDepartmentNameAr || correspondence.siteNameAr || 'مركز الاتصالات الإدارية',
      departmentEn: correspondence.siteNameAr || 'Administrative Communications',
      assigneeAr: isIncoming ? 'موظف الاتصالات الإدارية' : 'المعد الإداري',
      assigneeEn: isIncoming ? 'Archivist' : 'Author',
      status: 'COMPLETED',
      timestamp: correspondence.registerDate,
      duration: '10 دقيقة',
      isCurrent: false,
      iconType: 'register'
    });

    // --- STEP 2: Digital Stamping & Verification ---
    list.push({
      id: 'step-verification',
      stageNumber: stepCount++,
      stageCode: 'VER-02',
      titleAr: 'التحقق وتوليد الباركود الرقمي',
      titleEn: 'Digital Stamping & Barcode',
      subtitleAr: `باركود نظامي: ${correspondence.barcode || 'MOF-1446-AUTO'}`,
      subtitleEn: `Barcode: ${correspondence.barcode || 'MOF-1446-AUTO'}`,
      departmentAr: 'منظومة التكامل والرقمنة',
      departmentEn: 'Digital Integration Hub',
      assigneeAr: 'النظام الآلي (GSB Engine)',
      assigneeEn: 'Automated System',
      status: 'COMPLETED',
      timestamp: new Date(new Date(correspondence.registerDate).getTime() + 5 * 60000).toISOString(),
      duration: 'فوري',
      isCurrent: false,
      iconType: 'stamp'
    });

    // --- STEP 3..N: Traversed Concrete Route History ---
    if (routes.length > 0) {
      routes.forEach((r, idx) => {
        const isLastRoute = idx === routes.length - 1;
        const isCompletedRoute = !isLastRoute || correspondence.status === WorkItemStatus.Completed;
        const isRejected = r.routeKind === RouteKind.Return;

        let statusVal: 'COMPLETED' | 'ACTIVE' | 'PENDING' | 'REJECTED' = 'COMPLETED';
        if (isRejected) {
          statusVal = 'REJECTED';
        } else if (isLastRoute && correspondence.status !== WorkItemStatus.Completed) {
          statusVal = 'ACTIVE';
        }

        list.push({
          id: `route-${r.id}`,
          stageNumber: stepCount++,
          stageCode: `ROU-0${idx + 1}`,
          titleAr: `إحالة إدارية: ${r.toDepartmentNameAr}`,
          titleEn: `Routing: ${r.toDepartmentNameAr}`,
          subtitleAr: r.instructionAr,
          subtitleEn: r.instructionAr,
          departmentAr: r.toDepartmentNameAr,
          departmentEn: r.toDepartmentNameAr,
          assigneeAr: r.toEmployeeNameAr || 'مدير الإدارة',
          assigneeEn: r.toEmployeeNameAr || 'Director',
          status: statusVal,
          timestamp: r.routeDate,
          instruction: r.instructionAr,
          slaDeadline: r.actionRequiredDate,
          isCurrent: isLastRoute && correspondence.status !== WorkItemStatus.Completed,
          isActualRoute: true,
          routeKind: r.routeKind,
          iconType: 'route'
        });
      });
    } else {
      // Default initial routing if no explicit route items yet
      list.push({
        id: 'step-initial-route',
        stageNumber: stepCount++,
        stageCode: 'ROU-01',
        titleAr: 'التوجيه والإحالة الأولية',
        titleEn: 'Initial Action Routing',
        subtitleAr: 'توجيه المعاملة للإدارة المختصة لاتخاذ اللازم',
        subtitleEn: 'Forwarding to competent department for action',
        departmentAr: 'الإدارة المعنية بالإجراء',
        departmentEn: 'Action Department',
        status: correspondence.status === WorkItemStatus.Completed ? 'COMPLETED' : 'ACTIVE',
        timestamp: correspondence.registerDate,
        isCurrent: correspondence.status !== WorkItemStatus.Completed,
        iconType: 'route'
      });
    }

    // --- STEP: Action & Processing / Study ---
    const isProcessed = correspondence.status === WorkItemStatus.Completed;
    list.push({
      id: 'step-action-study',
      stageNumber: stepCount++,
      stageCode: 'ACT-03',
      titleAr: 'إعداد الإفادة والدراسة الفنية',
      titleEn: 'Technical Study & Formulation',
      subtitleAr: isProcessed ? 'تم استكمال إعداد الإفادة والمذكرات' : 'قيد المعالجة من قبل الفريق الفني المختص',
      subtitleEn: isProcessed ? 'Study and responses finalized' : 'Under active technical formulation',
      departmentAr: 'فريق العمل المختص',
      departmentEn: 'Specialized Working Group',
      status: isProcessed ? 'COMPLETED' : correspondence.status === WorkItemStatus.InProgress ? 'ACTIVE' : 'PENDING',
      isCurrent: !isProcessed && correspondence.status === WorkItemStatus.InProgress,
      slaDeadline: correspondence.expectedResponseDate,
      iconType: 'action'
    });

    // --- STEP: Executive Decision & Signature ---
    list.push({
      id: 'step-approval',
      stageNumber: stepCount++,
      stageCode: 'APP-04',
      titleAr: 'الاعتماد والتوقيع الرسمي',
      titleEn: 'Executive Approval & Signature',
      subtitleAr: correspondence.digitalSignature ? 'تم التوقيع الإلكتروني المعتمد' : 'بانتظار توقيع صاحب الصلاحية',
      subtitleEn: correspondence.digitalSignature ? 'Digitally Signed & Validated' : 'Awaiting authorized signature',
      departmentAr: 'مكتب صاحب الصلاحية',
      departmentEn: 'Office of Authorized Signatory',
      assigneeAr: correspondence.digitalSignature?.signedBy || 'صاحب الصلاحية',
      assigneeEn: correspondence.digitalSignature?.signedBy || 'Executive Approver',
      status: correspondence.digitalSignature || isProcessed ? 'COMPLETED' : 'PENDING',
      isCurrent: false,
      iconType: 'approval'
    });

    // --- STEP: Digital Archival & Closing ---
    const isArchived = correspondence.status === WorkItemStatus.Completed || correspondence.fileNameAr;
    list.push({
      id: 'step-archive',
      stageNumber: stepCount++,
      stageCode: 'ARC-05',
      titleAr: 'الحفظ بالأرشيف الإلكتروني والإقفال',
      titleEn: 'Electronic Archiving & Closure',
      subtitleAr: correspondence.fileNameAr ? `تم الحفظ في: ${correspondence.fileNameAr}` : 'بانتظار تصنيف الملف النهائي',
      subtitleEn: correspondence.fileNameAr ? `Archived in: ${correspondence.fileNameAr}` : 'Awaiting file classification',
      departmentAr: 'مركز الوثائق والمحفوظات',
      departmentEn: 'National Records & Archives',
      status: isProcessed ? 'COMPLETED' : 'PENDING',
      isCurrent: false,
      iconType: 'archive'
    });

    return list;
  }, [correspondence, routes]);

  // Merge simulated status overrides
  const steps: WorkflowStep[] = useMemo(() => {
    return rawSteps.map(s => {
      if (simulatedOverrides[s.id]) {
        const newStatus = simulatedOverrides[s.id];
        return {
          ...s,
          status: newStatus,
          isCurrent: newStatus === 'ACTIVE'
        };
      }
      return s;
    });
  }, [rawSteps, simulatedOverrides]);

  // Advance to next stage with D3 transition
  const handleAdvanceStage = () => {
    const activeIdx = steps.findIndex(s => s.status === 'ACTIVE');
    if (activeIdx !== -1) {
      const activeStepId = steps[activeIdx].id;
      const nextStep = steps[activeIdx + 1];

      if (nextStep) {
        setSimulatedOverrides(prev => ({
          ...prev,
          [activeStepId]: 'COMPLETED',
          [nextStep.id]: 'ACTIVE'
        }));
        setSelectedStepId(nextStep.id);

        toast.info(
          isAr
            ? `تم بنجاح انتقال المعاملة إلى مرحلة [${nextStep.titleAr}] مع تحريك عقد D3`
            : `Workflow advanced to stage [${nextStep.titleEn}] with D3 node animation`,
          {
            titleAr: 'تحديث حالة مسار المعاملة',
            titleEn: 'Workflow Stage Advanced',
            corrNumber: correspondence.corrNumber
          }
        );
      } else {
        // All completed!
        setSimulatedOverrides(prev => ({
          ...prev,
          [activeStepId]: 'COMPLETED'
        }));

        toast.success(
          isAr
            ? `تم استكمال وإنجاز كافة مراحل دورة حياة المعاملة بنسبة 100%`
            : `All lifecycle stages completed successfully (100%)`,
          {
            titleAr: 'اكتمال دورة العمل',
            titleEn: 'Workflow Completed',
            corrNumber: correspondence.corrNumber
          }
        );
      }
    } else {
      // If none active (e.g. all pending or all completed), reset or activate first pending
      const firstPending = steps.find(s => s.status === 'PENDING');
      if (firstPending) {
        setSimulatedOverrides(prev => ({
          ...prev,
          [firstPending.id]: 'ACTIVE'
        }));
        setSelectedStepId(firstPending.id);

        toast.info(
          isAr
            ? `تم تفعيل مرحلة [${firstPending.titleAr}] في مخطط D3`
            : `Activated stage [${firstPending.titleEn}] in D3 flowchart`,
          {
            titleAr: 'تفعيل المرحلة',
            titleEn: 'Stage Activated',
            corrNumber: correspondence.corrNumber
          }
        );
      } else {
        // Reset overrides to start fresh
        setSimulatedOverrides({});
        toast.info(
          isAr ? 'تمت إعادة ضبط المخطط إلى الحالة الأصلية' : 'Flowchart state reset to original',
          {
            titleAr: 'إعادة ضبط المحاكاة',
            titleEn: 'Simulation Reset',
            duration: 2000
          }
        );
      }
    }
  };

  const handleResetSimulation = () => {
    setSimulatedOverrides({});
    toast.info(
      isAr ? 'تمت استعادة الحالة الفعلية لمسار المعاملة' : 'Restored live workflow state',
      {
        titleAr: 'إعادة ضبط المسار',
        titleEn: 'State Reset',
        duration: 2000
      }
    );
  };

  // Set default selected step to current or last active
  const activeStep = useMemo(() => {
    if (selectedStepId) {
      return steps.find(s => s.id === selectedStepId) || steps[0];
    }
    return steps.find(s => s.isCurrent) || steps.find(s => s.status === 'ACTIVE') || steps[0];
  }, [steps, selectedStepId]);

  const completedCount = steps.filter(s => s.status === 'COMPLETED').length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const getStepIcon = (iconType: WorkflowStep['iconType'], status: WorkflowStep['status']) => {
    if (status === 'COMPLETED') {
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    }
    if (status === 'REJECTED') {
      return <AlertTriangle className="w-5 h-5 text-rose-500" />;
    }
    if (status === 'ACTIVE') {
      return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
    }

    switch (iconType) {
      case 'register':
        return <FileText className="w-4 h-4 text-slate-400" />;
      case 'stamp':
        return <ShieldCheck className="w-4 h-4 text-slate-400" />;
      case 'route':
        return <Send className="w-4 h-4 text-slate-400" />;
      case 'action':
        return <Workflow className="w-4 h-4 text-slate-400" />;
      case 'approval':
        return <FileCheck2 className="w-4 h-4 text-slate-400" />;
      case 'archive':
        return <FolderArchive className="w-4 h-4 text-slate-400" />;
      default:
        return <GitBranch className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>{isAr ? 'مكتمل ومنجز' : 'Completed'}</span>
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
            <span>{isAr ? 'المرحلة النشطة الحالية' : 'Current Active'}</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            {isAr ? 'معادة / مرفوضة' : 'Returned'}
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 border-dashed">
            {isAr ? 'مرحلة مستقبلية معلقة' : 'Pending / Next'}
          </span>
        );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Stats Component: Total Time Spent & Estimated Completion */}
      <WorkflowSummaryStats
        correspondence={correspondence}
        routes={routes}
        locale={locale}
      />

      {/* Main Flowchart Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        {/* Top Banner: Metrics & Control Bar */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Left Side: Title & Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                {isAr ? 'مخطط سير دورة المعاملة الحية' : 'Correspondence Workflow Lifecycle'}
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                {correspondence.corrNumber}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>
                {isAr
                  ? `تم إنجاز ${completedCount} من أصل ${steps.length} مراحل نظامية`
                  : `Completed ${completedCount} of ${steps.length} lifecycle stages`}
              </span>
              <div className="w-24 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden inline-block align-middle">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: View Controls (Engine, Simulation, Layout, Zoom, Details Toggle) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* D3 Simulation Trigger */}
          <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={handleAdvanceStage}
              className="px-2.5 py-1 rounded-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
              title={isAr ? 'محاكاة انتقال الحالة بالـ D3' : 'Simulate D3 Status Transition'}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isAr ? 'انتقال الحالة (D3)' : 'Advance Stage (D3)'}</span>
            </button>
            {Object.keys(simulatedOverrides).length > 0 && (
              <button
                onClick={handleResetSimulation}
                className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded cursor-pointer"
                title={isAr ? 'إعادة ضبط الحالة الأصلية' : 'Reset Status'}
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Engine Mode Toggle (D3 vs Classic Cards) */}
          <div className="bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setRenderEngine('d3')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                renderEngine === 'd3'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title={isAr ? 'محرك D3 التفاعلي المتحرك' : 'D3 Interactive Transition Engine'}
            >
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>{isAr ? 'محرك D3' : 'D3 Flow'}</span>
            </button>
            <button
              onClick={() => setRenderEngine('cards')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                renderEngine === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title={isAr ? 'عرض البطاقات' : 'Cards View'}
            >
              <Layers className="w-3 h-3" />
              <span>{isAr ? 'بطاقات' : 'Cards'}</span>
            </button>
          </div>

          {/* Layout Mode Toggle */}
          <div className="bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setLayoutMode('horizontal')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                layoutMode === 'horizontal'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title={isAr ? 'عرض أفقي تتابعي' : 'Horizontal Flow'}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'أفقي' : 'Horizontal'}</span>
            </button>
            <button
              onClick={() => setLayoutMode('vertical')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                layoutMode === 'vertical'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title={isAr ? 'عرض رأسي شجري' : 'Vertical Flow'}
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'رأسي' : 'Vertical'}</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.1))}
              className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded cursor-pointer"
              title={isAr ? 'تصغير' : 'Zoom Out'}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 px-1 font-bold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
              className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded cursor-pointer"
              title={isAr ? 'تكبير' : 'Zoom In'}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded cursor-pointer"
              title={isAr ? 'إعادة ضبط' : 'Reset Zoom'}
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Details Drawer Toggle */}
          <button
            onClick={() => setShowDetailsDrawer(!showDetailsDrawer)}
            className={`p-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              showDetailsDrawer
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
            title={isAr ? 'لوحة تفاصيل المرحلة' : 'Stage Inspector Drawer'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isAr ? 'تفاصيل المرحلة' : 'Details'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage Body */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-[420px] overflow-hidden bg-slate-50/40 dark:bg-slate-950/30">
        {/* Visualizer Flowchart Canvas Area */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative min-h-[380px]">
          {renderEngine === 'd3' ? (
            /* D3 VECTOR TRANSITION CANVAS */
            <D3WorkflowFlowchart
              steps={steps}
              selectedStepId={activeStep?.id || null}
              onSelectStep={stepId => setSelectedStepId(stepId)}
              layoutMode={layoutMode}
              zoomLevel={zoomLevel}
              locale={locale}
            />
          ) : (
            <div
              className="transition-transform duration-200 ease-out origin-center w-full max-w-full"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {layoutMode === 'horizontal' ? (
              /* HORIZONTAL SVG FLOWCHART */
              <div className="relative py-8 px-4 flex items-center justify-start sm:justify-center overflow-x-auto min-w-max gap-3 sm:gap-6">
                {/* Background Connecting SVG Line */}
                <svg
                  className="absolute top-1/2 left-0 right-0 -translate-y-1/2 w-full h-8 pointer-events-none z-0"
                  style={{ minWidth: `${steps.length * 200}px` }}
                >
                  <defs>
                    <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="70%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#94a3b8" />
                    </linearGradient>
                  </defs>
                  <line
                    x1="50"
                    y1="16"
                    x2={steps.length * 210}
                    y2="16"
                    stroke="url(#flowGrad)"
                    strokeWidth="3"
                    strokeDasharray="6 6"
                  />
                </svg>

                {/* Nodes Grid */}
                {steps.map((step, idx) => {
                  const isSelected = activeStep?.id === step.id;
                  const isCompleted = step.status === 'COMPLETED';
                  const isActive = step.status === 'ACTIVE';
                  const isPending = step.status === 'PENDING';

                  return (
                    <div
                      key={step.id}
                      onClick={() => setSelectedStepId(step.id)}
                      className={`relative z-10 w-52 bg-white dark:bg-slate-900 rounded-2xl p-4 border-2 transition-all duration-200 cursor-pointer text-right flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 ring-4 ring-emerald-500/15 scale-105'
                          : isCompleted
                          ? 'border-emerald-500/50 hover:border-emerald-500 shadow-sm'
                          : isActive
                          ? 'border-blue-500 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/20 animate-pulse'
                          : 'border-slate-200 dark:border-slate-800 opacity-65 hover:opacity-100 hover:border-slate-400'
                      }`}
                    >
                      {/* Step Header Badge & Stage Number */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold ${
                            isCompleted
                              ? 'bg-emerald-500 text-white'
                              : isActive
                              ? 'bg-blue-600 text-white animate-bounce'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {step.stageNumber}
                        </span>

                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[9px] text-slate-400 uppercase">
                            {step.stageCode}
                          </span>
                          {getStepIcon(step.iconType, step.status)}
                        </div>
                      </div>

                      {/* Title & Department */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mb-0.5">
                          {isAr ? step.titleAr : step.titleEn}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{isAr ? step.departmentAr : step.departmentEn}</span>
                        </p>
                      </div>

                      {/* Subtitle / Instruction */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-tight">
                          {isAr ? step.subtitleAr : step.subtitleEn}
                        </p>
                      </div>

                      {/* Footer Badge & Status */}
                      <div className="mt-3 flex items-center justify-between gap-1">
                        <span className="text-[9px] font-mono text-slate-400">
                          {step.timestamp
                            ? new Date(step.timestamp).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')
                            : isAr
                            ? 'معلق'
                            : 'Pending'}
                        </span>
                        {getStatusBadge(step.status)}
                      </div>

                      {/* Direction Arrow between nodes */}
                      {idx < steps.length - 1 && (
                        <div className={`hidden sm:flex absolute top-1/2 ${isAr ? '-left-4' : '-right-4'} -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md items-center justify-center text-slate-400`}>
                          <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* VERTICAL TIMELINE FLOWCHART */
              <div className="relative py-4 px-2 max-w-2xl mx-auto space-y-4 before:absolute before:inset-0 before:left-6 sm:before:left-1/2 before:-translate-x-1/2 before:w-1 before:bg-gradient-to-b before:from-emerald-500 before:via-blue-500 before:to-slate-300 dark:before:to-slate-800 before:z-0">
                {steps.map((step, idx) => {
                  const isSelected = activeStep?.id === step.id;
                  const isCompleted = step.status === 'COMPLETED';
                  const isActive = step.status === 'ACTIVE';

                  return (
                    <div
                      key={step.id}
                      onClick={() => setSelectedStepId(step.id)}
                      className={`relative z-10 flex items-start gap-4 p-4 rounded-2xl transition cursor-pointer border-2 ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-xl ring-4 ring-emerald-500/10'
                          : isCompleted
                          ? 'bg-white dark:bg-slate-900 border-emerald-500/40 hover:border-emerald-500'
                          : isActive
                          ? 'bg-white dark:bg-slate-900 border-blue-500 shadow-lg ring-2 ring-blue-500/20'
                          : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {/* Stage Node Marker Circle */}
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-mono font-bold text-xs shadow-md border ${
                          isCompleted
                            ? 'bg-emerald-600 text-white border-emerald-400'
                            : isActive
                            ? 'bg-blue-600 text-white border-blue-400 animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {step.stageNumber}
                      </div>

                      {/* Content Body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {isAr ? step.titleAr : step.titleEn}
                            </h4>
                            <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                              {step.stageCode}
                            </span>
                          </div>
                          {getStatusBadge(step.status)}
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2">
                          {isAr ? step.subtitleAr : step.subtitleEn}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>{isAr ? step.departmentAr : step.departmentEn}</span>
                          </span>
                          {step.assigneeAr && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{isAr ? step.assigneeAr : step.assigneeEn}</span>
                            </span>
                          )}
                          {step.timestamp && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{new Date(step.timestamp).toLocaleString(isAr ? 'ar-SA' : 'en-US')}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          )}
        </div>

        {/* Right Side: Step Inspector Detail Drawer */}
        {showDetailsDrawer && activeStep && (
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between overflow-y-auto animate-in fade-in duration-200">
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold font-mono text-xs">
                    {activeStep.stageCode}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {isAr ? 'بيانات المرحلة المحددة' : 'Selected Stage Data'}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Step {activeStep.stageNumber} of {steps.length}
                    </span>
                  </div>
                </div>
                {getStatusBadge(activeStep.status)}
              </div>

              {/* Step Title & Subtitle */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                  {isAr ? 'عنوان المرحلة' : 'Stage Title'}
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {isAr ? activeStep.titleAr : activeStep.titleEn}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {isAr ? activeStep.subtitleAr : activeStep.subtitleEn}
                </p>
              </div>

              {/* Key Attributes Grid */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-white dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" />
                    <span>{isAr ? 'الإدارة المسؤولة:' : 'Department:'}</span>
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {isAr ? activeStep.departmentAr : activeStep.departmentEn}
                  </span>
                </div>

                {activeStep.assigneeAr && (
                  <div className="p-2.5 bg-white dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>{isAr ? 'المختص / المعني:' : 'Assignee:'}</span>
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {isAr ? activeStep.assigneeAr : activeStep.assigneeEn}
                    </span>
                  </div>
                )}

                {activeStep.timestamp && (
                  <div className="p-2.5 bg-white dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{isAr ? 'وقت الحركة:' : 'Timestamp:'}</span>
                    </span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200 text-[11px]">
                      {new Date(activeStep.timestamp).toLocaleString(isAr ? 'ar-SA' : 'en-US')}
                    </span>
                  </div>
                )}

                {activeStep.slaDeadline && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-amber-800 dark:text-amber-300">
                    <span className="text-[11px] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isAr ? 'مهلة الرد المحددة (SLA):' : 'SLA Due Date:'}</span>
                    </span>
                    <span className="font-mono font-bold text-[11px]">
                      {new Date(activeStep.slaDeadline).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                    </span>
                  </div>
                )}
              </div>

              {/* Concrete Instruction if route */}
              {activeStep.instruction && (
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase font-mono block">
                    {isAr ? 'نص الأمر الإداري والتأشيرة:' : 'Administrative Directive:'}
                  </span>
                  <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed font-medium">
                    {activeStep.instruction}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Action Button */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono text-center mb-2">
                {isAr ? 'معرّف المعاملة الرقمي: ' : 'ID: '}
                <span className="font-bold">{correspondence.barcode || correspondence.corrNumber}</span>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* Workflow Status & Icons Descriptive Legend */}
        <WorkflowLegend locale={locale} defaultExpanded={false} />
      </div>
    </div>
  );
};
