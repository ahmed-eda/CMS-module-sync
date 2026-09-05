import React, { useState, useMemo } from 'react';
import {
  FileText,
  FileCheck2,
  Send,
  Building2,
  Clock,
  CheckCircle2,
  Activity,
  FileSignature,
  Archive,
  ChevronDown,
  ChevronUp,
  Search,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Calendar,
  Layers,
  User,
  Hash,
  Sparkles,
  Info,
  Check,
  Copy
} from 'lucide-react';
import { WorkItem, Department } from '../../types/domain';
import { WorkItemStatus, RouteKind, SecurityLevel, PriorityLevel, DeliveryMethod } from '../../types/enums';
import { appRepository } from '../../services/store';
import { toast } from '../notifications/ToastContext';

export interface ProcessingMilestone {
  stepNumber: number;
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  completedAt?: string;
  targetSlaHours: number;
  elapsedTimeString?: string;
  actorNameAr: string;
  actorRoleAr: string;
  departmentAr: string;
  descriptionAr: string;
  descriptionEn: string;
  artifacts: {
    labelAr: string;
    labelEn: string;
    value: string;
    iconType?: 'barcode' | 'ref' | 'signature' | 'folder' | 'route';
    highlight?: boolean;
  }[];
  auditNotesAr?: string[];
  slaStatusTextAr: string;
  slaStatusTextEn: string;
  isSlaCompliant: boolean;
}

interface CorrespondenceProcessingTimelineProps {
  locale: 'ar' | 'en';
  workItems: WorkItem[];
  departments: Department[];
  selectedCorrId?: number;
  onOpenDetails?: (item: WorkItem) => void;
}

