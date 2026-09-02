import React, { useState } from 'react';
import {
  Search,
  Layers,
  Globe,
  UserCheck,
  ShieldAlert,
  Building,
  KeyRound,
  FileCode2,
  ChevronDown,
  Sun,
  Moon,
  Settings,
  User,
  Bell,
  Camera
} from 'lucide-react';
import { appRepository } from '../../services/store';
import { UserSession } from '../../types/domain';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { SettingsTab } from '../profile/ProfileSettingsModal';

interface HeaderProps {
  session: UserSession;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenArchitecture?: () => void;
  onSelectCorrespondence?: (corrId: number) => void;
  onOpenSettings?: (tab?: SettingsTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  searchQuery,
  onSearchChange,
  onOpenArchitecture,
  onSelectCorrespondence,
  onOpenSettings
}) => {
  const isAr = session.locale === 'ar';
  const employees = appRepository.getEmployees();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md sticky top-0 z-30 select-none">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand & System Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 text-white font-black text-xl tracking-tighter">
            LF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white font-sans">
                LinkFlow
              </span>
              <span className="text-[10px] uppercase font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded tracking-widest">
                Enterprise
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              {isAr ? 'منظومة الاتصالات الإدارية والمراسلات الموحدة' : '.NET Core Clean Architecture Messaging'}
            </div>
          </div>
        </div>

        {/* Global Instant Search Bar */}
        <div className="flex-1 max-w-xl mx-4">
          <div className="relative flex items-center">
            <Search className={`w-4 h-4 text-slate-400 absolute ${isAr ? 'right-3.5' : 'left-3.5'} pointer-events-none`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={
                isAr
                  ? 'بحث فوري برقم القيد، الموضوع، الجهة المصدرة، أو الباركود... (Ctrl + /)'
                  : 'Search by registry number, subject, entity, or barcode...'
              }
              className={`w-full bg-slate-800/90 text-slate-100 placeholder-slate-400 text-xs rounded-xl border border-slate-700 py-2.5 ${
                isAr ? 'pr-10 pl-16' : 'pl-10 pr-16'
              } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition`}
            />
            <span className={`text-[10px] font-mono bg-slate-700/70 text-slate-300 px-2 py-1 rounded absolute ${isAr ? 'left-2.5' : 'right-2.5'} pointer-events-none`}>
              ESC
            </span>
          </div>
        </div>

        {/* Actions & Utilities */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Architecture Visualizer Button */}
          {onOpenArchitecture && (
            <button
              onClick={onOpenArchitecture}
              className="px-3 py-2 bg-emerald-950/70 border border-emerald-600/40 hover:bg-emerald-900/60 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title={isAr ? 'استعراض المعمارية النظيفة ومبادئ SOLID' : 'View Clean Architecture & SOLID Specs'}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-mono">.NET Core Specs</span>
            </button>
          )}

          {/* Settings & Profile Shortcut */}
          {onOpenSettings && (
            <button
              id="header-open-settings-btn"
              onClick={() => onOpenSettings('profile')}
              className="p-2 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-700/60"
              title={isAr ? 'الملف الشخصي والإعدادات' : 'Profile & Settings'}
            >
              <Settings className="w-4 h-4 text-emerald-400" />
            </button>
          )}

          {/* Theme Switcher */}
          <button
            onClick={() => appRepository.toggleTheme()}
            className="p-2 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-700/60"
            title={
              session.theme === 'dark'
                ? isAr
                  ? 'تفعيل الوضع المضيء'
                  : 'Switch to Light Mode'
                : isAr
                ? 'تفعيل الوضع الليلي'
                : 'Switch to Dark Mode'
            }
          >
            {session.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-300" />
            )}
          </button>

          {/* Locale Switcher */}
          <button
            onClick={() => appRepository.setLocale(isAr ? 'en' : 'ar')}
            className="p-2 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-700/60"
            title={isAr ? 'Switch to English' : 'التحويل للغة العربية'}
          >
            <Globe className="w-4 h-4 text-slate-400" />
            <span className="font-mono">{isAr ? 'EN' : 'عربي'}</span>
          </button>

          {/* Notification Center */}
          <NotificationCenter
            locale={session.locale}
            onSelectCorrespondence={onSelectCorrespondence}
            onOpenPreferences={() => onOpenSettings?.('notifications')}
          />

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              id="header-user-menu-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1.5 pr-3 hover:bg-slate-800 rounded-xl transition cursor-pointer border border-slate-700/60"
            >
              {session.user.avatarUrl ? (
                <img
                  src={session.user.avatarUrl}
                  alt={session.user.fullNameAr}
                  className="w-8 h-8 rounded-lg object-cover border border-emerald-500/50"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-300 text-xs">
                  {session.user.fullNameAr.slice(0, 2)}
                </div>
              )}
              <div className="text-start hidden md:block">
                <div className="text-xs font-bold text-slate-100 leading-tight">
                  {session.user.fullNameAr}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {session.department.nameAr}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div
                className={`absolute ${
                  isAr ? 'left-0' : 'right-0'
                } mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150`}
              >
                {/* User Header Summary Card */}
                <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700/60 flex items-center gap-3">
                  {session.user.avatarUrl ? (
                    <img
                      src={session.user.avatarUrl}
                      alt={session.user.fullNameAr}
                      className="w-10 h-10 rounded-xl object-cover border border-emerald-500/50 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold flex items-center justify-center shrink-0">
                      {session.user.fullNameAr.slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-100 truncate">
                      {session.user.fullNameAr}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-medium truncate">
                      {session.user.jobTitleAr}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono truncate">
                      <KeyRound className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{session.user.email}</span>
                    </div>
                  </div>
                </div>

                {/* Profile & Settings Trigger */}
                {onOpenSettings && (
                  <div className="space-y-1">
                    <button
                      id="dropdown-open-profile-settings-btn"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenSettings('profile');
                      }}
                      className="w-full text-start p-2.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-400" />
                        <span>{isAr ? 'الملف الشخصي والصورة بالكاميرا' : 'Profile & Camera Avatar'}</span>
                      </div>
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    </button>

                    <button
                      id="dropdown-open-notifications-settings-btn"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenSettings('notifications');
                      }}
                      className="w-full text-start p-2 rounded-lg hover:bg-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Bell className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isAr ? 'تفضيلات الإشعارات والتنبيهات' : 'Notification Preferences'}</span>
                      </div>
                    </button>

                    <button
                      id="dropdown-open-language-settings-btn"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenSettings('language');
                      }}
                      className="w-full text-start p-2 rounded-lg hover:bg-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isAr ? 'إعدادات اللغة والتقويم' : 'Language & Calendar'}</span>
                      </div>
                    </button>
                  </div>
                )}

                {/* Delegation alert badge */}
                {session.delegations.length > 0 && (
                  <div className="p-2.5 bg-amber-950/40 border border-amber-600/40 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{isAr ? 'تفويض نشط من سعادة المدير العام' : 'Active Delegation Active'}</span>
                  </div>
                )}

                {/* Employee switch menu */}
                <div>
                  <div className="text-[11px] font-bold text-slate-400 px-1 mb-1.5 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" />
                    <span>{isAr ? 'محاكاة التبديل بين الموظفين:' : 'Switch Active Employee:'}</span>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {employees.map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => {
                          appRepository.switchEmployee(emp.id);
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-start p-2 rounded-lg text-xs transition cursor-pointer flex items-center justify-between ${
                          session.user.id === emp.id
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="truncate">{emp.fullNameAr}</span>
                        <span className="text-[10px] font-mono opacity-70 shrink-0">
                          {emp.jobTitleAr.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

