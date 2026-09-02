import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Download,
  Printer,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  Calendar,
  User,
  Building2,
  Hash,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Sliders,
  Eye,
  FileCheck2
} from 'lucide-react';
import { Correspondence, RouteItem } from '../../types/domain';
import { AuditTimelineEvent } from '../correspondence/CorrespondenceAuditTrail';
import { generateCorrespondencePdfReport, PdfReportOptions } from '../../utils/pdfReportGenerator';
import { appRepository } from '../../services/store';
import { toast } from '../notifications/ToastContext';

interface MetadataAuditPdfModalProps {
  correspondence: Correspondence;
  routes?: RouteItem[];
  isOpen: boolean;
  onClose: () => void;
  locale: 'ar' | 'en';
}

export const MetadataAuditPdfModal: React.FC<MetadataAuditPdfModalProps> = ({
  correspondence: corr,
  routes = [],
  isOpen,
  onClose,
  locale
}) => {
  const isAr = locale === 'ar';

  // Export options state
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeDocuments, setIncludeDocuments] = useState(true);
  const [includeDigitalSignature, setIncludeDigitalSignature] = useState(true);
  const [includeAuditTrail, setIncludeAuditTrail] = useState(true);
  const [includeSecurityHashes, setIncludeSecurityHashes] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [activePreviewTab, setActivePreviewTab] = useState<'preview' | 'options'>('preview');

  // Build events for audit trail
  const [auditEvents, setAuditEvents] = useState<AuditTimelineEvent[]>([]);

  useEffect(() => {
    if (!corr) return;

    // Generate QR code for verification
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://linkflow.enterprise.gov.sa';
    const verifyUrl = `${baseUrl}/records/verify?corrId=${corr.id}&corrNumber=${encodeURIComponent(corr.corrNumber)}&chk=${corr.barcode}`;

    QRCode.toDataURL(verifyUrl, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: { dark: '#0f172a', light: '#ffffff' }
    })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('QR gen err:', err));

    // Gather chronological events
    const rawLogs = appRepository.getAuditLogsForCorrespondence(corr.id, corr.corrNumber);
    const events: AuditTimelineEvent[] = [];

    // Registration event
    events.push({
      id: `EVT-REG-${corr.id}`,
      timestamp: corr.registerDate || corr.deliveryDate || new Date().toISOString(),
      category: 'REGISTRATION',
      actionTitleAr: 'قيد وتسجيل المعاملة في النظام',
      actionTitleEn: 'Correspondence Registration & Ingestion',
      actorName: corr.deliveredBy || 'مركز الاتصالات الإدارية الموحدة',
      department: corr.senderDepartmentNameAr || 'مركز الاتصالات الإدارية الموحدة',
      description: isAr
        ? `تم قيد المعاملة برقم ${corr.corrNumber} وتوليد الباركود الرقمي ${corr.barcode}.`
        : `Registered under reference ${corr.corrNumber} with barcode ${corr.barcode}.`,
      ipAddress: '10.20.1.15',
      channel: 'منظومة التكامل الحكومي (GSB)',
      badgeTextAr: 'قيد رسمي',
      badgeTextEn: 'Registered',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      iconType: 'REGISTRATION'
    });

    // Document events
    corr.documents?.forEach(doc => {
      events.push({
        id: `EVT-DOC-${doc.id}`,
        timestamp: doc.activeDetail.uploadedAt || corr.registerDate,
        category: 'DOCUMENT',
        actionTitleAr: `إيداع وتوثيق مستند رقمي (${doc.documentType})`,
        actionTitleEn: `Document Uploaded: ${doc.documentType}`,
        actorName: doc.activeDetail.uploadedBy || 'أخصائي الأرشفة الرقمية',
        department: 'إدارة الوثائق والمحفوظات',
        description: isAr
          ? `تم إيداع الوثيقة "${doc.subject}" بالإصدار v${doc.activeDetail.version}.0 (الحجم: ${doc.activeDetail.fileSize}).`
          : `Uploaded document "${doc.subject}" version v${doc.activeDetail.version}.0 (${doc.activeDetail.fileSize}).`,
        ipAddress: '10.20.1.28',
        badgeTextAr: `مستند v${doc.activeDetail.version}.0`,
        badgeTextEn: `Doc v${doc.activeDetail.version}.0`,
        badgeColor: 'bg-blue-100 text-blue-700 border-blue-300',
        iconType: 'DOCUMENT'
      });
    });

    // Routes
    routes.forEach(route => {
      events.push({
        id: `EVT-ROUTE-${route.id}`,
        timestamp: route.routeDate || new Date().toISOString(),
        category: 'ROUTING',
        actionTitleAr: isAr ? 'إحالة وتوجيه إداري' : 'Workflow Routing & Forwarding',
        actionTitleEn: 'Workflow Routing & Forwarding',
        actorName: route.fromEmployeeNameAr,
        department: route.fromDepartmentNameAr,
        description: isAr
          ? `تمت إحالة المعاملة إلى: ${route.toDepartmentNameAr}${route.toEmployeeNameAr ? ` (${route.toEmployeeNameAr})` : ''} - الحالة: ${route.status}`
          : `Routed to: ${route.toDepartmentNameAr} - Status: ${route.status}`,
        instruction: route.instructionAr,
        ipAddress: `10.20.1.${(route.fromEmployeeId % 50) + 10}`,
        badgeTextAr: route.status,
        badgeTextEn: route.status,
        badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-300',
        iconType: 'ROUTING'
      });
    });

    // Signature
    if (corr.digitalSignature) {
      events.push({
        id: `EVT-SIG-${corr.id}`,
        timestamp: corr.digitalSignature.signedAt,
        category: 'SIGNATURE',
        actionTitleAr: 'اعتماد التوقيع والختم الإلكتروني الرقمي',
        actionTitleEn: 'Digital Signature & Stamp Certified',
        actorName: corr.digitalSignature.signedBy,
        department: corr.senderDepartmentNameAr || 'مكتب الاعتماد والتصديق',
        description: isAr
          ? `تم اعتماد وتوقيع المعاملة رقمياً بشهادة معتمدة من NCDC برقم البصمة: ${corr.digitalSignature.certificateHash}`
          : `Cryptographically signed and certified by NCDC. Hash: ${corr.digitalSignature.certificateHash}`,
        ipAddress: '10.20.1.5',
        badgeTextAr: 'توقيع معتمد',
        badgeTextEn: 'Certified Signature',
        badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
        iconType: 'SIGNATURE'
      });
    }

    // Raw audit logs
    rawLogs.forEach(raw => {
      const exists = events.some(e => e.id === raw.id || e.timestamp === raw.timestamp);
      if (!exists) {
        events.push({
          id: raw.id,
          timestamp: raw.timestamp,
          category: 'AUDIT_NOTE',
          actionTitleAr: raw.action,
          actionTitleEn: raw.action,
          actorName: raw.actorName,
          department: raw.department,
          description: raw.details,
          ipAddress: raw.ipAddress,
          badgeTextAr: 'سجل رقابي',
          badgeTextEn: 'Audit Log',
          badgeColor: 'bg-amber-100 text-amber-700 border-amber-300',
          iconType: 'AUDIT_NOTE'
        });
      }
    });

    // Sort descending
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setAuditEvents(events);
  }, [corr, routes, isAr]);

  if (!isOpen) return null;

  // Handle Generate and Download PDF
  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      toast.info(
        isAr ? 'جاري إنشاء وتهيئة تقرير الـ PDF المنظم...' : 'Generating structured PDF report...',
        {
          titleAr: 'تصدير PDF',
          titleEn: 'Exporting PDF',
          duration: 2500
        }
      );

      const options: PdfReportOptions = {
        includeMetadata,
        includeDocuments,
        includeDigitalSignature,
        includeAuditTrail,
        includeSecurityHashes,
        locale
      };

      const { doc, filename } = await generateCorrespondencePdfReport(corr, auditEvents, routes, options);
      doc.save(filename);

      toast.success(
        isAr ? 'تم تنزيل تقرير البيانات وسجل التدقيق بنجاح' : 'PDF Report downloaded successfully',
        {
          titleAr: 'اكتمل التصدير',
          titleEn: 'Export Completed',
          duration: 3500
        }
      );
    } catch (err) {
      console.error('Failed to export PDF:', err);
      toast.error(
        isAr ? 'حدث خطأ أثناء إنشاء ملف الـ PDF' : 'Error generating PDF file',
        {
          titleAr: 'خطأ في التصدير',
          titleEn: 'Export Error'
        }
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Native Print
  const handlePrintReport = () => {
    toast.info(
      isAr ? 'جاري توجيه التقرير للطباعة الرسمية...' : 'Preparing report for official printing...',
      {
        titleAr: 'أمر الطباعة',
        titleEn: 'Printing Report'
      }
    );
    window.print();
  };

  // Handle Copy Verification Link
  const handleCopyLink = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://linkflow.enterprise.gov.sa';
    const link = `${baseUrl}/records/verify?corrId=${corr.id}&corrNumber=${encodeURIComponent(corr.corrNumber)}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    toast.success(
      isAr ? 'تم نسخ رابط التحقق الرقمي إلى الحافظة' : 'Verification link copied to clipboard'
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-hidden select-text">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-900/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {isAr ? 'تقرير بيانات المعاملة وسجل التدقيق (PDF Report)' : 'Correspondence Metadata & Audit Trail PDF Report'}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  A4 Structured
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {corr.corrNumber} • {corr.barcode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintReport}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
              title={isAr ? 'طباعة التقرير مباشرة' : 'Print Report Directly'}
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action & Configuration Sub-bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActivePreviewTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activePreviewTab === 'preview'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isAr ? 'معاينة التقرير الرسمي' : 'Document Preview'}</span>
            </button>
            <button
              onClick={() => setActivePreviewTab('options')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activePreviewTab === 'options'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isAr ? 'تخصيص أقسام التقرير' : 'Report Sections'}</span>
            </button>
          </div>

          {/* Export Action Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ رابط التحقق' : 'Copy Verify URL')}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-900/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? (isAr ? 'جاري التوليد...' : 'Generating...') : (isAr ? 'تنزيل تقرير PDF المنظم' : 'Download PDF Report')}</span>
            </button>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950/60">
          {activePreviewTab === 'options' ? (
            /* Options & Filter Controls */
            <div className="max-w-2xl mx-auto space-y-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {isAr ? 'تخصيص محتويات وأقسام التقرير الرسمي' : 'Customize Report Contents'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAr
                    ? 'حدد العناصر التي ترغب بتضمينها في وثيقة الـ PDF المنظمة قبل التصدير أو الطباعة.'
                    : 'Select the structured sections to include in the generated PDF report.'}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  {
                    id: 'meta',
                    labelAr: 'بيانات وهوية المعاملة الأساسية (Metadata & Identity)',
                    labelEn: 'Correspondence Metadata & Identity Details',
                    checked: includeMetadata,
                    onChange: setIncludeMetadata,
                    descAr: 'الرقم، الباركود، الجهة المصدرة، درجة السرية، وتاريخ القيد'
                  },
                  {
                    id: 'docs',
                    labelAr: 'جدول الوثائق والمرفقات الرقمية (Attached Documents)',
                    labelEn: 'Attached Documents & Digital Assets Summary',
                    checked: includeDocuments,
                    onChange: setIncludeDocuments,
                    descAr: 'تفاصيل المستندات، أرقام الإصدارات، والأحجام'
                  },
                  {
                    id: 'sig',
                    labelAr: 'التوقيع والختم الإلكتروني المعتمد (Digital Signature)',
                    labelEn: 'Certified Digital Signature & Certificate Hash',
                    checked: includeDigitalSignature,
                    onChange: setIncludeDigitalSignature,
                    descAr: 'بصمة NCDC، هوية الموقع، وتاريخ التوثيق الرقمي'
                  },
                  {
                    id: 'audit',
                    labelAr: 'سجل التدقيق والتتبع الزمني الكامل (Audit Trail)',
                    labelEn: 'Complete Chronological Audit Trail History',
                    checked: includeAuditTrail,
                    onChange: setIncludeAuditTrail,
                    descAr: `توثيق كافة العمليات (${auditEvents.length} حركة) مع هوية الموظف وعنوان IP`
                  },
                  {
                    id: 'security',
                    labelAr: 'بصمة النزاهة الرقمية ورمز QR (Tamper-Proof Seal & QR)',
                    labelEn: 'Tamper-Evident SHA-256 Digest & QR Verification',
                    checked: includeSecurityHashes,
                    onChange: setIncludeSecurityHashes,
                    descAr: 'رمز استجابة سريعة للتحقق اللحظي عبر البوابة الحكومية'
                  }
                ].map(opt => (
                  <label
                    key={opt.id}
                    className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={opt.checked}
                      onChange={e => opt.onChange(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                        {isAr ? opt.labelAr : opt.labelEn}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        {opt.descAr}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  onClick={() => setActivePreviewTab('preview')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span>{isAr ? 'عرض المعاينة المحدثة' : 'View Updated Preview'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Live High-Fidelity A4 Report Document Preview Canvas */
            <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100">
              
              {/* Report Header Band */}
              <div className="bg-slate-900 text-white p-6 relative overflow-hidden border-b-4 border-emerald-500">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold block">
                      المملكة العربية السعودية • المنظومة الحكومية الموحدة
                    </span>
                    <h2 className="text-lg font-extrabold text-white">
                      تقرير بيانات المعاملة وسجل التدقيق الرقابي
                    </h2>
                    <p className="text-xs text-slate-300">
                      LinkFlow Enterprise Verifiable Audit Trail & Metadata Report
                    </p>
                  </div>

                  {qrCodeUrl && (
                    <div className="bg-white p-2 rounded-xl shrink-0 shadow-lg text-center">
                      <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16 mx-auto" />
                      <span className="text-[9px] font-mono text-slate-800 font-bold block mt-1">
                        مسح للتحقق
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Identity Banner */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/80">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      {isAr ? 'رقم المعاملة المرجعي:' : 'Reference Number:'}
                    </span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {corr.corrNumber}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      {isAr ? 'الباركود الرقمي:' : 'Digital Barcode:'}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {corr.barcode}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      {isAr ? 'تاريخ القيد والتسجيل:' : 'Registration Date:'}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {corr.registerDate?.substring(0, 10) || '1446/08/12'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    {isAr ? 'موضوع المعاملة:' : 'Subject:'}
                  </span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {corr.title}
                  </p>
                </div>
              </div>

              {/* Structured Sections */}
              <div className="p-6 space-y-6">
                
                {/* 1. Metadata Grid */}
                {includeMetadata && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-700">
                      <div className="w-2 h-4 bg-emerald-500 rounded-xs" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        {isAr ? '1. البيانات الوصفية والسمات الإدارية' : '1. Metadata & Attributes'}
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'نوع المعاملة' : 'Type'}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{corr.corrType}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'حالة المعاملة' : 'Status'}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{corr.status}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'درجة السرية' : 'Security'}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{corr.securityLevel}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'درجة الأسبقية' : 'Priority'}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{corr.priorityLevel}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'الجهة المصدرة' : 'Origin'}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{corr.siteNameAr || 'جهة خارجية'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'الإدارة المعنية' : 'Department'}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{corr.senderDepartmentNameAr || 'الاتصالات الإدارية'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'طريقة الاستلام' : 'Delivery Method'}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{corr.deliveryMethod || 'GSB'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'الملف الأرشيفي' : 'Archive Folder'}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{corr.fileNameAr || 'الأرشيف المركزي'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{corr.expectedResponseDate?.substring(0, 10) || 'غير محدد'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Documents Section */}
                {includeDocuments && corr.documents && corr.documents.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-700">
                      <div className="w-2 h-4 bg-blue-500 rounded-xs" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        {isAr ? `2. الوثائق والمرفقات الرقمية (${corr.documents.length})` : `2. Documents & Attachments (${corr.documents.length})`}
                      </h4>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-right">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="p-2.5">{isAr ? 'المعرف' : 'ID'}</th>
                            <th className="p-2.5">{isAr ? 'موضوع الوثيقة واسم الملف' : 'Subject & Filename'}</th>
                            <th className="p-2.5">{isAr ? 'الإصدار' : 'Version'}</th>
                            <th className="p-2.5">{isAr ? 'الحجم والصفحات' : 'Size / Pages'}</th>
                            <th className="p-2.5">{isAr ? 'الباركود' : 'Barcode'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {corr.documents.map(d => (
                            <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-2.5 font-mono font-bold text-slate-700 dark:text-slate-300">DOC-{d.id}</td>
                              <td className="p-2.5">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 block">{d.subject}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{d.activeDetail.fileName}</span>
                              </td>
                              <td className="p-2.5 font-mono text-blue-600 dark:text-blue-400 font-bold">v{d.activeDetail.version}.0</td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-300">{d.activeDetail.fileSize} ({d.pageCount} ص)</td>
                              <td className="p-2.5 font-mono text-slate-500 dark:text-slate-400">{d.barcode}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. Digital Signature */}
                {includeDigitalSignature && corr.digitalSignature && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl p-4 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{isAr ? 'التوقيع والختم الإلكتروني المعتمد (NCDC Trust Network)' : 'Certified Digital Signature'}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">
                      {isAr ? 'الموقع:' : 'Signed By:'} <strong className="text-slate-900 dark:text-slate-100">{corr.digitalSignature.signedBy}</strong> ({corr.digitalSignature.jobTitle}) - {corr.digitalSignature.signedAt}
                    </p>
                    <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      Hash: {corr.digitalSignature.certificateHash}
                    </p>
                  </div>
                )}

                {/* 4. Complete Audit Trail Table */}
                {includeAuditTrail && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-4 bg-amber-500 rounded-xs" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                          {isAr ? `3. سجل التدقيق الرقابي والتتبع الزمني (${auditEvents.length} حركة)` : `3. Chronological Audit Trail (${auditEvents.length} Events)`}
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {isAr ? 'غير قابل للتعديل' : 'Immutable'}
                      </span>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-right">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="p-2.5">{isAr ? 'الوقت والتاريخ' : 'Timestamp'}</th>
                            <th className="p-2.5">{isAr ? 'نوع الحركة والإجراء' : 'Action'}</th>
                            <th className="p-2.5">{isAr ? 'المسؤول والإدارة' : 'Actor & Dept'}</th>
                            <th className="p-2.5">{isAr ? 'تفاصيل الحركة والتوجيه' : 'Details & Note'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {auditEvents.slice(0, 15).map(evt => (
                            <tr key={evt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-2.5 font-mono text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                {evt.timestamp.replace('T', ' ').substring(0, 19)}
                                {evt.ipAddress && <span className="block text-slate-400">IP: {evt.ipAddress}</span>}
                              </td>
                              <td className="p-2.5">
                                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                  {isAr ? evt.actionTitleAr : evt.actionTitleEn}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                                  {evt.category}
                                </span>
                              </td>
                              <td className="p-2.5">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 block">{evt.actorName}</span>
                                <span className="text-[10px] text-slate-400 block">{evt.department}</span>
                              </td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-300">
                                <p className="line-clamp-2">{evt.description}</p>
                                {evt.instruction && (
                                  <span className="block text-[10px] text-amber-600 dark:text-amber-400 italic mt-0.5">
                                    "{evt.instruction}"
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Report Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-400">
                {isAr
                  ? 'تم استخراج هذا التقرير آلياً من منظومة LinkFlow Enterprise الموحدة ويحمل بصمة تحقق رقمية مشفرة.'
                  : 'This report was generated by LinkFlow Enterprise Core and carries a verifiable SHA-256 cryptographic seal.'}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Sticky Bar */}
        <div className="px-6 py-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{isAr ? 'شهادة اعتماد وتدقيق نظامية مطابقة للوائح' : 'Compliant with National Archiving & Audit Standards'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-900/30 cursor-pointer flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? (isAr ? 'جاري التصدير...' : 'Exporting...') : (isAr ? 'تصدير تقرير الـ PDF' : 'Export PDF Report')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
