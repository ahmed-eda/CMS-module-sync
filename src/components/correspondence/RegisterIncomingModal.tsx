import React, { useState } from 'react';
import {
  X,
  Plus,
  Upload,
  FileText,
  Shield,
  Clock,
  Building,
  CheckCircle2,
  AlertCircle,
  QrCode
} from 'lucide-react';
import { appRepository } from '../../services/store';
import { CorrespondenceValidator } from '../../services/validation';
import { PriorityLevel, SecurityLevel, DeliveryMethod } from '../../types/enums';
import { Correspondence } from '../../types/domain';
import { toast } from '../notifications/ToastContext';

interface RegisterIncomingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (corr: Correspondence) => void;
  locale: 'ar' | 'en';
}

export const RegisterIncomingModal: React.FC<RegisterIncomingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  locale
}) => {
  const isAr = locale === 'ar';
  const sites = appRepository.getSites();
  const folders = appRepository.getFileFolders();
  const lookups = appRepository.getLookups();

  const [title, setTitle] = useState('');
  const [siteId, setSiteId] = useState<number>(sites[0]?.id || 1);
  const [referenceNo, setReferenceNo] = useState('');
  const [referenceDate, setReferenceDate] = useState(new Date().toISOString().substring(0, 10));
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(DeliveryMethod.ElectronicSystem);
  const [deliveredBy, setDeliveredBy] = useState('');
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>(SecurityLevel.Normal);
  const [priorityLevel, setPriorityLevel] = useState<PriorityLevel>(PriorityLevel.Normal);
  const [fileFolderId, setFileFolderId] = useState<number | undefined>(folders[0]?.id);
  const [expectedResponseDays, setExpectedResponseDays] = useState<number>(5);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Attached files simulation
  const [uploadedFiles, setUploadedFiles] = useState<
    { subject: string; documentType: string; pageCount: number; fileName: string; fileSize: string }[]
  >([
    {
      subject: 'أصل كتاب الوارد الممسوح ضوئياً',
      documentType: 'خطاب رسمي وارد',
      pageCount: 2,
      fileName: 'Scanned_Incoming_Letter.pdf',
      fileSize: '1.4 MB'
    }
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = CorrespondenceValidator.validateIncoming({
      title,
      siteId,
      referenceNo,
      deliveryMethod,
      securityLevel,
      priorityLevel
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.warning(
        isAr ? 'يرجى تصحيح الأخطاء واستكمال الحقول الإلزامية لقيد الوارد' : 'Please check and complete all required incoming fields',
        {
          titleAr: 'تنبيه التحقق من البيانات',
          titleEn: 'Validation Incomplete'
        }
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const newCorr = appRepository.registerIncoming({
        title,
        siteId,
        referenceNo,
        referenceDate,
        deliveryMethod,
        deliveredBy,
        securityLevel,
        priorityLevel,
        fileFolderId,
        expectedResponseDays: Number(expectedResponseDays),
        notes,
        documents: uploadedFiles
      });

      toast.success(
        isAr
          ? `تم قيد المعاملة الواردة برقم (${newCorr.corrNumber}) وتوليد باركود التوثيق بنجاح`
          : `Incoming correspondence registered with number (${newCorr.corrNumber})`,
        {
          titleAr: 'تم قيد الوارد بنجاح',
          titleEn: 'Incoming Registered',
          corrNumber: newCorr.corrNumber,
          icon: <QrCode className="w-5 h-5 text-emerald-500" />
        }
      );

      onSuccess(newCorr);
      onClose();
    } catch (err: any) {
      toast.error(
        isAr ? `فشل في قيد المعاملة الواردة: ${err.message}` : `Failed to register incoming: ${err.message}`,
        {
          titleAr: 'خطأ في قيد الوارد',
          titleEn: 'Registration Error'
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                {isAr ? 'تسجيل وقيد وارد خارجي جديد' : 'Register Incoming Correspondence'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isAr
                  ? 'إصدار رقم قيد موحد وتوليد الباركود وتوثيق بيانات الجهة المصدرة'
                  : 'Assign registry number, issue barcode, and record origin data'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          {/* Section 1: Core Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                {isAr ? 'موضوع المعاملة / عنوان الخطاب *' : 'Correspondence Subject *'}
              </label>
              <input
                type="text"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors({ ...errors, title: '' });
                }}
                placeholder={isAr ? 'اكتب موضوع المعاملة بدقة...' : 'Enter subject...'}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
              {errors.title && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Origin Site */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {isAr ? 'الجهة الخارجية المصدرة *' : 'Origin External Entity *'}
                </label>
                <select
                  value={siteId}
                  onChange={e => setSiteId(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nameAr} ({s.siteTypeNameAr})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reference No */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {isAr ? 'رقم صادر الجهة الخارجية *' : 'Origin External Reference No *'}
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={e => {
                    setReferenceNo(e.target.value);
                    if (errors.referenceNo) setErrors({ ...errors, referenceNo: '' });
                  }}
                  placeholder="e.g. MOF-446-9921"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                {errors.referenceNo && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{errors.referenceNo}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Delivery Method */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {isAr ? 'طريقة التسليم والاستلام' : 'Delivery Method'}
                </label>
                <select
                  value={deliveryMethod}
                  onChange={e => setDeliveryMethod(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {lookups.deliveryMethods.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {isAr ? 'درجة الأسبقية' : 'Priority Level'}
                </label>
                <select
                  value={priorityLevel}
                  onChange={e => setPriorityLevel(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {lookups.priorityLevels.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Security */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {isAr ? 'درجة السرية' : 'Security Clearance'}
                </label>
                <select
                  value={securityLevel}
                  onChange={e => setSecurityLevel(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {lookups.securityLevels.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nameAr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Archive Folder */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {isAr ? 'ملف الحفظ والأرشيف المخصص' : 'Target Archive File Folder'}
                </label>
                <select
                  value={fileFolderId}
                  onChange={e => setFileFolderId(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.titleAr} ({f.fileNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Expected Response SLA */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {isAr ? 'المهلة المطلوبة للرد (أيام عمل SLA)' : 'SLA Response Days'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={expectedResponseDays}
                  onChange={e => setExpectedResponseDays(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                {isAr ? 'شرح وملاحظات إضافية' : 'Additional Remarks'}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={isAr ? 'أي إيضاحات أو توجيهات أولية...' : 'Optional notes...'}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Section 2: Uploaded Documents */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              {isAr ? 'المرفقات والوثائق الممسوحة ضوئياً:' : 'Attached Scanned Documents:'}
            </label>

            <div className="space-y-2">
              {uploadedFiles.map((f, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{f.subject}</span>
                      <div className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">
                        {f.fileName} • {f.fileSize} • {f.pageCount} {isAr ? 'صفحات' : 'pages'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded">
                    {isAr ? 'جاهز للقيد' : 'Ready'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAr ? 'اعتماد وقيد الوارد وتوليد الباركود' : 'Register & Generate Barcode'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
