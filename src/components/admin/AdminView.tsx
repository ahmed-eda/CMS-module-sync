import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Activity,
  Key,
  Building,
  CheckCircle2,
  Lock,
  FileCode2,
  Database
} from 'lucide-react';
import { appRepository } from '../../services/store';

interface AdminViewProps {
  locale: 'ar' | 'en';
}

export const AdminView: React.FC<AdminViewProps> = ({ locale }) => {
  const isAr = locale === 'ar';
  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'audit' | 'security'>('employees');

  const employees = appRepository.getEmployees();
  const departments = appRepository.getDepartments();
  const session = appRepository.getSession();

  const auditLogs = [
    {
      id: 1,
      action: 'قيد وارد خارجي جديد',
      details: 'تم قيد المعاملة 1446/IN/00482 لوزارة المالية',
      user: 'أحمد بن عبد الله السالم',
      timestamp: '2026-08-30 08:30:15',
      ip: '10.14.2.112'
    },
    {
      id: 2,
      action: 'إحالة وتوجيه إداري',
      details: 'إحالة إلى إدارة تقنية المعلومات (لاتخاذ اللازم)',
      user: 'د. خالد بن منصور العتيبي',
      timestamp: '2026-08-30 09:15:00',
      ip: '10.14.1.45'
    },
    {
      id: 3,
      action: 'اعتماد وتوقيع رقمي SHA256',
      details: 'توقيع كتاب صادر رقم 1446/OUT/00104',
      user: 'م. فيصل بن سلطان الحربي',
      timestamp: '2026-08-30 11:20:44',
      ip: '10.14.3.88'
    },
    {
      id: 4,
      action: 'أرشفة معاملة',
      details: 'إيداع معاملة في ملف عقود الصيانة البرمجية',
      user: 'سارة بنت محمد القحطاني',
      timestamp: '2026-08-30 12:00:10',
      ip: '10.14.2.118'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none">
      {/* Header */}
      <div>
        <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>{isAr ? 'لوحة الإدارة والرقابة وسجلات التدقيق (Security & Governance)' : 'Admin & Governance Console'}</span>
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
          {isAr
            ? 'إدارة صلاحيات الموظفين، مصفوفة الأمان، وسجل الحركات والتدقيق الأمني'
            : 'Access control, employee hierarchy, and immutable audit logs'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('employees')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'employees'
              ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{isAr ? 'دليل الموظفين والمستخدمين' : 'Employees'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'audit'
              ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>{isAr ? 'سجل التدقيق الأمني (Audit Logs)' : 'Audit Trail'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'security'
              ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>{isAr ? 'مصفوفة درجات السرية والتفويض' : 'Security Clearance Matrix'}</span>
        </button>
      </div>

      {/* Subtab Content */}
      {activeSubTab === 'employees' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
            <span>{isAr ? 'المستخدمين المسجلين في النظام:' : 'Registered Employees:'}</span>
            <span className="font-mono text-slate-400 dark:text-slate-400">Total: {employees.length}</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {employees.map(emp => (
              <div key={emp.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 font-bold flex items-center justify-center text-xs border border-slate-700">
                    {emp.fullNameAr.substring(0, 1)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>{emp.fullNameAr}</span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300 px-1.5 rounded">
                        @{emp.userCode}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {emp.jobTitleAr} • {emp.departmentNameAr}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-bold">
                    {emp.isManager ? 'مدير إدارة' : 'موظف مختص'}
                  </span>
                  <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                    ACTIVE
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
            <span>{isAr ? 'سجلات التدقيق الأمني غير القابلة للتعديل (Immutable Audit Logs)' : 'Immutable Audit Log'}</span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">Encrypted</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
            {auditLogs.map(log => (
              <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-700 dark:text-indigo-400">{log.action}</span>
                    <span className="text-slate-400 dark:text-slate-400 text-[10px]">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-xs font-sans">{log.details}</p>
                </div>
                <div className="text-end">
                  <div className="text-slate-800 dark:text-slate-200 text-xs font-sans font-bold">{log.user}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">IP: {log.ip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>مستويات الأمان والسرية</span>
            </h2>
            <div className="space-y-2 text-slate-700 dark:text-slate-300">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold block text-slate-900 dark:text-slate-100">سري للغاية (Top Secret - Level 4):</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  مقصور على الرئيس التنفيذي والمفوضين بقرار إداري، مشفر بمفتاح PKI.
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold block text-slate-900 dark:text-slate-100">سري (Confidential - Level 3):</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  متاح لمدراء العموم ومدراء الإدارات المعنية بالتأشيرة فقط.
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>مفاتيح التوقيع الرقمي الحكومي</span>
            </h2>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-950 dark:text-emerald-200 space-y-1">
              <div className="font-bold">شهادة التوقيع الرقمي المعتمدة:</div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                مزود الخدمة: المركز الوطني للتصديق الرقمي (NCDC)
                <br />
                خوارزمية التوقيع: RSA-4096 / SHA-256 Digest
                <br />
                حالة الشهادة: سارية المفعول وموثقة
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
