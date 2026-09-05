import React, { useState, useMemo } from 'react';
import {
  Building2,
  Building,
  Users,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Award,
  FileText,
  Send,
  Mail,
  Phone,
  Search,
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock,
  FileCode2,
  UserCheck,
  Briefcase,
  ExternalLink,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { Department, Employee } from '../../types/domain';
import { appRepository } from '../../services/store';
import { SecurityLevel } from '../../types/enums';
import { D3OrgVisualizer } from './D3OrgVisualizer';

interface OrgHierarchyViewProps {
  locale: 'ar' | 'en';
  onSelectEmployee?: (emp: Employee) => void;
}

interface SubUnit {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  supervisorAr: string;
  staffCount: number;
}

export const OrgHierarchyView: React.FC<OrgHierarchyViewProps> = ({ locale }) => {
  const isAr = locale === 'ar';
  const departments = useMemo(() => appRepository.getDepartments(), []);
  const employees = useMemo(() => appRepository.getEmployees(), []);
  const workItems = useMemo(() => appRepository.getWorkItems(), []);

  // View mode: 'd3' (Interactive D3 Graph) or 'tree' (Hierarchical Chart) or 'cards' (Grid Directory) or 'matrix' (Authority Matrix)
  const [viewMode, setViewMode] = useState<'d3' | 'tree' | 'cards' | 'matrix'>('d3');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(1); // Default to CEO bureau
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true
  });

  // Map sub-units under each general directorate for structural depth
  const departmentSubUnits: Record<number, SubUnit[]> = useMemo(() => ({
    1: [
      { id: '1-1', code: 'SEC-A', nameAr: 'أمانة المجلس والمراسلات العليا', nameEn: 'Board Secretariat & High-Level Directives', supervisorAr: 'أ. عبد الرحمن السبيعي', staffCount: 3 },
      { id: '1-2', code: 'SEC-B', nameAr: 'مكتب المتابعة والتنفيذ الخاص', nameEn: 'Executive Follow-up Unit', supervisorAr: 'م. حسام الشهري', staffCount: 2 }
    ],
    2: [
      { id: '2-1', code: 'LEG-A', nameAr: 'وحدة الاستشارات واللوائح النظامية', nameEn: 'Legal Consultations & By-laws', supervisorAr: 'المستشار / فهد البواردي', staffCount: 2 },
      { id: '2-2', code: 'LEG-B', nameAr: 'وحدة العقود والنزاعات الإدارية', nameEn: 'Contracts & Administrative Disputes', supervisorAr: 'أ. ريم الزهراني', staffCount: 2 }
    ],
    3: [
      { id: '3-1', code: 'FIN-A', nameAr: 'وحدة المدفوعات والارتباط المالي', nameEn: 'Payments & Financial Commitments', supervisorAr: 'أ. طلال العسيري', staffCount: 3 },
      { id: '3-2', code: 'FIN-B', nameAr: 'وحدة التخطيط المالي والميزانية العامة', nameEn: 'Budget Planning & Control', supervisorAr: 'أ. منيرة السالم', staffCount: 2 }
    ],
    4: [
      { id: '4-1', code: 'TEC-A', nameAr: 'قسم البنية التحتية والأمن السيبراني', nameEn: 'Infrastructure & Cybersecurity', supervisorAr: 'م. عمر بن خالد', staffCount: 4 },
      { id: '4-2', code: 'TEC-B', nameAr: 'قسم تطوير الأنظمة والاتصالات الإدارية', nameEn: 'Application Development & Gov Integration', supervisorAr: 'م. فهد القاسم', staffCount: 3 }
    ],
    5: [
      { id: '5-1', code: 'HR-A', nameAr: 'وحدة عمليات الموارد البشرية والرواتب', nameEn: 'HR Operations & Payroll', supervisorAr: 'أ. مشاعل الشمري', staffCount: 3 },
      { id: '5-2', code: 'HR-B', nameAr: 'وحدة التدريب وتطوير الكفاءات', nameEn: 'Talent Development & Training', supervisorAr: 'أ. زياد الغامدي', staffCount: 2 }
    ],
    6: [
      { id: '6-1', code: 'ARC-A', nameAr: 'وحدة القيد المركزي والاتصالات الحكومية الموحدة', nameEn: 'Central Registration & GSB Gateway', supervisorAr: 'أ. أحمد السالم', staffCount: 4 },
      { id: '6-2', code: 'ARC-B', nameAr: 'وحدة الفهرسة والأرشفة الرقمية والحفظ الدائم', nameEn: 'Indexing, Microfilm & Electronic Archive', supervisorAr: 'أ. سارة القحطاني', staffCount: 3 }
    ]
  }), []);

  // Department metadata additions (objectives, security classification)
  const departmentMeta: Record<number, { scopeAr: string; scopeEn: string; clearanceLevel: string; iconBg: string }> = {
    1: {
      scopeAr: 'الإشراف العام على استراتيجية المنظومة، اعتماد القرارات السيادية والمكاتبات الوزارية والتوقيع الرقمي النهائي.',
      scopeEn: 'Strategic oversight, sovereign decision sign-offs, and executive council correspondence.',
      clearanceLevel: 'سري للغاية (Top Secret - L4)',
      iconBg: 'bg-indigo-600 text-white'
    },
    2: {
      scopeAr: 'مراجعة كافة المعاملات والمذكرات النظامية، صياغة الاتفاقيات والعقود، وإبداء الرأي القانوني في المعاملات الواردة.',
      scopeEn: 'Legal compliance review, regulatory vetting, disputes management, and contract endorsement.',
      clearanceLevel: 'سري (Confidential - L3)',
      iconBg: 'bg-amber-600 text-white'
    },
    3: {
      scopeAr: 'إدارة الاعتمادات المالية، الصرف على المشروعات، متابعة الميزانيات، والتأشير المالي على المعاملات قبل الرفع.',
      scopeEn: 'Financial controls, fund allocation, payments processing, and expenditure audits.',
      clearanceLevel: 'سري (Confidential - L3)',
      iconBg: 'bg-emerald-600 text-white'
    },
    4: {
      scopeAr: 'تشغيل المنصة الإدارية، تأمين قنوات الربط الحكومي، إدارة البنية السحابية وشهادات التوقيع الإلكتروني.',
      scopeEn: 'IT systems maintenance, secure government interoperability (GSB), and digital signing keys.',
      clearanceLevel: 'سري (Confidential - L3)',
      iconBg: 'bg-blue-600 text-white'
    },
    5: {
      scopeAr: 'تنظيم شؤون الموظفين، إصدار قرارات التعيين والإجازات والتكليفات، ومتابعة الهيكل الوظيفي والصلاحيات.',
      scopeEn: 'Human talent management, delegation decrees, organizational job hierarchy, and training.',
      clearanceLevel: 'مقيد (Restricted - L2)',
      iconBg: 'bg-rose-600 text-white'
    },
    6: {
      scopeAr: 'القيد المركزي لكافة المعاملات الواردة والصادرة، التدقيق الأمني، التوزيع، والأرشفة الإلكترونية الدائمة.',
      scopeEn: 'Central institutional correspondence registry, dispatch, metadata indexing, and permanent archiving.',
      clearanceLevel: 'سري (Confidential - L3)',
      iconBg: 'bg-teal-600 text-white'
    }
  };

  // Toggle tree node expansion
  const toggleNode = (id: number) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Selected Department Details
  const selectedDept = departments.find(d => d.id === selectedDeptId) || departments[0];
  const selectedDeptEmployees = employees.filter(e => e.departmentId === selectedDept.id);
  const selectedDeptWorkItemsCount = workItems.filter(
    w => w.correspondence.senderDepartmentId === selectedDept.id || w.receiverId === selectedDept.managerId
  ).length;

  // Filtered departments for cards view
  const filteredDepartments = useMemo(() => {
    if (!searchQuery.trim()) return departments;
    const q = searchQuery.toLowerCase().trim();
    return departments.filter(
      d =>
        d.nameAr.toLowerCase().includes(q) ||
        d.nameEn.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        (d.managerNameAr && d.managerNameAr.toLowerCase().includes(q))
    );
  }, [departments, searchQuery]);

  // Root Department (CEO Office)
  const rootDept = departments.find(d => !d.parentId) || departments[0];
  // Subordinate Directorates
  const childDepts = departments.filter(d => d.parentId === rootDept.id);

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Switcher */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{isAr ? 'الهيكل التنظيمي المعتمد للمؤسسة' : 'Institutional Organizational Hierarchy'}</span>
                <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  {isAr ? 'معتمد رسمياً' : 'Official Approved'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'الشجرة الإدارية القيادية، وحدات الارتباط الإداري، مصفوفة الاختصاصات، وقنوات تدفق المعاملات'
                  : 'Administrative tree, reporting lines, functional scopes, and transaction flows'}
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle Controls */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setViewMode('d3')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              viewMode === 'd3'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isAr ? 'مخطط D3 التفاعلي (Org Visualizer)' : 'Interactive D3 Chart'}</span>
          </button>

          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              viewMode === 'tree'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isAr ? 'المخطط الهرمي (Tree)' : 'Hierarchy Tree'}</span>
          </button>

          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              viewMode === 'cards'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>{isAr ? 'دليل الإدارات (Directory)' : 'Departments Grid'}</span>
          </button>

          <button
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              viewMode === 'matrix'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'مصفوفة الصلاحيات (Authority)' : 'Authority Matrix'}</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-500 block font-semibold">{isAr ? 'إجمالي الإدارات العامة:' : 'General Directorates:'}</span>
          <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-lg mt-0.5">{departments.length} {isAr ? 'قطاعات رئيسية' : 'Sectors'}</div>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">{isAr ? 'ارتباط رئاسي مباشر' : 'Direct Line'}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-500 block font-semibold">{isAr ? 'الوحدات والأقسام التابعة:' : 'Sub-units & Sections:'}</span>
          <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-lg mt-0.5">12 {isAr ? 'وحدة متخصصة' : 'Units'}</div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{isAr ? 'مغطاة بنظام القيد والتوزيع' : 'Active Flow'}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-500 block font-semibold">{isAr ? 'إجمالي الكادر الوظيفي:' : 'Total Personnel:'}</span>
          <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-lg mt-0.5">{employees.length} {isAr ? 'مستخدم ومفوض' : 'Users'}</div>
          <span className="text-[10px] text-slate-500 font-bold">{isAr ? 'حسابات نشطة ومربوطة بالـ PKI' : 'PKI Verified'}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-500 block font-semibold">{isAr ? 'سلطة الاعتماد النهائي:' : 'Top Sign-off Authority:'}</span>
          <div className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-1 truncate">
            {rootDept.managerNameAr || 'الرئيس التنفيذي'}
          </div>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">{isAr ? 'المستوى السيادي (L4)' : 'Level 4 Clearance'}</span>
        </div>
      </div>

      {/* Main Mode View */}
      {viewMode === 'd3' && (
        <D3OrgVisualizer locale={locale} />
      )}

      {viewMode === 'tree' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left/Main Column: Visual Org Chart Tree */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Apex Node: Executive President's Bureau */}
            <div className="flex flex-col items-center">
              <div
                onClick={() => setSelectedDeptId(rootDept.id)}
                className={`w-full max-w-lg p-4 rounded-2xl border-2 transition cursor-pointer shadow-md text-center relative ${
                  selectedDeptId === rootDept.id
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-400'
                }`}
              >
                <div className="absolute top-3 right-3 text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
                  {rootDept.code}
                </div>

                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                  <Award className="w-6 h-6" />
                </div>

                <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  {isAr ? rootDept.nameAr : rootDept.nameEn}
                </div>

                <div className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold mt-1">
                  {rootDept.managerNameAr}
                </div>

                <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  <span className="flex items-center gap-1 font-mono">
                    <Users className="w-3 h-3 text-slate-400" />
                    {employees.filter(e => e.departmentId === rootDept.id).length} {isAr ? 'منسوبين' : 'Staff'}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400 font-mono">
                    Level 4 (Top Secret)
                  </span>
                </div>
              </div>

              {/* Vertical connector line */}
              <div className="w-0.5 h-8 bg-indigo-400 dark:bg-indigo-600 my-1"></div>

              {/* Horizontal distribution bar */}
              <div className="w-full max-w-2xl h-0.5 bg-slate-300 dark:bg-slate-700 relative">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
              </div>
            </div>

            {/* 2. Subordinate General Directorates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
              {childDepts.map(dept => {
                const isSelected = selectedDeptId === dept.id;
                const deptStaff = employees.filter(e => e.departmentId === dept.id);
                const subUnits = departmentSubUnits[dept.id] || [];
                const isExpanded = !!expandedNodes[dept.id];
                const meta = departmentMeta[dept.id];

                return (
                  <div
                    key={dept.id}
                    className={`rounded-2xl border transition shadow-xs flex flex-col justify-between overflow-hidden ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Card Header & Dept Details */}
                    <div
                      onClick={() => setSelectedDeptId(dept.id)}
                      className="p-4 cursor-pointer space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${meta?.iconBg || 'bg-slate-800 text-white'}`}>
                            <Building className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                              {dept.code}
                            </span>
                            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                              {isAr ? dept.nameAr : dept.nameEn}
                            </h3>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 ring-4 ring-indigo-100 dark:ring-indigo-950 shrink-0"></span>
                        )}
                      </div>

                      {/* Manager Profile Snippet */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                        <div className="text-[10px] text-slate-500 font-semibold">{isAr ? 'المدير العام المكلّف:' : 'Director General:'}</div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {dept.managerNameAr}
                        </div>
                      </div>

                      {/* Metrics Footer inside card */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                        <span className="flex items-center gap-1 font-mono font-semibold">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {deptStaff.length} {isAr ? 'موظفين مسجلين' : 'Staff'}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {subUnits.length} {isAr ? 'وحدات تابعة' : 'Sub-units'}
                        </span>
                      </div>
                    </div>

                    {/* Collapsible Sub-units Section */}
                    {subUnits.length > 0 && (
                      <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            toggleNode(dept.id);
                          }}
                          className="w-full px-4 py-2 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            <span>{isAr ? 'الأقسام والوحدات التابعة' : 'Affiliated Sections'} ({subUnits.length})</span>
                          </span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                            {isExpanded ? (isAr ? 'طي' : 'Collapse') : (isAr ? 'عرض' : 'Expand')}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-3 space-y-1.5 divide-y divide-slate-200/50 dark:divide-slate-800/50">
                            {subUnits.map(unit => (
                              <div key={unit.id} className="pt-1.5 flex items-center justify-between text-[11px]">
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                                    {isAr ? unit.nameAr : unit.nameEn}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {unit.supervisorAr} • <span className="font-mono">{unit.code}</span>
                                  </div>
                                </div>
                                <span className="text-[10px] font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                  {unit.staffCount} {isAr ? 'أعضاء' : 'staff'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Department Details Inspector */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 sticky top-6">
              {/* Dept Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-bold">
                    {selectedDept.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                    {isAr ? selectedDept.nameAr : selectedDept.nameEn}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    {selectedDept.parentId
                      ? (isAr ? 'التبعية: مكتب معالي الرئيس التنفيذي (SEC-01)' : 'Reporting: CEO Bureau')
                      : (isAr ? 'المستوى: القيادة العليا المستقلة' : 'Level: Apex Board')}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              {/* Functional Scope Description */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{isAr ? 'نطاق الاختصاص والمسؤوليات الإدارية:' : 'Scope & Functional Mandate:'}</span>
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  {isAr
                    ? (departmentMeta[selectedDept.id]?.scopeAr || 'المسؤولية عن متابعة ومعالجة كافة المعاملات والمخاطبات الواردة والصادرة ذات العلاقة.')
                    : (departmentMeta[selectedDept.id]?.scopeEn || 'Responsible for processing corresponding sector matters.')}
                </p>
              </div>

              {/* Director General Info */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isAr ? 'المسؤول الأول المفوض بالإدارة:' : 'Appointed Director / Head:'}</span>
                </span>
                <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {selectedDept.managerNameAr}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {selectedDept.id === 1 ? 'الرئيس التنفيذي' : 'مدير عام الإدارة'} • صلاحيات اعتماد كاملة
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                    AUTHORIZED
                  </span>
                </div>
              </div>

              {/* Security & Access Level */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>{isAr ? 'درجة السرية والتصريح الأمني:' : 'Security Clearance Matrix:'}</span>
                </span>
                <div className="p-2.5 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-200/80 dark:border-purple-800/50 text-xs text-purple-950 dark:text-purple-200 flex items-center justify-between">
                  <span className="font-semibold">{departmentMeta[selectedDept.id]?.clearanceLevel || 'سري (Confidential)'}</span>
                  <span className="text-[10px] font-mono bg-purple-200/60 dark:bg-purple-900/60 px-2 py-0.5 rounded font-bold">PKI Signed</span>
                </div>
              </div>

              {/* Assigned Employees List */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{isAr ? 'الموظفين المسجلين في هذا القطاع:' : 'Staff in this Department:'}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    {selectedDeptEmployees.length} {isAr ? 'موظف' : 'members'}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {selectedDeptEmployees.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      {isAr ? 'لا يوجد موظفين إضافيين مسجلين مباشرة' : 'No staff registered'}
                    </div>
                  ) : (
                    selectedDeptEmployees.map(emp => (
                      <div
                        key={emp.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs hover:border-indigo-300 transition"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{emp.fullNameAr}</span>
                            {emp.isManager && (
                              <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 rounded font-bold">
                                {isAr ? 'مدير' : 'Lead'}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {emp.jobTitleAr} • <span className="font-mono">@{emp.userCode}</span>
                          </div>
                        </div>

                        <div className="text-end text-[10px] font-mono text-slate-400">
                          {emp.email}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Cards Directory View */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400 mr-1" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'بحث في الإدارات العامة، رمز الإدارة، أو اسم المدير العام...'
                  : 'Search by department name, code, or director...'
              }
              className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 cursor-pointer"
              >
                {isAr ? 'مسح' : 'Clear'}
              </button>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDepartments.map(dept => {
              const staff = employees.filter(e => e.departmentId === dept.id);
              const subUnits = departmentSubUnits[dept.id] || [];
              const meta = departmentMeta[dept.id];

              return (
                <div
                  key={dept.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${meta?.iconBg || 'bg-slate-800 text-white'}`}>
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                            {dept.code}
                          </span>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                            {isAr ? dept.nameAr : dept.nameEn}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {isAr ? (meta?.scopeAr || '') : (meta?.scopeEn || '')}
                    </p>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">{isAr ? 'المدير العام المسؤول:' : 'Director General:'}</span>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{dept.managerNameAr}</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {staff.length} {isAr ? 'منسوبين' : 'members'}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      {subUnits.length} {isAr ? 'وحدات وأقسام' : 'units'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 3: Authority Matrix View */}
      {viewMode === 'matrix' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'مصفوفة الصلاحيات والتفويضات الإدارية المعتمدة لكل إدارة' : 'Delegated Authority & Administrative Powers Matrix'}</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">Decree #1446-ADM</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-100/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 text-start">{isAr ? 'الإدارة / القطاع' : 'Department'}</th>
                  <th className="p-3.5 text-center">{isAr ? 'قيد وتوزيع الوارد' : 'Incoming Entry'}</th>
                  <th className="p-3.5 text-center">{isAr ? 'تصدير صادر خارجي' : 'Outbox Dispatch'}</th>
                  <th className="p-3.5 text-center">{isAr ? 'اعتماد وتوقيع رقمي' : 'Digital Signing'}</th>
                  <th className="p-3.5 text-center">{isAr ? 'المعاملات السرية للغاية' : 'Top Secret Access'}</th>
                  <th className="p-3.5 text-center">{isAr ? 'الحفظ والأرشفة النهائية' : 'Final Archiving'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {departments.map(dept => {
                  const isCeo = dept.id === 1;
                  const isArchive = dept.id === 6;
                  const isLegal = dept.id === 2;

                  return (
                    <tr key={dept.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3.5 font-sans font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {dept.code}
                          </span>
                          <span>{isAr ? dept.nameAr : dept.nameEn}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        {isArchive || isCeo ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                            {isAr ? 'صلاحية كاملة' : 'Full Power'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px]">
                            {isAr ? 'استلام فقط' : 'Receive Only'}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        {isCeo || isArchive ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                            {isAr ? 'تصدير رسمي' : 'Direct Dispatch'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[11px]">
                            {isAr ? 'عبر الاتصالات' : 'Via Central'}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        {isCeo ? (
                          <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[11px]">
                            {isAr ? 'سيادي مطلق (L4)' : 'Apex (L4)'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
                            {isAr ? 'مدير الإدارة (L3)' : 'Director (L3)'}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        {isCeo ? (
                          <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-bold text-[11px]">
                            {isAr ? 'مصرّح بالكامل' : 'Granted'}
                          </span>
                        ) : isLegal ? (
                          <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">
                            {isAr ? 'بتأشيرة الرئيس' : 'By Directive'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[11px]">
                            {isAr ? 'محجوب' : 'Restricted'}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        {isArchive ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold text-[11px]">
                            {isAr ? 'مسؤولية حصرية' : 'Custodian'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 text-[11px]">
                            {isAr ? 'إيداع مؤقت' : 'Working File'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
