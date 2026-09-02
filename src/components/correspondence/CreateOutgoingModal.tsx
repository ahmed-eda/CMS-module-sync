import React, { useState } from 'react';
import {
  X,
  Send,
  Building2,
  FileCheck,
  Shield,
  Clock,
  CheckCircle2,
  Lock,
  PenTool
} from 'lucide-react';
import { appRepository } from '../../services/store';
import { CorrespondenceValidator } from '../../services/validation';
import { PriorityLevel, SecurityLevel } from '../../types/enums';
import { Correspondence } from '../../types/domain';
import { toast } from '../notifications/ToastContext';

interface CreateOutgoingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (corr: Correspondence) => void;
  locale: 'ar' | 'en';
}

export const CreateOutgoingModal: React.FC<CreateOutgoingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  locale
}) => {
  const isAr = locale === 'ar';
  const sites = appRepository.getSites();
  const departments = appRepository.getDepartments();
  const folders = appRepository.getFileFolders();
  const lookups = appRepository.getLookups();
  const session = appRepository.getSession();

  const [title, setTitle] = useState('');
  const [siteId, setSiteId] = useState<number>(sites[0]?.id || 1);
  const [senderDepartmentId, setSenderDepartmentId] = useState<number>(session.department.id || departments[0]?.id || 1);
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>(SecurityLevel.Normal);
  const [priorityLevel, setPriorityLevel] = useState<PriorityLevel>(PriorityLevel.Normal);
  const [fileFolderId, setFileFolderId] = useState<number | undefined>(folders[0]?.id);
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = CorrespondenceValidator.validateOutgoing({
      title,
      siteId,
      securityLevel,
      priorityLevel,
      senderDepartmentId
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.warning(
        isAr ? 'يرجى استكمال الحقول الإلزامية لإنشاء وتصدير الخطاب الصادر' : 'Please check required fields for outgoing correspondence',
        {
          titleAr: 'تنبيه التحقق من البيانات',
          titleEn: 'Validation Incomplete'
        }
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const newCorr = appRepository.createOutgoing({
        title,
        siteId,
        senderDepartmentId,
        securityLevel,
        priorityLevel,
        fileFolderId,
        content
      });

      toast.success(
        isAr
          ? `تم بنجاح تصدير الخطاب الصادر برقم (${newCorr.corrNumber}) وتجهيزه للإرسال`
          : `Outgoing correspondence (${newCorr.corrNumber}) drafted and ready for dispatch`,
        {
          titleAr: 'تم إنشاء وتصدير الصادر',
          titleEn: 'Outgoing Created',
          corrNumber: newCorr.corrNumber,
          icon: <Send className="w-5 h-5 text-blue-500" />
        }
      );

      onSuccess(newCorr);
      onClose();
    } catch (err: any) {
      toast.error(
        isAr ? `فشل في تصدير المعاملة: ${err.message}` : `Failed to create outgoing: ${err.message}`,
        {
          titleAr: 'خطأ في إنشاء الصادر',
          titleEn: 'Creation Error'
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
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                {isAr ? 'إعداد وتصدير كتاب صادر خارجي رسمي' : 'Draft & Issue Outgoing Correspondence'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isAr
                  ? 'صياغة الخطاب، إدراج التوقيع الإلكتروني المعتمد، والتصدير عبر منظومة التكامل'
                  : 'Official government outgoing dispatch with digital signature'}
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
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              {isAr ? 'موضوع الكتاب الصادر *' : 'Outgoing Subject *'}
            </label>
            <input
              type="text"
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (errors.title) setErrors({ ...errors, title: '' });
              }}
              placeholder={isAr ? 'اكتب موضوع الصادر بدقة...' : 'Subject of outgoing letter...'}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            {errors.title && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Site */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                {isAr ? 'الجهة الخارجية الموجه إليها *' : 'Target Destination Entity *'}
              </label>
              <select
                value={siteId}
                onChange={e => setSiteId(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {sites.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nameAr} ({s.siteTypeNameAr})
                  </option>
                ))}
              </select>
            </div>

            {/* Sender Dept */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                {isAr ? 'الإدارة الصادر عنها الكتاب' : 'Originating Directorate'}
              </label>
              <select
                value={senderDepartmentId}
                onChange={e => setSenderDepartmentId(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                {isAr ? 'درجة الأسبقية' : 'Priority'}
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
                {isAr ? 'درجة السرية' : 'Clearance'}
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

            {/* Folder */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                {isAr ? 'ملف الحفظ' : 'Archive Folder'}
              </label>
              <select
                value={fileFolderId}
                onChange={e => setFileFolderId(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {folders.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.titleAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Letter Body Text */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              {isAr ? 'نص الكتاب ومحتوى الخطاب' : 'Official Letter Content'}
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={
                isAr
                  ? 'سعادة / معالي ... السلام عليكم ورحمة الله وبركاته، بالإشارة إلى الموضوع أعلاه...'
                  : 'Enter official message body...'
              }
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
            />
          </div>

          {/* Digital Signature Notice */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>
                {isAr
                  ? `سيتم تضمين التوقيع والختم الرقمي المعتمد للمستخدم: ${session.user.fullNameAr}`
                  : `Digital signature of ${session.user.fullNameAr} will be applied`}
              </span>
            </div>
            <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded font-bold text-blue-800 dark:text-blue-300">
              SHA256 Encrypted
            </span>
          </div>

          {/* Actions */}
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
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>{isAr ? 'اعتماد وتصدير الصادر فورياً' : 'Sign & Dispatch Outgoing'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
