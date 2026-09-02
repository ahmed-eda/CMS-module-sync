import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  History,
  Paperclip,
  CheckCircle2,
  Send,
  Building,
  Shield,
  Clock,
  Printer,
  FileCheck2,
  Calendar,
  Layers,
  ArrowRight,
  Workflow,
  QrCode,
  ShieldCheck,
  FileDown
} from 'lucide-react';
import { WorkItem, Correspondence } from '../../types/domain';
import { RouteHistoryTree } from './RouteHistoryTree';
import { WorkflowVisualizer } from './WorkflowVisualizer';
import { CorrespondenceQRModal } from './CorrespondenceQRModal';
import { CorrespondenceAuditTrail } from './CorrespondenceAuditTrail';
import { MetadataAuditPdfModal } from '../reports/MetadataAuditPdfModal';
import { appRepository } from '../../services/store';
import { CorrespondenceCountdownTimer } from './CorrespondenceCountdownTimer';
import { WorkItemStatus } from '../../types/enums';

interface CorrespondenceDetailsModalProps {
  item: WorkItem;
  isOpen: boolean;
  onClose: () => void;
  onOpenDocument: (docId: number) => void;
  onForward: () => void;
  onReply: () => void;
  onRefuse: () => void;
  locale: 'ar' | 'en';
  initialTab?: 'info' | 'workflow' | 'docs' | 'routes' | 'notes' | 'audit';
}

