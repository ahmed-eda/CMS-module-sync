import React, { useState } from 'react';
import { X, Share2, CheckSquare, Square, CheckCircle2 } from 'lucide-react';
import { WorkItem } from '../../types/domain';
import { appRepository } from '../../services/store';
import { toast } from '../notifications/ToastContext';

interface DistributeDialogProps {
  item: WorkItem;
  isOpen: boolean;
  onClose: () => void;
  locale: 'ar' | 'en';
}

export const DistributeDialog: React.FC<DistributeDialogProps> = ({ item, isOpen, onClose, locale }) => {
  const isAr = locale === 'ar';
  const departments = appRepository.getDepartments();
  const [selectedDepts, setSelectedDepts] = useState<number[]>([]);
  const [instruction, setInstruction] = useState('للإحاطة والاطلاع وتعميم التوجيهات على منسوبيكم');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleDept = (id: number) => {
    if (selectedDepts.includes(id)) {
      setSelectedDepts(selectedDepts.filter(d => d !== id));
    } else {
      setSelectedDepts([...selectedDepts, id]);
    }
  };

  const selectAll = () => {
    setSelectedDepts(departments.map(d => d.id));
  };

  const clearAll = () => {
    setSelectedDepts([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDepts.length === 0) {
      toast.warning(
        isAr ? 'يرجى اختيار إدارة واحدة على الأقل لتعميم المعاملة إليها' : 'Please select at least one department for broadcast',
        {
          titleAr: 'تنبيه الاختيار',
          titleEn: 'Selection Required'
        }
      );
      return;
    }

    setIsSubmitting(true);
    try {
      appRepository.distributeWorkItem(item.id, selectedDepts, instruction);

      toast.success(
        isAr
          ? `تم بنجاح توزيع وتعميم المعاملة على (${selectedDepts.length}) إدارات مصحوبة بالتأشيرة المعتمدة`
          : `Correspondence broadcasted to (${selectedDepts.length}) departments with official directive`,
        {
          titleAr: 'تم التوزيع والتعميم بنجاح',
          titleEn: 'Broadcast Distributed',
          corrNumber: item.correspondence.corrNumber,
          icon: <Share2 className="w-5 h-5 text-indigo-500" />
        }
      );

      onClose();
    } catch (err: any) {
      toast.error(
        isAr ? `فشل في تعميم المعاملة: ${err.message}` : `Failed to distribute: ${err.message}`,
        {
          titleAr: 'خطأ في عملية التوزيع',
          titleEn: 'Distribution Error',
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
            <Share2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold">{isAr ? 'توزيع وتعميم المعاملة' : 'Distribute & Broadcast'}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isAr ? 'حدد الإدارات الموجه إليها التعميم:' : 'Select Target Departments:'}
            </label>
            <div className="flex items-center gap-2 text-[11px]">
              <button type="button" onClick={selectAll} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer">
                {isAr ? 'تحديد الكل' : 'Select All'}
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button type="button" onClick={clearAll} className="text-slate-500 dark:text-slate-400 hover:underline cursor-pointer">
                {isAr ? 'إلغاء' : 'Clear'}
              </button>
            </div>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/60">
            {departments.map(dept => {
              const isChecked = selectedDepts.includes(dept.id);
              return (
                <div
                  key={dept.id}
                  onClick={() => toggleDept(dept.id)}
                  className={`p-2 rounded-lg text-xs flex items-center gap-2.5 transition cursor-pointer ${
                    isChecked
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold border border-indigo-200 dark:border-indigo-800/60'
                      : 'hover:bg-white dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span>{dept.nameAr}</span>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              {isAr ? 'نص التعميم والتأشيرة الموحدة' : 'Broadcast Directive'}
            </label>
            <textarea
              rows={2}
              value={instruction}
              onChange={e => setInstruction(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none"
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
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAr ? `تعميم على (${selectedDepts.length}) إدارات` : `Distribute (${selectedDepts.length})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
