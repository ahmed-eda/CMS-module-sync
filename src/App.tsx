import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar, ActiveNavSection } from './components/layout/Sidebar';
import { Ribbon } from './components/layout/Ribbon';
import { InboxView } from './components/inbox/InboxView';
import { RegisterIncomingModal } from './components/correspondence/RegisterIncomingModal';
import { CreateOutgoingModal } from './components/correspondence/CreateOutgoingModal';
import { CorrespondenceDetailsModal } from './components/correspondence/CorrespondenceDetailsModal';
import { DocumentViewerModal } from './components/documents/DocumentViewerModal';
import { ForwardDialog } from './components/actions/ForwardDialog';
import { ReplyDialog } from './components/actions/ReplyDialog';
import { RefuseDialog } from './components/actions/RefuseDialog';
import { DistributeDialog } from './components/actions/DistributeDialog';
import { EndDialog } from './components/actions/EndDialog';
import { ArchiveDialog } from './components/actions/ArchiveDialog';
import { ArchiveFoldersView } from './components/archive/ArchiveFoldersView';
import { SitesDirectoryView } from './components/sites/SitesDirectoryView';
import { FollowUpReportsView } from './components/reports/FollowUpReportsView';
import { AdvancedSearchView } from './components/search/AdvancedSearchView';
import { AdminView } from './components/admin/AdminView';
import { CleanArchitectureVisualizer } from './components/architecture/CleanArchitectureVisualizer';
import { ToastProvider, toast } from './components/notifications/ToastContext';
import { ToastContainer } from './components/notifications/ToastContainer';
import { CorrespondenceQRModal } from './components/correspondence/CorrespondenceQRModal';
import { MetadataAuditPdfModal } from './components/reports/MetadataAuditPdfModal';
import { ProfileSettingsModal, SettingsTab } from './components/profile/ProfileSettingsModal';

import { appRepository } from './services/store';
import { WorkItem, Correspondence } from './types/domain';
import { CorrespondenceType, PriorityLevel, InboxType } from './types/enums';

