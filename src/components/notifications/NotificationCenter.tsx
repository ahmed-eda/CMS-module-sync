import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Clock,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ArrowUpRight,
  Filter,
  Check,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  X,
  Settings
} from 'lucide-react';
import { appRepository } from '../../services/store';
import { SystemNotification, NotificationCategory, NotificationType } from '../../types/domain';

interface NotificationCenterProps {
  locale: 'ar' | 'en';
  onSelectCorrespondence?: (corrId: number) => void;
  onOpenPreferences?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  locale,
  onSelectCorrespondence,
  onOpenPreferences
}) => {
  const isAr = locale === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>(
    appRepository.getNotifications()
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize with store
  useEffect(() => {
    const unsubscribe = appRepository.subscribe(() => {
      setNotifications(appRepository.getNotifications());
    });
    return () => unsubscribe();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const criticalCount = notifications.filter(n => !n.isRead && n.priority === 'CRITICAL').length;
  const deadlinesCount = notifications.filter(n => n.category === 'deadline').length;

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (activeCategory !== 'all' && n.category !== activeCategory) {
      return false;
    }
    if (unreadOnly && n.isRead) {
      return false;
    }
    return true;
  });

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    appRepository.markNotificationAsRead(id);
  };

  const handleDismiss = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    appRepository.dismissNotification(id);
  };

  const handleMarkAllRead = () => {
    appRepository.markAllNotificationsAsRead();
  };

  const handleClearAll = () => {
    appRepository.clearAllNotifications();
  };

  const handleNotificationClick = (item: SystemNotification) => {
    if (!item.isRead) {
      appRepository.markNotificationAsRead(item.id);
    }
    if (item.corrId && onSelectCorrespondence) {
      onSelectCorrespondence(item.corrId);
      setIsOpen(false);
    }
  };

  const handleSimulateAlert = () => {
    const seq = Math.floor(1000 + Math.random() * 9000);
    appRepository.addNotification({
      type: 'DEADLINE_APPROACHING',
      category: 'deadline',
      titleAr: `تنبيه موعد إنجاز معاملة (${seq})`,
      titleEn: `Upcoming Action Deadline Alert (${seq})`,
      descriptionAr: `معاملة عاجلة رقم 1446/IN/${seq} تتطلب إعداد إفادة رسمية خلال 24 ساعة`,
      descriptionEn: `Urgent transaction 1446/IN/${seq} requires formal submission within 24h`,
      priority: 'HIGH',
      corrNumber: `1446/IN/${seq}`,
      deadlineDate: new Date(Date.now() + 24 * 3600000).toISOString(),
      remainingHours: 24
    });
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'DEADLINE_APPROACHING':
      case 'DEADLINE_OVERDUE':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'NEW_CORRESPONDENCE':
        return <FileText className="w-4 h-4 text-emerald-500" />;
      case 'URGENT_ACTION':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'DELEGATION_ACTIVE':
      case 'SYSTEM_ALERT':
        return <ShieldCheck className="w-4 h-4 text-sky-500" />;
      case 'ROUTE_UPDATE':
      default:
        return <ArrowUpRight className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 shrink-0 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            {isAr ? 'حرج / طارئ' : 'Critical'}
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
            {isAr ? 'عاجل' : 'High'}
          </span>
        );
      case 'NORMAL':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 shrink-0">
            {isAr ? 'عادي' : 'Normal'}
          </span>
        );
      default:
        return null;
    }
  };

  const formatTimeAgo = (isoDate: string) => {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return isAr ? 'الآن' : 'Just now';
    if (mins < 60) return isAr ? `منذ ${mins} دقيقة` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return isAr ? `منذ ${hours} ساعة` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return isAr ? `منذ ${days} يوم` : `${days}d ago`;
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Bell Button in Header */}
      <button
        id="notification-center-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isAr ? 'مركز التنبيهات والإشعارات' : 'Notification Center'}
        className={`p-2 rounded-xl transition cursor-pointer relative border flex items-center justify-center ${
          isOpen
            ? 'bg-slate-800 text-white border-emerald-500/50 shadow-inner'
            : 'hover:bg-slate-800 text-slate-300 border-slate-700/60'
        }`}
        title={
          isAr
            ? `مركز التنبيهات (${unreadCount} غير مقروء)`
            : `Notification Center (${unreadCount} unread)`
        }
      >
        <Bell className="w-4 h-4" />

        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md ring-2 ring-slate-900 ${
              criticalCount > 0
                ? 'bg-rose-500 animate-pulse'
                : 'bg-emerald-500'
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          id="notification-center-panel"
          className={`absolute ${
            isAr ? 'left-0 sm:-left-12' : 'right-0 sm:-right-12'
          } mt-2.5 w-[340px] sm:w-[420px] max-w-[95vw] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100`}
        >
          {/* Header Bar */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                    {isAr ? 'مركز التنبيهات والمتابعة' : 'System Alerts & Notifications'}
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold font-mono">
                      {unreadCount} {isAr ? 'جديد' : 'new'}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isAr
                    ? 'متابعة حية للمهل الزمنية، المعاملات، وتحديثات النظام'
                    : 'Real-time tracking for deadlines, correspondence & SLA'}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              {onOpenPreferences && (
                <button
                  id="notif-center-open-settings-btn"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenPreferences();
                  }}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg text-xs transition cursor-pointer"
                  title={isAr ? 'تخصيص تفضيلات الإشعارات' : 'Notification Preferences'}
                >
                  <Settings className="w-4 h-4 text-emerald-500" />
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg text-xs transition cursor-pointer"
                  title={isAr ? 'تعيين الكل كمقروء' : 'Mark all as read'}
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg text-xs transition cursor-pointer"
                  title={isAr ? 'مسح كافة التنبيهات' : 'Clear all'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg text-xs transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SLA Quick Status Banner */}
          {deadlinesCount > 0 && (
            <div className="px-3.5 py-2 bg-amber-500/10 dark:bg-amber-950/30 border-b border-amber-500/20 flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-300">
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>
                  {isAr
                    ? `لديك (${deadlinesCount}) مهل زمنية تتطلب الرد أو الإنجاز`
                    : `You have (${deadlinesCount}) active deadlines requiring response`}
                </span>
              </div>
              <button
                onClick={() => setActiveCategory('deadline')}
                className="font-bold underline text-[10px] hover:text-amber-800 dark:hover:text-amber-200 cursor-pointer"
              >
                {isAr ? 'عرض المهل' : 'View Deadlines'}
              </button>
            </div>
          )}

          {/* Category Filter Tabs */}
          <div className="px-3 pt-2.5 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 overflow-x-auto select-none bg-slate-50/40 dark:bg-slate-900/40">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                {isAr ? 'الكل' : 'All'}
              </button>
              <button
                onClick={() => setActiveCategory('deadline')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                  activeCategory === 'deadline'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>{isAr ? 'المواعيد والمهل' : 'Deadlines'}</span>
              </button>
              <button
                onClick={() => setActiveCategory('correspondence')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                  activeCategory === 'correspondence'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>{isAr ? 'المعاملات' : 'Correspondence'}</span>
              </button>
              <button
                onClick={() => setActiveCategory('system')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                  activeCategory === 'system'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>{isAr ? 'النظام' : 'System'}</span>
              </button>
            </div>

            {/* Unread Only Toggle */}
            <button
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`p-1 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition ${
                unreadOnly
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
              }`}
              title={isAr ? 'عرض غير المقروء فقط' : 'Unread only'}
            >
              <Filter className="w-3 h-3" />
              <span className="hidden sm:inline">{isAr ? 'غير المقروء' : 'Unread'}</span>
            </button>
          </div>

          {/* Notifications Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-2 space-y-1.5 max-h-[380px]">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-emerald-500" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isAr ? 'لا توجد تنبيهات جديدة' : 'All caught up!'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[240px] mx-auto">
                  {isAr
                    ? 'كافة المواعيد والمعاملات النظامية تم التعامل معها بنجاح'
                    : 'All deadlines and incoming workflows have been handled.'}
                </p>
                <button
                  onClick={handleSimulateAlert}
                  className="mt-3 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAr ? 'محاكاة تنبيه مهلة جديد' : 'Simulate New Alert'}</span>
                </button>
              </div>
            ) : (
              filteredNotifications.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`group relative p-3 rounded-xl transition cursor-pointer flex items-start gap-3 border ${
                    !item.isRead
                      ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/20 shadow-xs'
                      : 'bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200/60 dark:border-slate-800'
                  }`}
                >
                  {/* Unread indicator bullet */}
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-3.5 right-2 sm:right-3 shrink-0 ring-2 ring-white dark:ring-slate-900" />
                  )}

                  {/* Icon */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      item.type === 'DEADLINE_APPROACHING' || item.type === 'DEADLINE_OVERDUE'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : item.type === 'URGENT_ACTION'
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : item.type === 'NEW_CORRESPONDENCE'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {getNotificationIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4
                        className={`text-xs font-bold truncate ${
                          !item.isRead
                            ? 'text-slate-900 dark:text-white font-extrabold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isAr ? item.titleAr : item.titleEn}
                      </h4>
                      {getPriorityBadge(item.priority)}
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {isAr ? item.descriptionAr : item.descriptionEn}
                    </p>

                    {/* Deadline SLA badge if present */}
                    {item.remainingHours !== undefined && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>
                          {isAr
                            ? `المهلة المتبقية: ${item.remainingHours} ساعة`
                            : `SLA Deadline: ${item.remainingHours}h remaining`}
                        </span>
                      </div>
                    )}

                    {/* Footer Info & Actions */}
                    <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>{formatTimeAgo(item.timestamp)}</span>
                        {item.corrNumber && (
                          <span className="font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[9px]">
                            {item.corrNumber}
                          </span>
                        )}
                      </div>

                      {/* Hover action buttons */}
                      <div className="flex items-center gap-1">
                        {item.corrId && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold group-hover:underline flex items-center gap-0.5">
                            <span>{isAr ? 'عرض' : 'View'}</span>
                            <ChevronRight className={`w-3 h-3 ${isAr ? 'rotate-180' : ''}`} />
                          </span>
                        )}
                        <button
                          onClick={e => handleDismiss(item.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 rounded transition cursor-pointer"
                          title={isAr ? 'حذف الإشعار' : 'Dismiss'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Bar: System Integration Status & Simulation */}
          <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span className="font-medium">
                {isAr ? 'الربط الحكومي (GSB): متصل' : 'GSB Hub: Connected'}
              </span>
            </div>

            <button
              onClick={handleSimulateAlert}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>{isAr ? 'اختبار تنبيه فوري' : 'Test Alert'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
