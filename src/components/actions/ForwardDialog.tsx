import React, { useState } from 'react';
import { X, Send, Building, User, Calendar, CheckCircle2 } from 'lucide-react';
import { WorkItem } from '../../types/domain';
import { RouteKind } from '../../types/enums';
import { appRepository } from '../../services/store';
import { CorrespondenceValidator } from '../../services/validation';
import { toast } from '../notifications/ToastContext';

interface ForwardDialogProps {
  item: WorkItem;
  isOpen: boolean;
  onClose: () => void;
  locale: 'ar' | 'en';
}

export const ForwardDialog: React.FC<ForwardDialogProps> = ({ item, isOpen, onClose, locale }) => {
  const isAr = locale === 'ar';
  const departments = appRepository.getDepartments();
  const employees = appRepository.getEmployees();

  const [toDepartmentId, setToDepartmentId] = useState<number>(departments[1]?.id || 2);
  const [toEmployeeId, setToEmployeeId] = useState<number | undefined>(undefined);
  const [routeKind, setRouteKind] = useState<RouteKind>(RouteKind.ActionNeeded);
  const [instructionAr, setInstructionAr] = useState('');
  const [actionRequiredDate, setActionRequiredDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const filteredEmployees = employees.filter(e => e.departmentId === toDepartmentId);
  const targetDept = departments.find(d => d.id === toDepartmentId);
  const targetEmp = employees.find(e => e.id === toEmployeeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = CorrespondenceValidator.validateForward({
      toDepartmentId,
      instructionAr
    });

    if (!val.isValid) {
      setErrors(val.errors);
      toast.warning(
        isAr ? 'يرجى استكمال الحقول الإلزامية للإحالة' : 'Please fill all required forward fields',
        {
          titleAr: 'بيانات غير مكتملة',
          titleEn: 'Validation Incomplete'
        }
      );
      return;
    }

    setIsSubmitting(true);
    try {
      appRepository.forwardWorkItem(item.id, {
        toDepartmentId,
        toEmployeeId: toEmployeeId || undefined,
        routeKind,
        instructionAr,
        actionRequiredDate: actionRequiredDate || undefined
      });

      const recipientText = targetEmp
        ? `${targetEmp.fullNameAr} (${targetDept?.nameAr || ''})`
        : targetDept?.nameAr || 'الإدارة الموجه إليها';

      toast.success(
        isAr
          ? `تمت إحالة المعاملة إلى [${recipientText}] بنجاح`
          : `Correspondence successfully forwarded to [${recipientText}]`,
        {
          titleAr: 'تمت الإحالة والتوجيه بنجاح',
          titleEn: 'Forward Completed',
          corrNumber: item.correspondence.corrNumber,
          icon: <Send className="w-5 h-5 text-blue-500" />
        }
      );

      onClose();
    } catch (err: any) {
      toast.error(
        isAr ? `فشل في إحالة المعاملة: ${err.message}` : `Failed to forward: ${err.message}`,
        {
          titleAr: 'خطأ في الإحالة',
          titleEn: 'Forwarding Error',
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
            <Send className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold">
              {isAr ? 'إحالة وتوجيه المعاملة' : 'Forward Correspondence'}
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

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                {isAr ? 'الإدارة الموجه إليها *' : 'Target Directorate *'}
              </label>
              <select
                value={toDepartmentId}
                onChange={e => {
                  setToDepartmentId(Number(e.target.value));
                  setToEmployeeId(undefined);
                }}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                {isAr ? 'الموظف المختص (اختياري)' : 'Specific Employee (Optional)'}
              </label>
              <select
                value={toEmployeeId || ''}
                onChange={e => setToEmployeeId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="">{isAr ? '-- بدون تحديد موظف (لصندوق الإدارة العام) --' : '-- General Department Inbox --'}</option>
                {filteredEmployees.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.fullNameAr} ({e.jobTitleAr})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {isAr ? 'نوع التوجيه والإجراء' : 'Action Type'}
                </label>
                <select
                  value={routeKind}
                  onChange={e => setRouteKind(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value={RouteKind.ActionNeeded}>{isAr ? 'لاتخاذ اللازم' : 'Action Needed'}</option>
                  <option value={RouteKind.ForInfo}>{isAr ? 'للاطلاع والإحاطة' : 'For Info'}</option>
                  <option value={RouteKind.ForApproval}>{isAr ? 'للاعتماد والتوقيع' : 'For Approval'}</option>
                  <option value={RouteKind.ForStudy}>{isAr ? 'للدراسة وإبداء الرأي' : 'For Study'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {isAr ? 'تاريخ الإنجاز المطلوب' : 'Due Date'}
                </label>
                <input
                  type="date"
                  value={actionRequiredDate}
                  onChange={e => setActionRequiredDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                {isAr ? 'نص التأشيرة والتوجيه *' : 'Instruction Note *'}
              </label>
              <textarea
                rows={3}
                value={instructionAr}
                onChange={e => {
                  setInstructionAr(e.target.value);
                  if (errors.instructionAr) setErrors({ ...errors, instructionAr: '' });
                }}
                placeholder={isAr ? 'اكتب التأشيرة الموجهة للإدارة...' : 'Enter routing remarks...'}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {errors.instructionAr && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{errors.instructionAr}</p>
              )}
            </div>
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
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAr ? 'إرسال الإحالة' : 'Send Forward'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
