import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  CheckCircle2,
  QrCode,
  Shield,
  Layers,
  ExternalLink,
  FileDown
} from 'lucide-react';
import { appRepository } from '../../services/store';
import { toast } from '../notifications/ToastContext';
import { CorrespondenceQRModal } from '../correspondence/CorrespondenceQRModal';
import { MetadataAuditPdfModal } from '../reports/MetadataAuditPdfModal';
import { Correspondence } from '../../types/domain';

interface DocumentViewerModalProps {
  documentId?: number;
  correspondence?: Correspondence;
  isOpen: boolean;
  onClose: () => void;
  locale: 'ar' | 'en';
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  documentId,
  correspondence: passedCorrespondence,
  isOpen,
  onClose,
  locale
}) => {
  const isAr = locale === 'ar';
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [activeVersionIdx, setActiveVersionIdx] = useState(0);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [docQrDataUrl, setDocQrDataUrl] = useState<string>('');

  const doc = documentId ? appRepository.getDocumentById(documentId) : undefined;
  const parentCorr = passedCorrespondence || (documentId ? appRepository.getCorrespondenceByDocumentId(documentId) : undefined);

  useEffect(() => {
    if (!doc && !parentCorr) return;

    const corrNumber = parentCorr ? parentCorr.corrNumber : '1446/IN/00482';
    const chk = doc ? doc.barcode : (parentCorr ? parentCorr.barcode : 'DOC-446-01');
    const corrId = parentCorr ? parentCorr.id : 101;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://linkflow.enterprise.gov.sa';
    
    const qrPayload = `${baseUrl}/records/verify?corrId=${corrId}&corrNumber=${encodeURIComponent(corrNumber)}&chk=${chk}&docId=${doc?.id || 0}`;

    QRCode.toDataURL(qrPayload, {
      width: 250,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => {
        setDocQrDataUrl(url);
      })
      .catch(err => {
        console.error('Failed to generate doc QR:', err);
      });
  }, [doc, parentCorr]);

  if (!isOpen || !documentId) return null;

  if (!doc) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl max-w-sm text-center space-y-3 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {isAr ? 'عذراً، لم يتم العثور على الوثيقة المطلوبة' : 'Document not found'}
          </p>
          <button onClick={onClose} className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer">
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    );
  }

  const allDetails = [doc.activeDetail, ...(doc.historyDetails || [])];
  const detail = allDetails[activeVersionIdx] || doc.activeDetail;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-hidden">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Top bar */}
          <div className="px-6 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs">{doc.subject}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                    v{detail.version}.0
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {detail.fileName} • {detail.fileSize}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-800 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(50, prev - 15))}
                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                  title="تصغير"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono px-1 text-slate-300">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(200, prev + 15))}
                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                  title="تكبير"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  className="p-1 text-slate-400 hover:text-white rounded border-r border-slate-700 mr-1 pr-1 cursor-pointer"
                  title="تدوير"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* QR Code Action Button */}
              <button
                id="doc-viewer-qr-btn"
                onClick={() => setIsQRModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 rounded-xl transition cursor-pointer border border-emerald-500/40 flex items-center gap-1.5 text-xs font-bold"
                title={isAr ? 'عرض وتوليد رمز QR للسجل الرقمي' : 'Generate & view digital record QR Code'}
              >
                <QrCode className="w-4 h-4" />
                <span>{isAr ? 'رمز QR والسجل' : 'QR Record'}</span>
              </button>

              {/* PDF Report Export Button */}
              {parentCorr && (
                <button
                  id="doc-viewer-export-pdf-btn"
                  onClick={() => setIsPdfModalOpen(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl transition cursor-pointer shadow-sm shadow-emerald-950/40 flex items-center gap-1.5 text-xs font-bold"
                  title={isAr ? 'تصدير تقرير بيانات المعاملة وسجل التدقيق كملف PDF رسمي' : 'Export Metadata & Audit Trail as structured PDF report'}
                >
                  <FileDown className="w-4 h-4" />
                  <span>{isAr ? 'تقرير PDF والتدقيق' : 'Export PDF Report'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  toast.info(
                    isAr ? 'جاري تجهيز وإرسال الوثيقة للطباعة الرسمية...' : 'Preparing document for official printing...',
                    {
                      titleAr: 'أمر الطباعة',
                      titleEn: 'Printing Document',
                      duration: 3000
                    }
                  );
                  window.print();
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer border border-slate-700"
                title="طباعة"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer border border-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Document Canvas Preview Area */}
          <div className="flex-1 bg-slate-800 dark:bg-slate-950 overflow-auto p-8 flex items-center justify-center">
            <div
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out'
              }}
              className="w-[600px] min-h-[820px] bg-white shadow-2xl rounded-lg p-10 flex flex-col justify-between relative text-slate-900 border border-slate-300 select-text"
            >
              {/* Document Official Header */}
              <div className="border-b-2 border-slate-900 pb-6 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="font-extrabold text-sm tracking-tight text-slate-900">
                    المملكة العربية السعودية
                  </div>
                  <div className="font-bold text-xs text-slate-800">
                    منظومة LinkFlow Enterprise الموحدة
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    مركز الاتصالات الإدارية والأرشفة الرقمية
                  </div>
                </div>

                {/* Official Barcode Stamp */}
                <div className="text-center p-2 border-2 border-slate-900 rounded-lg bg-slate-50">
                  <div className="font-mono text-xs font-black tracking-widest">{doc.barcode}</div>
                  <div className="h-6 flex items-center justify-center my-1">
                    <div className="w-36 h-4 bg-slate-900 flex items-center justify-center text-[8px] text-white font-mono">
                      ||| | || |||| | ||| || |||
                    </div>
                  </div>
                  <div className="text-[9px] font-mono text-slate-600">
                    {new Date().toISOString().substring(0, 10)}
                  </div>
                </div>
              </div>

              {/* Document Content Body */}
              <div className="my-8 flex-1 space-y-4">
                <div className="text-center font-bold text-base text-slate-900 underline underline-offset-8">
                  {doc.subject}
                </div>

                <p className="text-xs text-slate-800 leading-relaxed indent-6">
                  سعادة / معالي مدير عام الإدارة المعنية المحترم،،،
                  <br />
                  السلام عليكم ورحمة الله وبركاته،،
                </p>

                <p className="text-xs text-slate-700 leading-relaxed text-justify">
                  بالإشارة إلى المعاملة المقيدة في المنظومة برقم {doc.barcode} والوثائق الإلحاقية المرفقة طيه؛
                  نحيطكم علماً بأنه تم تدقيق وتوثيق كافة المسوغات الإدارية والمالية وفقاً لأحدث معايير الأرشفة
                  الإلكترونية وضوابط الحوكمة المؤسسية. نرجو التكرم بالاطلاع وإكمال اللازم حسب الاختصاص النظامي.
                </p>

                {/* Technical Attachment Snapshot Box */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>بيانات التشفير والحفظ السحابي:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-mono">
                    <div>اسم الملف: {detail.fileName}</div>
                    <div>الحجم: {detail.fileSize}</div>
                    <div>تاريخ الرفع: {new Date(detail.uploadedAt).toLocaleDateString('ar-SA')}</div>
                    <div>المسؤول: {detail.uploadedBy}</div>
                  </div>
                </div>
              </div>

              {/* Document Official Footer & Digital Signature */}
              <div className="border-t-2 border-slate-900 pt-6 flex items-end justify-between text-xs">
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500">تم الاعتماد والتوقيع الإلكتروني:</div>
                  <div className="font-bold text-slate-900">م. فيصل بن سلطان الحربي</div>
                  <div className="text-[10px] text-slate-600 font-mono">مدير عام التحول الرقمي وتقنية المعلومات</div>
                </div>

                {/* Interactive Dynamic QR Stamp on Document */}
                <button
                  onClick={() => setIsQRModalOpen(true)}
                  className="text-center group cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-emerald-500/50"
                  title={isAr ? 'انقر لعرض وتفاصيل الرمز الرقمي المشفر' : 'Click to inspect digital QR record'}
                >
                  <div className="w-18 h-18 border-2 border-slate-900 rounded-lg flex flex-col items-center justify-center bg-white text-slate-900 p-1 shadow-xs group-hover:shadow-md transition">
                    {docQrDataUrl ? (
                      <img src={docQrDataUrl} alt="QR Code" className="w-12 h-12 object-contain" />
                    ) : (
                      <QrCode className="w-8 h-8 text-emerald-700" />
                    )}
                    <span className="text-[7px] font-mono font-black text-emerald-800 mt-0.5 tracking-wider">
                      VERIFIED
                    </span>
                  </div>
                  <span className="text-[8px] text-slate-500 group-hover:text-emerald-700 font-bold block mt-0.5">
                    {isAr ? 'رمز التحقق الرقمي' : 'Digital QR'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer info & version switcher */}
          <div className="px-6 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0 text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-400">{isAr ? 'إصدارات الملف:' : 'Versions:'}</span>
              <div className="flex items-center gap-1">
                {allDetails.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => setActiveVersionIdx(i)}
                    className={`px-2 py-1 rounded font-mono text-xs transition cursor-pointer ${
                      activeVersionIdx === i
                        ? 'bg-slate-900 dark:bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    v{v.version}.0
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition cursor-pointer"
            >
              {isAr ? 'إغلاق المعاينة' : 'Close Viewer'}
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Details Modal */}
      {isQRModalOpen && parentCorr && (
        <CorrespondenceQRModal
          correspondence={parentCorr}
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          locale={locale}
        />
      )}

      {/* PDF Export & Audit Trail Report Modal */}
      {isPdfModalOpen && parentCorr && (
        <MetadataAuditPdfModal
          correspondence={parentCorr}
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          locale={locale}
        />
      )}
    </>
  );
};

