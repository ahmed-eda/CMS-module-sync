import React, { useEffect, useState, useMemo } from 'react';
import {
  Star,
  Clock,
  AlertTriangle,
  FileText,
  Building,
  CheckCircle2,
  Paperclip,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Send,
  Eye,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  RotateCcw,
  LayoutList,
  Table as TableIcon,
  Shield,
  Layers,
  Sparkles,
  Mail,
  MailOpen,
  CheckCheck,
  Timer,
  Hourglass
} from 'lucide-react';
import { WorkItem } from '../../types/domain';
import {
  CorrespondenceType,
  PriorityLevel,
  SecurityLevel,
  WorkItemStatus
} from '../../types/enums';
import { appRepository } from '../../services/store';
import { CorrespondenceCountdownTimer } from '../correspondence/CorrespondenceCountdownTimer';

export type SortColumn =
  | 'date'
  | 'priority'
  | 'sender'
  | 'corrNumber'
  | 'title'
  | 'security'
  | 'importance'
  | 'deadline';

export type SortOrder = 'asc' | 'desc';

interface InboxViewProps {
  workItems: WorkItem[];
  selectedItem?: WorkItem;
  onSelectItem: (item: WorkItem) => void;
  onOpenDetails: (item: WorkItem) => void;
  currentView: string;
  onViewChange: (view: string) => void;
  locale: 'ar' | 'en';
}

const getPriorityWeight = (p: PriorityLevel): number => {
  switch (p) {
    case PriorityLevel.Immediate:
      return 4;
    case PriorityLevel.TopUrgent:
      return 3;
    case PriorityLevel.Urgent:
      return 2;
    case PriorityLevel.Normal:
    default:
      return 1;
  }
};

const getSecurityWeight = (s: SecurityLevel): number => {
  switch (s) {
    case SecurityLevel.Secret:
      return 4;
    case SecurityLevel.TopConfidential:
      return 3;
    case SecurityLevel.Confidential:
      return 2;
    case SecurityLevel.Normal:
    default:
      return 1;
  }
};

const getSenderName = (item: WorkItem, isAr: boolean): string => {
  const corr = item.correspondence;
  return corr.siteNameAr || corr.senderDepartmentNameAr || (isAr ? 'جهة غير محددة' : 'Unspecified');
};

