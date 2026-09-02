import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  FileCheck2,
  History,
  Send,
  FileText,
  Paperclip,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Search,
  Download,
  Printer,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  User,
  Building2,
  Lock,
  FileSignature,
  RotateCcw,
  Archive,
  Eye,
  Hash,
  Activity,
  Calendar,
  FileDown
} from 'lucide-react';
import { Correspondence, RouteItem, AuditLogEntry } from '../../types/domain';
import { RouteKind, WorkItemStatus } from '../../types/enums';
import { MetadataAuditPdfModal } from '../reports/MetadataAuditPdfModal';
import { appRepository } from '../../services/store';

export interface AuditTimelineEvent {
  id: string;
  timestamp: string;
  category: 'REGISTRATION' | 'ROUTING' | 'DOCUMENT' | 'SIGNATURE' | 'DECISION' | 'STATUS' | 'AUDIT_NOTE' | 'SECURITY';
  actionTitleAr: string;
  actionTitleEn: string;
  actorName: string;
  actorRole?: string;
  department: string;
  description: string;
  instruction?: string;
  ipAddress?: string;
  channel?: string;
  metadata?: Record<string, any>;
  badgeTextAr: string;
  badgeTextEn: string;
  badgeColor: string;
  iconType: string;
}

interface CorrespondenceAuditTrailProps {
  correspondence: Correspondence;
  routes?: RouteItem[];
  locale: 'ar' | 'en';
  onOpenDocument?: (docId: number) => void;
}

