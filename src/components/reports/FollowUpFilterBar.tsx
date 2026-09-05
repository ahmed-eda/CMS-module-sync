import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Building,
  Filter,
  X,
  RotateCcw,
  ChevronDown,
  Sparkles,
  Check,
  CalendarRange,
  ArrowUpDown
} from 'lucide-react';
import { Department } from '../../types/domain';

export type DatePreset = 'all' | 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';

export interface FollowUpFilterState {
  datePreset: DatePreset;
  startDate: string; // 'YYYY-MM-DD' or ''
  endDate: string;   // 'YYYY-MM-DD' or ''
  departmentId: string; // 'all' or department id as string
}

interface FollowUpFilterBarProps {
  locale: 'ar' | 'en';
  filters: FollowUpFilterState;
  onFilterChange: (newFilters: FollowUpFilterState) => void;
  departments: Department[];
  totalAvailableCount: number;
  filteredCount: number;
  departmentItemCounts?: Record<number, number>;
  onReset: () => void;
}

export const FollowUpFilterBar: React.FC<FollowUpFilterBarProps> = ({
  locale,
  filters,
  onFilterChange,
  departments,
  totalAvailableCount,
  filteredCount,
  departmentItemCounts = {},
  onReset
}) => {
  const isAr = locale === 'ar';
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Compute preset dates relative to current operational timestamp (2026-09-05)
  const getPresetDates = (preset: DatePreset): { startDate: string; endDate: string } => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const todayStr = toDateStr(now);

    switch (preset) {
      case 'today':
        return { startDate: todayStr, endDate: todayStr };
      case 'last7days': {
        const d = new Date(now);
        d.setDate(d.getDate() - 6);
        return { startDate: toDateStr(d), endDate: todayStr };
      }
      case 'last30days': {
        const d = new Date(now);
        d.setDate(d.getDate() - 29);
        return { startDate: toDateStr(d), endDate: todayStr };
      }
      case 'thisMonth': {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { startDate: toDateStr(firstDay), endDate: toDateStr(lastDay) };
      }
      case 'lastMonth': {
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        return { startDate: toDateStr(firstDay), endDate: toDateStr(lastDay) };
      }
      case 'all':
      default:
        return { startDate: '', endDate: '' };
    }
  };

  const handleSelectPreset = (preset: DatePreset) => {
    if (preset === 'custom') {
      onFilterChange({
        ...filters,
        datePreset: 'custom'
      });
      setIsDatePickerOpen(true);
      return;
    }

    const { startDate, endDate } = getPresetDates(preset);
    onFilterChange({
      ...filters,
      datePreset: preset,
      startDate,
      endDate
    });
    setIsDatePickerOpen(false);
  };

  const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFilterChange({
      ...filters,
      datePreset: 'custom',
      [field]: value
    });
  };

  const handleSelectDepartment = (deptId: string) => {
    onFilterChange({
      ...filters,
      departmentId: deptId
    });
    setIsDepartmentOpen(false);
  };

  const selectedDepartment = useMemo(() => {
    if (filters.departmentId === 'all') return null;
    return departments.find(d => String(d.id) === filters.departmentId) || null;
  }, [departments, filters.departmentId]);

  const isFiltered = filters.datePreset !== 'all' || filters.departmentId !== 'all' || filters.startDate !== '' || filters.endDate !== '';

  const presetLabels: Record<DatePreset, { ar: string; en: string }> = {
    all: { ar: 'كل الفترات', en: 'All Dates' },
    today: { ar: 'اليوم', en: 'Today' },
    last7days: { ar: 'آخر 7 أيام', en: 'Last 7 Days' },
    last30days: { ar: 'آخر 30 يوماً', en: 'Last 30 Days' },
    thisMonth: { ar: 'الشهر الحالي', en: 'This Month' },
    lastMonth: { ar: 'الشهر السابق', en: 'Last Month' },
    custom: { ar: 'فترة مخصصة', en: 'Custom Range' }
  };

  // Human readable date range label
  const formattedDateRangeText = useMemo(() => {
    if (filters.datePreset === 'all' && !filters.startDate && !filters.endDate) {
      return isAr ? 'جميع المعاملات المؤرشفة والنشطة' : 'All Historical & Active Correspondence';
    }
    if (filters.datePreset !== 'custom') {
      return isAr ? presetLabels[filters.datePreset].ar : presetLabels[filters.datePreset].en;
    }
    if (filters.startDate && filters.endDate) {
      return isAr ? `من ${filters.startDate} إلى ${filters.endDate}` : `From ${filters.startDate} to ${filters.endDate}`;
    }
    if (filters.startDate) {
      return isAr ? `ابتداءً من ${filters.startDate}` : `From ${filters.startDate}`;
    }
    if (filters.endDate) {
      return isAr ? `حتى ${filters.endDate}` : `Until ${filters.endDate}`;
    }
    return isAr ? 'فترة مخصصة' : 'Custom Range';
  }, [filters, isAr]);

  return (
    <div
      id="followup-filter-bar"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3.5 print:border print:border-slate-400 print:bg-white print:text-black print:p-3 print:space-y-2"
    >
      {/* Header Line & Quick Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3 print:pb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {isAr ? 'نطاق الرصد والتصفية الفورية (Real-time Scoping)' : 'Real-time Data Scoping & Filtering'}
              </span>
              {isFiltered && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold font-mono">
                  {isAr ? 'تصفية نشطة' : 'Filtered'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-400">
              {isAr
                ? 'تخصيص مجالات التحليل لجميع الرسوم البيانية ومسار المعالجة في وقت حقيقي'
                : 'Instantly scope all KPIs, distribution charts, and timeline milestones'}
            </p>
          </div>
        </div>

        {/* Scoped Count Badge & Reset Action */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono">
            <span className="text-slate-400">{isAr ? 'المعاملات المشمولة:' : 'Scoped:'}</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{filteredCount}</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-600 dark:text-slate-300">{totalAvailableCount}</span>
          </div>

          {isFiltered && (
            <button
              id="btn-reset-filters"
              onClick={onReset}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition cursor-pointer print:hidden"
              title={isAr ? 'إلغاء كافة الفلاتر واستعادة النطاق الكامل' : 'Reset all filters'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Department Filter Component (5 cols on md) */}
        <div className="md:col-span-5 relative">
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isAr ? 'الإدارة أو القطاع المختص' : 'Target Department'}</span>
          </label>

          <div className="relative">
            <button
              id="dropdown-department-filter"
              type="button"
              onClick={() => setIsDepartmentOpen(prev => !prev)}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs border transition cursor-pointer text-start ${
                selectedDepartment
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-600 text-slate-900 dark:text-slate-100 font-medium'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-500" />
                <span className="truncate">
                  {selectedDepartment
                    ? isAr
                      ? selectedDepartment.nameAr
                      : selectedDepartment.nameEn
                    : isAr
                    ? 'كافة الإدارات والقطاعات (الكل)'
                    : 'All Departments & Sectors'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {selectedDepartment && (
                  <span
                    onClick={e => {
                      e.stopPropagation();
                      handleSelectDepartment('all');
                    }}
                    className="p-0.5 rounded hover:bg-emerald-200/60 dark:hover:bg-emerald-900/60 text-slate-400 hover:text-slate-700"
                    title={isAr ? 'مسح الفلتر' : 'Clear'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isDepartmentOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {/* Department Dropdown Menu */}
            {isDepartmentOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDepartmentOpen(false)}
                />
                <div
                  id="department-filter-menu"
                  className="absolute z-50 mt-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-1.5 max-h-72 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* All Departments Option */}
                  <button
                    type="button"
                    onClick={() => handleSelectDepartment('all')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer text-start ${
                      filters.departmentId === 'all'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                      <span>{isAr ? 'كافة الإدارات والقطاعات (الكل)' : 'All Departments & Sectors'}</span>
                    </div>
                    <span className="font-mono text-[11px] opacity-80">
                      {totalAvailableCount}
                    </span>
                  </button>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                  {/* Department Items */}
                  {departments.map(dept => {
                    const isSelected = String(dept.id) === filters.departmentId;
                    const count = departmentItemCounts[dept.id] || 0;

                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => handleSelectDepartment(String(dept.id))}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer text-start ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="truncate">{isAr ? dept.nameAr : dept.nameEn}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                            {dept.code}
                          </span>
                          <span className="font-mono text-[11px] opacity-80 min-w-[20px] text-end">
                            {count}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Date-Range Picker (7 cols on md) */}
        <div className="md:col-span-7 space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isAr ? 'النطاق الزمني لتسجيل المعاملات' : 'Registration Date Scope'}</span>
            </label>

            {/* Custom Range Toggle / Display */}
            <button
              id="btn-toggle-custom-date"
              type="button"
              onClick={() => setIsDatePickerOpen(prev => !prev)}
              className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <CalendarRange className="w-3 h-3" />
              <span>
                {isDatePickerOpen
                  ? isAr ? 'إخفاء التقويم' : 'Hide Custom Dates'
                  : isAr ? 'تحديد تواريخ مخصصة' : 'Custom Dates'}
              </span>
            </button>
          </div>

          {/* Quick Presets Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
            {(['all', 'last30days', 'last7days', 'today', 'thisMonth', 'lastMonth'] as DatePreset[]).map(preset => {
              const isActive = filters.datePreset === preset;
              const label = isAr ? presetLabels[preset].ar : presetLabels[preset].en;

              return (
                <button
                  key={preset}
                  id={`btn-date-preset-${preset}`}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition shrink-0 cursor-pointer border ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Inputs Drawer (Shown when custom is picked or toggled) */}
          {(isDatePickerOpen || filters.datePreset === 'custom') && (
            <div
              id="custom-date-inputs-row"
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150"
            >
              {/* Start Date */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 font-medium shrink-0">
                  {isAr ? 'من تاريخ:' : 'From:'}
                </span>
                <input
                  id="filter-start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={e => handleCustomDateChange('startDate', e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 font-mono outline-none cursor-pointer"
                  title={isAr ? 'تاريخ البداية' : 'Start Date'}
                />
                {filters.startDate && (
                  <button
                    type="button"
                    onClick={() => handleCustomDateChange('startDate', '')}
                    className="p-0.5 rounded text-slate-400 hover:text-slate-600"
                    title={isAr ? 'مسح تاريخ البداية' : 'Clear start date'}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* End Date */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 font-medium shrink-0">
                  {isAr ? 'إلى تاريخ:' : 'To:'}
                </span>
                <input
                  id="filter-end-date"
                  type="date"
                  value={filters.endDate}
                  onChange={e => handleCustomDateChange('endDate', e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 font-mono outline-none cursor-pointer"
                  title={isAr ? 'تاريخ النهاية' : 'End Date'}
                />
                {filters.endDate && (
                  <button
                    type="button"
                    onClick={() => handleCustomDateChange('endDate', '')}
                    className="p-0.5 rounded text-slate-400 hover:text-slate-600"
                    title={isAr ? 'مسح تاريخ النهاية' : 'Clear end date'}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filter Scope Summary Bar (Print Friendly & Visible) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {isAr ? 'النطاق الإحصائي المطبق:' : 'Active Applied Scope:'}
          </span>

          {/* Department Chip */}
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <Building className="w-3 h-3 text-emerald-600" />
            <span>
              {selectedDepartment
                ? isAr
                  ? selectedDepartment.nameAr
                  : selectedDepartment.nameEn
                : isAr
                ? 'كافة الإدارات والقطاعات'
                : 'All Departments'}
            </span>
            {selectedDepartment && (
              <button
                type="button"
                onClick={() => handleSelectDepartment('all')}
                className="hover:text-rose-600 ms-0.5 print:hidden"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>

          {/* Date Range Chip */}
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-mono">
            <Calendar className="w-3 h-3 text-emerald-600" />
            <span>{formattedDateRangeText}</span>
            {filters.datePreset !== 'all' && (
              <button
                type="button"
                onClick={() => handleSelectPreset('all')}
                className="hover:text-rose-600 ms-0.5 print:hidden"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        </div>

        {/* Real-time Status Indicator */}
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{isAr ? 'المخططات والمسارات متزامنة لحظياً' : 'Visuals & milestones live synced'}</span>
        </div>
      </div>
    </div>
  );
};
