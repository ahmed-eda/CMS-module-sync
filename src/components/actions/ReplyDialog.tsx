import React, { useState } from 'react';
import { X, Reply, CheckCircle2 } from 'lucide-react';
import { WorkItem } from '../../types/domain';
import { appRepository } from '../../services/store';
import { toast } from '../notifications/ToastContext';

interface ReplyDialogProps {
  item: WorkItem;
  isOpen: boolean;
  onClose: () => void;
  locale: 'ar' | 'en';
}

export const ReplyDialog: React.FC<ReplyDialogProps> = ({ item, isOpen, onClose, locale }) => {
  const isAr = locale === 'ar';
  const [replyTitle, setReplyTitle] = useState(`رد على: ${item.correspondence.title}`);
  const [replyNotes, setReplyNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyNotes.trim()) {
      toast.warning(
        isAr ? 'يرجى كتابة نص الرد والإفادة الرسمية قبل الإرسال' : 'Please enter official reply remarks before submitting',
        {
          titleAr: 'مطلوب إدخال نص الرد',
          titleEn: 'Reply Text Required'
        }
      );
      return;
    }

    setIsSubmitting(true);
    try {
      appRepository.replyWorkItem(item.id, {
        replyTitle,
        replyNotes
      });

      toast.success(
        isAr
          ? `تم اعتماد وتسجيل الرد الرسمي على المعاملة رقم ${item.correspondence.corrNumber} بنجاح`
          : `Official reply registered and dispatched successfully for ${item.correspondence.corrNumber}`,
        {
          titleAr: 'تم إرسال الرد الرسمي',
          titleEn: 'Reply Submitted',
          corrNumber: item.correspondence.corrNumber,
          icon: <Reply className="w-5 h-5 text-teal-500" />
        }
      );

      onClose();
    } catch (err: any) {
      toast.error(
        isAr ? `فشل في اعتماد الرد: ${err.message}` : `Failed to submit reply: ${err.message}`,
        {
          titleAr: 'خطأ في تسجيل الرد',
          titleEn: 'Reply Submission Error',
          corrNumber: item.correspondence.corrNumber
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Reply className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold">
              {isAr ? 'تسجيل وإرسال رد رسمي' : 'Send Official Reply'}
            </h3>
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
              {isAr ? 'عنوان الرد' : 'Reply Title'}
            </label>
            <input
              type="text"
              value={replyTitle}
              onChange={e => setReplyTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              {isAr ? 'نص الرد والإفادة الرسمية *' : 'Reply Content & Remarks *'}
            </label>
            <textarea
              rows={4}
              value={replyNotes}
              onChange={e => setReplyNotes(e.target.value)}
              placeholder={isAr ? 'اكتب تفاصيل الرد المكتمل...' : 'Enter official reply statement...'}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-teal-500 outline-none"
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
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAr ? 'اعتماد الرد' : 'Submit Reply'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
