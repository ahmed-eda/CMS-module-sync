import React, { useState } from 'react';
import { X, XCircle, AlertTriangle } from 'lucide-react';
import { WorkItem } from '../../types/domain';
import { appRepository } from '../../services/store';
import { toast } from '../notifications/ToastContext';

interface RefuseDialogProps {
  item: WorkItem;
  isOpen: boolean;
  onClose: () => void;
  locale: 'ar' | 'en';
}

export const RefuseDialog: React.FC<RefuseDialogProps> = ({ item, isOpen, onClose, locale }) => {
  const isAr = locale === 'ar';
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.warning(
        isAr ? 'يرجى توضيح وكتابة أسباب الرفض أو عدم الاختصاص' : 'Please provide refusal or lack-of-jurisdiction reasons',
        {
          titleAr: 'سبب الإعادة مطلوب',
          titleEn: 'Reason Required'
        }
      );
      return;
    }

    setIsSubmitting(true);
    try {
      appRepository.refuseWorkItem(item.id, reason);

      toast.warning(
        isAr
          ? `تمت إعادة ورفض استلام المعاملة رقم ${item.correspondence.corrNumber} وإعادتها للجهة المرسلة`
          : `Correspondence ${item.correspondence.corrNumber} returned to sender with justification`,
        {
          titleAr: 'تمت إعادة المعاملة',
          titleEn: 'Correspondence Returned',
          corrNumber: item.correspondence.corrNumber,
          icon: <XCircle className="w-5 h-5 text-rose-500" />
        }
      );

      onClose();
    } catch (err: any) {
      toast.error(
        isAr ? `فشل في إعادة المعاملة: ${err.message}` : `Failed to return: ${err.message}`,
        {
          titleAr: 'خطأ في إعادة المعاملة',
          titleEn: 'Return Error',
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
            <XCircle className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold">{isAr ? 'إعادة ورفض المعاملة' : 'Refuse & Return'}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs space-y-1 text-rose-950 dark:text-rose-200">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>{isAr ? 'تنبيه: سيتم إعادة المعاملة للإدارة المرسلة' : 'Will return to sender'}</span>
            </div>
            <p className="text-[11px] text-rose-800 dark:text-rose-300">
              {item.correspondence.corrNumber} - {item.correspondence.title}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              {isAr ? 'أسباب الرفض أو عدم الاختصاص *' : 'Refusal Reason *'}
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={isAr ? 'اكتب المبررات الإدارية أو النواقص...' : 'Specify reasons...'}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-rose-500 outline-none"
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
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 rounded-xl shadow-md transition cursor-pointer"
            >
              <span>{isAr ? 'تأكيد الرفض والإعادة' : 'Confirm Refusal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