export const CorrespondenceProcessingTimeline: React.FC<CorrespondenceProcessingTimelineProps> = ({
  locale,
  workItems,
  departments,
  selectedCorrId: initialSelectedCorrId,
  onOpenDetails
}) => {
  const isAr = locale === 'ar';

  // Selection & Search State
  const [selectedItemId, setSelectedItemId] = useState<number>(() => {
    if (initialSelectedCorrId) {
      const match = workItems.find(w => w.correspondence.id === initialSelectedCorrId);
      if (match) return match.id;
    }
    return workItems[0]?.id || 1;
  });

  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'live' | 'benchmark'>('live');
  const [expandedMilestoneIds, setExpandedMilestoneIds] = useState<Record<string, boolean>>({
    'step-1': true,
    'step-2': true,
    'step-3': true
  });
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Active selected work item
  const selectedWorkItem = useMemo(() => {
    return workItems.find(w => w.id === selectedItemId) || workItems[0];
  }, [workItems, selectedItemId]);

  const corr = selectedWorkItem?.correspondence;
  const routes = useMemo(() => {
    if (!corr) return [];
    return appRepository.getRoutesForCorr(corr.id);
  }, [corr]);

  // Format date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return isAr ? 'غير محدد' : 'N/A';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat(isAr ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);
    } catch {
      return isoString;
    }
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
    toast.info(isAr ? `تم نسخ ${label} إلى الحافظة` : `Copied ${label} to clipboard`, {
      duration: 2000
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedMilestoneIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Build the 5 Milestones dynamically based on current correspondence status, routes, signatures, and archive state
  const milestones: ProcessingMilestone[] = useMemo(() => {
    if (!corr) return [];

    const isCompleted = corr.status === WorkItemStatus.Completed || corr.status === WorkItemStatus.Archived;
    const isArchived = corr.status === WorkItemStatus.Archived;
    const hasSignature = !!corr.digitalSignature || isCompleted;
    const hasRoutes = routes.length > 0;
    const isPendingReply = corr.status === WorkItemStatus.PendingReply;
    const isInProgress = corr.status === WorkItemStatus.InProgress || corr.status === WorkItemStatus.Read || isPendingReply;

    // Milestone 1: Registration & Intake (Always completed for any registered correspondence)
    const m1: ProcessingMilestone = {
      stepNumber: 1,
      id: 'step-1',
      titleAr: 'قيد وتسجيل المعاملة والمسح الضوئي (OCR)',
      titleEn: 'Ingestion, Metadata Indexing & OCR Registration',
      subtitleAr: 'استلام المعاملة، إصدار الباركود والرقم الموحد، وأرشفة أصول المرفقات',
      subtitleEn: 'Intake capture, barcode issuance, classification, and OCR scanning',
      status: 'COMPLETED',
      completedAt: corr.registerDate || corr.deliveryDate,
      targetSlaHours: 2,
      elapsedTimeString: isAr ? '15 دقيقة (فوري)' : '15 mins (Instant)',
      actorNameAr: 'أ. خالد بن ناصر الدوسري',
      actorRoleAr: 'مدير مركز الوثائق والاتصالات الإدارية',
      departmentAr: 'مركز الوثائق والاتصالات الإدارية الموحدة',
      descriptionAr:
        corr.corrType === 1
          ? `تم قيد الخطاب الوارد من (${corr.siteNameAr || 'جهة خارجية'})، والتحقق الأمني من سلامة الأختام والمرفقات (${corr.documents.length} ملفات)، وتوليد الباركود الرقمي والتصنيف الأمني (${corr.securityLevel === SecurityLevel.Confidential ? 'سري' : corr.securityLevel === SecurityLevel.TopConfidential ? 'سري للغاية' : 'عادي'}).`
          : `تم إنشاء وتسجيل مسودة كتاب الصادر الرسمي، وفهرسة البيانات الوصفية، وإصدار الباركود التتبعي الموحد.`,
      descriptionEn: `Correspondence captured, security classification stamped, and barcode issued.`,
      artifacts: [
        {
          labelAr: 'رقم القيد الموحد',
          labelEn: 'Correspondence No',
          value: corr.corrNumber,
          iconType: 'ref',
          highlight: true
        },
        {
          labelAr: 'الباركود الرقمي المشفر',
          labelEn: 'Encrypted Barcode',
          value: corr.barcode || '4460048201',
          iconType: 'barcode'
        },
        {
          labelAr: 'قناة التسليم والربط',
          labelEn: 'Delivery Channel',
          value: corr.deliveredBy || (corr.deliveryMethod === DeliveryMethod.ElectronicSystem ? 'منظومة التكامل الحكومي (GSB)' : 'مناولة باليد')
        },
        {
          labelAr: 'الوثائق والمرفقات الأصلية',
          labelEn: 'Indexed Documents',
          value: `${corr.documents.length} ملفات مؤرشفة رقمياً`
        }
      ],
      auditNotesAr: [
        'فحص الفيروسات والتوقيع الإلكتروني لمرفقات PDF ناجح 100%',
        'فهرسة الكلمات المفتاحية باللغة العربية عبر الذكاء الاصطناعي (OCR Searchable)'
      ],
      slaStatusTextAr: 'تم الإنجاز ضمن المستهدف الأولي (خلال 15 دقيقة)',
      slaStatusTextEn: 'Completed within SLA benchmark (15 mins)',
      isSlaCompliant: true
    };

    // Milestone 2: Triage & Administrative Routing
    const m2Status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' = hasRoutes ? 'COMPLETED' : 'IN_PROGRESS';
    const firstRoute = routes[0];
    const m2: ProcessingMilestone = {
      stepNumber: 2,
      id: 'step-2',
      titleAr: 'الفحص والفرز والإحالة الإدارية والتوجيه',
      titleEn: 'Triage, Departmental Routing & Referral',
      subtitleAr: 'مراجعة مكتب الاتصالات/القيادة، وتوجيه المعاملة للإدارة المختصة مع التكليف',
      subtitleEn: 'Triage by Central Registry & routing to assigned executive department',
      status: m2Status,
      completedAt: firstRoute ? firstRoute.routeDate : undefined,
      targetSlaHours: 4,
      elapsedTimeString: hasRoutes ? (isAr ? '1 ساعة و 20 دقيقة' : '1 hr 20 mins') : (isAr ? 'جاري المعالجة' : 'In triage'),
      actorNameAr: firstRoute ? firstRoute.fromEmployeeNameAr : 'مكتب الاتصالات الإدارية المركزية',
      actorRoleAr: 'أمين سر لجنة التوجيه والفرز',
      departmentAr: firstRoute ? firstRoute.fromDepartmentNameAr : 'الاتصالات الإدارية',
      descriptionAr: firstRoute
        ? `تمت إحالة المعاملة إلى (${firstRoute.toDepartmentNameAr}) موجهة إلى (${firstRoute.toEmployeeNameAr || 'مدير الإدارة'}) بتوجيه: "${firstRoute.instructionAr}".`
        : `المعاملة في مرحلة التدقيق والفرز لدى مكتب الاتصالات لتحديد الإدارة المختصة وصياغة التأشيرة والتكليف.`,
      descriptionEn: firstRoute
        ? `Routed to ${firstRoute.toDepartmentNameAr} with directive: "${firstRoute.instructionAr}".`
        : `Awaiting triage and assignment directive.`,
      artifacts: [
        {
          labelAr: 'نوع الإحالة والتكليف',
          labelEn: 'Route Purpose',
          value: firstRoute
            ? firstRoute.routeKind === RouteKind.ActionNeeded
              ? 'لاتخاذ اللازم والرد'
              : firstRoute.routeKind === RouteKind.ForStudy
              ? 'للدراسة وإبداء الرأي'
              : firstRoute.routeKind === RouteKind.ForApproval
              ? 'للاعتماد والتوقيع'
              : 'إحالة وتوجيه'
            : 'بانتظار التأشيرة',
          iconType: 'route',
          highlight: true
        },
        {
          labelAr: 'الإدارة المحال إليها',
          labelEn: 'Target Department',
          value: firstRoute ? firstRoute.toDepartmentNameAr : 'الإدارة العامة للتحول الرقمي'
        },
        {
          labelAr: 'الموظف المكلف',
          labelEn: 'Assigned Specialist',
          value: firstRoute?.toEmployeeNameAr || 'م. أحمد بن سالم الغامدي'
        },
        {
          labelAr: 'المهلة النظامية المقررة (SLA)',
          labelEn: 'Prescribed SLA Window',
          value: corr.expectedResponseDate ? `حتى ${formatDate(corr.expectedResponseDate)}` : 'خلال 48 ساعة'
        }
      ],
      auditNotesAr: [
        'تم إرسال إشعار فوري وتنبيه SMS للموظف المكلف ومدير الإدارة',
        'تثبيت قيود الصلاحيات الأمنية طبقاً لدرجة سرية المعاملة'
      ],
      slaStatusTextAr: hasRoutes ? 'إحالة منجزة بامتياز (1.3 ساعة)' : 'قيد التدقيق والتوجيه الإداري',
      slaStatusTextEn: hasRoutes ? 'Routing completed within SLA target' : 'Pending routing execution',
      isSlaCompliant: true
    };

    // Milestone 3: Technical Study & Response Drafting
    let m3Status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' = 'PENDING';
    if (isCompleted || hasSignature || routes.some(r => r.routeKind === RouteKind.Reply || r.status === 'EXECUTED')) {
      m3Status = 'COMPLETED';
    } else if (hasRoutes || isInProgress) {
      m3Status = 'IN_PROGRESS';
    }

    const m3: ProcessingMilestone = {
      stepNumber: 3,
      id: 'step-3',
      titleAr: 'الدراسة الفنية والمعالجة وصياغة الإفادة الرسمية',
      titleEn: 'Technical Review, Study & Response Drafting',
      subtitleAr: 'فحص المسوغات النظامية، التنسيق الداخلي، وإعداد مذكرة العرض ومسودة الخطاب',
      subtitleEn: 'In-depth review, cross-department study, and response memo drafting',
      status: m3Status,
      completedAt: m3Status === 'COMPLETED' ? (corr.deliveryDate ? corr.deliveryDate : corr.registerDate) : undefined,
      targetSlaHours: 24,
      elapsedTimeString:
        m3Status === 'COMPLETED'
          ? isAr
            ? '14 ساعة (ضمن المهلة)'
            : '14 hrs (Compliant)'
          : isAr
          ? 'قيد الإجراء (منقضي 18 ساعة)'
          : 'Underway (18h elapsed)',
      actorNameAr: 'م. أحمد بن سالم الغامدي',
      actorRoleAr: 'رئيس قسم الحلول السحابية والبنية الرقمية',
      departmentAr: 'الإدارة العامة للتحول الرقمي وتقنية المعلومات',
      descriptionAr:
        m3Status === 'COMPLETED'
          ? `تم إنجاز الدراسة الفنية للمتطلبات الواردة، وإرفاق مذكرات العرض اللازمة، وصياغة مسودة الخطاب الجوابي وفق النماذج الحكومية المعتمدة.`
          : m3Status === 'IN_PROGRESS'
          ? `يعكف الفريق الفني على مراجعة المتطلبات وإعداد مذكرة العرض الفنية وتدقيق الاشتراطات النظامية.`
          : `بانتظار استلام المعاملة في صندوق دراسة الإدارة المختصة.`,
      descriptionEn:
        m3Status === 'COMPLETED'
          ? `Technical study concluded and official response memo formulated.`
          : `Technical examination and memo preparation in progress.`,
      artifacts: [
        {
          labelAr: 'مذكرات العرض الداخلي',
          labelEn: 'Internal Presentation Notes',
          value: corr.presentationNotes && corr.presentationNotes.length > 0
            ? `${corr.presentationNotes.length} مذكرات عرض معتمدة`
            : 'مذكرة عرض فنية رقم 1446/NOTE/12',
          highlight: true
        },
        {
          labelAr: 'المسوغات واللوائح المستند عليها',
          labelEn: 'Regulatory References',
          value: 'ضوابط هيئة الحكومة الرقمية + لائحة المشتريات الحكومية'
        },
        {
          labelAr: 'حالة مسودة الرد',
          labelEn: 'Response Draft Status',
          value: m3Status === 'COMPLETED' ? 'مسودة نهائية جاهزة للاعتماد' : 'مسودة قيد المراجعة الفنية'
        }
      ],
      auditNotesAr: [
        'تم التحقق من مطابقة الاعتمادات المالية المتاحة بالمشروع',
        'إضافة ملاحظات وتوصيات التعديل في سجل المتابعة الفني'
      ],
      slaStatusTextAr: m3Status === 'COMPLETED' ? 'مكتملة بنجاح ضمن المهلة (14 ساعة من أصل 24)' : 'قيد الدراسة النشطة (متبقي 6 ساعات على مستهدف المرحلة)',
      slaStatusTextEn: m3Status === 'COMPLETED' ? 'Concluded within SLA window' : 'Under active study (6h SLA remaining)',
      isSlaCompliant: true
    };

    // Milestone 4: Review, Endorsement & Digital Signature
    let m4Status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' = 'PENDING';
    if (hasSignature || isCompleted) {
      m4Status = 'COMPLETED';
    } else if (m3Status === 'COMPLETED' || isPendingReply) {
      m4Status = 'IN_PROGRESS';
    }

    const sigData = corr.digitalSignature;
    const m4: ProcessingMilestone = {
      stepNumber: 4,
      id: 'step-4',
      titleAr: 'المراجعة والاعتماد والتوقيع الرقمي المعتمد',
      titleEn: 'Administrative Review, Approval & Digital Signature',
      subtitleAr: 'تدقيق القيادة العليا، الختم الإلكتروني، وتطبيق التوقيع المشفر (SHA-256)',
      subtitleEn: 'Executive endorsement and certified digital signing via NCDC',
      status: m4Status,
      completedAt: sigData?.signedAt || (m4Status === 'COMPLETED' ? '2026-08-28T14:15:00Z' : undefined),
      targetSlaHours: 8,
      elapsedTimeString:
        m4Status === 'COMPLETED'
          ? isAr
            ? '3 ساعات و 10 دقائق'
            : '3 hrs 10 mins'
          : m4Status === 'IN_PROGRESS'
          ? isAr
            ? 'بانتظار توقيع صاحب الصلاحية'
            : 'Awaiting executive signature'
          : isAr
          ? 'بانتظار اكتمال الدراسة'
          : 'Pending drafting completion',
      actorNameAr: sigData?.signedBy || 'م. فيصل بن سلطان الحربي',
      actorRoleAr: sigData?.jobTitle || 'مدير عام التحول الرقمي وتقنية المعلومات',
      departmentAr: 'الإدارة العامة للتحول الرقمي وتقنية المعلومات',
      descriptionAr:
        m4Status === 'COMPLETED'
          ? `تم اعتماد الخطاب الرسمي والتأشير بالصلاحية، وتطبيق الختم الرقمي المشفر بواسطة شهادة التصديق الوطني (NCDC) برمز استجابة سريعة (QR) مشفر.`
          : m4Status === 'IN_PROGRESS'
          ? `المعاملة محالة لصاحب الصلاحية في صندوق التوقيع والاعتماد الإلكتروني.`
          : `المرحلة مجدولة بعد الانتهاء من الصياغة الفنية.`,
      descriptionEn:
        m4Status === 'COMPLETED'
          ? `Formally endorsed and digitally signed with SHA-256 certificate.`
          : `Pending authorized signatory review and token stamping.`,
      artifacts: [
        {
          labelAr: 'حالة التوقيع الإلكتروني',
          labelEn: 'Signature Verification',
          value: m4Status === 'COMPLETED' ? 'موقعة رقمياً بشهادة حكومية معتمدة' : 'بانتظار توقيع المفوض',
          iconType: 'signature',
          highlight: true
        },
        {
          labelAr: 'بصمة الشهادة المشفرة',
          labelEn: 'Certificate Hash',
          value: sigData?.certificateHash || 'SHA256: 7C9F-446A-1102-E8B9-90DF'
        },
        {
          labelAr: 'رمز التحقق الفوري (QR Code)',
          labelEn: 'Verification QR Token',
          value: sigData?.qrData || `VERIFY-LINKFLOW-${corr.corrNumber}-SECURE`
        }
      ],
      auditNotesAr: [
        'فحص صلاحية الشهادة عبر مزود الثقة الوطني (NCDC CRL/OCSP) بنجاح',
        'توليد الختم الزمني المشفر (RFC 3161 Timestamp) للتوثيق القضائي'
      ],
      slaStatusTextAr: m4Status === 'COMPLETED' ? 'تم الاعتماد والتوقيع بزمن قياسي (3.2 ساعة)' : 'في صندوق الاعتماد والتوقيع',
      slaStatusTextEn: m4Status === 'COMPLETED' ? 'Certified digital signature sealed' : 'Awaiting executive signature',
      isSlaCompliant: true
    };

    // Milestone 5: Official Dispatch, Long-Term Archival & SLA Closure
    let m5Status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' = 'PENDING';
    if (isCompleted || isArchived) {
      m5Status = 'COMPLETED';
    } else if (m4Status === 'COMPLETED') {
      m5Status = 'IN_PROGRESS';
    }

    const m5: ProcessingMilestone = {
      stepNumber: 5,
      id: 'step-5',
      titleAr: 'التصدير الرسمي والأرشفة الإلكترونية وإغلاق المعاملة',
      titleEn: 'Official Dispatch, Electronic Archiving & Resolution',
      subtitleAr: 'إرسال الرد عبر منظومة التكامل (GSB)، الحفظ في الملف المخصص، وإغلاق مؤشر الـ SLA',
      subtitleEn: 'Transmission via GSB hub, permanent archival, and SLA indicator closure',
      status: m5Status,
      completedAt: m5Status === 'COMPLETED' ? corr.registerDate : undefined,
      targetSlaHours: 4,
      elapsedTimeString:
        m5Status === 'COMPLETED'
          ? isAr
            ? '40 دقيقة'
            : '40 mins'
          : m5Status === 'IN_PROGRESS'
          ? isAr
            ? 'جاري تجهيز التصدير والإيداع'
            : 'Preparing dispatch & archive'
          : isAr
          ? 'المرحلة الختامية'
          : 'Final stage',
      actorNameAr: 'أ. خالد بن ناصر الدوسري',
      actorRoleAr: 'مدير مركز الوثائق والاتصالات الإدارية الموحدة',
      departmentAr: 'مركز الوثائق والاتصالات الإدارية الموحدة',
      descriptionAr:
        m5Status === 'COMPLETED'
          ? `تم تصدير الرد الرسمي عبر منظومة التكامل الحكومي (GSB)، واستلام إشعار الإيداع والتوثيق، وحفظ المعاملة ومرفقاتها في (${corr.fileNameAr || 'ملف الأرشيف الرقمي المعتمد'}) وإغلاق مؤشر الـ SLA بنجاح.`
          : m5Status === 'IN_PROGRESS'
          ? `بانتظار تأكيد التصدير الرسمي عبر GSB أو الإيداع النهائي في ملف الحفظ الرقمي.`
          : `المرحلة النهائية لدورة حياة المعاملة.`,
      descriptionEn:
        m5Status === 'COMPLETED'
          ? `Dispatched via GSB, archived in permanent repository, and SLA metric finalized.`
          : `Pending final dispatch transmission and archival indexing.`,
      artifacts: [
        {
          labelAr: 'ملف الحفظ والأرشيف الرقمي',
          labelEn: 'Permanent Filing Folder',
          value: corr.fileNameAr || 'FIL-446-TECH-01 (مشاريع التحول الرقمي والبنية السحابية)',
          iconType: 'folder',
          highlight: true
        },
        {
          labelAr: 'إيصال الإرسال الحكومي (GSB)',
          labelEn: 'GSB Delivery Receipt',
          value: m5Status === 'COMPLETED' ? 'GSB-ACK-1446-99210-CONFIRMED' : 'بانتظار حزمة الإرسال'
        },
        {
          labelAr: 'مؤشر الامتثال لـ SLA',
          labelEn: 'SLA Resolution Compliance',
          value: m5Status === 'COMPLETED' ? 'مكتملة ومحققة لنسبة التزام 100%' : 'قيد المتابعة الزمنية'
        }
      ],
      auditNotesAr: [
        'تشفير وحفظ نسخة رقمية طبق الأصل في خزانة السجلات الدائمة',
        'توليد تقرير سجل المسار التوثيقي الكامل (Full Traceability Audit Log)'
      ],
      slaStatusTextAr: m5Status === 'COMPLETED' ? 'أغلقت المعاملة بنجاح تام ضمن المهلة' : 'بانتظار استكمال الإجراءات الختامية',
      slaStatusTextEn: m5Status === 'COMPLETED' ? 'Formally closed and archived' : 'Pending final dispatch closure',
      isSlaCompliant: true
    };

    return [m1, m2, m3, m4, m5];
  }, [corr, routes, isAr]);

  // Overall milestone progress calculations
  const completedMilestonesCount = milestones.filter(m => m.status === 'COMPLETED').length;
  const inProgressMilestone = milestones.find(m => m.status === 'IN_PROGRESS');
  const progressPercentage = Math.round((completedMilestonesCount / milestones.length) * 100);

  // Filter correspondences for quick selector
  const filteredWorkItems = useMemo(() => {
    if (!searchFilter.trim()) return workItems.slice(0, 10);
    const q = searchFilter.toLowerCase().trim();
    return workItems.filter(
      w =>
        w.correspondence.corrNumber.toLowerCase().includes(q) ||
        w.correspondence.title.toLowerCase().includes(q) ||
        (w.correspondence.siteNameAr && w.correspondence.siteNameAr.toLowerCase().includes(q))
    );
  }, [workItems, searchFilter]);

  return (
    <div id="processing-milestones-timeline-section" className="space-y-6 print:space-y-4 print:break-inside-avoid">
      {/* Section Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 print:border-slate-300 print:shadow-none print:break-inside-avoid">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/50">
                <Activity className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>{isAr ? 'مسار مراحل معالجة المراسلات (Processing Milestones Timeline)' : 'Correspondence Processing Milestones Timeline'}</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
                    {isAr ? '5 مراحل قياسية' : '5 Standard Steps'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr
                    ? 'رصد إجرائي حي وتتبع عمودي لمراحل قيد وتوجيه ودراسة واعتماد وتصدير المعاملة مع قياس الـ SLA'
                    : 'End-to-end vertical step milestone tracker for correspondence processing velocity & compliance'}
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs font-semibold self-start md:self-auto print:hidden">
            <button
              id="btn-timeline-tab-live"
              onClick={() => setActiveTab('live')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'live'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{isAr ? 'التتبع الحي للمعاملة' : 'Live Item Milestones'}</span>
            </button>
            <button
              id="btn-timeline-tab-benchmark"
              onClick={() => setActiveTab('benchmark')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'benchmark'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isAr ? 'الدليل الإجرائي المعياري (SLA Matrix)' : 'Standard SLA Benchmark Matrix'}</span>
            </button>
          </div>
        </div>

        {/* Correspondence Selector & Quick Stage Switcher */}
        {activeTab === 'live' && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3 print:hidden">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-xl">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="input-timeline-corr-search"
                    type="text"
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    placeholder={isAr ? 'بحث برقم المعاملة أو الموضوع أو الجهة...' : 'Search correspondence by number, subject, entity...'}
                    className="w-full ps-9 pe-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Dropdown Selector */}
                <select
                  id="select-timeline-correspondence"
                  value={selectedWorkItem ? selectedItemId : ''}
                  onChange={e => setSelectedItemId(Number(e.target.value))}
                  disabled={workItems.length === 0}
                  className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono disabled:opacity-50"
                >
                  {workItems.length === 0 ? (
                    <option value="">{isAr ? 'لا توجد معاملات مطابقة' : 'No matching items'}</option>
                  ) : (
                    workItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.correspondence.corrNumber} - {item.correspondence.title.substring(0, 36)}...
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Action Button: Open Full Details Modal if provided */}
              {onOpenDetails && selectedWorkItem && (
                <button
                  id="btn-timeline-open-details"
                  onClick={() => onOpenDetails(selectedWorkItem)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition shrink-0 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isAr ? 'عرض ملف المعاملة الكامل' : 'Open Full Correspondence Dossier'}</span>
                </button>
              )}
            </div>

            {/* Quick Sample Selector Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] text-slate-400 dark:text-slate-400 shrink-0 font-medium">
                {isAr ? 'معاملات نموذجية:' : 'Quick Select:'}
              </span>
              {filteredWorkItems.slice(0, 5).map(item => {
                const isSelected = item.id === selectedItemId;
                const corrNumber = item.correspondence.corrNumber;
                let statusBadge = isAr ? 'قيد المعالجة' : 'In Progress';
                if (item.status === WorkItemStatus.Completed) statusBadge = isAr ? 'مكتملة' : 'Completed';
                else if (item.status === WorkItemStatus.New) statusBadge = isAr ? 'جديدة' : 'New';

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                    }`}
                  >
                    <span className="font-mono">{corrNumber}</span>
                    <span className={`text-[9px] px-1 rounded ${isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                      {statusBadge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Timeline Display */}
      {activeTab === 'live' && corr ? (
        <div className="space-y-6">
          {/* Active Correspondence Progress Overview Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Info Column */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-xs border border-emerald-200/60 dark:border-emerald-800/40">
                    {corr.corrNumber}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-400">|</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {corr.siteNameAr || (corr.corrType === 1 ? 'جهة خارجية' : 'صادر إداري')}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-400">|</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(corr.registerDate)}</span>
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {corr.title}
                </h3>
              </div>

              {/* Progress Bar & Stage Status */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-[280px] lg:min-w-[340px]">
                <div className="w-full space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">
                      {isAr
                        ? `إنجاز المسار: ${completedMilestonesCount} من 5 مراحل`
                        : `Milestone Progress: ${completedMilestonesCount} of 5 Steps`}
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {progressPercentage}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {inProgressMilestone
                        ? isAr
                          ? `المرحلة النشطة حالياً: ${inProgressMilestone.stepNumber}`
                          : `Active Stage: Step ${inProgressMilestone.stepNumber}`
                        : isAr
                        ? 'مكتملة بالكامل'
                        : 'All Steps Finalized'}
                    </span>
                    <span className="font-semibold text-teal-600 dark:text-teal-400">
                      {corr.expectedResponseDate ? (isAr ? 'ضمن المهلة المحددة' : 'On Track') : (isAr ? 'إجراء نظامي' : 'Standard SLA')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vertical Step Component */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs">
            <div className="relative">
              {/* Stepped Milestones List */}
              <div className="space-y-8">
                {milestones.map((step, idx) => {
                  const isLast = idx === milestones.length - 1;
                  const isExpanded = !!expandedMilestoneIds[step.id];
                  const isCompleted = step.status === 'COMPLETED';
                  const isInProgress = step.status === 'IN_PROGRESS';
                  const isPending = step.status === 'PENDING';

                  // Milestone Icon selection
                  const renderStepIcon = () => {
                    if (isCompleted) {
                      return <CheckCircle2 className="w-5 h-5 text-white" />;
                    }
                    if (isInProgress) {
                      return <Clock className="w-5 h-5 text-white animate-spin-slow" />;
                    }
                    return (
                      <span className="text-sm font-mono font-bold text-slate-400 dark:text-slate-500">
                        {step.stepNumber}
                      </span>
                    );
                  };

                  return (
                    <div
                      key={step.id}
                      id={`timeline-step-row-${step.stepNumber}`}
                      className="relative flex items-start gap-4 sm:gap-6 group"
                    >
                      {/* Vertical Connecting Line */}
                      {!isLast && (
                        <div
                          className={`absolute start-5 sm:start-6 top-11 bottom-[-32px] w-[3px] -translate-x-1/2 transition-colors ${
                            isCompleted
                              ? 'bg-emerald-500 dark:bg-emerald-400'
                              : isInProgress
                              ? 'bg-gradient-to-b from-amber-500 to-slate-200 dark:to-slate-800'
                              : 'bg-slate-200 dark:bg-slate-800'
                          }`}
                        />
                      )}

                      {/* Step Node Circle */}
                      <div className="relative z-10 shrink-0">
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                            isCompleted
                              ? 'bg-emerald-600 dark:bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/60 shadow-xs'
                              : isInProgress
                              ? 'bg-amber-500 dark:bg-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-950/70 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-400'
                          }`}
                        >
                          {renderStepIcon()}
                        </div>

                        {/* Ping Ring for In-Progress */}
                        {isInProgress && (
                          <div className="absolute -inset-1 rounded-2xl bg-amber-400/30 animate-ping pointer-events-none" />
                        )}
                      </div>

                      {/* Step Card Body */}
                      <div
                        className={`flex-1 rounded-2xl border transition-all duration-200 p-4 sm:p-5 ${
                          isInProgress
                            ? 'bg-amber-50/25 dark:bg-amber-950/15 border-amber-300 dark:border-amber-800/80 shadow-xs'
                            : isCompleted
                            ? 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
                            : 'bg-slate-50/30 dark:bg-slate-900/30 border-slate-200/70 dark:border-slate-800/60 opacity-80'
                        }`}
                      >
                        {/* Step Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase font-mono tracking-wide ${
                                  isCompleted
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                    : isInProgress
                                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 animate-pulse'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {isAr ? `المرحلة ${step.stepNumber}` : `Milestone ${step.stepNumber}`}
                              </span>

                              {/* Status Badge */}
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                  isCompleted
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                    : isInProgress
                                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {isCompleted && <Check className="w-3 h-3" />}
                                {isInProgress && <Activity className="w-3 h-3 animate-pulse" />}
                                <span>
                                  {isCompleted
                                    ? isAr ? 'مكتملة ومحققة' : 'Completed'
                                    : isInProgress
                                    ? isAr ? 'قيد المعالجة حالياً (المرحلة النشطة)' : 'In-Progress (Active Milestone)'
                                    : isAr ? 'مرحلة لاحقة (قيد الانتظار)' : 'Pending Upcoming Step'}
                                </span>
                              </span>
                            </div>

                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                              {isAr ? step.titleAr : step.titleEn}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {isAr ? step.subtitleAr : step.subtitleEn}
                            </p>
                          </div>

                          {/* Timestamp / Elapsed SLA indicator */}
                          <div className="flex items-center sm:flex-col sm:items-end gap-2 text-xs font-mono shrink-0">
                            {step.completedAt ? (
                              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>{formatDate(step.completedAt)}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{isAr ? 'المهلة المستهدفة:' : 'Target Window:'} {step.targetSlaHours}h</span>
                              </div>
                            )}

                            {step.elapsedTimeString && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-400">
                                {isAr ? 'الزمن المستغرق: ' : 'Duration: '}
                                {step.elapsedTimeString}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Step Narrative */}
                        <div className="pt-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {isAr ? step.descriptionAr : step.descriptionEn}
                        </div>

                        {/* Metadata & Artifacts Grid */}
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* Responsible Actor */}
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2">
                            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <div className="min-w-0 text-xs">
                              <span className="text-[10px] text-slate-400 dark:text-slate-400 block">
                                {isAr ? 'المسؤول / الجهة المنفذة:' : 'Responsible Officer & Entity:'}
                              </span>
                              <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {step.actorNameAr}
                              </p>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                                {step.actorRoleAr} - {step.departmentAr}
                              </span>
                            </div>
                          </div>

                          {/* Primary Artifact */}
                          {step.artifacts[0] && (
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-start justify-between gap-2">
                              <div className="min-w-0 text-xs">
                                <span className="text-[10px] text-slate-400 dark:text-slate-400 block">
                                  {isAr ? step.artifacts[0].labelAr : step.artifacts[0].labelEn}:
                                </span>
                                <p className="font-bold text-slate-900 dark:text-slate-100 truncate font-mono">
                                  {step.artifacts[0].value}
                                </p>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                                  {step.slaStatusTextAr}
                                </span>
                              </div>
                              <button
                                onClick={() => handleCopy(step.artifacts[0].value, step.artifacts[0].labelAr)}
                                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                                title={isAr ? 'نسخ القيمة' : 'Copy value'}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Collapsible Inspection Panel */}
                        <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 print:hidden">
                          <button
                            onClick={() => toggleExpand(step.id)}
                            className="flex items-center justify-between w-full text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 font-medium">
                              <Info className="w-3.5 h-3.5 text-emerald-600" />
                              <span>
                                {isExpanded
                                  ? isAr ? 'إخفاء تفاصيل الفحص والتدقيق الإداري' : 'Hide Detailed Audit Artifacts'
                                  : isAr ? 'عرض تفاصيل الفحص والوثائق المرتبطة بالمرحلة' : 'Show Detailed Audit Artifacts'}
                              </span>
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-3 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-2.5 animate-fadeIn">
                              {/* Secondary Artifacts List */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                {step.artifacts.slice(1).map((art, aIdx) => (
                                  <div
                                    key={aIdx}
                                    className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                                  >
                                    <span className="text-slate-500 dark:text-slate-400">
                                      {isAr ? art.labelAr : art.labelEn}:
                                    </span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono text-end truncate max-w-[200px]">
                                      {art.value}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* Audit Trace Notes */}
                              {step.auditNotesAr && step.auditNotesAr.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                                    {isAr ? 'ملاحظات التحقق والامتثال الرقابي:' : 'Compliance Audit Notes:'}
                                  </span>
                                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                                    {step.auditNotesAr.map((note, nIdx) => (
                                      <li key={nIdx}>{note}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'live' && !corr ? (
        /* Empty State when no correspondence matches filters */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Activity className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {isAr ? 'لا توجد معاملات مسجلة ضمن الفلاتر ونطاق البحث الحالي' : 'No correspondence records match current filter criteria'}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isAr
              ? 'يرجى تجربة توسيع نطاق التاريخ أو اختيار كافة الإدارات لعرض محطات مسار المعالجة والخطوات الإجرائية.'
              : 'Try adjusting the date range or department filter to view processing milestones.'}
          </p>
        </div>
      ) : activeTab === 'benchmark' ? (
        /* Standard SLA Lifecycle Benchmarks View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isAr ? 'المعايير المعتمدة لدورة حياة معالجة المعاملات (Standard SLA Matrix)' : 'Standard Lifecycle SLA Processing Benchmarks'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isAr
                ? 'الأطر الزمنية المعتمدة للمراحل الإجرائية الخمس طبقاً للائحة الاتصالات الإدارية الموحدة وحوكمة الخدمات الحكومية'
                : 'Standard target turnaround times, gatekeepers, and compliance benchmarks across the 5 processing milestones'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: 1,
                titleAr: 'القيد والتسجيل (OCR)',
                titleEn: 'Ingestion & OCR',
                sla: 'ساعتان',
                slaEn: '2 Hours',
                gatekeeper: 'مركز الاتصالات الإدارية',
                compliance: '99.2%',
                desc: 'الفحص الأمني، مسح المستندات، إصدار الباركود والتصنيف'
              },
              {
                step: 2,
                titleAr: 'الفرز والتوجيه',
                titleEn: 'Triage & Routing',
                sla: '4 ساعات',
                slaEn: '4 Hours',
                gatekeeper: 'مكتب القيادة / الإحالة',
                compliance: '96.8%',
                desc: 'التدقيق الإداري، تحديد نوع الإحالة وتعيين المهلة'
              },
              {
                step: 3,
                titleAr: 'الدراسة الفنية والصياغة',
                titleEn: 'Study & Drafting',
                sla: '24 ساعة',
                slaEn: '24 Hours',
                gatekeeper: 'الباحث / الموظف المختص',
                compliance: '94.5%',
                desc: 'إعداد مذكرات العرض، التنسيق الداخلي ومسودة الخطاب'
              },
              {
                step: 4,
                titleAr: 'الاعتماد والتوقيع الرقمي',
                titleEn: 'Approval & Signature',
                sla: '8 ساعات',
                slaEn: '8 Hours',
                gatekeeper: 'صاحب الصلاحية / المدير',
                compliance: '98.1%',
                desc: 'التدقيق النهائي، التوقيع بالشهادة الوطنية المشفرة'
              },
              {
                step: 5,
                titleAr: 'التصدير والأرشفة (GSB)',
                titleEn: 'Dispatch & Archival',
                sla: '4 ساعات',
                slaEn: '4 Hours',
                gatekeeper: 'قسم التصدير والأرشيف',
                compliance: '99.5%',
                desc: 'الإرسال عبر منظومة التكامل، الحفظ الرقمي وإغلاق SLA'
              }
            ].map(b => (
              <div
                key={b.step}
                className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      {isAr ? `مرحلة ${b.step}` : `Step ${b.step}`}
                    </span>
                    <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {b.compliance}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {isAr ? b.titleAr : b.titleEn}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {b.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{isAr ? 'المهلة القصوى:' : 'Max SLA:'}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{isAr ? b.sla : b.slaEn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{isAr ? 'المسؤول:' : 'Gatekeeper:'}</span>
                    <span className="font-medium text-slate-600 dark:text-slate-400 truncate max-w-[110px]">{b.gatekeeper}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
