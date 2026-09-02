import React, { useState } from 'react';
import { Search, Filter, Calendar, Building, FileText, CheckCircle2, RotateCcw } from 'lucide-react';
import { appRepository } from '../../services/store';
import { WorkItem } from '../../types/domain';
import { CorrespondenceType, PriorityLevel, SecurityLevel } from '../../types/enums';

interface AdvancedSearchViewProps {
  onOpenDetails: (item: WorkItem) => void;
  locale: 'ar' | 'en';
}

export const AdvancedSearchView: React.FC<AdvancedSearchViewProps> = ({ onOpenDetails, locale }) => {
  const isAr = locale === 'ar';
  const sites = appRepository.getSites();
  const departments = appRepository.getDepartments();

  const [corrNumber, setCorrNumber] = useState('');
  const [keyword, setKeyword] = useState('');
  const [siteId, setSiteId] = useState<string>('');
  const [corrType, setCorrType] = useState<string>('');
  const [securityLevel, setSecurityLevel] = useState<string>('');
  const [priorityLevel, setPriorityLevel] = useState<string>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const allItems = appRepository.getWorkItems();

  const handleReset = () => {
    setCorrNumber('');
    setKeyword('');
    setSiteId('');
    setCorrType('');
    setSecurityLevel('');
    setPriorityLevel('');
    setFromDate('');
    setToDate('');
  };

  const filteredItems = allItems.filter(item => {
    const corr = item.correspondence;
    if (corrNumber && !corr.corrNumber.toLowerCase().includes(corrNumber.toLowerCase())) return false;
    if (keyword && !corr.title.toLowerCase().includes(keyword.toLowerCase())) return false;
    if (siteId && String(corr.siteId) !== siteId) return false;
    if (corrType && String(corr.corrType) !== corrType) return false;
    if (securityLevel && String(corr.securityLevel) !== securityLevel) return false;
    if (priorityLevel && String(corr.priorityLevel) !== priorityLevel) return false;
    if (fromDate && corr.registerDate < fromDate) return false;
    if (toDate && corr.registerDate > toDate) return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none">
      {/* Header */}
      <div>
        <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>{isAr ? 'البحث المتقدم والمطابقة الشاملة' : 'Advanced Search & Multi-Criteria Filtering'}</span>
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
          {isAr
            ? 'البحث الدقيق عبر أرقام القيود، الكلمات المفتاحية، الجهات المصدرة، والتواريخ'
            : 'Find correspondences by multiple metadata parameters'}
        </p>
      </div>

      {/* Filter Form Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              {isAr ? 'رقم القيد / المعاملة' : 'Registry Number'}
            </label>
            <input
              type="text"
              value={corrNumber}
              onChange={e => setCorrNumber(e.target.value)}
              placeholder="e.g. 1446/IN/00482"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              {isAr ? 'كلمات في الموضوع' : 'Keyword in Title'}
            </label>
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder={isAr ? 'الميزانية، التحول الرقمي...' : 'Keywords...'}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              {isAr ? 'الجهة الخارجية' : 'External Entity'}
            </label>
            <select
              value={siteId}
              onChange={e => setSiteId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="">{isAr ? 'جميع الجهات' : 'All Entities'}</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nameAr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              {isAr ? 'نوع المعاملة' : 'Type'}
            </label>
            <select
              value={corrType}
              onChange={e => setCorrType(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="">{isAr ? 'الكل' : 'All'}</option>
              <option value={CorrespondenceType.Incoming}>{isAr ? 'وارد خارجي' : 'Incoming'}</option>
              <option value={CorrespondenceType.Outgoing}>{isAr ? 'صادر خارجي' : 'Outgoing'}</option>
              <option value={CorrespondenceType.InternalPresentation}>{isAr ? 'مذكرة عرض داخلية' : 'Internal'}</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {isAr ? `نتائج البحث: (${filteredItems.length}) معاملة` : `Found ${filteredItems.length} matches`}
          </span>

          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}</span>
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => onOpenDetails(item)}
              className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer flex items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{item.correspondence.corrNumber}</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded font-mono border border-slate-200 dark:border-slate-700">
                    {item.correspondence.siteNameAr || 'إدارة داخلية'}
                  </span>
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{item.correspondence.title}</div>
              </div>

              <div className="text-end font-mono text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                {new Date(item.receiveDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
