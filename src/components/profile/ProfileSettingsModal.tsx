import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Bell,
  Globe,
  Palette,
  ShieldCheck,
  Camera,
  Upload,
  Trash2,
  Check,
  X,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  Clock,
  Calendar,
  Sparkles,
  RefreshCw,
  Building,
  KeyRound,
  FileCheck2,
  Layers,
  AlertTriangle,
  Monitor,
  CheckCircle2,
  Sliders,
  Sun,
  Moon,
  Info,
  Shield,
  BadgeCheck,
  Send,
  HelpCircle,
  Eye
} from 'lucide-react';
import { appRepository } from '../../services/store';
import {
  UserSession,
  Employee,
  UserNotificationPreferences,
  UserRegionalPreferences,
  SecurityLevel
} from '../../types/domain';
import { CameraCaptureModal } from './CameraCaptureModal';
import { useToast } from '../notifications/ToastContext';

export type SettingsTab = 'profile' | 'notifications' | 'language' | 'appearance' | 'security';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;
  locale: 'ar' | 'en';
}

// Preset avatars collection
const PRESET_AVATARS = [
  {
    id: 'male-exec',
    nameAr: 'مسؤول تنفيذي',
    nameEn: 'Executive Officer',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'female-officer',
    nameAr: 'مستشارة قيادية',
    nameEn: 'Lead Consultant',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'male-eng',
    nameAr: 'مهندس نظم',
    nameEn: 'Systems Engineer',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'female-auditor',
    nameAr: 'أخصائية تدقيق',
    nameEn: 'Audit Specialist',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'male-director',
    nameAr: 'مدير إدارة',
    nameEn: 'Department Director',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80'
  }
];

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile',
  locale
}) => {
  const isAr = locale === 'ar';
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [session, setSession] = useState<UserSession>(appRepository.getSession());

  // Form states
  const [fullNameAr, setFullNameAr] = useState(session.user.fullNameAr);
  const [fullNameEn, setFullNameEn] = useState(session.user.fullNameEn);
  const [jobTitleAr, setJobTitleAr] = useState(session.user.jobTitleAr);
  const [email, setEmail] = useState(session.user.email);
  const [phone, setPhone] = useState(session.user.phone || '+966 50 123 4567');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(session.user.avatarUrl);

  // Notification Preferences state
  const [notifPrefs, setNotifPrefs] = useState<UserNotificationPreferences>(
    appRepository.getNotificationPreferences()
  );

  // Regional Preferences state
  const [regionalPrefs, setRegionalPrefs] = useState<UserRegionalPreferences>(
    appRepository.getRegionalPreferences()
  );

  // Theme state
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>(session.theme);
  const [selectedLocale, setSelectedLocale] = useState<'ar' | 'en'>(session.locale);

  // Browser desktop notification permission status
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens or session updates
  useEffect(() => {
    if (isOpen) {
      const curSession = appRepository.getSession();
      setSession(curSession);
      setFullNameAr(curSession.user.fullNameAr);
      setFullNameEn(curSession.user.fullNameEn);
      setJobTitleAr(curSession.user.jobTitleAr);
      setEmail(curSession.user.email);
      setPhone(curSession.user.phone || '+966 50 123 4567');
      setAvatarUrl(curSession.user.avatarUrl);
      setNotifPrefs(appRepository.getNotificationPreferences());
      setRegionalPrefs(appRepository.getRegionalPreferences());
      setSelectedTheme(curSession.theme);
      setSelectedLocale(curSession.locale);
      setActiveTab(initialTab);

      if (typeof window !== 'undefined' && 'Notification' in window) {
        setBrowserPerm(Notification.permission);
      }
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Handle saving profile changes
  const handleSaveProfile = () => {
    appRepository.updateUserProfile({
      fullNameAr,
      fullNameEn,
      jobTitleAr,
      email,
      phone,
      avatarUrl
    });

    appRepository.updateNotificationPreferences(notifPrefs);
    appRepository.updateRegionalPreferences(regionalPrefs);

    if (selectedLocale !== session.locale) {
      appRepository.setLocale(selectedLocale);
    }
    if (selectedTheme !== session.theme) {
      appRepository.setTheme(selectedTheme);
    }

    toast.success(
      isAr ? 'تم حفظ الملف الشخصي وتفضيلات الإعدادات بنجاح' : 'Profile & settings saved successfully',
      {
        titleAr: 'تحديث الإعدادات',
        titleEn: 'Settings Updated'
      }
    );

    onClose();
  };

  // Handle Avatar from Camera
  const handleCameraCapture = (capturedDataUrl: string) => {
    setAvatarUrl(capturedDataUrl);
    appRepository.updateUserAvatar(capturedDataUrl);
    toast.success(
      isAr ? 'تم التقاط وتحديث الصورة الشخصية بنجاح' : 'Profile avatar updated via camera capture',
      {
        titleAr: 'الصورة الشخصية',
        titleEn: 'Profile Photo'
      }
    );
  };

  // Handle Avatar file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(isAr ? 'يرجى اختيار ملف صورة صالح' : 'Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const dataUrl = event.target?.result as string;
      setAvatarUrl(dataUrl);
      appRepository.updateUserAvatar(dataUrl);
      toast.success(
        isAr ? 'تم رفع وتعيين الصورة الشخصية بنجاح' : 'Avatar image uploaded successfully'
      );
    };
    reader.readAsDataURL(file);
  };

  // Remove Avatar
  const handleRemoveAvatar = () => {
    setAvatarUrl(undefined);
    appRepository.updateUserAvatar('');
    toast.info(
      isAr ? 'تمت استعادة الصورة الافتراضية' : 'Avatar reset to default monogram'
    );
  };

  // Request browser notification permission
  const handleRequestBrowserPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserPerm(perm);
        if (perm === 'granted') {
          setNotifPrefs(prev => ({ ...prev, desktopNotifications: true }));
          toast.success(
            isAr ? 'تم تفعيل إشعارات سطح المكتب بنجاح' : 'Desktop notifications enabled'
          );
        } else {
          setNotifPrefs(prev => ({ ...prev, desktopNotifications: false }));
          toast.warning(
            isAr ? 'تم حظر إشعارات المتصفح' : 'Browser notifications permission denied'
          );
        }
      } catch (err) {
        console.error('Notification permission error:', err);
      }
    }
  };

  // Send Test Notification
  const handleSendTestNotification = () => {
    const seq = Math.floor(1000 + Math.random() * 9000);
    appRepository.addNotification({
      type: 'DEADLINE_APPROACHING',
      category: 'deadline',
      titleAr: `تنبيه تجريبي: موعد إنجاز معاملة (${seq})`,
      titleEn: `Test Alert: SLA Deadline Notice (${seq})`,
      descriptionAr: `هذا تنبيه تجريبي للتحقق من تفضيلات قنوات الإشعارات والصوت في نظام المراسلات`,
      descriptionEn: `This is a test notification to verify audio chimes and delivery channels`,
      priority: 'HIGH',
      corrNumber: `1446/IN/${seq}`,
      deadlineDate: new Date(Date.now() + 24 * 3600000).toISOString(),
      remainingHours: 24
    });

    toast.info(
      isAr ? 'تم إرسال تنبيه تجريبي بنجاح إلى مركز الإشعارات' : 'Test alert dispatched successfully',
      {
        titleAr: 'اختبار الإشعارات',
        titleEn: 'Notification Test'
      }
    );
  };

  // Reset all to defaults
  const handleResetDefaults = () => {
    appRepository.resetPreferencesToDefault();
    setNotifPrefs(appRepository.getNotificationPreferences());
    setRegionalPrefs(appRepository.getRegionalPreferences());
    setSelectedLocale('ar');
    setSelectedTheme('light');
    toast.info(
      isAr ? 'تمت استعادة التفضيلات الافتراضية للنظام' : 'System preferences reset to default'
    );
  };

  const getSecurityBadge = (level: SecurityLevel) => {
    switch (level) {
      case SecurityLevel.TopConfidential:
      case SecurityLevel.Secret:
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-rose-500" />
            <span>{isAr ? 'تصريح أمني: سري للغاية / خاص' : 'Top Confidential Clearance'}</span>
          </span>
        );
      case SecurityLevel.Confidential:
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>{isAr ? 'تصريح أمني: سري' : 'Confidential Clearance'}</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isAr ? 'تصريح أمني: اعتيادي' : 'Standard Clearance'}</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        id="profile-settings-modal"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Avatar thumbnail preview */}
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullNameAr}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold text-lg flex items-center justify-center border-2 border-emerald-400/40 shadow-md">
                  {fullNameAr.slice(0, 2)}
                </div>
              )}
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 absolute -bottom-0.5 -right-0.5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {isAr ? 'الملف الشخصي وإعدادات المنظومة' : 'User Profile & System Settings'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {session.user.userCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {session.department.nameAr} • {session.user.jobTitleAr}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40 flex items-center gap-1 sm:gap-2 overflow-x-auto">
          <button
            id="tab-profile-btn"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'profile'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white/70 dark:bg-slate-900/70'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{isAr ? 'الملف التعريفي والصورة' : 'Profile & Photo'}</span>
          </button>

          <button
            id="tab-notifications-btn"
            onClick={() => setActiveTab('notifications')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'notifications'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white/70 dark:bg-slate-900/70'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>{isAr ? 'تفضيلات الإشعارات' : 'Notifications'}</span>
          </button>

          <button
            id="tab-language-btn"
            onClick={() => setActiveTab('language')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'language'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white/70 dark:bg-slate-900/70'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>{isAr ? 'اللغة والإعدادات الإقليمية' : 'Language & Regional'}</span>
          </button>

          <button
            id="tab-appearance-btn"
            onClick={() => setActiveTab('appearance')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'appearance'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white/70 dark:bg-slate-900/70'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>{isAr ? 'المظهر والواجهة' : 'Appearance'}</span>
          </button>

          <button
            id="tab-security-btn"
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'security'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white/70 dark:bg-slate-900/70'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isAr ? 'الأمان والصلاحيات' : 'Security & Roles'}</span>
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: PROFILE & AVATAR */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Avatar Management Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? 'الصورة الشخصية والتقاط الكاميرا' : 'Profile Avatar & Camera Access'}</span>
                </h3>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Big Avatar Display */}
                  <div className="relative group shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-28 h-28 rounded-3xl object-cover border-4 border-emerald-500/50 shadow-xl"
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-3xl flex items-center justify-center border-4 border-emerald-400/40 shadow-xl">
                        {fullNameAr.slice(0, 2)}
                      </div>
                    )}

                    <button
                      onClick={() => setIsCameraModalOpen(true)}
                      className="absolute inset-0 bg-slate-950/60 rounded-3xl opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
                    >
                      <Camera className="w-6 h-6 text-emerald-400" />
                      <span>{isAr ? 'فتح الكاميرا' : 'Open Camera'}</span>
                    </button>
                  </div>

                  {/* Upload and Camera Controls */}
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        id="open-camera-capture-btn"
                        onClick={() => setIsCameraModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-950/40 hover:scale-[1.02] transition cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{isAr ? 'التقاط صورة حية بالكاميرا' : 'Take Live Photo (WebRTC)'}</span>
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-slate-400" />
                        <span>{isAr ? 'رفع من الجهاز' : 'Upload File'}</span>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </button>

                      {avatarUrl && (
                        <button
                          onClick={handleRemoveAvatar}
                          className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                          title={isAr ? 'إزالة الصورة الشخصية' : 'Remove Avatar'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Presets Gallery */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                        {isAr ? 'أو اختر شخصية جاهزة:' : 'Or choose an executive preset:'}
                      </span>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {PRESET_AVATARS.map(preset => (
                          <button
                            key={preset.id}
                            onClick={() => {
                              setAvatarUrl(preset.url);
                              appRepository.updateUserAvatar(preset.url);
                              toast.success(
                                isAr
                                  ? `تم اختيار الشخصية: ${preset.nameAr}`
                                  : `Selected preset: ${preset.nameEn}`
                              );
                            }}
                            className={`relative rounded-xl overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                              avatarUrl === preset.url
                                ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                                : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                            }`}
                            title={isAr ? preset.nameAr : preset.nameEn}
                          >
                            <img
                              src={preset.url}
                              alt={preset.nameEn}
                              className="w-10 h-10 object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Information Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الاسم الكامل (بالعربية)' : 'Full Name (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={fullNameAr}
                    onChange={e => setFullNameAr(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الاسم الكامل (بالإنجليزية)' : 'Full Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={fullNameEn}
                    onChange={e => setFullNameEn(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'المسمى الوظيفي الرسمي' : 'Official Job Title'}
                  </label>
                  <input
                    type="text"
                    value={jobTitleAr}
                    onChange={e => setJobTitleAr(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'البريد الإلكتروني المؤسسي' : 'Official Email Address'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'رقم الهاتف / الجوال' : 'Phone / Mobile Number'}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الإدارة التابع لها' : 'Department Assignment'}
                  </label>
                  <div className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center justify-between">
                    <span>{session.department.nameAr}</span>
                    <span className="font-mono text-[10px] text-slate-400">ID: {session.department.code}</span>
                  </div>
                </div>
              </div>

              {/* Security Clearance Badge Summary */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                      {isAr ? 'مستوى الصلاحيات والتصنيف الأمني للمستخدم' : 'Security Clearance & Authority'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isAr
                        ? 'يخول للمستخدم الاطلاع على المعاملات والتقارير بموجب الهيكل التنظيمي'
                        : 'Permits viewing correspondence and documents according to institutional matrix'}
                    </div>
                  </div>
                </div>
                {getSecurityBadge(session.user.securityClearance)}
              </div>
            </div>
          )}

          {/* TAB 2: NOTIFICATION PREFERENCES */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Delivery Channels */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-500" />
                      <span>{isAr ? 'قنوات استلام التنبيهات' : 'Notification Delivery Channels'}</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isAr
                        ? 'تخصيص وسائط الإشعار والتنبيه الصوتي داخل المنظومة'
                        : 'Choose where and how you receive real-time alerts'}
                    </p>
                  </div>

                  <button
                    onClick={handleSendTestNotification}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إرسال إشعار تجريبي' : 'Send Test Alert'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* In-App Alerts */}
                  <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-start gap-3 cursor-pointer hover:border-emerald-500/50 transition">
                    <input
                      type="checkbox"
                      checked={notifPrefs.inAppAlerts}
                      onChange={e =>
                        setNotifPrefs(prev => ({ ...prev, inAppAlerts: e.target.checked }))
                      }
                      className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{isAr ? 'إشعارات الواجهة الفورية (Toasts)' : 'In-App Toast Alerts'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {isAr
                          ? 'ظهور نوافذ التنبيه التفاعلية المنبثقة عند ورود معاملات جديدة'
                          : 'Pop-up notification cards on events and workflows'}
                      </div>
                    </div>
                  </label>

                  {/* Sound Chimes */}
                  <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-start gap-3 cursor-pointer hover:border-emerald-500/50 transition">
                    <input
                      type="checkbox"
                      checked={notifPrefs.soundEnabled}
                      onChange={e =>
                        setNotifPrefs(prev => ({ ...prev, soundEnabled: e.target.checked }))
                      }
                      className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        {notifPrefs.soundEnabled ? (
                          <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{isAr ? 'التنبيه الصوتي الحركي' : 'Audio Sound Chimes'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {isAr
                          ? 'تشغيل نغمة صوتية رسمية خافتة عند ورود تنبيه عاجل أو هام'
                          : 'Play subtle enterprise acoustic chimes on alerts'}
                      </div>
                    </div>
                  </label>

                  {/* Desktop Push Notifications */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-start justify-between gap-3">
                    <label className="flex items-start gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={notifPrefs.desktopNotifications && browserPerm === 'granted'}
                        disabled={browserPerm !== 'granted'}
                        onChange={e =>
                          setNotifPrefs(prev => ({
                            ...prev,
                            desktopNotifications: e.target.checked
                          }))
                        }
                        className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <Bell className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{isAr ? 'إشعارات سطح المكتب ( المتصفح )' : 'Browser Desktop Push'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {isAr
                            ? 'استلام تنبيهات حتى عند تصغير المتصفح'
                            : 'Receive background notifications while working in other tabs'}
                        </div>
                      </div>
                    </label>

                    {browserPerm !== 'granted' && (
                      <button
                        onClick={handleRequestBrowserPermission}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white text-[10px] font-bold transition cursor-pointer shrink-0"
                      >
                        {isAr ? 'طلب الإذن' : 'Request'}
                      </button>
                    )}
                  </div>

                  {/* Email Digests */}
                  <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-start gap-3 cursor-pointer hover:border-emerald-500/50 transition">
                    <input
                      type="checkbox"
                      checked={notifPrefs.emailAlerts}
                      onChange={e =>
                        setNotifPrefs(prev => ({ ...prev, emailAlerts: e.target.checked }))
                      }
                      className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{isAr ? 'البريد الإلكتروني وملخص المهام' : 'Email Alerts & Daily Digest'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {isAr
                          ? 'إرسال ملخص بالمعاملات المتبقية نهاية كل يوم عمل'
                          : 'Daily consolidated email dispatch of pending SLA workflows'}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Event Subscriptions */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? 'أنواع الأحداث المشترك بها' : 'Event Triggers & Workflow Alerts'}</span>
                </h3>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {isAr ? 'معاملة واردة أو صادرة جديدة في صندوق البريد' : 'New Incoming / Outgoing Correspondence Assigned'}
                    </span>
                    <input
                      type="checkbox"
                      checked={notifPrefs.notifyOnNewCorrespondence}
                      onChange={e =>
                        setNotifPrefs(prev => ({
                          ...prev,
                          notifyOnNewCorrespondence: e.target.checked
                        }))
                      }
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {isAr ? 'اقتراب موعد انتهاء المهلة النظامية (SLA Warning)' : 'Upcoming Response SLA Deadline Warning'}
                    </span>
                    <input
                      type="checkbox"
                      checked={notifPrefs.notifyOnDeadlineApproaching}
                      onChange={e =>
                        setNotifPrefs(prev => ({
                          ...prev,
                          notifyOnDeadlineApproaching: e.target.checked
                        }))
                      }
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {isAr ? 'توجيهات عاجلة جداً وأوامر الإدارة العليا' : 'Urgent VIP Directives & Leadership Instructions'}
                    </span>
                    <input
                      type="checkbox"
                      checked={notifPrefs.notifyOnUrgentDirectives}
                      onChange={e =>
                        setNotifPrefs(prev => ({
                          ...prev,
                          notifyOnUrgentDirectives: e.target.checked
                        }))
                      }
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {isAr ? 'تحديثات الإحالة ومسار العمل والتوقيع' : 'Workflow Routing, Approvals & Signature Updates'}
                    </span>
                    <input
                      type="checkbox"
                      checked={notifPrefs.notifyOnWorkflowUpdates}
                      onChange={e =>
                        setNotifPrefs(prev => ({
                          ...prev,
                          notifyOnWorkflowUpdates: e.target.checked
                        }))
                      }
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {isAr ? 'سريان أو تعديل التفويضات الإدارية' : 'Administrative Delegation Activation & Changes'}
                    </span>
                    <input
                      type="checkbox"
                      checked={notifPrefs.notifyOnDelegation}
                      onChange={e =>
                        setNotifPrefs(prev => ({
                          ...prev,
                          notifyOnDelegation: e.target.checked
                        }))
                      }
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Quiet Hours */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>{isAr ? 'ساعات الهدوء وعدم الإزعاج (Quiet Hours)' : 'Do Not Disturb Schedule'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr
                      ? 'كتم الإشعارات الصوتية المنبثقة خارج ساعات الدوام الرسمي'
                      : 'Silence non-critical chimes and popups after business hours'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={notifPrefs.quietHoursEnabled}
                    onChange={e =>
                      setNotifPrefs(prev => ({ ...prev, quietHoursEnabled: e.target.checked }))
                    }
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  {notifPrefs.quietHoursEnabled && (
                    <div className="flex items-center gap-1 text-xs font-mono text-slate-700 dark:text-slate-300">
                      <input
                        type="time"
                        value={notifPrefs.quietHoursStart}
                        onChange={e =>
                          setNotifPrefs(prev => ({ ...prev, quietHoursStart: e.target.value }))
                        }
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2 py-1 rounded-lg"
                      />
                      <span>-</span>
                      <input
                        type="time"
                        value={notifPrefs.quietHoursEnd}
                        onChange={e =>
                          setNotifPrefs(prev => ({ ...prev, quietHoursEnd: e.target.value }))
                        }
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2 py-1 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LANGUAGE & REGIONAL SETTINGS */}
          {activeTab === 'language' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Primary Language Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? 'لغة الواجهة الأساسية' : 'Primary Interface Language'}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Arabic Option */}
                  <div
                    id="lang-select-ar"
                    onClick={() => {
                      setSelectedLocale('ar');
                      appRepository.setLocale('ar');
                    }}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer relative ${
                      selectedLocale === 'ar'
                        ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {selectedLocale === 'ar' && (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center absolute top-3.5 left-3.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="text-2xl mb-1">🇸🇦</div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      اللغة العربية (المملكة العربية السعودية)
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      الواجهة الرسمية المعتمدة للمنظومة مع محاذاة من اليمين إلى اليسار (RTL).
                    </p>
                  </div>

                  {/* English Option */}
                  <div
                    id="lang-select-en"
                    onClick={() => {
                      setSelectedLocale('en');
                      appRepository.setLocale('en');
                    }}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer relative ${
                      selectedLocale === 'en'
                        ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {selectedLocale === 'en' && (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center absolute top-3.5 right-3.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="text-2xl mb-1">🌐</div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      English (International Enterprise)
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Clean international architecture layout with Left-to-Right orientation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Regional Calendar & Formats */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? 'التقويم والتنسيق الإقليمي' : 'Regional Calendar & Formats'}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Calendar System */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'نظام التقويم المعتمد' : 'Default Calendar Standard'}
                    </label>
                    <select
                      value={regionalPrefs.calendarType}
                      onChange={e =>
                        setRegionalPrefs(prev => ({
                          ...prev,
                          calendarType: e.target.value as 'hijri' | 'gregorian'
                        }))
                      }
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
                    >
                      <option value="hijri">
                        {isAr ? 'التقويم الهجري (أم القرى - معتمد)' : 'Hijri (Umm al-Qura Standard)'}
                      </option>
                      <option value="gregorian">
                        {isAr ? 'التقويم الميلادي (Gregorian)' : 'Gregorian Standard'}
                      </option>
                    </select>
                  </div>

                  {/* Time Format */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'تنسيق الوقت وساعة النظام' : 'Time Display Format'}
                    </label>
                    <select
                      value={regionalPrefs.timeFormat}
                      onChange={e =>
                        setRegionalPrefs(prev => ({
                          ...prev,
                          timeFormat: e.target.value as '12h' | '24h'
                        }))
                      }
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
                    >
                      <option value="12h">
                        {isAr ? 'نظام 12 ساعة (صباحاً / مساءً)' : '12-Hour Format (AM / PM)'}
                      </option>
                      <option value="24h">
                        {isAr ? 'نظام 24 ساعة (عسكري / رسمي)' : '24-Hour Military Format'}
                      </option>
                    </select>
                  </div>

                  {/* Date Format */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'صيغة كتابة التاريخ' : 'Date Format Structure'}
                    </label>
                    <select
                      value={regionalPrefs.dateFormat}
                      onChange={e =>
                        setRegionalPrefs(prev => ({
                          ...prev,
                          dateFormat: e.target.value as any
                        }))
                      }
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition font-mono cursor-pointer"
                    >
                      <option value="YYYY/MM/DD">YYYY/MM/DD (1446/02/27)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (27/02/1446)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (02/27/1446)</option>
                    </select>
                  </div>

                  {/* Number System */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'أرقام السجلات والمراسلات' : 'Numeral Representation'}
                    </label>
                    <select
                      value={regionalPrefs.numberSystem}
                      onChange={e =>
                        setRegionalPrefs(prev => ({
                          ...prev,
                          numberSystem: e.target.value as 'latin' | 'arabic'
                        }))
                      }
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
                    >
                      <option value="latin">
                        {isAr ? 'الأرقام العربية القياسية (1, 2, 3)' : 'Standard Arabic / Latin (1, 2, 3)'}
                      </option>
                      <option value="arabic">
                        {isAr ? 'الأرقام المشرقية (١، ٢، ٣)' : 'Eastern Arabic Numerals (١، ٢، ٣)'}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: APPEARANCE & THEME */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? 'سمة وألوان الواجهة' : 'Interface Theme Mode'}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Light Mode */}
                  <div
                    onClick={() => {
                      setSelectedTheme('light');
                      appRepository.setTheme('light');
                    }}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer relative bg-slate-100 dark:bg-slate-800/60 ${
                      selectedTheme === 'light'
                        ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {selectedTheme === 'light' && (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center absolute top-3.5 left-3.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <Sun className="w-7 h-7 text-amber-500 mb-2" />
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {isAr ? 'الوضع المضيء (نهاري)' : 'Light Mode (Daytime)'}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {isAr
                        ? 'واجهة بيضاء ناصعة مريحة لقراءة المستندات الرسمية والأرشفة'
                        : 'High-contrast bright canvas ideal for reading official documents'}
                    </p>
                  </div>

                  {/* Dark Mode */}
                  <div
                    onClick={() => {
                      setSelectedTheme('dark');
                      appRepository.setTheme('dark');
                    }}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer relative bg-slate-900 text-white ${
                      selectedTheme === 'dark'
                        ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {selectedTheme === 'dark' && (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center absolute top-3.5 right-3.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <Moon className="w-7 h-7 text-emerald-400 mb-2" />
                    <div className="text-sm font-black text-white">
                      {isAr ? 'الوضع الليلي (داكن)' : 'Dark Mode (Executive Slate)'}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {isAr
                        ? 'واجهة داكنة مريحة للعين في الإضاءة المنخفضة مع تقليل استهلاك الطاقة'
                        : 'Sleek slate dark interface reducing eye fatigue'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Layout Density & Accessibility */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? 'كثافة العرض وتسهيلات الاستخدام' : 'Density & Accessibility'}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {isAr ? 'كثافة الجداول والقوائم' : 'Grid Table Density'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {isAr ? 'عرض مريح مع مساحات واسعة للقراءة' : 'Comfortable layout spacing'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {isAr ? 'المؤثرات الحركية والتنقل' : 'Interface Animations'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {isAr ? 'حركات انتقال سلسة ومفعلة افتراضياً' : 'Smooth micro-interactions active'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY & ROLES */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Active Session & Clearance Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>{isAr ? 'بيانات الجلسة والتشفير' : 'Active Session & Cryptography'}</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    {isAr ? 'جلسة آمنة (TLS 1.3)' : 'Secure TLS 1.3'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'عنوان IP' : 'IP Address'}</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">10.20.1.100</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'نوع المصادقة' : 'Auth Protocol'}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">GSB SSO / PKI</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'الرقم الوظيفي' : 'Employee ID'}</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{session.user.userCode}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'صلاحية التوقيع' : 'Digital Sign'}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{isAr ? 'مفعلة ومعتمدة' : 'Verified RSA-4096'}</span>
                  </div>
                </div>
              </div>

              {/* Active Delegations */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? 'التفويضات الإدارية الممنوحة لك' : 'Active Delegated Authorities'}</span>
                </h3>

                {session.delegations.length > 0 ? (
                  <div className="space-y-2">
                    {session.delegations.map((del, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <BadgeCheck className="w-4 h-4 text-amber-500" />
                            <span>{del.fromEmployeeName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            {isAr ? 'الصلاحيات المفوضة: ' : 'Delegated permissions: '}
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              {del.permissions.join(' • ')}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-lg shrink-0">
                          {isAr ? 'ساري حتى: ' : 'Valid until: '} {del.validUntil}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    {isAr ? 'لا توجد تفويضات إدارية نشطة حالياً' : 'No active delegated authority'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleResetDefaults}
            className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isAr ? 'استعادة الافتراضيات' : 'Reset Defaults'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              id="save-profile-settings-btn"
              onClick={handleSaveProfile}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 hover:scale-[1.02] transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isAr ? 'حفظ التغييرات' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live WebRTC Camera Capture Modal */}
      {isCameraModalOpen && (
        <CameraCaptureModal
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          onCapture={handleCameraCapture}
          locale={locale}
        />
      )}
    </div>
  );
};
