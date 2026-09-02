import React from 'react';
import {
  Inbox,
  Send,
  FileCheck2,
  ListTodo,
  UserCheck,
  FolderArchive,
  Building2,
  BarChart3,
  Search,
  Settings,
  PlusCircle,
  Clock,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';
import { appRepository } from '../../services/store';

export type ActiveNavSection =
  | 'inbox-private'
  | 'inbox-general'
  | 'inbox-task'
  | 'inbox-assignment'
  | 'inbox-delegate'
  | 'outbox'
  | 'presentation-notes'
  | 'files'
  | 'sites'
  | 'reports'
  | 'dashboard'
  | 'admin';

interface SidebarProps {
  activeSection: ActiveNavSection;
  onSelectSection: (section: ActiveNavSection) => void;
  onOpenNewIncoming: () => void;
  onOpenNewOutgoing: () => void;
  locale: 'ar' | 'en';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  onOpenNewIncoming,
  onOpenNewOutgoing,
  locale
}) => {
  const isAr = locale === 'ar';
  const workItems = appRepository.getWorkItems();
  const unreadCount = workItems.filter(w => !w.isRead).length;
  const urgentCount = workItems.filter(w => w.correspondence.priorityLevel >= 2).length;
  const tasksCount = workItems.filter(w => w.inboxId === 3).length;

  const inboxes = [
    {
      id: 'inbox-private' as ActiveNavSection,
      label: isAr ? 'البريد الخاص (الشخصي)' : 'Private Inbox',
      icon: Inbox,
      badge: unreadCount > 0 ? unreadCount : undefined,
      badgeColor: 'bg-emerald-600 text-white'
    },
    {
      id: 'inbox-general' as ActiveNavSection,
      label: isAr ? 'البريد العام (الإدارة)' : 'General Dept Inbox',
      icon: Layers,
      badge: 4,
      badgeColor: 'bg-slate-200 text-slate-700'
    },
    {
      id: 'inbox-task' as ActiveNavSection,
      label: isAr ? 'صندوق المهام (مخصص لي)' : 'Tasks & Follow-up',
      icon: ListTodo,
      badge: tasksCount > 0 ? tasksCount : undefined,
      badgeColor: 'bg-blue-600 text-white'
    },
    {
      id: 'inbox-delegate' as ActiveNavSection,
      label: isAr ? 'صندوق التفويضات الإدارية' : 'Delegations Inbox',
      icon: UserCheck,
      badge: 1,
      badgeColor: 'bg-amber-600 text-white'
    }
  ];

  const secondaryNav = [
    {
      id: 'outbox' as ActiveNavSection,
      label: isAr ? 'الصادر العام والمذكرات' : 'Outbox & Circulars',
      icon: Send
    },
    {
      id: 'presentation-notes' as ActiveNavSection,
      label: isAr ? 'مذكرات العرض والقرارات' : 'Presentation Notes',
      icon: FileText
    },
    {
      id: 'files' as ActiveNavSection,
      label: isAr ? 'ملفات الحفظ والأرشيف' : 'Archive & File Folders',
      icon: FolderArchive
    },
    {
      id: 'sites' as ActiveNavSection,
      label: isAr ? 'دليل الجهات الخارجية' : 'External Entities',
      icon: Building2
    },
    {
      id: 'reports' as ActiveNavSection,
      label: isAr ? 'البحث المتقدم والمطابقة' : 'Advanced Search',
      icon: Search
    },
    {
      id: 'dashboard' as ActiveNavSection,
      label: isAr ? 'مؤشرات الأداء والرصد' : 'Analytics & SLA',
      icon: BarChart3
    },
    {
      id: 'admin' as ActiveNavSection,
      label: isAr ? 'إدارة الهيكل والصلاحيات' : 'System Administration',
      icon: Settings
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-l border-slate-800 shrink-0 select-none">
      {/* Primary Action Buttons */}
      <div className="p-3.5 space-y-2 border-b border-slate-800">
        <button
          onClick={onOpenNewIncoming}
          className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition cursor-pointer active:scale-98"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isAr ? 'تسجيل وقيد وارد جديد' : 'Register Incoming'}</span>
        </button>

        <button
          onClick={onOpenNewOutgoing}
          className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
        >
          <Send className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isAr ? 'إعداد وتصدير صادر' : 'Create Outgoing'}</span>
        </button>
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Inboxes */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-2 font-mono">
            {isAr ? 'صناديق البريد والعمل' : 'Work Queues & Inboxes'}
          </div>
          <div className="space-y-1">
            {inboxes.map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectSection(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                      : 'hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Navigation */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-2 font-mono">
            {isAr ? 'الوحدات الإدارية والأرشيف' : 'Modules & Directories'}
          </div>
          <div className="space-y-1">
            {secondaryNav.map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectSection(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                      : 'hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* System Status Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>.NET 9 Core Engine</span>
        </div>
        <span className="text-slate-400 text-[10px]">v2.4.0</span>
      </div>
    </aside>
  );
};