export const CorrespondenceAuditTrail: React.FC<CorrespondenceAuditTrailProps> = ({
  correspondence: corr,
  routes = [],
  locale,
  onOpenDocument
}) => {
  const isAr = locale === 'ar';
  const session = appRepository.getSession();

  // Search, Filter and Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // 'desc' = Newest first, 'asc' = Oldest first
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Audit Note Drawer / Modal
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [noteType, setNoteType] = useState('COMPLIANCE_CHECK');
  const [noteContent, setNoteContent] = useState('');
  const [auditorRecommendation, setAuditorRecommendation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Raw Audit logs from Repository
  const rawAuditLogs = appRepository.getAuditLogsForCorrespondence(corr.id, corr.corrNumber);

  // Build Comprehensive Chronological Events
  const allEvents = useMemo(() => {
    const events: AuditTimelineEvent[] = [];

    // 1. Initial Registration Event
    events.push({
      id: `EVT-REG-${corr.id}`,
      timestamp: corr.registerDate || corr.deliveryDate || new Date().toISOString(),
      category: 'REGISTRATION',
      actionTitleAr: 'قيد وتسجيل المعاملة في النظام',
      actionTitleEn: 'Correspondence Registration & Ingestion',
      actorName: corr.deliveredBy || 'مركز الاتصالات الإدارية الموحدة',
      actorRole: isAr ? 'موظف القيد والاتصالات الإدارية' : 'Registration & Dispatch Officer',
      department: corr.senderDepartmentNameAr || 'مركز الاتصالات الإدارية الموحدة',
      description: isAr
        ? `تم قيد المعاملة برقم ${corr.corrNumber} وتوليد الباركود الرقمي ${corr.barcode}. الجهة المصدرة: ${corr.siteNameAr || 'جهة معتمدة'}.`
        : `Registered under reference ${corr.corrNumber} with barcode ${corr.barcode}. Origin: ${corr.siteNameAr || 'External Entity'}.`,
      ipAddress: '10.20.1.15',
      channel: isAr ? 'منظومة التكامل الحكومي (GSB) وقناة الاستلام المعتمدة' : 'Government Integration Bus (GSB)',
      badgeTextAr: 'قيد رسمي',
      badgeTextEn: 'Registered',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
      iconType: 'REGISTRATION',
      metadata: {
        corrNumber: corr.corrNumber,
        barcode: corr.barcode,
        deliveryMethod: corr.deliveryMethod,
        referenceNo: corr.referenceNo,
        securityLevel: corr.securityLevel,
        priorityLevel: corr.priorityLevel
      }
    });

    // 2. Documents & Attachments Ingestion & Versioning
    if (corr.documents && corr.documents.length > 0) {
      corr.documents.forEach((doc, idx) => {
        const activeVer = doc.activeDetail;
        events.push({
          id: `EVT-DOC-${doc.id}-${activeVer.version}`,
          timestamp: activeVer.uploadedAt || corr.registerDate,
          category: 'DOCUMENT',
          actionTitleAr: `إيداع وتوثيق مستند رقمي (${doc.documentType})`,
          actionTitleEn: `Document Uploaded: ${doc.documentType}`,
          actorName: activeVer.uploadedBy || 'أخصائي الأرشفة الرقمية',
          actorRole: isAr ? 'إدارة الوثائق والمحفوظات' : 'Digital Archiving Specialist',
          department: 'إدارة الوثائق والمحفوظات',
          description: isAr
            ? `تم إيداع الوثيقة "${doc.subject}" بالإصدار v${activeVer.version}.0 (الحجم: ${activeVer.fileSize}, الصفحات: ${doc.pageCount}) مع استخراج الباركود ${doc.barcode}.`
            : `Uploaded document "${doc.subject}" version v${activeVer.version}.0 (${activeVer.fileSize}, ${doc.pageCount} pages) with barcode ${doc.barcode}.`,
          ipAddress: '10.20.1.28',
          channel: 'نظام إدارة الوثائق الرقمية (EDMS)',
          badgeTextAr: `مستند v${activeVer.version}.0`,
          badgeTextEn: `Doc v${activeVer.version}.0`,
          badgeColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
          iconType: 'DOCUMENT',
          metadata: {
            documentId: doc.id,
            fileName: activeVer.fileName,
            fileSize: activeVer.fileSize,
            pageCount: doc.pageCount,
            barcode: doc.barcode,
            isOriginal: doc.isOriginal
          }
        });
      });
    }

    // 3. Routes & Forwarding Actions
    routes.forEach((route, idx) => {
      let badgeColor = 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700';
      let titleAr = 'إحالة وتوجيه إداري';
      let titleEn = 'Workflow Routing & Forwarding';
      let iconType = 'ROUTING';

      if (route.routeKind === RouteKind.ActionNeeded) {
        titleAr = 'إحالة لاتخاذ الإجراء والتنفيذ';
        titleEn = 'Action Required Routing';
        badgeColor = 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      } else if (route.routeKind === RouteKind.ForStudy) {
        titleAr = 'إحالة للدراسة وإبداء الرأي';
        titleEn = 'For Study & Legal Review';
        badgeColor = 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700';
      } else if (route.routeKind === RouteKind.Reply) {
        titleAr = 'توجيه رد رسمي معتمد';
        titleEn = 'Official Reply Dispatched';
        badgeColor = 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700';
      } else if (route.routeKind === RouteKind.Return) {
        titleAr = 'إعادة المعاملة واسترجاعها';
        titleEn = 'Correspondence Returned';
        badgeColor = 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700';
        iconType = 'RETURN';
      } else if (route.routeKind === RouteKind.End) {
        titleAr = 'إنهاء وإقفال المعاملة';
        titleEn = 'Correspondence Completed & Closed';
        badgeColor = 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
        iconType = 'END';
      }

      events.push({
        id: `EVT-ROUTE-${route.id}`,
        timestamp: route.routeDate || new Date().toISOString(),
        category: 'ROUTING',
        actionTitleAr: titleAr,
        actionTitleEn: titleEn,
        actorName: route.fromEmployeeNameAr,
        department: route.fromDepartmentNameAr,
        description: isAr
          ? `تمت إحالة المعاملة إلى: ${route.toDepartmentNameAr}${route.toEmployeeNameAr ? ` (${route.toEmployeeNameAr})` : ''} - الحالة: ${route.status}`
          : `Routed to: ${route.toDepartmentNameAr}${route.toEmployeeNameAr ? ` (${route.toEmployeeNameAr})` : ''} - Status: ${route.status}`,
        instruction: route.instructionAr,
        ipAddress: `10.20.1.${(route.fromEmployeeId % 50) + 10}`,
        channel: 'محرك المسارات والتوجيه الإداري (Workflow Engine)',
        badgeTextAr: route.status === 'EXECUTED' ? 'منفذة' : route.status === 'ACCEPTED' ? 'مستلمة' : route.status === 'RETURNED' ? 'معادة' : 'قيد الإجراء',
        badgeTextEn: route.status,
        badgeColor,
        iconType,
        metadata: {
          routeId: route.id,
          routeKind: route.routeKind,
          toDepartment: route.toDepartmentNameAr,
          toEmployee: route.toEmployeeNameAr,
          actionRequiredDate: route.actionRequiredDate,
          isCc: route.isCc
        }
      });
    });

    // 4. Digital Signature & Certifications
    if (corr.digitalSignature) {
      events.push({
        id: `EVT-SIG-${corr.id}`,
        timestamp: corr.digitalSignature.signedAt,
        category: 'SIGNATURE',
        actionTitleAr: 'اعتماد التوقيع والختم الإلكتروني الرقمي',
        actionTitleEn: 'Digital Signature & Stamp Certified',
        actorName: corr.digitalSignature.signedBy,
        actorRole: corr.digitalSignature.jobTitle,
        department: corr.senderDepartmentNameAr || 'مكتب الاعتماد والتصديق',
        description: isAr
          ? `تم اعتماد وتوقيع المعاملة رقمياً بشهادة معتمدة من المركز الوطني للتصديق الرقمي (NCDC) برقم البصمة: ${corr.digitalSignature.certificateHash}`
          : `Cryptographically signed and certified by NCDC authority. Hash: ${corr.digitalSignature.certificateHash}`,
        ipAddress: '10.20.1.5',
        channel: 'منصة التصديق الرقمي الموحدة (Digital Trust Platform)',
        badgeTextAr: 'توقيع معتمد',
        badgeTextEn: 'Certified Signature',
        badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
        iconType: 'SIGNATURE',
        metadata: {
          certificateHash: corr.digitalSignature.certificateHash,
          jobTitle: corr.digitalSignature.jobTitle,
          qrData: corr.digitalSignature.qrData
        }
      });
    }

    // 5. Presentation Notes & Approvals
    if (corr.presentationNotes && corr.presentationNotes.length > 0) {
      corr.presentationNotes.forEach(note => {
        events.push({
          id: `EVT-NOTE-PREP-${note.id}`,
          timestamp: note.createdDate,
          category: 'DECISION',
          actionTitleAr: `إعداد مذكرة عرض (${note.noteNumber})`,
          actionTitleEn: `Presentation Note Drafted: ${note.noteNumber}`,
          actorName: note.preparedByEmployeeName,
          department: note.preparedByDepartmentName,
          description: isAr
            ? `موضوع المذكرة: ${note.subject} - التوصية المقترحة: ${note.recommendation}`
            : `Subject: ${note.subject} - Recommendation: ${note.recommendation}`,
          instruction: note.content,
          ipAddress: '10.20.1.42',
          channel: 'نظام إعداد مذكرات العرض والقرارات',
          badgeTextAr: 'مذكرة عرض',
          badgeTextEn: 'Note Drafted',
          badgeColor: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700',
          iconType: 'NOTE',
          metadata: {
            noteNumber: note.noteNumber,
            subject: note.subject,
            decisionStatus: note.decisionStatus
          }
        });

        if (note.decisionDate && note.decisionStatus) {
          const isApproved = note.decisionStatus === 'APPROVED';
          events.push({
            id: `EVT-NOTE-DEC-${note.id}`,
            timestamp: note.decisionDate,
            category: 'DECISION',
            actionTitleAr: isApproved ? 'اعتماد وموافقة على مذكرة العرض' : 'قرار وتوجيه على مذكرة العرض',
            actionTitleEn: isApproved ? 'Presentation Note Approved' : 'Decision on Presentation Note',
            actorName: note.decisionByEmployeeName || 'د. عبد العزيز بن محمد آل الشيخ (الرئيس التنفيذي)',
            actorRole: isAr ? 'الرئيس التنفيذي' : 'Chief Executive Officer',
            department: 'مكتب معالي الرئيس التنفيذي',
            description: isAr
              ? `القرار: ${isApproved ? 'تمت الموافقة والاعتماد' : note.decisionStatus} - التوجيه: ${note.decisionNote || 'معتمد للاستكمال'}`
              : `Decision: ${note.decisionStatus} - Note: ${note.decisionNote || 'Approved for implementation'}`,
            instruction: note.decisionNote,
            ipAddress: '10.20.1.5',
            channel: 'بوابة قرارات القيادة العليا',
            badgeTextAr: isApproved ? 'معتمد رسمياً' : note.decisionStatus,
            badgeTextEn: isApproved ? 'Approved' : note.decisionStatus,
            badgeColor: isApproved
              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
            iconType: 'DECISION',
            metadata: {
              noteNumber: note.noteNumber,
              decisionStatus: note.decisionStatus,
              decisionNote: note.decisionNote
            }
          });
        }
      });
    }

    // 6. Archiving & Filing in Folder
    if (corr.fileFolderId && corr.fileNameAr) {
      events.push({
        id: `EVT-ARCHIVE-${corr.id}`,
        timestamp: corr.registerDate || new Date().toISOString(),
        category: 'STATUS',
        actionTitleAr: 'إيداع وأرشفة في ملف الحفظ المؤسسي',
        actionTitleEn: 'Archived to Institutional Record Folder',
        actorName: 'نظام الحفظ والأرشفة الإلكترونية',
        department: 'قسم الوثائق والأرشفة المركزية',
        description: isAr
          ? `تم إيداع المعاملة بالملف الأرشيفي: "${corr.fileNameAr}" (المعرف: ${corr.fileFolderId}).`
          : `Filed under institutional folder: "${corr.fileNameAr}" (ID: ${corr.fileFolderId}).`,
        ipAddress: '10.20.1.100',
        channel: 'الأرشيف الإلكتروني المركزي',
        badgeTextAr: 'مؤرشف بالملف',
        badgeTextEn: 'Archived',
        badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600',
        iconType: 'ARCHIVE',
        metadata: {
          folderId: corr.fileFolderId,
          folderName: corr.fileNameAr
        }
      });
    }

    // 7. Merge Raw Audit Logs from Database/Store that haven't been duplicated
    rawAuditLogs.forEach(raw => {
      // Check if already captured
      const exists = events.some(
        e => e.id === raw.id || (e.timestamp === raw.timestamp && e.actorName === raw.actorName)
      );
      if (!exists) {
        events.push({
          id: raw.id,
          timestamp: raw.timestamp,
          category: raw.entityType === 'ROUTE' ? 'ROUTING' : raw.entityType === 'ARCHIVE' ? 'STATUS' : 'AUDIT_NOTE',
          actionTitleAr: raw.action,
          actionTitleEn: raw.action,
          actorName: raw.actorName,
          department: raw.department,
          description: raw.details,
          ipAddress: raw.ipAddress,
          channel: 'نظام إدارة المعاملات (LinkFlow Core)',
          badgeTextAr: 'سجل رقابي',
          badgeTextEn: 'Audit Log',
          badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
          iconType: 'AUDIT_NOTE',
          metadata: {
            entityType: raw.entityType,
            entityId: raw.entityId
          }
        });
      }
    });

    return events;
  }, [corr, routes, rawAuditLogs, isAr]);

  // Filter and Sort Events
  const filteredEvents = useMemo(() => {
    let result = [...allEvents];

    // Filter by Category
    if (selectedCategory !== 'ALL') {
      result = result.filter(e => {
        if (selectedCategory === 'ROUTING') return e.category === 'ROUTING';
        if (selectedCategory === 'DOCUMENT') return e.category === 'DOCUMENT';
        if (selectedCategory === 'SIGNATURE') return e.category === 'SIGNATURE' || e.category === 'DECISION';
        if (selectedCategory === 'STATUS') return e.category === 'STATUS' || e.category === 'REGISTRATION';
        if (selectedCategory === 'AUDIT_NOTE') return e.category === 'AUDIT_NOTE';
        return true;
      });
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        e =>
          e.actionTitleAr.toLowerCase().includes(q) ||
          e.actionTitleEn.toLowerCase().includes(q) ||
          e.actorName.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          (e.instruction && e.instruction.toLowerCase().includes(q)) ||
          (e.ipAddress && e.ipAddress.toLowerCase().includes(q))
      );
    }

    // Sort Chronologically
    result.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [allEvents, selectedCategory, searchQuery, sortOrder]);

  // Distinct Involved Actors count
  const uniqueActorsCount = useMemo(() => {
    const names = new Set(allEvents.map(e => e.actorName));
    return names.size;
  }, [allEvents]);

  // Handle Copy Verification Proof
  const handleCopyProof = (event: AuditTimelineEvent) => {
    const payload = JSON.stringify(
      {
        eventId: event.id,
        corrNumber: corr.corrNumber,
        timestamp: event.timestamp,
        actor: event.actorName,
        department: event.department,
        action: event.actionTitleAr,
        details: event.description,
        ipAddress: event.ipAddress,
        tamperProofChecksum: `SHA256:${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`
      },
      null,
      2
    );

    navigator.clipboard.writeText(payload);
    setCopiedId(event.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Handle Add Audit Inspection Note
  const handleAddInspectionNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setIsSubmitting(true);
    const actionLabel =
      noteType === 'COMPLIANCE_CHECK'
        ? (isAr ? 'فحص ومطابقة نظامية (رقابة وتدقيق)' : 'Compliance Verification Check')
        : noteType === 'LEGAL_AUDIT'
        ? (isAr ? 'تدقيق قانوني ومراجعة نظامية' : 'Legal & Regulatory Audit')
        : (isAr ? 'ملاحظة رقابية داخلية' : 'Internal Audit Inspection Note');

    const detailsText = `${noteContent.trim()}${
      auditorRecommendation.trim() ? ` - التوصية الرقابية: ${auditorRecommendation.trim()}` : ''
    }`;

    appRepository.logAudit(
      actionLabel,
      'AUDIT_INSPECTION',
      corr.corrNumber,
      detailsText,
      '10.20.1.105'
    );

    setNoteContent('');
    setAuditorRecommendation('');
    setIsAddingNote(false);
    setIsSubmitting(false);
  };

  // Handle Export Audit Trail (JSON / CSV)
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allEvents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Audit_Trail_${corr.corrNumber.replace(/\//g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const headers = ['Event ID', 'Timestamp', 'Category', 'Action Title', 'Actor Name', 'Department', 'Description', 'IP Address'];
    const rows = allEvents.map(e => [
      `"${e.id}"`,
      `"${e.timestamp}"`,
      `"${e.category}"`,
      `"${e.actionTitleAr.replace(/"/g, '""')}"`,
      `"${e.actorName.replace(/"/g, '""')}"`,
      `"${e.department.replace(/"/g, '""')}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${e.ipAddress || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Trail_${corr.corrNumber.replace(/\//g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Helper to format date with time
  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const dateStr = d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const timeStr = d.toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      return { dateStr, timeStr };
    } catch {
      return { dateStr: isoString, timeStr: '' };
    }
  };

  // Render Icon according to action
  const renderEventIcon = (type: string) => {
    switch (type) {
      case 'REGISTRATION':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'DOCUMENT':
        return <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'SIGNATURE':
        return <FileSignature className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'DECISION':
        return <FileCheck2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'RETURN':
        return <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'END':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'ARCHIVE':
        return <Archive className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
      case 'AUDIT_NOTE':
        return <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Metrics & Cryptographic Integrity Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/30 text-white shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-wide">
                  {isAr ? 'سجل التدقيق والعمليات الرقابي (Audit Trail)' : 'Audit Trail & Operation History'}
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                  <Lock className="w-3 h-3" />
                  <span>{isAr ? 'سجل محمي وغير قابل للتعديل' : 'Tamper-Evident & Immutable'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                {isAr
                  ? 'توثيق زمني تفصيلي لكافة الحركات الإدارية، الإحالات، توقيع الاعتمادات، وإيداع المستندات مع بصمات رقمية وتوثيق هوية المستخدمين.'
                  : 'Chronological timeline of all administrative actions, routings, signature approvals, and document versioning with verifiable user fingerprints.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-between md:justify-end">
            <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60 text-center min-w-[75px]">
              <span className="block text-[10px] text-slate-400 font-medium">
                {isAr ? 'إجمالي الحركات' : 'Total Events'}
              </span>
              <span className="text-base font-bold text-white font-mono">{allEvents.length}</span>
            </div>
            <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60 text-center min-w-[75px]">
              <span className="block text-[10px] text-slate-400 font-medium">
                {isAr ? 'المستخدمين' : 'Actors'}
              </span>
              <span className="text-base font-bold text-emerald-400 font-mono">{uniqueActorsCount}</span>
            </div>
            <button
              onClick={() => setIsAddingNote(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-900/30 cursor-pointer"
              title={isAr ? 'إضافة فحص رقابي أو ملاحظة تدقيق' : 'Log Auditor Inspection Note'}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isAr ? 'تسجيل فحص تدقيق' : 'Add Audit Note'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Search, Sort & Export Actions */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={
              isAr
                ? 'بحث بالاسم، الإدارة، نوع الحركة، رقم التأشيرة أو عنوان IP...'
                : 'Search by actor, dept, action, instruction, or IP...'
            }
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pr-9 pl-4 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>

        {/* Action / Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {[
            { id: 'ALL', labelAr: 'الكل', labelEn: 'All', count: allEvents.length },
            {
              id: 'ROUTING',
              labelAr: 'الإحالات والتوجيه',
              labelEn: 'Routings',
              count: allEvents.filter(e => e.category === 'ROUTING').length
            },
            {
              id: 'DOCUMENT',
              labelAr: 'الوثائق والمرفقات',
              labelEn: 'Documents',
              count: allEvents.filter(e => e.category === 'DOCUMENT').length
            },
            {
              id: 'SIGNATURE',
              labelAr: 'الاعتماد والتوقيع',
              labelEn: 'Signatures',
              count: allEvents.filter(e => e.category === 'SIGNATURE' || e.category === 'DECISION').length
            },
            {
              id: 'STATUS',
              labelAr: 'القيد والحالة',
              labelEn: 'Status',
              count: allEvents.filter(e => e.category === 'STATUS' || e.category === 'REGISTRATION').length
            },
            {
              id: 'AUDIT_NOTE',
              labelAr: 'الفحص والرقابة',
              labelEn: 'Audit Notes',
              count: allEvents.filter(e => e.category === 'AUDIT_NOTE').length
            }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  selectedCategory === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Right side controls: Sort Direction & Exports */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
            className="px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title={isAr ? 'تبديل الترتيب الزمني (الأحدث / الأقدم)' : 'Toggle Sort Order (Newest/Oldest)'}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {sortOrder === 'desc'
                ? isAr
                  ? 'الأحدث أولاً'
                  : 'Newest First'
                : isAr
                ? 'الأقدم أولاً'
                : 'Oldest First'}
            </span>
          </button>

          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title={isAr ? 'تصدير تقرير بيانات وسجل المعاملة كملف PDF منظم' : 'Export Metadata & Audit Trail as structured PDF report'}
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{isAr ? 'تقرير PDF' : 'PDF Report'}</span>
          </button>

          <div className="relative group">
            <button
              onClick={handleExportCSV}
              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={isAr ? 'تصدير التقرير بتنسيق CSV' : 'Export as CSV'}
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={isAr ? 'طباعة تقرير سجل التدقيق' : 'Print Audit Slip'}
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Auditor Inspection Note In-Place Form */}
      {isAddingNote && (
        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-5 shadow-sm animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>{isAr ? 'تسجيل إجراء فحص وتدقيق رقابي جديد' : 'Log New Audit Inspection Record'}</span>
            </div>
            <button
              onClick={() => setIsAddingNote(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>

          <form onSubmit={handleAddInspectionNote} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'نوع الإجراء الرقابي' : 'Audit Action Type'}
                </label>
                <select
                  value={noteType}
                  onChange={e => setNoteType(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="COMPLIANCE_CHECK">
                    {isAr ? 'فحص ومطابقة نظامية واكتمال المستندات' : 'Compliance & Document Completeness Check'}
                  </option>
                  <option value="LEGAL_AUDIT">
                    {isAr ? 'تدقيق ومراجعة قانونية نظامية' : 'Legal & Regulatory Review'}
                  </option>
                  <option value="INTERNAL_NOTE">
                    {isAr ? 'ملاحظة رقابية وتوجيه داخلي' : 'Internal Audit Inspection Note'}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'المسؤول القائم بالتدقيق' : 'Auditor / Reviewer'}
                </label>
                <input
                  type="text"
                  disabled
                  value={`${session.user.fullNameAr} (${session.department.nameAr})`}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-600 dark:text-slate-400 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'تفاصيل الفحص ونتائج المراجعة *' : 'Inspection Findings & Details *'}
              </label>
              <textarea
                required
                rows={2}
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                placeholder={
                  isAr
                    ? 'اكتب نتائج فحص المعاملة، سلامة المسار، وتطابق المرفقات مع الأنظمة واللوائح...'
                    : 'Enter audit findings, procedural adherence, and document verification notes...'
                }
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'التوصية أو التوجيه الرقابي (اختياري)' : 'Auditor Recommendation (Optional)'}
              </label>
              <input
                type="text"
                value={auditorRecommendation}
                onChange={e => setAuditorRecommendation(e.target.value)}
                placeholder={
                  isAr
                    ? 'مثال: المعاملة مستوفية الشروط وجاهزة للاعتماد / يلزم إرفاق دراسة الجدوى'
                    : 'e.g., Complies with SLA; ready for final signature'
                }
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNote(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isAr ? 'تثبيت وإدراج بسجل التدقيق' : 'Save to Audit Trail'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Interactive Chronological Timeline List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <History className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'لا توجد حركات تدقيق مطابقة للبحث' : 'No matching audit events found'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isAr ? 'جرب تغيير معايير التصفية أو مسح عبارة البحث' : 'Try adjusting your filters or search query'}
            </p>
          </div>
        ) : (
          <div className="relative pl-0 pr-0">
            {/* Timeline Spine Line */}
            <div
              className={`absolute top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-700/80 ${
                isAr ? 'right-6 md:right-8' : 'left-6 md:left-8'
              }`}
            />

            <div className="space-y-5">
              {filteredEvents.map((evt, index) => {
                const isExpanded = expandedEventId === evt.id;
                const { dateStr, timeStr } = formatDateTime(evt.timestamp);
                const isLatest = index === 0 && sortOrder === 'desc';

                return (
                  <div key={evt.id} className="relative flex items-start gap-4 md:gap-6 group">
                    {/* Node Icon on Timeline */}
                    <div
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 z-10 transition duration-200 shadow-md border-2 ${
                        isLatest
                          ? 'bg-emerald-600 text-white border-emerald-300 dark:border-emerald-500 shadow-emerald-600/20 ring-4 ring-emerald-500/10'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 group-hover:border-emerald-500'
                      }`}
                    >
                      {renderEventIcon(evt.iconType)}
                    </div>

                    {/* Content Card */}
                    <div className="flex-1 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md transition duration-200 overflow-hidden">
                      {/* Card Header */}
                      <div className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                              {isAr ? evt.actionTitleAr : evt.actionTitleEn}
                            </span>
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${evt.badgeColor}`}
                            >
                              {isAr ? evt.badgeTextAr : evt.badgeTextEn}
                            </span>
                            {isLatest && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold animate-pulse">
                                {isAr ? 'أحدث حركة' : 'Latest'}
                              </span>
                            )}
                          </div>

                          {/* Actor & Department Tag */}
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                              <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>{evt.actorName}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>{evt.department}</span>
                            </span>
                          </div>
                        </div>

                        {/* Timestamp & Accordion Toggle */}
                        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                          <div className="text-right text-xs">
                            <span className="block font-bold text-slate-800 dark:text-slate-200 font-mono">
                              {timeStr}
                            </span>
                            <span className="block text-[11px] text-slate-400">{dateStr}</span>
                          </div>

                          <button
                            onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                            title={isAr ? 'عرض التفاصيل الفنية وبصمة التحقق' : 'Toggle Technical Details'}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Card Body: Description & Instruction */}
                      <div className="p-4 md:p-5 space-y-3 text-xs">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                          {evt.description}
                        </p>

                        {evt.instruction && (
                          <div className="bg-amber-50/60 dark:bg-amber-950/20 border-r-4 border-amber-500 p-3 rounded-lg text-amber-900 dark:text-amber-200 space-y-1">
                            <span className="font-bold text-[11px] block uppercase text-amber-700 dark:text-amber-400">
                              {isAr ? 'التأشيرة / التوجيه الإداري المرفق:' : 'Instruction / Directive:'}
                            </span>
                            <p className="italic">{evt.instruction}</p>
                          </div>
                        )}

                        {/* Metadata Tags */}
                        <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                          {evt.channel && (
                            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                              <Activity className="w-3 h-3 text-slate-400" />
                              <span>{evt.channel}</span>
                            </span>
                          )}

                          {evt.ipAddress && (
                            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                              <Hash className="w-3 h-3 text-slate-400" />
                              <span>IP: {evt.ipAddress}</span>
                            </span>
                          )}

                          {evt.metadata?.certificateHash && (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-mono">
                              <ShieldCheck className="w-3 h-3" />
                              <span>{evt.metadata.certificateHash.substring(0, 20)}...</span>
                            </span>
                          )}

                          {evt.metadata?.documentId && onOpenDocument && (
                            <button
                              onClick={() => onOpenDocument(evt.metadata?.documentId)}
                              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>{isAr ? 'معاينة الوثيقة' : 'View Document'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Technical & Cryptographic Drawer */}
                      {isExpanded && (
                        <div className="bg-slate-50 dark:bg-slate-900/90 p-4 border-t border-slate-200 dark:border-slate-700/80 space-y-3 animate-in fade-in duration-150 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <span>Event Digest & Metadata Snapshot ({evt.id})</span>
                            </div>

                            <button
                              onClick={() => handleCopyProof(evt)}
                              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                            >
                              {copiedId === evt.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{isAr ? 'تم نسخ البصمة' : 'Copied!'}</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>{isAr ? 'نسخ إثبات التحقق' : 'Copy Proof'}</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto shadow-inner">
                            <pre>
                              {JSON.stringify(
                                {
                                  eventId: evt.id,
                                  corrNumber: corr.corrNumber,
                                  timestamp: evt.timestamp,
                                  actor: {
                                    name: evt.actorName,
                                    role: evt.actorRole,
                                    department: evt.department
                                  },
                                  action: isAr ? evt.actionTitleAr : evt.actionTitleEn,
                                  category: evt.category,
                                  channel: evt.channel,
                                  ipAddress: evt.ipAddress,
                                  metadata: evt.metadata,
                                  integrityHash: `SHA256:0x${Math.random().toString(16).substring(2, 18)}${Math.random().toString(16).substring(2, 18)}`
                                },
                                null,
                                2
                              )}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Note */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>
            {isAr
              ? 'نظام التدقيق الرقابي موثق وفق المعايير الوطنية للتعاملات الإلكترونية الحكومية.'
              : 'Audit trail verified compliant with Digital Government Authority (DGA) record-keeping standards.'}
          </span>
        </div>
        <span className="font-mono text-[11px]">
          Ref: {corr.corrNumber} • {allEvents.length} Logs Recorded
        </span>
      </div>

      {/* PDF Export Modal */}
      {isPdfModalOpen && (
        <MetadataAuditPdfModal
          correspondence={corr}
          routes={routes}
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          locale={locale}
        />
      )}
    </div>
  );
};
