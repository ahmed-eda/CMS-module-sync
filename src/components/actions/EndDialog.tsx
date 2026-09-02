import React, { useState } from 'react';
import { X, CheckCircle, CheckCircle2 } from 'lucide-react';
import { WorkItem } from '../../types/domain';
import { appRepository } from '../../services/store';
import { toast } from '../notifications/ToastContext';

interface EndDialogProps {
  item: WorkItem;
  isOpen: boolean;
  onClose: () => void;
  locale: 'ar' | 'en';
}

export const EndDialog: React.FC<EndDialogProps> = ({ item, isOpen, onClose, locale }) => {
  const isAr = locale === 'ar';
  const [endReason, setEndReason] = useState('تم استيفاء كافة المتطلبات وإنجاز التوجيهات وحفظ المعاملة');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!endReason.trim()) {
      toast.warning(
        isAr ? 'يرجى كتابة وتوثيق مبررات إقفال وإنهاء المعاملة' : 'Please provide closing resolution remarks',
        {
          titleAr: 'سبب الإقفال مطلوب',
          titleEn: 'Closing Reason Required'
        }
      );
      return;
    }

    setIsSubmitting(true);
    try {
      appRepository.endCorrespondence(item.id, endReason);

      toast.success(
        isAr
          ? `تم بنجاح إقفال وإنهاء دورة عمل المعاملة رقم ${item.correspondence.corrNumber}`
          : `Correspondence ${item.correspondence.corrNumber} completed and closed successfully`,
        {
          titleAr: 'تم إنهاء وإقفال المعاملة',
          titleEn: 'Correspondence Completed',
          corrNumber: item.correspondence.corrNumber,
          icon: <CheckCircle className="w-5 h-5 text-emerald-500" />
        }
      );

      onClose();
    } catch (err: any) {
      toast.error(
        isAr ? `فشل في إنهاء المعاملة: ${err.message}` : `Failed to close: ${err.message}`,
        {
          titleAr: 'خطأ في إقفال المعاملة',
          titleEn: 'Closing Error',
          corrNumber: item.correspondence.corrNumber
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold">{isAr ? 'إنهاء وإقفال المعاملة' : 'End & Close'}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-1">
            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{item.correspondence.corrNumber}</span>
            <p className="text-slate-600 dark:text-slate-400 truncate">{item.correspondence.title}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              {isAr ? 'سبب ومبررات الإقفال والإنهاء *' : 'Closing Reason & Resolution *'}
            </label>
            <textarea
              rows={3}
              value={endReason}
              onChange={e => setEndReason(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

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
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAr ? 'تأكيد الإنهاء والإقفال' : 'Confirm Close'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