function AppContent() {
  const [activeSection, setActiveSection] = useState<ActiveNavSection>('inbox-private');
  const [inboxSubView, setInboxSubView] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected state
  const [selectedItem, setSelectedItem] = useState<WorkItem | undefined>(undefined);
  const [detailsItem, setDetailsItem] = useState<WorkItem | null>(null);
  const [detailsInitialTab, setDetailsInitialTab] = useState<'info' | 'workflow' | 'docs' | 'routes' | 'notes' | 'audit'>('info');
  const [viewingDocId, setViewingDocId] = useState<number | null>(null);

  // Modals state
  const [isRegisterIncomingOpen, setIsRegisterIncomingOpen] = useState(false);
  const [isCreateOutgoingOpen, setIsCreateOutgoingOpen] = useState(false);
  const [isForwardOpen, setIsForwardOpen] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isRefuseOpen, setIsRefuseOpen] = useState(false);
  const [isDistributeOpen, setIsDistributeOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>('profile');

  // Store subscription
  const [workItems, setWorkItems] = useState<WorkItem[]>(appRepository.getWorkItems());
  const [session, setSession] = useState(appRepository.getSession());
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Track known correspondence IDs to detect newly arrived correspondences during polling
  const knownCorrIdsRef = useRef<Set<number>>(
    new Set(appRepository.getWorkItems().map(w => w.correspondence.id))
  );

  useEffect(() => {
    const unsubscribe = appRepository.subscribe(() => {
      const all = appRepository.getWorkItems();
      setWorkItems([...all]);
      setSession(appRepository.getSession());
      setSelectedItem(prev => (prev ? all.find(w => w.id === prev.id) || prev : prev));
      setDetailsItem(prev => (prev ? all.find(w => w.id === prev.id) || prev : prev));
    });
    return () => unsubscribe();
  }, []);

  // Unified refresh function used both by manual button and by periodic 5-minute poller
  const executeRefresh = useCallback((isManual = false) => {
    // Poll the repository/backend for updates
    const pollResult = appRepository.pollForNewCorrespondence();
    const currentItems = appRepository.getWorkItems();
    setWorkItems([...currentItems]);
    setSession(appRepository.getSession());
    setLastSyncTime(new Date());

    // Identify newly arrived correspondences that were not previously present
    const newlyArrived = currentItems.filter(
      item => !knownCorrIdsRef.current.has(item.correspondence.id)
    );

    // Update set of known IDs
    currentItems.forEach(item => {
      knownCorrIdsRef.current.add(item.correspondence.id);
    });

    const isAr = session.locale === 'ar';

    if (newlyArrived.length > 0) {
      // Display subtle notification for newly arrived correspondence
      newlyArrived.forEach(newItem => {
        const corr = newItem.correspondence;
        const sender = corr.siteNameAr || corr.senderDepartmentNameAr || (isAr ? 'جهة حكومية' : 'Government Entity');

        toast.info(
          isAr
            ? `تم استلام معاملة واردة جديدة: ${corr.title} من (${sender})`
            : `New incoming correspondence received: ${corr.title} from (${sender})`,
          {
            titleAr: 'معاملة واردة جديدة (مزامنة دورية)',
            titleEn: 'New Incoming (Auto-Sync)',
            corrNumber: corr.corrNumber,
            duration: 6500,
            action: {
              labelAr: 'معاينة المعاملة',
              labelEn: 'View Item',
              onClick: () => {
                setSelectedItem(newItem);
                setDetailsItem(newItem);
              }
            }
          }
        );
      });
    } else if (isManual) {
      toast.info(
        isAr
          ? 'تم تحديث قائمة المعاملات ومزامنة البيانات بنجاح (لا توجد معاملات واردة جديدة)'
          : 'Correspondence lists refreshed and synchronized (No new items)',
        {
          titleAr: 'تحديث البيانات',
          titleEn: 'Data Refreshed',
          duration: 2500
        }
      );
    }
  }, [session.locale]);

  // Root periodic polling mechanism (Every 5 minutes = 300,000 ms)
  useEffect(() => {
    const POLLING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

    const timer = setInterval(() => {
      executeRefresh(false);
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [executeRefresh]);

  // Filtered items based on activeSection & inboxSubView & searchQuery
  const getFilteredItems = () => {
    let list = workItems;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        w =>
          w.correspondence.corrNumber.toLowerCase().includes(q) ||
          w.correspondence.title.toLowerCase().includes(q) ||
          (w.correspondence.siteNameAr && w.correspondence.siteNameAr.toLowerCase().includes(q))
      );
    }

    // Section-level filter
    if (activeSection === 'inbox-private') {
      list = list.filter(w => w.inboxId === InboxType.Private);
    } else if (activeSection === 'inbox-general') {
      list = list.filter(w => w.inboxId === InboxType.General);
    } else if (activeSection === 'inbox-task') {
      list = list.filter(w => w.inboxId === InboxType.Task);
    } else if (activeSection === 'inbox-delegate') {
      list = list.filter(w => w.inboxId === InboxType.Delegate);
    } else if (activeSection === 'outbox') {
      list = list.filter(w => w.correspondence.senderDepartmentId === session.department.id);
    } else if (activeSection === 'presentation-notes') {
      list = list.filter(
        w => w.correspondence.corrType === CorrespondenceType.InternalPresentation
      );
    }

    // Sub-views
    switch (inboxSubView) {
      case 'unread':
        return list.filter(w => !w.isRead && !w.isDeletedFromInbox);
      case 'important':
        return list.filter(w => w.isImportant && !w.isDeletedFromInbox);
      case 'urgent':
        return list.filter(w => w.correspondence.priorityLevel >= PriorityLevel.Urgent && !w.isDeletedFromInbox);
      case 'reply-requested':
        return list.filter(w => w.correspondence.expectedResponseDate && !w.isDeletedFromInbox);
      case 'internal':
        return list.filter(
          w => w.correspondence.corrType === CorrespondenceType.InternalPresentation && !w.isDeletedFromInbox
        );
      case 'external':
        return list.filter(
          w =>
            (w.correspondence.corrType === CorrespondenceType.Incoming ||
              w.correspondence.corrType === CorrespondenceType.Outgoing) &&
            !w.isDeletedFromInbox
        );
      case 'deleted':
        return list.filter(w => !!w.isDeletedFromInbox);
      case 'all':
      default:
        return list.filter(w => !w.isDeletedFromInbox);
    }
  };

  const filteredWorkItems = getFilteredItems();

  // Keep selectedItem in sync
  useEffect(() => {
    if (session.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [session.theme]);

  // Keep selectedItem in sync
  useEffect(() => {
    if (filteredWorkItems.length > 0 && (!selectedItem || !filteredWorkItems.find(w => w.id === selectedItem.id))) {
      setSelectedItem(filteredWorkItems[0]);
    } else if (filteredWorkItems.length === 0) {
      setSelectedItem(undefined);
    }
  }, [filteredWorkItems, selectedItem]);

  const activeTargetItem = selectedItem || detailsItem || workItems[0];
  const isInboxView = [
    'inbox-private',
    'inbox-general',
    'inbox-task',
    'inbox-assignment',
    'inbox-delegate',
    'outbox',
    'presentation-notes'
  ].includes(activeSection);

  return (
    <div
      dir={session.locale === 'ar' ? 'rtl' : 'ltr'}
      className={`h-screen w-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden antialiased ${
        session.theme === 'dark' ? 'dark' : ''
      }`}
    >
      {/* Top Application Header */}
      <Header
        session={session}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onOpenSettings={(tab?: SettingsTab) => {
          setSettingsInitialTab(tab || 'profile');
          setIsSettingsOpen(true);
        }}
        onSelectCorrespondence={corrId => {
          const item = workItems.find(
            w => w.corrId === corrId || w.correspondence.id === corrId
          );
          if (item) {
            setSelectedItem(item);
            setDetailsItem(item);
          } else {
            const corr = appRepository.getCorrespondenceById(corrId);
            if (corr) {
              const syntheticItem: WorkItem = {
                id: corr.id,
                corrId: corr.id,
                inboxId: 1,
                receiverId: session.user.id,
                receiveDate: corr.registerDate,
                status: corr.status,
                correspondence: corr
              };
              setSelectedItem(syntheticItem);
              setDetailsItem(syntheticItem);
            }
          }
        }}
      />

      {/* Modern Action Ribbon */}
      <Ribbon
        selectedItem={activeTargetItem}
        locale={session.locale}
        onRegisterIncoming={() => setIsRegisterIncomingOpen(true)}
        onNewOutgoing={() => setIsCreateOutgoingOpen(true)}
        onForward={() => activeTargetItem && setIsForwardOpen(true)}
        onReply={() => activeTargetItem && setIsReplyOpen(true)}
        onRefuse={() => activeTargetItem && setIsRefuseOpen(true)}
        onDistribute={() => activeTargetItem && setIsDistributeOpen(true)}
        onAssignSelf={() => {
          if (activeTargetItem) {
            appRepository.assignToSelf(activeTargetItem.id);
            toast.success(
              session.locale === 'ar'
                ? `تم تخصيص واستلام المعاملة (${activeTargetItem.correspondence.corrNumber}) لنفسك بنجاح`
                : `Correspondence ${activeTargetItem.correspondence.corrNumber} assigned to yourself`,
              {
                titleAr: 'تم تخصيص المعاملة',
                titleEn: 'Assigned to Self',
                corrNumber: activeTargetItem.correspondence.corrNumber
              }
            );
          }
        }}
        onEnd={() => activeTargetItem && setIsEndOpen(true)}
        onRetrieve={() => {
          if (activeTargetItem) {
            appRepository.retrieveWorkItem(activeTargetItem.id);
            toast.info(
              session.locale === 'ar'
                ? `تم استرجاع المعاملة (${activeTargetItem.correspondence.corrNumber}) من الإرسال بنجاح`
                : `Correspondence ${activeTargetItem.correspondence.corrNumber} retrieved from transit`,
              {
                titleAr: 'تم استرجاع المعاملة',
                titleEn: 'Retrieval Successful',
                corrNumber: activeTargetItem.correspondence.corrNumber
              }
            );
          }
        }}
        onArchive={() => activeTargetItem && setIsArchiveOpen(true)}
        onNewNote={() => setIsCreateOutgoingOpen(true)}
        onViewDocs={() => {
          if (activeTargetItem?.correspondence.documents[0]) {
            setViewingDocId(activeTargetItem.correspondence.documents[0].id);
          }
        }}
        onViewQR={() => {
          if (activeTargetItem) {
            setIsQROpen(true);
          }
        }}
        onViewHistory={() => {
          if (activeTargetItem) {
            setDetailsInitialTab('routes');
            setDetailsItem(activeTargetItem);
          }
        }}
        onViewWorkflow={() => {
          if (activeTargetItem) {
            setDetailsInitialTab('workflow');
            setDetailsItem(activeTargetItem);
          }
        }}
        onViewAudit={() => {
          if (activeTargetItem) {
            setDetailsInitialTab('audit');
            setDetailsItem(activeTargetItem);
          }
        }}
        onExportPdf={() => {
          if (activeTargetItem) {
            setIsPdfModalOpen(true);
          }
        }}
        onDelete={() => {
          if (activeTargetItem) {
            const targetId = activeTargetItem.id;
            const targetCorrNo = activeTargetItem.correspondence.corrNumber;
            appRepository.deleteWorkItem(targetId);
            toast.warning(
              session.locale === 'ar'
                ? `تم نقل المعاملة (${targetCorrNo}) إلى سلة المحذوفات`
                : `Correspondence ${targetCorrNo} moved to recycle bin`,
              {
                titleAr: 'تم النقل لسلة المحذوفات',
                titleEn: 'Moved to Recycle Bin',
                corrNumber: targetCorrNo,
                action: {
                  labelAr: 'تراجع واستعادة',
                  labelEn: 'Undo & Restore',
                  onClick: () => {
                    appRepository.recoverWorkItem(targetId);
                    toast.success(
                      session.locale === 'ar'
                        ? `تمت استعادة المعاملة (${targetCorrNo}) إلى صندوق الوارد`
                        : `Correspondence ${targetCorrNo} restored to inbox`,
                      {
                        titleAr: 'تمت الاستعادة بنجاح',
                        titleEn: 'Restored Successfully',
                        corrNumber: targetCorrNo
                      }
                    );
                  }
                }
              }
            );
          }
        }}
        onRecover={() => {
          if (activeTargetItem) {
            appRepository.recoverWorkItem(activeTargetItem.id);
            toast.success(
              session.locale === 'ar'
                ? `تمت استعادة المعاملة (${activeTargetItem.correspondence.corrNumber}) إلى صندوق الوارد بنجاح`
                : `Correspondence ${activeTargetItem.correspondence.corrNumber} recovered to inbox`,
              {
                titleAr: 'تمت الاستعادة بنجاح',
                titleEn: 'Recovery Completed',
                corrNumber: activeTargetItem.correspondence.corrNumber
              }
            );
          }
        }}
        onRefresh={() => executeRefresh(true)}
        lastSyncTime={lastSyncTime}
      />

      {/* Main Workspace Area (Sidebar + Active View) */}
      <div className="flex-1 flex min-h-0">
        {/* Navigation Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onSelectSection={sec => {
            setIsArchitectureOpen(false);
            setActiveSection(sec);
          }}
          onOpenNewIncoming={() => setIsRegisterIncomingOpen(true)}
          onOpenNewOutgoing={() => setIsCreateOutgoingOpen(true)}
          locale={session.locale}
        />

        {/* Dynamic Main Stage */}
        <main className="flex-1 flex min-w-0 bg-white dark:bg-slate-900 overflow-hidden">
          {isArchitectureOpen ? (
            <CleanArchitectureVisualizer locale={session.locale} />
          ) : isInboxView ? (
            <InboxView
              workItems={filteredWorkItems}
              selectedItem={selectedItem}
              onSelectItem={setSelectedItem}
              onOpenDetails={item => setDetailsItem(item)}
              currentView={inboxSubView}
              onViewChange={setInboxSubView}
              locale={session.locale}
            />
          ) : activeSection === 'files' ? (
            <ArchiveFoldersView locale={session.locale} />
          ) : activeSection === 'sites' ? (
            <SitesDirectoryView locale={session.locale} />
          ) : activeSection === 'dashboard' ? (
            <FollowUpReportsView locale={session.locale} />
          ) : activeSection === 'reports' ? (
            <AdvancedSearchView onOpenDetails={item => setDetailsItem(item)} locale={session.locale} />
          ) : activeSection === 'admin' ? (
            <AdminView locale={session.locale} />
          ) : null}
        </main>
      </div>

      {/* Register Incoming Modal */}
      {isRegisterIncomingOpen && (
        <RegisterIncomingModal
          isOpen={isRegisterIncomingOpen}
          onClose={() => setIsRegisterIncomingOpen(false)}
          onSuccess={newCorr => {
            const newItem = appRepository.getWorkItems().find(w => w.correspondence.id === newCorr.id);
            if (newItem) setSelectedItem(newItem);
          }}
          locale={session.locale}
        />
      )}

      {/* Create Outgoing Modal */}
      {isCreateOutgoingOpen && (
        <CreateOutgoingModal
          isOpen={isCreateOutgoingOpen}
          onClose={() => setIsCreateOutgoingOpen(false)}
          onSuccess={newCorr => {
            const newItem = appRepository.getWorkItems().find(w => w.correspondence.id === newCorr.id);
            if (newItem) setSelectedItem(newItem);
          }}
          locale={session.locale}
        />
      )}

      {/* Full Correspondence Details Modal */}
      {detailsItem && (
        <CorrespondenceDetailsModal
          item={detailsItem}
          isOpen={!!detailsItem}
          onClose={() => {
            setDetailsItem(null);
            setDetailsInitialTab('info');
          }}
          onOpenDocument={docId => setViewingDocId(docId)}
          onForward={() => setIsForwardOpen(true)}
          onReply={() => setIsReplyOpen(true)}
          onRefuse={() => setIsRefuseOpen(true)}
          locale={session.locale}
          initialTab={detailsInitialTab}
        />
      )}

      {/* Document Viewer Modal with Zoom, Rotation & Barcode Stamp */}
      {viewingDocId && (
        <DocumentViewerModal
          documentId={viewingDocId}
          correspondence={activeTargetItem?.correspondence}
          isOpen={!!viewingDocId}
          onClose={() => setViewingDocId(null)}
          locale={session.locale}
        />
      )}

      {/* Unique QR Code & Digital Record Modal */}
      {isQROpen && activeTargetItem && (
        <CorrespondenceQRModal
          correspondence={activeTargetItem.correspondence}
          isOpen={isQROpen}
          onClose={() => setIsQROpen(false)}
          locale={session.locale}
        />
      )}

      {/* Action Dialogs */}
      {isForwardOpen && activeTargetItem && (
        <ForwardDialog
          item={activeTargetItem}
          isOpen={isForwardOpen}
          onClose={() => setIsForwardOpen(false)}
          locale={session.locale}
        />
      )}

      {isReplyOpen && activeTargetItem && (
        <ReplyDialog
          item={activeTargetItem}
          isOpen={isReplyOpen}
          onClose={() => setIsReplyOpen(false)}
          locale={session.locale}
        />
      )}

      {isRefuseOpen && activeTargetItem && (
        <RefuseDialog
          item={activeTargetItem}
          isOpen={isRefuseOpen}
          onClose={() => setIsRefuseOpen(false)}
          locale={session.locale}
        />
      )}

      {isDistributeOpen && activeTargetItem && (
        <DistributeDialog
          item={activeTargetItem}
          isOpen={isDistributeOpen}
          onClose={() => setIsDistributeOpen(false)}
          locale={session.locale}
        />
      )}

      {isEndOpen && activeTargetItem && (
        <EndDialog
          item={activeTargetItem}
          isOpen={isEndOpen}
          onClose={() => setIsEndOpen(false)}
          locale={session.locale}
        />
      )}

      {isArchiveOpen && activeTargetItem && (
        <ArchiveDialog
          item={activeTargetItem}
          isOpen={isArchiveOpen}
          onClose={() => setIsArchiveOpen(false)}
          locale={session.locale}
          onNavigateToArchive={() => {
            setIsArchiveOpen(false);
            setActiveSection('files');
          }}
        />
      )}

      {/* PDF Export & Audit Trail Report Modal from Ribbon/Main */}
      {isPdfModalOpen && activeTargetItem && (
        <MetadataAuditPdfModal
          correspondence={activeTargetItem.correspondence}
          routes={appRepository.getRoutesByCorrespondenceId(activeTargetItem.correspondence.id)}
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          locale={session.locale}
        />
      )}

      {/* Profile & Settings Modal */}
      {isSettingsOpen && (
        <ProfileSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          initialTab={settingsInitialTab}
          locale={session.locale}
        />
      )}

      {/* Non-intrusive Toast Notification Feedback */}
      <ToastContainer locale={session.locale} />
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