export const InboxView: React.FC<InboxViewProps> = ({
  workItems,
  selectedItem,
  onSelectItem,
  onOpenDetails,
  currentView,
  onViewChange,
  locale
}) => {
  const isAr = locale === 'ar';

  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<'split' | 'table'>('split');

  // Sort toggle handler
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      // For date, priority, security, importance default to desc (highest/newest first), for text default to asc
      if (['date', 'priority', 'security', 'importance'].includes(column)) {
        setSortOrder('desc');
      } else {
        setSortOrder('asc');
      }
    }
  };

  const resetSort = () => {
    setSortColumn('date');
    setSortOrder('desc');
  };

  // Memoized sorted work-items
  const sortedWorkItems = useMemo(() => {
    const list = [...workItems];
    return list.sort((a, b) => {
      let result = 0;
      switch (sortColumn) {
        case 'date': {
          const dateA = new Date(a.receiveDate || a.correspondence.registerDate).getTime();
          const dateB = new Date(b.receiveDate || b.correspondence.registerDate).getTime();
          result = dateA - dateB;
          break;
        }
        case 'priority': {
          const pA = getPriorityWeight(a.correspondence.priorityLevel);
          const pB = getPriorityWeight(b.correspondence.priorityLevel);
          result = pA - pB;
          break;
        }
        case 'sender': {
          const sA = getSenderName(a, isAr);
          const sB = getSenderName(b, isAr);
          result = sA.localeCompare(sB, isAr ? 'ar' : 'en', { numeric: true, sensitivity: 'base' });
          break;
        }
        case 'corrNumber': {
          result = (a.correspondence.corrNumber || '').localeCompare(
            b.correspondence.corrNumber || '',
            undefined,
            { numeric: true }
          );
          break;
        }
        case 'title': {
          const tA = (a.correspondence.title || '').trim();
          const tB = (b.correspondence.title || '').trim();
          result = tA.localeCompare(tB, isAr ? 'ar' : 'en', { numeric: true, sensitivity: 'base' });
          break;
        }
        case 'security': {
          const secA = getSecurityWeight(a.correspondence.securityLevel);
          const secB = getSecurityWeight(b.correspondence.securityLevel);
          result = secA - secB;
          break;
        }
        case 'importance': {
          const impA = a.isImportant ? 1 : 0;
          const impB = b.isImportant ? 1 : 0;
          result = impA - impB;
          break;
        }
        case 'deadline': {
          const dateA = a.correspondence.expectedResponseDate
            ? new Date(a.correspondence.expectedResponseDate).getTime()
            : 9999999999999;
          const dateB = b.correspondence.expectedResponseDate
            ? new Date(b.correspondence.expectedResponseDate).getTime()
            : 9999999999999;
          result = dateA - dateB;
          break;
        }
        default:
          result = 0;
      }

      return sortOrder === 'asc' ? result : -result;
    });
  }, [workItems, sortColumn, sortOrder, isAr]);

  // Unread items count in active sorted view
  const unreadCount = useMemo(() => {
    return sortedWorkItems.filter(w => !w.isRead).length;
  }, [sortedWorkItems]);

  // Urgent/Immediate items count in active sorted view
  const urgentCount = useMemo(() => {
    return sortedWorkItems.filter(
      w =>
        w.correspondence.priorityLevel === PriorityLevel.Immediate ||
        w.correspondence.priorityLevel === PriorityLevel.TopUrgent ||
        w.correspondence.priorityLevel === PriorityLevel.Urgent
    ).length;
  }, [sortedWorkItems]);

  // Keyboard navigation (j/k or down/up, Enter to open, m/u to toggle read)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      if (sortedWorkItems.length === 0) return;

      const currentIndex = sortedWorkItems.findIndex(w => w.id === selectedItem?.id);
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < sortedWorkItems.length - 1 ? currentIndex + 1 : 0;
        onSelectItem(sortedWorkItems[nextIndex]);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : sortedWorkItems.length - 1;
        onSelectItem(sortedWorkItems[prevIndex]);
      } else if (e.key === 'Enter' && selectedItem) {
        e.preventDefault();
        onOpenDetails(selectedItem);
      } else if ((e.key === 'm' || e.key === 'M' || e.key === 'u' || e.key === 'U') && selectedItem) {
        e.preventDefault();
        appRepository.toggleReadStatus(selectedItem.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sortedWorkItems, selectedItem, onSelectItem, onOpenDetails]);

  const viewTabs = [
    { id: 'all', label: isAr ? 'الكل' : 'All' },
    { id: 'unread', label: isAr ? 'غير مقروء' : 'Unread' },
    { id: 'important', label: isAr ? 'هام' : 'Important' },
    { id: 'urgent', label: isAr ? 'عاجل وطارئ' : 'Urgent' },
    { id: 'reply-requested', label: isAr ? 'بانتظار الرد (SLA)' : 'Pending SLA' },
    { id: 'internal', label: isAr ? 'مذكرات داخلية' : 'Internal' },
    { id: 'external', label: isAr ? 'وارد وصادر' : 'External' },
    { id: 'deleted', label: isAr ? 'المحذوفات' : 'Trash' }
  ];

  // Visual colored indicator dot based on PriorityLevel
  const renderPriorityDot = (p: PriorityLevel, showPing = true) => {
    switch (p) {
      case PriorityLevel.Immediate:
        return (
          <span
            className="relative flex h-2.5 w-2.5 shrink-0"
            title={isAr ? 'درجة الأولوية: فوري / طارئ' : 'Priority: Immediate'}
          >
            {showPing && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            )}
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600 dark:bg-rose-500 shadow-xs shadow-rose-500/50" />
          </span>
        );
      case PriorityLevel.TopUrgent:
        return (
          <span
            className="relative flex h-2.5 w-2.5 shrink-0"
            title={isAr ? 'درجة الأولوية: عاجل جداً' : 'Priority: Top Urgent'}
          >
            <span className="inline-flex rounded-full h-2.5 w-2.5 bg-red-600 dark:bg-red-500 ring-2 ring-red-100 dark:ring-red-950/80" />
          </span>
        );
      case PriorityLevel.Urgent:
        return (
          <span
            className="relative flex h-2.5 w-2.5 shrink-0"
            title={isAr ? 'درجة الأولوية: عاجل' : 'Priority: Urgent'}
          >
            <span className="inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 dark:bg-amber-400 ring-2 ring-amber-100 dark:ring-amber-950/80" />
          </span>
        );
      case PriorityLevel.Normal:
      default:
        return (
          <span
            className="relative flex h-2 w-2 shrink-0"
            title={isAr ? 'درجة الأولوية: عادي' : 'Priority: Normal'}
          >
            <span className="inline-flex rounded-full h-2 w-2 bg-slate-300 dark:bg-slate-600" />
          </span>
        );
    }
  };

  const getPriorityBadge = (p: PriorityLevel) => {
    switch (p) {
      case PriorityLevel.Immediate:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shrink-0 flex items-center gap-1.5 shadow-2xs">
            {renderPriorityDot(PriorityLevel.Immediate, true)}
            <span>{isAr ? 'فوري / طارئ' : 'Immediate'}</span>
          </span>
        );
      case PriorityLevel.TopUrgent:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/60 shrink-0 flex items-center gap-1.5 shadow-2xs">
            {renderPriorityDot(PriorityLevel.TopUrgent, false)}
            <span>{isAr ? 'عاجل جداً' : 'Top Urgent'}</span>
          </span>
        );
      case PriorityLevel.Urgent:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shrink-0 flex items-center gap-1.5 shadow-2xs">
            {renderPriorityDot(PriorityLevel.Urgent, false)}
            <span>{isAr ? 'عاجل' : 'Urgent'}</span>
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 flex items-center gap-1.5">
            {renderPriorityDot(PriorityLevel.Normal, false)}
            <span>{isAr ? 'عادي' : 'Normal'}</span>
          </span>
        );
    }
  };

  const getSecurityBadge = (s: SecurityLevel) => {
    switch (s) {
      case SecurityLevel.Secret:
      case SecurityLevel.TopConfidential:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 flex items-center gap-1 shrink-0">
            <ShieldAlert className="w-3 h-3" />
            <span>{isAr ? 'سري للغاية' : 'Top Secret'}</span>
          </span>
        );
      case SecurityLevel.Confidential:
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shrink-0">
            {isAr ? 'سري' : 'Confidential'}
          </span>
        );
      default:
        return null;
    }
  };

  const getCorrTypeBadge = (t: CorrespondenceType) => {
    switch (t) {
      case CorrespondenceType.Incoming:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0">
            {isAr ? 'وارد خارجي' : 'Incoming'}
          </span>
        );
      case CorrespondenceType.Outgoing:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 shrink-0">
            {isAr ? 'صادر خارجي' : 'Outgoing'}
          </span>
        );
      case CorrespondenceType.InternalPresentation:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 shrink-0">
            {isAr ? 'مذكرة عرض' : 'Presentation Note'}
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 shrink-0">
            {isAr ? 'تعميم' : 'Circular'}
          </span>
        );
    }
  };

  // Helper to render sort icon for headers
  const renderSortIndicator = (column: SortColumn) => {
    const isActive = sortColumn === column;
    if (!isActive) {
      return (
        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      );
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
    );
  };

  // Get active sort column name for the summary pill
  const getSortColumnLabel = (col: SortColumn) => {
    switch (col) {
      case 'date':
        return isAr ? 'التاريخ' : 'Date';
      case 'priority':
        return isAr ? 'الأولوية' : 'Priority';
      case 'sender':
        return isAr ? 'الجهة المصدرة / الراسل' : 'Sender';
      case 'corrNumber':
        return isAr ? 'رقم المعاملة' : 'Number';
      case 'title':
        return isAr ? 'الموضوع' : 'Subject';
      case 'security':
        return isAr ? 'درجة السرية' : 'Security';
      case 'importance':
        return isAr ? 'المميزة بنجمة' : 'Starred';
      case 'deadline':
        return isAr ? 'المهلة والعد التنازلي' : 'SLA Deadline';
      default:
        return col;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 overflow-hidden select-none">
      {/* Top Header: Sub-view Filter Tabs & Control Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-2 flex flex-wrap items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2">
          {viewTabs.map(tab => (
            <button
              key={tab.id}
              id={`inbox-tab-${tab.id}`}
              onClick={() => onViewChange(tab.id)}
              className={`pb-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                currentView === tab.id
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Mode, Read Actions & Sorting Overview */}
        <div className="flex items-center gap-2 pb-2 flex-wrap">
          {/* Selected Item Read/Unread Toggle Quick Action */}
          {selectedItem && (
            <button
              id="inbox-toggle-read-btn"
              onClick={() => appRepository.toggleReadStatus(selectedItem.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border shadow-xs ${
                selectedItem.isRead
                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80'
              }`}
              title={
                isAr
                  ? (selectedItem.isRead ? 'تعيين المعاملة المحددة كغير مقروءة (اختصار: M)' : 'تعيين المعاملة المحددة كمقروءة (اختصار: M)')
                  : (selectedItem.isRead ? 'Mark selected item as unread (Shortcut: M)' : 'Mark selected item as read (Shortcut: M)')
              }
            >
              {selectedItem.isRead ? (
                <>
                  <Mail className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>{isAr ? 'تعيين كغير مقروء' : 'Mark Unread'}</span>
                </>
              ) : (
                <>
                  <MailOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isAr ? 'تعيين كمقروء' : 'Mark Read'}</span>
                </>
              )}
              <kbd className="hidden sm:inline-block text-[10px] font-mono px-1 py-0.2 bg-black/5 dark:bg-white/10 rounded">
                M
              </kbd>
            </button>
          )}

          {/* Mark All as Read in current view */}
          {unreadCount > 0 && (
            <button
              id="inbox-mark-all-read-btn"
              onClick={() => appRepository.markAllAsRead()}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              title={
                isAr
                  ? `تحديد كافة معاملات الصندوق غير المقروءة (${unreadCount}) كمقروءة`
                  : `Mark all ${unreadCount} unread items as read`
              }
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline text-[11px] font-medium">
                {isAr ? `تحديد الكل كمقروء (${unreadCount})` : `Mark All Read (${unreadCount})`}
              </span>
            </button>
          )}

          {/* Urgent items badge if urgent tasks exist */}
          {urgentCount > 0 && (
            <div
              className="flex items-center gap-1.5 text-xs bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 px-2.5 py-1 rounded-lg shadow-2xs font-semibold"
              title={
                isAr
                  ? `يوجد ${urgentCount} معاملة ذات أولوية عاجلة / طارئة تتطلب انتباهاً سريعاً`
                  : `${urgentCount} urgent/immediate tasks require prompt attention`
              }
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600 dark:bg-rose-500" />
              </span>
              <span className="text-[11px]">
                {isAr ? `${urgentCount} عاجل وطارئ` : `${urgentCount} Urgent`}
              </span>
            </div>
          )}

          {/* Active Sort Pill with Reset */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {isAr ? 'الترتيب:' : 'Sort:'}{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {getSortColumnLabel(sortColumn)}
              </strong>{' '}
              ({sortOrder === 'asc' ? (isAr ? 'تصاعدي ↑' : 'Asc ↑') : (isAr ? 'تنازلي ↓' : 'Desc ↓')})
            </span>
            {(sortColumn !== 'date' || sortOrder !== 'desc') && (
              <button
                id="inbox-reset-sort-btn"
                onClick={resetSort}
                title={isAr ? 'إعادة الترتيب الافتراضي (الأحدث أولاً)' : 'Reset default sort'}
                className="p-0.5 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View Mode Toggle: Split List vs Full Table */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              id="inbox-view-mode-split"
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={isAr ? 'عرض القائمة مع لوحة المعاينة السريعة' : 'Split View with Inspector'}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] font-semibold">{isAr ? 'مقسم' : 'Split'}</span>
            </button>
            <button
              id="inbox-view-mode-table"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={isAr ? 'عرض جدول بيانات موسع' : 'Expanded Table Grid'}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] font-semibold">{isAr ? 'جدول كامل' : 'Grid'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'split' ? (
        /* Split Layout: Left List with Sortable Header + Right Inspector */
        <div className="flex-1 flex min-h-0">
          {/* Work-Items Column */}
          <div className="w-full md:w-3/5 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col min-h-0">
            {/* Interactive Column Sort Headers Bar for Split List */}
            <div className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 px-3.5 py-2 flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 select-none shrink-0">
              <div className="flex items-center gap-2">
                {/* Star / Importance Header */}
                <button
                  id="inbox-sort-star"
                  onClick={() => handleSort('importance')}
                  className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1 group ${
                    sortColumn === 'importance'
                      ? 'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                      : 'text-slate-400'
                  }`}
                  title={isAr ? 'ترتيب حسب المعاملات المميزة بنجمة' : 'Sort by Starred'}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {renderSortIndicator('importance')}
                </button>

                {/* Number / Code Header */}
                <button
                  id="inbox-sort-corrnumber"
                  onClick={() => handleSort('corrNumber')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer group ${
                    sortColumn === 'corrNumber'
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 font-black'
                      : ''
                  }`}
                  title={isAr ? 'ترتيب حسب رقم المعاملة' : 'Sort by Correspondence Number'}
                >
                  <span>{isAr ? 'الرقم / النوع' : 'Number / Type'}</span>
                  {renderSortIndicator('corrNumber')}
                </button>

                {/* Title / Subject Header */}
                <button
                  id="inbox-sort-title"
                  onClick={() => handleSort('title')}
                  className={`px-2 py-1 rounded hidden sm:flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer group ${
                    sortColumn === 'title'
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 font-black'
                      : ''
                  }`}
                  title={isAr ? 'ترتيب حسب موضوع المعاملة' : 'Sort by Subject'}
                >
                  <span>{isAr ? 'الموضوع' : 'Subject'}</span>
                  {renderSortIndicator('title')}
                </button>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-3">
                {/* Sender / Origin Header */}
                <button
                  id="inbox-sort-sender"
                  onClick={() => handleSort('sender')}
                  className={`px-2 py-1 rounded hidden sm:flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer group ${
                    sortColumn === 'sender'
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 font-black'
                      : ''
                  }`}
                  title={isAr ? 'ترتيب حسب الجهة المصدرة أو الراسل' : 'Sort by Sender / Origin'}
                >
                  <Building className="w-3 h-3 text-slate-400" />
                  <span>{isAr ? 'الجهة / الراسل' : 'Sender'}</span>
                  {renderSortIndicator('sender')}
                </button>

                {/* Priority Header */}
                <button
                  id="inbox-sort-priority"
                  onClick={() => handleSort('priority')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer group ${
                    sortColumn === 'priority'
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 font-black'
                      : ''
                  }`}
                  title={isAr ? 'ترتيب حسب درجة الأولوية والاستعجال' : 'Sort by Priority'}
                >
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span>{isAr ? 'الأولوية' : 'Priority'}</span>
                  {renderSortIndicator('priority')}
                </button>

                {/* Date Header */}
                <button
                  id="inbox-sort-date"
                  onClick={() => handleSort('date')}
                  className={`px-2 py-1 rounded flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer group ${
                    sortColumn === 'date'
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 font-black'
                      : ''
                  }`}
                  title={isAr ? 'ترتيب حسب تاريخ الاستلام والقيد' : 'Sort by Date'}
                >
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{isAr ? 'التاريخ' : 'Date'}</span>
                  {renderSortIndicator('date')}
                </button>
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
              {sortedWorkItems.length === 0 ? (
                <div className="p-16 text-center text-slate-400 dark:text-slate-500 space-y-2">
                  <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 stroke-1" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {isAr ? 'لا توجد معاملات في هذا الصندوق حالياً' : 'No correspondences found'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {isAr
                      ? 'يمكنك قيد معاملة وارد أو إعداد صادر جديد من شريط الأوامر.'
                      : 'Register an incoming or outgoing item.'}
                  </p>
                </div>
              ) : (
                sortedWorkItems.map(item => {
                  const isSelected = selectedItem?.id === item.id;
                  const isUnread = !item.isRead;
                  const priority = item.correspondence.priorityLevel;

                  // Priority-based accent border and subtle background highlight
                  let rowPriorityClass = '';
                  if (isSelected) {
                    rowPriorityClass =
                      'bg-emerald-50/90 dark:bg-emerald-950/40 border-s-4 border-s-emerald-600 dark:border-s-emerald-500 shadow-xs';
                  } else if (priority === PriorityLevel.Immediate) {
                    rowPriorityClass = `bg-rose-50/60 dark:bg-rose-950/25 hover:bg-rose-100/70 dark:hover:bg-rose-900/35 border-s-4 border-s-rose-500 shadow-2xs ${
                      isUnread ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-800 dark:text-slate-200'
                    }`;
                  } else if (priority === PriorityLevel.TopUrgent) {
                    rowPriorityClass = `bg-red-50/45 dark:bg-red-950/20 hover:bg-red-100/60 dark:hover:bg-red-900/30 border-s-4 border-s-red-500 ${
                      isUnread ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-800 dark:text-slate-200'
                    }`;
                  } else if (priority === PriorityLevel.Urgent) {
                    rowPriorityClass = `bg-amber-50/35 dark:bg-amber-950/15 hover:bg-amber-100/50 dark:hover:bg-amber-900/25 border-s-4 border-s-amber-500 ${
                      isUnread ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-800 dark:text-slate-200'
                    }`;
                  } else {
                    rowPriorityClass = `bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-s-4 border-s-transparent ${
                      isUnread ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'
                    }`;
                  }

                  return (
                    <div
                      key={item.id}
                      id={`inbox-item-${item.id}`}
                      onClick={() => {
                        onSelectItem(item);
                        if (!item.isRead) appRepository.markAsRead(item.id);
                      }}
                      onDoubleClick={() => onOpenDetails(item)}
                      className={`p-3.5 transition cursor-pointer relative flex items-start gap-3 ${rowPriorityClass}`}
                    >
                      {/* Star & Read Status Controls */}
                      <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                        <button
                          id={`star-btn-${item.id}`}
                          onClick={e => {
                            e.stopPropagation();
                            appRepository.toggleImportance(item.id);
                          }}
                          className="p-1 text-slate-300 dark:text-slate-600 hover:text-amber-500 dark:hover:text-amber-400 transition cursor-pointer"
                          title={item.isImportant ? (isAr ? 'إزالة التمييز' : 'Unstar') : (isAr ? 'تمييز بنجمة' : 'Star')}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              item.isImportant
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </button>

                        <button
                          id={`read-toggle-btn-${item.id}`}
                          onClick={e => {
                            e.stopPropagation();
                            appRepository.toggleReadStatus(item.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title={
                            item.isRead
                              ? (isAr ? 'معاملة مقروءة - اضغط للتعيين كغير مقروءة' : 'Read - Click to mark as unread')
                              : (isAr ? 'معاملة غير مقروءة - اضغط للتعيين كمقروءة' : 'Unread - Click to mark as read')
                          }
                        >
                          {item.isRead ? (
                            <MailOpen className="w-4 h-4 text-slate-400 dark:text-slate-500 hover:text-emerald-600" />
                          ) : (
                            <div className="relative">
                              <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                          )}
                        </button>
                      </div>

                      {/* Main Content Info */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              {renderPriorityDot(item.correspondence.priorityLevel)}
                              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                                {item.correspondence.corrNumber}
                              </span>
                            </div>
                            {getCorrTypeBadge(item.correspondence.corrType)}
                            {getPriorityBadge(item.correspondence.priorityLevel)}
                            {getSecurityBadge(item.correspondence.securityLevel)}
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                            {new Date(item.receiveDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                          </span>
                        </div>

                        {/* Title & SLA Deadline countdown */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 leading-snug flex-1">
                            {item.correspondence.title}
                          </div>
                          {item.correspondence.expectedResponseDate && (
                            <CorrespondenceCountdownTimer
                              expectedResponseDate={item.correspondence.expectedResponseDate}
                              registerDate={item.correspondence.registerDate}
                              isReplied={item.correspondence.isReplied}
                              isCompleted={item.status === WorkItemStatus.Completed}
                              locale={locale}
                              variant="pill"
                            />
                          )}
                        </div>

                        {/* Meta summary */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                              {getSenderName(item, isAr)}
                            </span>
                            {item.correspondence.referenceNo && (
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded font-mono">
                                {isAr ? 'قيد صادر الجهة:' : 'Ref:'} {item.correspondence.referenceNo}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {item.correspondence.documents.length > 0 && (
                              <span className="flex items-center gap-0.5 text-slate-400 dark:text-slate-500">
                                <Paperclip className="w-3 h-3" />
                                <span>{item.correspondence.documents.length}</span>
                              </span>
                            )}
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded font-mono font-bold">
                              {item.correspondence.routesCount} {isAr ? 'تأشيرات' : 'routes'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Side: Quick Inspector & Details Panel */}
          <div className="hidden md:flex md:w-2/5 flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto p-4 space-y-4">
            {selectedItem ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
                {/* Header Details */}
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {renderPriorityDot(selectedItem.correspondence.priorityLevel)}
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                          {selectedItem.correspondence.corrNumber}
                        </span>
                      </div>
                      {getCorrTypeBadge(selectedItem.correspondence.corrType)}
                      {getPriorityBadge(selectedItem.correspondence.priorityLevel)}
                      {getSecurityBadge(selectedItem.correspondence.securityLevel)}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-400 mt-1 font-mono">
                      {isAr ? 'الباركود الرقمي:' : 'Barcode:'} {selectedItem.correspondence.barcode}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="inbox-inspector-toggle-read-btn"
                      onClick={() => appRepository.toggleReadStatus(selectedItem.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer shadow-xs ${
                        selectedItem.isRead
                          ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      }`}
                      title={
                        selectedItem.isRead
                          ? (isAr ? 'تعيين كغير مقروء (اختصار: M)' : 'Mark as Unread (Shortcut: M)')
                          : (isAr ? 'تعيين كمقروء (اختصار: M)' : 'Mark as Read (Shortcut: M)')
                      }
                    >
                      {selectedItem.isRead ? (
                        <>
                          <Mail className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>{isAr ? 'تعيين كغير مقروء' : 'Mark Unread'}</span>
                        </>
                      ) : (
                        <>
                          <MailOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{isAr ? 'تعيين كمقروء' : 'Mark Read'}</span>
                        </>
                      )}
                    </button>

                    <button
                      id="inbox-inspector-full-view-btn"
                      onClick={() => onOpenDetails(selectedItem)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                    >
                      <span>{isAr ? 'معاينة كاملة' : 'Full View'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title & Notes */}
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {isAr ? 'موضوع المعاملة:' : 'Subject:'}
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    {selectedItem.correspondence.title}
                  </p>
                </div>

                {/* Impending Deadline & SLA Countdown Card */}
                {selectedItem.correspondence.expectedResponseDate && (
                  <CorrespondenceCountdownTimer
                    expectedResponseDate={selectedItem.correspondence.expectedResponseDate}
                    registerDate={selectedItem.correspondence.registerDate}
                    isReplied={selectedItem.correspondence.isReplied}
                    isCompleted={selectedItem.status === WorkItemStatus.Completed}
                    locale={locale}
                    variant="card"
                  />
                )}

                {/* Detailed Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 dark:text-slate-400 block text-[10px] mb-0.5">
                      {isAr ? 'الجهة المصدرة / المعنية:' : 'Origin / Entity:'}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {getSenderName(selectedItem, isAr) || '---'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 dark:text-slate-400 block text-[10px] mb-0.5">
                      {isAr ? 'ملف الحفظ والأرشيف:' : 'Archive Folder:'}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">
                      {selectedItem.correspondence.fileNameAr || (isAr ? 'غير محدد' : 'None')}
                    </span>
                  </div>
                </div>

                {/* Digital Signature Badge if present */}
                {selectedItem.correspondence.digitalSignature && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{isAr ? 'معتمد وموقع رقمياً' : 'Digitally Signed'}</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                        SHA256 Valid
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      {selectedItem.correspondence.digitalSignature.signedBy} (
                      {selectedItem.correspondence.digitalSignature.jobTitle})
                    </p>
                  </div>
                )}

                {/* Documents & Attachments preview */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center justify-between">
                    <span>{isAr ? 'المرفقات والوثائق:' : 'Attached Documents:'}</span>
                    <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                      {selectedItem.correspondence.documents.length}
                    </span>
                  </h4>
                  <div className="space-y-1.5">
                    {selectedItem.correspondence.documents.map(doc => (
                      <div
                        key={doc.id}
                        className="p-2 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                            {doc.subject}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                          {doc.activeDetail.fileSize}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                {isAr ? 'اختر معاملة من القائمة لمعاينتها' : 'Select an item to view'}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Full Data Grid Table View with Interactive Sortable Headers */
        <div className="flex-1 bg-white dark:bg-slate-900 overflow-x-auto overflow-y-auto">
          <table className="w-full text-start border-collapse text-xs">
            {/* Table Header with interactive column sorting */}
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 shadow-xs">
              <tr>
                {/* Star & Read Status Column */}
                <th scope="col" className="py-3 px-2 text-center w-20">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      id="table-sort-star"
                      onClick={() => handleSort('importance')}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer group"
                      title={isAr ? 'ترتيب حسب المميزة بنجمة' : 'Sort by Starred'}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          sortColumn === 'importance' ? 'text-amber-500 fill-amber-400' : 'text-slate-400'
                        }`}
                      />
                    </button>
                    <span className="text-slate-300 dark:text-slate-600 text-[10px]">/</span>
                    <span title={isAr ? 'حالة القراءة' : 'Read Status'}>
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                    </span>
                  </div>
                </th>

                {/* Correspondence Number */}
                <th scope="col" className="py-3 px-4 text-start font-bold">
                  <button
                    id="table-sort-corrnumber"
                    onClick={() => handleSort('corrNumber')}
                    className={`flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer group ${
                      sortColumn === 'corrNumber'
                        ? 'text-emerald-700 dark:text-emerald-400 font-black'
                        : ''
                    }`}
                  >
                    <span>{isAr ? 'رقم القيد والنوع' : 'Corr # & Type'}</span>
                    {renderSortIndicator('corrNumber')}
                  </button>
                </th>

                {/* Subject / Title */}
                <th scope="col" className="py-3 px-4 text-start font-bold min-w-[240px]">
                  <button
                    id="table-sort-title"
                    onClick={() => handleSort('title')}
                    className={`flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer group ${
                      sortColumn === 'title' ? 'text-emerald-700 dark:text-emerald-400 font-black' : ''
                    }`}
                  >
                    <span>{isAr ? 'موضوع المعاملة' : 'Subject'}</span>
                    {renderSortIndicator('title')}
                  </button>
                </th>

                {/* Sender / Origin */}
                <th scope="col" className="py-3 px-4 text-start font-bold min-w-[180px]">
                  <button
                    id="table-sort-sender"
                    onClick={() => handleSort('sender')}
                    className={`flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer group ${
                      sortColumn === 'sender' ? 'text-emerald-700 dark:text-emerald-400 font-black' : ''
                    }`}
                  >
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isAr ? 'الجهة المصدرة / الراسل' : 'Sender / Origin'}</span>
                    {renderSortIndicator('sender')}
                  </button>
                </th>

                {/* Priority */}
                <th scope="col" className="py-3 px-4 text-start font-bold">
                  <button
                    id="table-sort-priority"
                    onClick={() => handleSort('priority')}
                    className={`flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer group ${
                      sortColumn === 'priority'
                        ? 'text-emerald-700 dark:text-emerald-400 font-black'
                        : ''
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isAr ? 'درجة الأولوية' : 'Priority'}</span>
                    {renderSortIndicator('priority')}
                  </button>
                </th>

                {/* Security */}
                <th scope="col" className="py-3 px-4 text-start font-bold">
                  <button
                    id="table-sort-security"
                    onClick={() => handleSort('security')}
                    className={`flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer group ${
                      sortColumn === 'security'
                        ? 'text-emerald-700 dark:text-emerald-400 font-black'
                        : ''
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-purple-500" />
                    <span>{isAr ? 'السرية' : 'Security'}</span>
                    {renderSortIndicator('security')}
                  </button>
                </th>

                {/* Receive Date */}
                <th scope="col" className="py-3 px-4 text-start font-bold">
                  <button
                    id="table-sort-date"
                    onClick={() => handleSort('date')}
                    className={`flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer group ${
                      sortColumn === 'date' ? 'text-emerald-700 dark:text-emerald-400 font-black' : ''
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isAr ? 'تاريخ الاستلام' : 'Receive Date'}</span>
                    {renderSortIndicator('date')}
                  </button>
                </th>

                {/* Expected SLA Deadline & Countdown */}
                <th scope="col" className="py-3 px-4 text-start font-bold whitespace-nowrap">
                  <button
                    id="table-sort-deadline"
                    onClick={() => handleSort('deadline')}
                    className={`flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer group ${
                      sortColumn === 'deadline'
                        ? 'text-emerald-700 dark:text-emerald-400 font-black'
                        : ''
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isAr ? 'المهلة والعد التنازلي' : 'SLA Countdown'}</span>
                    {renderSortIndicator('deadline')}
                  </button>
                </th>

                {/* Attachments & Routes */}
                <th scope="col" className="py-3 px-4 text-center font-bold">
                  <span>{isAr ? 'المرفقات والتأشيرات' : 'Docs & Routes'}</span>
                </th>

                {/* Actions */}
                <th scope="col" className="py-3 px-4 text-center font-bold">
                  <span>{isAr ? 'إجراء' : 'Actions'}</span>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedWorkItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400 dark:text-slate-500">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 stroke-1 mb-2" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {isAr ? 'لا توجد معاملات في هذا الصندوق حالياً' : 'No correspondences found'}
                    </p>
                  </td>
                </tr>
              ) : (
                sortedWorkItems.map(item => {
                  const isSelected = selectedItem?.id === item.id;
                  const isUnread = !item.isRead;
                  const priority = item.correspondence.priorityLevel;

                  let tableRowPriorityClass = '';
                  if (isSelected) {
                    tableRowPriorityClass =
                      'bg-emerald-50/90 dark:bg-emerald-950/40 text-slate-900 dark:text-slate-100 border-s-4 border-s-emerald-600 dark:border-s-emerald-500 shadow-xs';
                  } else if (priority === PriorityLevel.Immediate) {
                    tableRowPriorityClass = `bg-rose-50/60 dark:bg-rose-950/25 hover:bg-rose-100/70 dark:hover:bg-rose-900/35 border-s-4 border-s-rose-500 ${
                      isUnread ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-800 dark:text-slate-200'
                    }`;
                  } else if (priority === PriorityLevel.TopUrgent) {
                    tableRowPriorityClass = `bg-red-50/45 dark:bg-red-950/20 hover:bg-red-100/60 dark:hover:bg-red-900/30 border-s-4 border-s-red-500 ${
                      isUnread ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-800 dark:text-slate-200'
                    }`;
                  } else if (priority === PriorityLevel.Urgent) {
                    tableRowPriorityClass = `bg-amber-50/35 dark:bg-amber-950/15 hover:bg-amber-100/50 dark:hover:bg-amber-900/25 border-s-4 border-s-amber-500 ${
                      isUnread ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-800 dark:text-slate-200'
                    }`;
                  } else {
                    tableRowPriorityClass = `bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-s-4 border-s-transparent ${
                      isUnread ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'
                    }`;
                  }

                  return (
                    <tr
                      key={item.id}
                      id={`table-row-${item.id}`}
                      onClick={() => {
                        onSelectItem(item);
                        if (!item.isRead) appRepository.markAsRead(item.id);
                      }}
                      onDoubleClick={() => onOpenDetails(item)}
                      className={`transition cursor-pointer ${tableRowPriorityClass}`}
                    >
                      {/* Star & Read Status */}
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`table-star-btn-${item.id}`}
                            onClick={e => {
                              e.stopPropagation();
                              appRepository.toggleImportance(item.id);
                            }}
                            className="p-1 text-slate-300 dark:text-slate-600 hover:text-amber-500 dark:hover:text-amber-400 transition cursor-pointer"
                            title={item.isImportant ? (isAr ? 'إزالة التمييز' : 'Unstar') : (isAr ? 'تمييز بنجمة' : 'Star')}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                item.isImportant
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300 dark:text-slate-600'
                              }`}
                            />
                          </button>

                          <button
                            id={`table-toggle-read-btn-${item.id}`}
                            onClick={e => {
                              e.stopPropagation();
                              appRepository.toggleReadStatus(item.id);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title={
                              item.isRead
                                ? (isAr ? 'معاملة مقروءة - اضغط للتعيين كغير مقروءة' : 'Read - Click to mark as unread')
                                : (isAr ? 'معاملة غير مقروءة - اضغط للتعيين كمقروءة' : 'Unread - Click to mark as read')
                            }
                          >
                            {item.isRead ? (
                              <MailOpen className="w-4 h-4 text-slate-400 dark:text-slate-500 hover:text-emerald-600" />
                            ) : (
                              <div className="relative">
                                <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              </div>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Number & Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            {renderPriorityDot(item.correspondence.priorityLevel)}
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                              {item.correspondence.corrNumber}
                            </span>
                          </div>
                          <div>{getCorrTypeBadge(item.correspondence.corrType)}</div>
                        </div>
                      </td>

                      {/* Title */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 max-w-md">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                            {item.correspondence.title}
                          </div>
                          {item.correspondence.referenceNo && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              {isAr ? 'مرجع الجهة:' : 'Ref:'} {item.correspondence.referenceNo}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Sender / Origin */}
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {getSenderName(item, isAr) || '---'}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getPriorityBadge(item.correspondence.priorityLevel)}
                      </td>

                      {/* Security */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getSecurityBadge(item.correspondence.securityLevel) || (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {isAr ? 'عادي' : 'Normal'}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(item.receiveDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                      </td>

                      {/* Expected SLA Deadline & Countdown */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.correspondence.expectedResponseDate ? (
                          <CorrespondenceCountdownTimer
                            expectedResponseDate={item.correspondence.expectedResponseDate}
                            registerDate={item.correspondence.registerDate}
                            isReplied={item.correspondence.isReplied}
                            isCompleted={item.status === WorkItemStatus.Completed}
                            locale={locale}
                            variant="pill"
                          />
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                            —
                          </span>
                        )}
                      </td>

                      {/* Attachments & Routes */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2 text-[11px]">
                          {item.correspondence.documents.length > 0 && (
                            <span className="flex items-center gap-0.5 text-slate-500 dark:text-slate-400 font-mono">
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>{item.correspondence.documents.length}</span>
                            </span>
                          )}
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded font-mono font-bold">
                            {item.correspondence.routesCount} {isAr ? 'تأشيرات' : 'routes'}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`table-row-toggle-read-btn-${item.id}`}
                            onClick={e => {
                              e.stopPropagation();
                              appRepository.toggleReadStatus(item.id);
                            }}
                            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                              item.isRead
                                ? 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400'
                                : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            }`}
                            title={
                              item.isRead
                                ? (isAr ? 'تعيين كغير مقروء' : 'Mark as Unread')
                                : (isAr ? 'تعيين كمقروء' : 'Mark as Read')
                            }
                          >
                            {item.isRead ? (
                              <Mail className="w-3.5 h-3.5" />
                            ) : (
                              <MailOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            )}
                            <span className="hidden xl:inline text-[10px]">
                              {item.isRead ? (isAr ? 'غير مقروء' : 'Unread') : (isAr ? 'مقروء' : 'Read')}
                            </span>
                          </button>

                          <button
                            id={`table-row-open-btn-${item.id}`}
                            onClick={e => {
                              e.stopPropagation();
                              onOpenDetails(item);
                            }}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isAr ? 'معاينة' : 'View'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
