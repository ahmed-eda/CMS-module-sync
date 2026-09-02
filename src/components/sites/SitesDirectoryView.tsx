import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  X,
  CheckCircle2
} from 'lucide-react';
import { appRepository } from '../../services/store';
import { ExternalSite } from '../../types/domain';

interface SitesDirectoryViewProps {
  locale: 'ar' | 'en';
}

export const SitesDirectoryView: React.FC<SitesDirectoryViewProps> = ({ locale }) => {
  const isAr = locale === 'ar';
  const sites = appRepository.getSites();
  const workItems = appRepository.getWorkItems();

  const [search, setSearch] = useState('');
  const [selectedSite, setSelectedSite] = useState<ExternalSite | null>(sites[0] || null);
  const [isCreating, setIsCreating] = useState(false);

  // New site form
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [siteTypeNameAr, setSiteTypeNameAr] = useState('وزارة وهيئة حكومية');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const filteredSites = sites.filter(
    s =>
      s.nameAr.toLowerCase().includes(search.toLowerCase()) ||
      s.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  const siteCorrespondences = selectedSite
    ? workItems.filter(w => w.correspondence.siteId === selectedSite.id)
    : [];

  const handleAddSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) {
      alert(isAr ? 'يرجى إدخال اسم الجهة باللغة العربية' : 'Enter site name');
      return;
    }

    const newS = appRepository.addSite({
      nameAr,
      nameEn: nameEn || nameAr,
      siteTypeCode: 'GOV',
      siteTypeNameAr
    });

    setNameAr('');
    setNameEn('');
    setIsCreating(false);
    setSelectedSite(newS);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>{isAr ? 'دليل الجهات الخارجية ومنظومة الربط (GSB)' : 'External Entities & Integration Directory'}</span>
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
            {isAr
              ? 'إدارة بيانات الوزارات، الهيئات، السفارات، والشركات، وتتبع المعاملات المتبادلة'
              : 'Directory of government ministries, authorities, and private entities'}
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إضافة جهة جديدة' : 'Add New Entity'}</span>
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Sites List */}
        <div className="w-full md:w-1/2 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isAr ? 'بحث بالاسم أو الكود...' : 'Search entities...'}
                className="w-full text-xs pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-1">
            {filteredSites.map(site => {
              const isSelected = selectedSite?.id === site.id;
              return (
                <div
                  key={site.id}
                  onClick={() => setSelectedSite(site)}
                  className={`p-3.5 rounded-xl transition cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700">
                      {site.code.split('-')[1] || 'GOV'}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{site.nameAr}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">{site.siteTypeNameAr}</div>
                    </div>
                  </div>

                  {site.electronicAddress && (
                    <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded font-bold">
                      GSB Connected
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Site Details */}
        <div className="hidden md:flex md:w-1/2 flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto p-6 space-y-4">
          {selectedSite ? (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded font-bold">
                      {selectedSite.code}
                    </span>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{selectedSite.nameAr}</h2>
                    <p className="text-xs text-slate-400 dark:text-slate-400">{selectedSite.nameEn}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                    {selectedSite.siteTypeNameAr}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span className="truncate">{selectedSite.email || 'inbound@gov.sa'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span>{selectedSite.phone || '+966 11 800 0000'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 col-span-2 text-slate-700 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span>{selectedSite.address || 'المملكة العربية السعودية'}</span>
                  </div>
                </div>
              </div>

              {/* Correspondences with this entity */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  {isAr ? 'المراسلات والمعاملات المتبادلة مع هذه الجهة:' : 'Correspondences with this Entity:'}
                </h3>
                <div className="space-y-2">
                  {siteCorrespondences.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs">
                      {isAr ? 'لا توجد معاملات مسجلة مع هذه الجهة حالياً' : 'No transactions recorded'}
                    </div>
                  ) : (
                    siteCorrespondences.map(item => (
                      <div
                        key={item.id}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-emerald-500 dark:hover:border-emerald-500 transition shadow-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{item.correspondence.corrNumber}</span>
                          <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5 truncate max-w-sm">
                            {item.correspondence.title}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          {new Date(item.receiveDate).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
              {isAr ? 'اختر جهة لعرض التفاصيل' : 'Select an entity'}
            </div>
          )}
        </div>
      </div>

      {/* Add Site Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <h3 className="text-sm font-bold">{isAr ? 'إضافة جهة خارجية جديدة' : 'Add External Entity'}</h3>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSite} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {isAr ? 'اسم الجهة باللغة العربية *' : 'Entity Name (Arabic) *'}
                </label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={e => setNameAr(e.target.value)}
                  placeholder="e.g. هيئة الاتصالات والفضاء والتقنية"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {isAr ? 'اسم الجهة باللغة الإنجليزية' : 'Entity Name (English)'}
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={e => setNameEn(e.target.value)}
                  placeholder="e.g. CST Authority"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {isAr ? 'نوع وتصنيف الجهة' : 'Entity Category'}
                </label>
                <select
                  value={siteTypeNameAr}
                  onChange={e => setSiteTypeNameAr(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                >
                  <option value="وزارة وهيئة حكومية">وزارة وهيئة حكومية</option>
                  <option value="هيئة ومؤسسة عامة">هيئة ومؤسسة عامة</option>
                  <option value="سفارة أو ممثلية دبلوماسية">سفارة أو ممثلية دبلوماسية</option>
                  <option value="شركة وقطاع خاص">شركة وقطاع خاص</option>
                </select>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl shadow-md transition cursor-pointer"
                >
                  {isAr ? 'حفظ الجهة' : 'Save Entity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
