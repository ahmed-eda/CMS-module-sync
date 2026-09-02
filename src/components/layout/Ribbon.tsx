import React from 'react';
import {
  Send,
  Reply,
  XCircle,
  Share2,
  UserCheck,
  CheckCircle,
  Undo2,
  FolderArchive,
  FileText,
  FileSearch,
  History,
  Trash2,
  RotateCcw,
  PlusCircle,
  RefreshCw,
  Printer,
  Workflow,
  QrCode,
  ShieldCheck,
  FileDown
} from 'lucide-react';
import { WorkItem } from '../../types/domain';

interface RibbonProps {
  selectedItem?: WorkItem;
  locale: 'ar' | 'en';
  onForward: () => void;
  onReply: () => void;
  onRefuse: () => void;
  onDistribute: () => void;
  onAssignSelf: () => void;
  onEnd: () => void;
  onRetrieve: () => void;
  onArchive: () => void;
  onNewNote: () => void;
  onViewDocs: () => void;
  onViewHistory: () => void;
  onViewWorkflow?: () => void;
  onViewQR?: () => void;
  onViewAudit?: () => void;
  onExportPdf?: () => void;
  onDelete: () => void;
  onRecover: () => void;
  onRegisterIncoming: () => void;
  onNewOutgoing: () => void;
  onRefresh: () => void;
  lastSyncTime?: Date;
}

