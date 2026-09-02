import React, { useState } from 'react';
import { X, FolderArchive, CheckCircle2 } from 'lucide-react';
import { WorkItem } from '../../types/domain';
import { appRepository } from '../../services/store';
import { toast } from '../notifications/ToastContext';

interface ArchiveDialogProps {
  item: WorkItem;
  isOpen: boolean;
  onClose: () => void;
  locale: 'ar' | 'en';
  onNavigateToArchive?: () => void;
}

export const ArchiveDialog: React.FC<ArchiveDialogProps> = ({ item, isOpen, onClose, locale, onNavigateToArchive }) => {
  const isAr = locale === 'ar';
  const folders = appRepository.getFileFolders();
  const [selectedFolderId, setSelectedFolderId] = useState<number>(folders[0]?.id || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const targetFolder = folders.find(f => f.id === selectedFolderId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      appRepository.archiveWorkItem(item.id, selectedFolderId);
      
      const folderName = isAr ? (targetFolder?.titleAr || 'ملف الأرشيف') : (targetFolder?.titleEn || 'Archive Folder');
      
      toast.success(
        isAr
          ? `تم حفظ وأرشفة المعاملة في ملف [${folderName}] بنجاح`
          : `Correspondence successfully archived to [${folderName}]`,
        {
          titleAr: 'تمت الأرشفة بنجاح',
          titleEn: 'Archived to Folder',
          corrNumber: item.correspondence.corrNumber,
          icon: <FolderArchive className="w-5 h-5 text-amber-500" />,
          action: onNavigateToArchive
            ? {
                labelAr: 'عرض ملف الأرشيف',
                labelEn: 'View Archive Folder',
                onClick: onNavigateToArchive
              }
            : undefined
        }
      );

      onClose();
    } catch (err: any) {
      toast.error(
        isAr ? `فشل في أرشفة المعاملة: ${err.message}` : `Failed to archive correspondence: ${err.message}`,
        {
          titleAr: 'تعذر الحفظ في الأرشيف',
          titleEn: 'Archiving Error',
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
            <FolderArchive className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold">{isAr ? 'حفظ وأرشفة المعاملة' : 'Archive to File Folder'}</h3>
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
              {isAr ? 'اختر ملف الحفظ الأرشيفي *' : 'Select Target File Folder *'}
            </label>
            <select
              value={selectedFolderId}
              onChange={e => setSelectedFolderId(Number(e.target.value))}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {folders.map(f => (
                <option key={f.id} value={f.id}>
                  {f.titleAr} ({f.fileNumber}) - {f.storageLocation}
                </option>
              ))}
            </select>
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
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAr ? 'تأكيد الحفظ بالأرشيف' : 'Archive'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