export const CorrespondenceDetailsModal: React.FC<CorrespondenceDetailsModalProps> = ({
  item,
  isOpen,
  onClose,
  onOpenDocument,
  onForward,
  onReply,
  onRefuse,
  locale,
  initialTab = 'info'
}) => {
  const isAr = locale === 'ar';
  const corr = item.correspondence;
  const [activeTab, setActiveTab] = useState<'info' | 'workflow' | 'docs' | 'routes' | 'notes' | 'audit'>(initialTab);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const routes = appRepository.getRoutesForCorr(corr.id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-mono font-bold text-white text-sm shadow-md">
              {corr.corrNumber.split('/')[1] || 'COR'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold">{corr.corrNumber}</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                  Barcode: {corr.barcode}
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate max-w-lg mt-0.5">{corr.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQROpen(true)}
              className="p-2 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title={isAr ? 'إنشاء وعرض رمز QR والتحقق الرقمي' : 'Generate & view digital record QR Code'}
            >
              <QrCode className="w-4 h-4" />
              <span>{isAr ? 'رمز QR والسجل' : 'QR Record'}</span>
            </button>
            <button
              id="details-export-pdf-btn"
              onClick={() => setIsPdfModalOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg transition cursor-pointer shadow-xs flex items-center gap-1.5 text-xs font-bold"
              title={isAr ? 'تصدير تقرير بيانات المعاملة وسجل التدقيق كملف PDF رسمي منظم' : 'Export Metadata & Audit Trail as structured PDF report'}
            >
              <FileDown className="w-4 h-4" />
              <span>{isAr ? 'تقرير PDF والتدقيق' : 'Export PDF Report'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={isAr ? 'طباعة ملصق الباركود والبيانات' : 'Print Slip'}
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 pt-2 flex items-center gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'info'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isAr ? 'البيانات الأساسية' : 'General Info'}</span>
          </button>

          <button
            onClick={() => setActiveTab('workflow')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'workflow'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Workflow className="w-4 h-4 text-emerald-500" />
            <span>{isAr ? 'مخطط سير المعاملة' : 'Workflow Lifecycle'}</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-bold">
              {isAr ? 'تفاعلي' : 'Live'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'docs'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Paperclip className="w-4 h-4" />
            <span>
              {isAr ? 'المرفقات والوثائق' : 'Documents'} ({corr.documents.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('routes')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'routes'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>
              {isAr ? 'شجرة المسار والتأشيرات' : 'Route History'} ({routes.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'audit'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{isAr ? 'سجل التدقيق والرقابة (Audit Trail)' : 'Audit Trail'}</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-bold">
              {isAr ? 'موثق' : 'Verified'}
            </span>
          </button>

          {corr.presentationNotes && corr.presentationNotes.length > 0 && (
            <button
              onClick={() => setActiveTab('notes')}
              className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'notes'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>
                {isAr ? 'مذكرات العرض' : 'Presentation Notes'} ({corr.presentationNotes.length})
              </span>
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-white dark:bg-slate-900">
          {activeTab === 'workflow' && (
            <div className="space-y-4">
              <WorkflowVisualizer
                correspondence={corr}
                routes={routes}
                locale={locale}
              />
            </div>
          )}
          {activeTab === 'info' && (
            <div className="space-y-5">
              {/* Subject box */}
              <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono">
                  {isAr ? 'موضوع المعاملة' : 'Subject'}
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">{corr.title}</p>
              </div>

              {/* Impending SLA Deadline Countdown Card */}
              {corr.expectedResponseDate && (
                <CorrespondenceCountdownTimer
                  expectedResponseDate={corr.expectedResponseDate}
                  registerDate={corr.registerDate}
                  isReplied={corr.isReplied}
                  isCompleted={corr.status === WorkItemStatus.Completed}
                  locale={locale}
                  variant="card"
                />
              )}

              {/* Data Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] mb-0.5">
                    {isAr ? 'الجهة المصدرة / الطالبة' : 'Origin / Source'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {corr.siteNameAr || corr.senderDepartmentNameAr || '---'}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] mb-0.5">
                    {isAr ? 'رقم قيد/صادر الجهة' : 'Origin Ref No'}
                  </span>
                  <span className="font-bold font-mono text-slate-900 dark:text-slate-100">{corr.referenceNo || '---'}</span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] mb-0.5">
                    {isAr ? 'تاريخ القيد والتسجيل' : 'Registration Date'}
                  </span>
                  <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                    {new Date(corr.registerDate).toLocaleString(isAr ? 'ar-SA' : 'en-US')}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] mb-0.5">
                    {isAr ? 'ملف الحفظ والأرشيف' : 'Archive Folder'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
                    {corr.fileNameAr || (isAr ? 'غير مخصص' : 'Unassigned')}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] mb-0.5">
                    {isAr ? 'مهلة الرد المتوقعة (SLA)' : 'Expected SLA Date'}
                  </span>
                  <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                    {corr.expectedResponseDate
                      ? new Date(corr.expectedResponseDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')
                      : isAr
                      ? 'غير محدد'
                      : 'None'}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] mb-0.5">
                    {isAr ? 'طريقة الاستلام / التسليم' : 'Delivery Method'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{corr.deliveredBy || 'منظومة إلكترونية'}</span>
                </div>
              </div>

              {/* Digital Signature Card */}
              {corr.digitalSignature && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-950 dark:text-emerald-200">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{isAr ? 'اعتماد التوقيع الإلكتروني الحكومي الموثق' : 'Official Digital Signature'}</span>
                    </div>
                    <span className="font-mono text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded">
                      VERIFIED
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-emerald-900 dark:text-emerald-300">
                    <div>
                      <span className="text-emerald-700 dark:text-emerald-400 block text-[10px]">الموقّع:</span>
                      <span className="font-semibold">{corr.digitalSignature.signedBy}</span>
                    </div>
                    <div>
                      <span className="text-emerald-700 dark:text-emerald-400 block text-[10px]">الصفة / المنصب:</span>
                      <span className="font-semibold">{corr.digitalSignature.jobTitle}</span>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 truncate">
                    Cert: {corr.digitalSignature.certificateHash}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-3">
              {corr.documents.map(doc => (
                <div
                  key={doc.id}
                  className="p-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between hover:border-emerald-500 dark:hover:border-emerald-500 transition shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{doc.subject}</span>
                      <div className="text-[11px] text-slate-400 dark:text-slate-400 font-mono mt-0.5">
                        {doc.activeDetail.fileName} • {doc.activeDetail.fileSize} • v{doc.activeDetail.version}.0
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenDocument(doc.id)}
                    className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    {isAr ? 'معاينة الوثيقة' : 'View File'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'routes' && <RouteHistoryTree routes={routes} locale={locale} />}

          {activeTab === 'notes' && corr.presentationNotes && (
            <div className="space-y-4">
              {corr.presentationNotes.map(note => (
                <div key={note.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{note.subject}</span>
                    <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                      {note.decisionStatus || 'APPROVED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{note.content}</p>
                  {note.recommendation && (
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-xs text-emerald-900 dark:text-emerald-300">
                      <span className="font-bold block mb-0.5">التوصية المقترحة:</span>
                      <span>{note.recommendation}</span>
                    </div>
                  )}
                  {note.decisionNote && (
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-lg text-xs text-blue-900 dark:text-blue-300">
                      <span className="font-bold block mb-0.5">قرار وتوجيه معالي الرئيس:</span>
                      <span>{note.decisionNote}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'audit' && (
            <CorrespondenceAuditTrail
              correspondence={corr}
              routes={routes}
              locale={locale}
              onOpenDocument={onOpenDocument}
            />
          )}
        </div>

        {/* Footer Quick Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onForward();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isAr ? 'إحالة وتوجيه' : 'Forward'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onReply();
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>{isAr ? 'رد رسمي' : 'Reply'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onRefuse();
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>{isAr ? 'رفض وإعادة' : 'Refuse'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>

      {/* QR Code Details Modal */}
      {isQROpen && (
        <CorrespondenceQRModal
          correspondence={corr}
          isOpen={isQROpen}
          onClose={() => setIsQROpen(false)}
          locale={locale}
        />
      )}

      {/* PDF Export & Audit Trail Report Modal */}
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