export const Ribbon: React.FC<RibbonProps> = ({
  selectedItem,
  locale,
  onForward,
  onReply,
  onRefuse,
  onDistribute,
  onAssignSelf,
  onEnd,
  onRetrieve,
  onArchive,
  onNewNote,
  onViewDocs,
  onViewHistory,
  onViewWorkflow,
  onViewQR,
  onViewAudit,
  onExportPdf,
  onDelete,
  onRecover,
  onRegisterIncoming,
  onNewOutgoing,
  onRefresh,
  lastSyncTime
}) => {
  const isAr = locale === 'ar';
  const hasSelection = !!selectedItem;
  const isDeleted = selectedItem?.isDeletedFromInbox;

  const formattedSyncTime = lastSyncTime
    ? lastSyncTime.toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs px-4 py-2 select-none overflow-x-auto">
      <div className="flex items-center gap-2 min-w-max">
        {/* Group 1: Creation */}
        <div className="flex items-center gap-1 pr-2 border-r border-slate-200 dark:border-slate-800">
          <button
            onClick={onRegisterIncoming}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition cursor-pointer text-[11px] font-bold group"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1 group-hover:scale-110 transition" />
            <span>{isAr ? 'قيد وارد' : 'Incoming'}</span>
          </button>

          <button
            onClick={onNewOutgoing}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition cursor-pointer text-[11px] font-bold group"
          >
            <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1 group-hover:scale-110 transition" />
            <span>{isAr ? 'إعداد صادر' : 'Outgoing'}</span>
          </button>
        </div>

        {/* Group 2: Workflow & Routing Actions */}
        <div className="flex items-center gap-1 px-2 border-r border-slate-200 dark:border-slate-800">
          <button
            disabled={!hasSelection || isDeleted}
            onClick={onForward}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-[11px] font-semibold"
          >
            <Send className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-1" />
            <span>{isAr ? 'إحالة وتوجيه' : 'Forward'}</span>
          </button>

          <button
            disabled={!hasSelection || isDeleted}
            onClick={onReply}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-[11px] font-semibold"
          >
            <Reply className="w-4 h-4 text-teal-600 dark:text-teal-400 mb-1" />
            <span>{isAr ? 'رد رسمي' : 'Reply'}</span>
          </button>

          <button
            disabled={!hasSelection || isDeleted}
            onClick={onRefuse}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-[11px] font-semibold"
          >
            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mb-1" />
            <span>{isAr ? 'إعادة / رفض' : 'Refuse'}</span>
          </button>

          <button
            disabled={!hasSelection || isDeleted}
            onClick={onDistribute}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-[11px] font-semibold"
          >
            <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mb-1" />
            <span>{isAr ? 'توزيع وتعميم' : 'Distribute'}</span>
          </button>

          <button
            disabled={!hasSelection || isDeleted}
            onClick={onAssignSelf}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-[11px] font-semibold"
          >
            <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 mb-1" />
            <span>{isAr ? 'تخصيص للنفس' : 'Assign Self'}</span>
          </button>

          <button
            disabled={!hasSelection || isDeleted}
            onClick={onEnd}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-[11px] font-semibold"
          >
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
            <span>{isAr ? 'إنهاء وإقفال' : 'End'}</span>
          </button>

          <button
            disabled={!hasSelection || isDeleted}
            onClick={onRetrieve}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-[11px] font-semibold"
          >
            <Undo2 className="w-4 h-4 text-purple-600 dark:text-purple-400 mb-1" />
            <span>{isAr ? 'استرجاع وسحب' : 'Retrieve'}</span>
          </button>
        </div>

        {/* Group 3: Document & History */}
        <div className="flex items-center gap-1 px-2 border-r border-slate-200 dark:border-slate-800">
          <button
            disabled={!hasSelection}
            onClick={onViewWorkflow || onViewHistory}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-[11px] font-bold group"
          >
            <Workflow className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1 group-hover:scale-110 transition" />
            <span>{isAr ? 'مخطط السير' : 'Workflow'}</span>
          </button>

          <button
            id="ribbon-qr-code-btn"
            disabled={!hasSelection}
            onClick={onViewQR}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-[11px] font-bold group"
            title={isAr ? 'إنشاء وعرض رمز الاستجابة السريعة (QR Code) المرتبط بالسجل الرقمي' : 'Generate & view digital record QR Code'}
          >
            <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1 group-hover:scale-110 transition" />
            <span>{isAr ? 'رمز QR والسجل' : 'QR Record'}</span>
          </button>

          <button
            disabled={!hasSelection}
            onClick={onViewDocs}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-[11px] font-semibold"
          >
            <FileSearch className="w-4 h-4 text-slate-700 dark:text-slate-300 mb-1" />
            <span>{isAr ? 'المرفقات والباركود' : 'Documents'}</span>
          </button>

          <button
            disabled={!hasSelection}
            onClick={onViewHistory}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-[11px] font-semibold"
          >
            <History className="w-4 h-4 text-slate-700 dark:text-slate-300 mb-1" />
            <span>{isAr ? 'شجرة المسار' : 'History'}</span>
          </button>

          <button
            disabled={!hasSelection}
            onClick={onViewAudit}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-[11px] font-semibold group"
            title={isAr ? 'عرض سجل التدقيق والرقابة وتتبع العمليات' : 'View Audit Trail & Operations History'}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1 group-hover:scale-110 transition" />
            <span>{isAr ? 'سجل التدقيق' : 'Audit Trail'}</span>
          </button>

          <button
            disabled={!hasSelection}
            onClick={onExportPdf}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-[11px] font-semibold group"
            title={isAr ? 'تصدير تقرير بيانات وسجل المعاملة كملف PDF منظم' : 'Export Metadata & Audit Trail as structured PDF report'}
          >
            <FileDown className="w-4 h-4 text-teal-600 dark:text-teal-400 mb-1 group-hover:scale-110 transition" />
            <span>{isAr ? 'تقرير PDF' : 'PDF Report'}</span>
          </button>

          <button
            disabled={!hasSelection || isDeleted}
            onClick={onArchive}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-[11px] font-semibold"
          >
            <FolderArchive className="w-4 h-4 text-amber-700 dark:text-amber-400 mb-1" />
            <span>{isAr ? 'حفظ بأرشيف' : 'Archive'}</span>
          </button>
        </div>

        {/* Group 4: Utilities */}
        <div className="flex items-center gap-1 pl-2">
          {isDeleted ? (
            <button
              onClick={onRecover}
              className="flex flex-col items-center justify-center p-2 rounded-xl text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer text-[11px] font-semibold"
            >
              <RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
              <span>{isAr ? 'استعادة' : 'Recover'}</span>
            </button>
          ) : (
            <button
              disabled={!hasSelection}
              onClick={onDelete}
              className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-[11px] font-semibold"
            >
              <Trash2 className="w-4 h-4 text-rose-500 mb-1" />
              <span>{isAr ? 'حذف' : 'Delete'}</span>
            </button>
          )}

          <button
            id="ribbon-refresh-btn"
            onClick={onRefresh}
            title={
              isAr
                ? `تحديث القوائم ومزامنة الوارد فورياً (التزامن التلقائي: كل 5 دقائق - آخر تحديث: ${formattedSyncTime || 'الآن'})`
                : `Refresh & sync incoming (Auto-polling every 5 min - Last synced: ${formattedSyncTime || 'now'})`
            }
            className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-[11px] font-semibold relative group"
          >
            <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1 group-hover:rotate-180 transition-transform duration-500" />
            <span>{isAr ? 'تحديث' : 'Refresh'}</span>
            <span
              className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
              title={isAr ? 'الاستطلاع التلقائي نشط (5 دقائق)' : 'Auto-polling active (5m)'}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
