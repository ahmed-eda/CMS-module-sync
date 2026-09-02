import React, { useState } from 'react';
import {
  FolderArchive,
  Plus,
  Search,
  FileText,
  Building,
  CheckCircle2,
  FolderOpen,
  X,
  Layers
} from 'lucide-react';
import { appRepository } from '../../services/store';
import { FileFolder } from '../../types/domain';
import { FileKind } from '../../types/enums';

interface ArchiveFoldersViewProps {
  locale: 'ar' | 'en';
}

export const ArchiveFoldersView: React.FC<ArchiveFoldersViewProps> = ({ locale }) => {
  const isAr = locale === 'ar';
  const folders = appRepository.getFileFolders();
  const workItems = appRepository.getWorkItems();

  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<FileFolder | null>(folders[0] || null);
  const [isCreating, setIsCreating] = useState(false);

  // New folder state
  const [titleAr, setTitleAr] = useState('');
  const [categoryNameAr, setCategoryNameAr] = useState('المشاريع الاستراتيجية والتقنية');
  const [storageLocation, setStorageLocation] = useState('');
  const [folderKind, setFolderKind] = useState<FileKind>(FileKind.Topic);

  const filteredFolders = folders.filter(
    f =>
      f.titleAr.toLowerCase().includes(search.toLowerCase()) ||
      f.fileNumber.toLowerCase().includes(search.toLowerCase()) ||
      f.categoryNameAr.toLowerCase().includes(search.toLowerCase())
  );

  const folderItems = selectedFolder
    ? workItems.filter(w => w.correspondence.fileFolderId === selectedFolder.id)
    : [];

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleAr.trim() || !storageLocation.trim()) {
      alert(isAr ? 'يرجى تعبئة اسم الملف وموقع الحفظ' : 'Please fill all required fields');
      return;
    }

    const newF = appRepository.createFileFolder({
      titleAr,
      categoryNameAr,
      storageLocation,
      kind: folderKind
    });

    setTitleAr('');
    setStorageLocation('');
    setIsCreating(false);
    setSelectedFolder(newF);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>{isAr ? 'ملفات الحفظ والأرشفة الموضوعية' : 'Archive & Subject File Folders'}</span>
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
            {isAr
              ? 'إدارة خطة التصنيف الموحدة، أماكن الحفظ الورقية والرقمية، والمعاملات المودعة'
              : 'Enterprise records classification, electronic & physical cabinet locations'}
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إنشاء ملف حفظ جديد' : 'New Archive Folder'}</span>
        </button>
      </div>

      {/* Split Area */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Folders List */}
        <div className="w-full md:w-1/2 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isAr ? 'بحث في ملفات الحفظ...' : 'Search folders...'}
                className="w-full text-xs pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-1">
            {filteredFolders.map(folder => {
              const isSelected = selectedFolder?.id === folder.id;
              return (
                <div
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder)}
                  className={`p-3.5 rounded-xl transition cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <FolderOpen className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{folder.titleAr}</span>
                        <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                          {folder.fileNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{folder.categoryNameAr}</div>
                      <div className="text-[10px] text-amber-700 dark:text-amber-400 font-mono mt-0.5">{folder.storageLocation}</div>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-full shrink-0">
                    {folder.corrCount} {isAr ? 'معاملة' : 'items'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Folder Details & Embedded Correspondences */}
        <div className="hidden md:flex md:w-1/2 flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto p-6 space-y-4">
          {selectedFolder ? (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded font-bold">
                      {selectedFolder.fileNumber}
                    </span>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{selectedFolder.titleAr}</h2>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded">
                    {selectedFolder.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 dark:text-slate-400 block text-[10px]">التصنيف الإداري:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedFolder.categoryNameAr}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 dark:text-slate-400 block text-[10px]">موقع الحفظ والرف:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedFolder.storageLocation}</span>
                  </div>
                </div>
              </div>

              {/* Correspondences inside this folder */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  {isAr ? 'المعاملات المودعة والمحفوظة في هذا الملف:' : 'Archived Correspondences in this Folder:'}
                </h3>
                <div className="space-y-2">
                  {folderItems.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs">
                      {isAr ? 'لا توجد معاملات محفوظة بهذا الملف بعد' : 'No items archived here'}
                    </div>
                  ) : (
                    folderItems.map(item => (
                      <div
                        key={item.id}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-amber-500 dark:hover:border-amber-500 transition shadow-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{item.correspondence.corrNumber}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              {new Date(item.receiveDate).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5 truncate max-w-sm">
                            {item.correspondence.title}
                          </p>
                        </div>

                        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                          {item.correspondence.siteNameAr || 'معاملة رسمية'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
              {isAr ? 'اختر ملف حفظ لاستعراض محتوياته' : 'Select a folder'}
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <h3 className="text-sm font-bold">{isAr ? 'إنشاء ملف حفظ وأرشيف جديد' : 'New Archive Folder'}</h3>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="p-6 space-y-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {isAr ? 'اسم وعنوان ملف الحفظ *' : 'Folder Title *'}
                </label>
                <input
                  type="text"
                  value={titleAr}
                  onChange={e => setTitleAr(e.target.value)}
                  placeholder="e.g. ملف عقود الصيانة البرمجية 1446هـ"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {isAr ? 'التصنيف والمجال' : 'Category'}
                </label>
                <input
                  type="text"
                  value={categoryNameAr}
                  onChange={e => setCategoryNameAr(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {isAr ? 'موقع الحفظ الفعلي والرف الرقمي *' : 'Storage Location & Shelf *'}
                </label>
                <input
                  type="text"
                  value={storageLocation}
                  onChange={e => setStorageLocation(e.target.value)}
                  placeholder="e.g. خزانة C2 / رف 04 (الأرشيف المركزي)"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
                />
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
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 rounded-xl shadow-md transition cursor-pointer"
                >
                  {isAr ? 'إنشاء الملف' : 'Create Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
