import {
  CorrespondenceType,
  InboxType,
  SecurityLevel,
  PriorityLevel,
  DeliveryMethod,
  WorkItemStatus,
  RouteKind,
  FileKind,
  RelationType
} from '../types/enums';
import {
  Department,
  Employee,
  ExternalSite,
  FileFolder,
  Correspondence,
  WorkItem,
  RouteItem,
  AuditLogEntry,
  UserSession,
  DocumentItem,
  SystemNotification,
  UserNotificationPreferences,
  UserRegionalPreferences
} from '../types/domain';
import {
  SEED_DEPARTMENTS,
  SEED_EMPLOYEES,
  SEED_SITES,
  SEED_FOLDERS,
  SEED_CORRESPONDENCES,
  SEED_WORK_ITEMS,
  SEED_ROUTES,
  SEED_AUDIT_LOGS
} from '../data/seedData';

type Listener = () => void;

class AppRepository {
  private departments: Department[] = [];
  private employees: Employee[] = [];
  private sites: ExternalSite[] = [];
  private fileFolders: FileFolder[] = [];
  private correspondences: Correspondence[] = [];
  private workItems: WorkItem[] = [];
  private routes: RouteItem[] = [];
  private auditLogs: AuditLogEntry[] = [];
  private notifications: SystemNotification[] = [];
  private listeners: Set<Listener> = new Set();

  private session: UserSession = {
    user: SEED_EMPLOYEES[6], // Default: Eng. Ahmed Al-Ghamdi
    department: SEED_DEPARTMENTS[3],
    locale: 'ar',
    theme: 'light',
    notificationPreferences: {
      inAppAlerts: true,
      soundEnabled: true,
      desktopNotifications: false,
      emailAlerts: true,
      smsUrgentAlerts: true,
      notifyOnNewCorrespondence: true,
      notifyOnDeadlineApproaching: true,
      notifyOnOverdue: true,
      notifyOnUrgentDirectives: true,
      notifyOnWorkflowUpdates: true,
      notifyOnDelegation: true,
      notifyOnSystemSync: false,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      toastDurationSeconds: 5
    },
    regionalPreferences: {
      calendarType: 'hijri',
      timeFormat: '12h',
      dateFormat: 'YYYY/MM/DD',
      numberSystem: 'latin'
    },
    delegations: [
      {
        fromEmployeeId: 104,
        fromEmployeeName: 'م. فيصل بن سلطان الحربي (مدير عام التحول الرقمي)',
        validUntil: '2026-12-31',
        permissions: ['INBOX_ACTION', 'FORWARD_APPROVE', 'VIEW_CONFIDENTIAL']
      }
    ]
  };

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData() {
    this.departments = [...SEED_DEPARTMENTS];
    this.employees = [...SEED_EMPLOYEES];
    this.sites = [...SEED_SITES];
    this.fileFolders = [...SEED_FOLDERS];
    this.correspondences = JSON.parse(JSON.stringify(SEED_CORRESPONDENCES));
    this.workItems = JSON.parse(JSON.stringify(SEED_WORK_ITEMS));
    this.routes = JSON.parse(JSON.stringify(SEED_ROUTES));
    this.auditLogs = JSON.parse(JSON.stringify(SEED_AUDIT_LOGS));
    this.initializeNotifications();
  }

  private initializeNotifications() {
    const now = new Date();
    
    this.notifications = [
      {
        id: 'NOTIF-1',
        type: 'DEADLINE_APPROACHING',
        category: 'deadline',
        titleAr: 'اقتراب موعد الرد النهائي (SLA Alert)',
        titleEn: 'Upcoming Response Deadline (SLA)',
        descriptionAr: 'معاملة وارد رقم 1446/IN/00482 بشأن الميزانية التقديرية - متبقي 18 ساعة لانتهاء المهلة النظامية',
        descriptionEn: 'Incoming 1446/IN/00482 regarding Estimated Budget - 18 hours remaining to comply with SLA',
        timestamp: new Date(now.getTime() - 15 * 60000).toISOString(),
        isRead: false,
        priority: 'CRITICAL',
        corrId: 101,
        corrNumber: '1446/IN/00482',
        siteNameAr: 'وزارة المالية',
        deadlineDate: new Date(now.getTime() + 18 * 3600000).toISOString(),
        remainingHours: 18
      },
      {
        id: 'NOTIF-2',
        type: 'NEW_CORRESPONDENCE',
        category: 'correspondence',
        titleAr: 'معاملة واردة جديدة تتطلب الإجراء',
        titleEn: 'New Incoming Correspondence Received',
        descriptionAr: 'تم استلام خطاب رسمي من هيئة الحكومة الرقمية برقم 1446/IN/00484 بشأن مؤشر نضج الخدمات',
        descriptionEn: 'Official letter received from Digital Government Authority (1446/IN/00484)',
        timestamp: new Date(now.getTime() - 45 * 60000).toISOString(),
        isRead: false,
        priority: 'HIGH',
        corrId: 103,
        corrNumber: '1446/IN/00484',
        siteNameAr: 'هيئة الحكومة الرقمية (DGA)'
      },
      {
        id: 'NOTIF-3',
        type: 'URGENT_ACTION',
        category: 'correspondence',
        titleAr: 'توجيه عاجل جداً من مكتب الرئيس التنفيذي',
        titleEn: 'Urgent Direct Action from CEO Office',
        descriptionAr: 'إحالة عاجلة للمعاملة 1446/IN/00485: إعداد تقرير جاهزية الربط مع منصة اعتماد',
        descriptionEn: 'Urgent routing for 1446/IN/00485: Prepare Etimad Integration Readiness Report',
        timestamp: new Date(now.getTime() - 120 * 60000).toISOString(),
        isRead: false,
        priority: 'HIGH',
        corrId: 104,
        corrNumber: '1446/IN/00485',
        siteNameAr: 'مكتب الرئيس التنفيذي'
      },
      {
        id: 'NOTIF-4',
        type: 'DELEGATION_ACTIVE',
        category: 'system',
        titleAr: 'تفويض صلاحيات إدارية ساري',
        titleEn: 'Active Administrative Delegation',
        descriptionAr: 'لديك تفويض صلاحيات نشط من سعادة مدير عام التحول الرقمي بصلاحية اتخاذ الإجراء والتوقيع',
        descriptionEn: 'You have active delegated authority from DG of Digital Transformation',
        timestamp: new Date(now.getTime() - 240 * 60000).toISOString(),
        isRead: true,
        priority: 'NORMAL'
      },
      {
        id: 'NOTIF-5',
        type: 'SYSTEM_ALERT',
        category: 'system',
        titleAr: 'اكتمال مزامنة منصة التكامل الحكومي (GSB)',
        titleEn: 'Government Integration (GSB) Sync Successful',
        descriptionAr: 'تمت مزامنة 14 معاملة وارد وصادر عبر قناة الربط الآمن للشبكة الحكومية',
        descriptionEn: '14 transactions synchronized successfully via Secure Government Bus',
        timestamp: new Date(now.getTime() - 360 * 60000).toISOString(),
        isRead: true,
        priority: 'LOW'
      }
    ];
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public logAudit(
    action: string,
    entityType: string,
    entityId: string,
    details: string,
    ipAddress?: string
  ): AuditLogEntry {
    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      entityType,
      entityId,
      actorName: this.session.user.fullNameAr,
      department: this.session.department.nameAr,
      timestamp: new Date().toISOString(),
      details,
      ipAddress: ipAddress || '10.20.1.100'
    };
    this.auditLogs.unshift(newLog);
    this.notify();
    return newLog;
  }

  public getAuditLogsForCorrespondence(corrId: number, corrNumber?: string): AuditLogEntry[] {
    const targetCorr = this.correspondences.find(c => c.id === corrId);
    const num = corrNumber || targetCorr?.corrNumber || '';

    return this.auditLogs.filter(log => {
      if (log.entityId === String(corrId)) return true;
      if (num && log.entityId === num) return true;
      if (num && log.details.includes(num)) return true;
      if (targetCorr?.barcode && (log.details.includes(targetCorr.barcode) || log.entityId === targetCorr.barcode)) return true;
      return false;
    });
  }

  private addAuditLog(action: string, entityType: string, entityId: string, details: string) {
    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      entityType,
      entityId,
      actorName: this.session.user.fullNameAr,
      department: this.session.department.nameAr,
      timestamp: new Date().toISOString(),
      details,
      ipAddress: '10.20.1.100'
    };
    this.auditLogs.unshift(newLog);
  }

  // Session & Preferences
  public getSession(): UserSession {
    return this.session;
  }

  public setLocale(locale: 'ar' | 'en') {
    this.session.locale = locale;
    this.notify();
  }

  public setTheme(theme: 'light' | 'dark') {
    this.session.theme = theme;
    try {
      localStorage.setItem('cms_theme', theme);
    } catch {}
    this.notify();
  }

  public toggleTheme() {
    const nextTheme = this.session.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  public getNotificationPreferences(): UserNotificationPreferences {
    return this.session.notificationPreferences || {
      inAppAlerts: true,
      soundEnabled: true,
      desktopNotifications: false,
      emailAlerts: true,
      smsUrgentAlerts: true,
      notifyOnNewCorrespondence: true,
      notifyOnDeadlineApproaching: true,
      notifyOnOverdue: true,
      notifyOnUrgentDirectives: true,
      notifyOnWorkflowUpdates: true,
      notifyOnDelegation: true,
      notifyOnSystemSync: false,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      toastDurationSeconds: 5
    };
  }

  public updateNotificationPreferences(prefs: Partial<UserNotificationPreferences>) {
    const current = this.getNotificationPreferences();
    this.session.notificationPreferences = {
      ...current,
      ...prefs
    };
    this.addAuditLog(
      'تحديث تفضيلات الإشعارات',
      'USER_PREFERENCES',
      this.session.user.userCode,
      'تم حفظ تفضيلات قنوات وتنبيهات الإشعارات بنجاح'
    );
    this.notify();
  }

  public getRegionalPreferences(): UserRegionalPreferences {
    return this.session.regionalPreferences || {
      calendarType: 'hijri',
      timeFormat: '12h',
      dateFormat: 'YYYY/MM/DD',
      numberSystem: 'latin'
    };
  }

  public updateRegionalPreferences(prefs: Partial<UserRegionalPreferences>) {
    const current = this.getRegionalPreferences();
    this.session.regionalPreferences = {
      ...current,
      ...prefs
    };
    this.addAuditLog(
      'تحديث الإعدادات الإقليمية واللغوية',
      'USER_PREFERENCES',
      this.session.user.userCode,
      `تم تحديث إعدادات التقويم (${this.session.regionalPreferences?.calendarType || 'hijri'}) والتنسيق`
    );
    this.notify();
  }

  public updateUserProfile(data: {
    fullNameAr?: string;
    fullNameEn?: string;
    email?: string;
    phone?: string;
    jobTitleAr?: string;
    jobTitleEn?: string;
    avatarUrl?: string;
    signatureUrl?: string;
  }) {
    const userIndex = this.employees.findIndex(e => e.id === this.session.user.id);
    const updatedUser: Employee = {
      ...this.session.user,
      ...data
    };

    if (userIndex >= 0) {
      this.employees[userIndex] = updatedUser;
    }
    this.session.user = updatedUser;

    this.addAuditLog(
      'تحديث الملف الشخصي',
      'USER_PROFILE',
      updatedUser.userCode,
      `تم تحديث بيانات الملف الشخصي للمستخدم: ${updatedUser.fullNameAr}`
    );
    this.notify();
    return updatedUser;
  }

  public updateUserAvatar(avatarUrl: string) {
    return this.updateUserProfile({ avatarUrl });
  }

  public updateUserSignature(signatureUrl: string) {
    return this.updateUserProfile({ signatureUrl });
  }

  public resetPreferencesToDefault() {
    this.session.notificationPreferences = {
      inAppAlerts: true,
      soundEnabled: true,
      desktopNotifications: false,
      emailAlerts: true,
      smsUrgentAlerts: true,
      notifyOnNewCorrespondence: true,
      notifyOnDeadlineApproaching: true,
      notifyOnOverdue: true,
      notifyOnUrgentDirectives: true,
      notifyOnWorkflowUpdates: true,
      notifyOnDelegation: true,
      notifyOnSystemSync: false,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      toastDurationSeconds: 5
    };
    this.session.regionalPreferences = {
      calendarType: 'hijri',
      timeFormat: '12h',
      dateFormat: 'YYYY/MM/DD',
      numberSystem: 'latin'
    };
    this.session.theme = 'light';
    this.session.locale = 'ar';
    this.notify();
  }

  public switchEmployee(employeeId: number) {
    const emp = this.employees.find(e => e.id === employeeId);
    if (!emp) return;
    const dept = this.departments.find(d => d.id === emp.departmentId) || this.departments[0];
    this.session = {
      ...this.session,
      user: emp,
      department: dept
    };
    this.addAuditLog(
      'تبديل مستخدم الجلسة',
      'USER_SESSION',
      emp.userCode,
      `تم التحويل إلى المستخدم: ${emp.fullNameAr}`
    );
    this.notify();
  }

  // Lookups & Master Data
  public getDepartments(): Department[] {
    return this.departments;
  }

  public getEmployees(): Employee[] {
    return this.employees;
  }

  public updateEmployee(id: number, data: Partial<Employee>): Employee | undefined {
    const index = this.employees.findIndex(e => e.id === id);
    if (index < 0) return undefined;

    let deptName = data.departmentNameAr;
    if (data.departmentId && !deptName) {
      const dept = this.departments.find(d => d.id === data.departmentId);
      if (dept) deptName = dept.nameAr;
    }

    const updated: Employee = {
      ...this.employees[index],
      ...data,
      ...(deptName ? { departmentNameAr: deptName } : {})
    };
    this.employees[index] = updated;

    if (this.session.user.id === id) {
      this.session.user = updated;
      if (updated.departmentId !== this.session.department.id) {
        const newDept = this.departments.find(d => d.id === updated.departmentId);
        if (newDept) this.session.department = newDept;
      }
    }

    this.addAuditLog(
      'تحديث بيانات وصلاحيات موظف',
      'EMPLOYEE_UPDATE',
      updated.userCode,
      `تم تحديث بيانات الموظف ${updated.fullNameAr}: المسمى (${updated.jobTitleAr})، الإدارة (${updated.departmentNameAr})`
    );

    this.notify();
    return updated;
  }

  public updateDepartment(id: number, data: Partial<Department>): Department | undefined {
    const index = this.departments.findIndex(d => d.id === id);
    if (index < 0) return undefined;

    const updated: Department = {
      ...this.departments[index],
      ...data
    };
    this.departments[index] = updated;

    if (this.session.department.id === id) {
      this.session.department = updated;
    }

    this.addAuditLog(
      'تحديث بيانات الإدارة',
      'DEPARTMENT_UPDATE',
      updated.code,
      `تم تحديث بيانات الإدارة ${updated.nameAr}`
    );

    this.notify();
    return updated;
  }

  public getSites(): ExternalSite[] {
    return this.sites;
  }

  public getFileFolders(): FileFolder[] {
    return this.fileFolders;
  }

  public getAuditLogs(): AuditLogEntry[] {
    return this.auditLogs;
  }

  public getLookups() {
    return {
      securityLevels: [
        { id: SecurityLevel.Normal, code: 'NORMAL', nameAr: 'عادي', nameEn: 'Normal' },
        { id: SecurityLevel.Confidential, code: 'CONFIDENTIAL', nameAr: 'سري', nameEn: 'Confidential' },
        { id: SecurityLevel.TopConfidential, code: 'TOP_CONFIDENTIAL', nameAr: 'سري للغاية', nameEn: 'Top Confidential' },
        { id: SecurityLevel.Secret, code: 'SECRET', nameAr: 'محظور / عالي الحساسية', nameEn: 'Secret' }
      ],
      priorityLevels: [
        { id: PriorityLevel.Normal, code: 'NORMAL', nameAr: 'عادي', nameEn: 'Normal' },
        { id: PriorityLevel.Urgent, code: 'URGENT', nameAr: 'عاجل', nameEn: 'Urgent' },
        { id: PriorityLevel.TopUrgent, code: 'TOP_URGENT', nameAr: 'عاجل جداً', nameEn: 'Top Urgent' },
        { id: PriorityLevel.Immediate, code: 'IMMEDIATE', nameAr: 'فوري / طارئ', nameEn: 'Immediate' }
      ],
      deliveryMethods: [
        { id: DeliveryMethod.ManualCourier, code: 'COURIER', nameAr: 'مناولة باليد / مراسل', nameEn: 'Courier' },
        { id: DeliveryMethod.ElectronicSystem, code: 'ELECTRONIC', nameAr: 'منظومة التكامل الحكومي (GSB)', nameEn: 'Electronic System (GSB)' },
        { id: DeliveryMethod.Email, code: 'EMAIL', nameAr: 'بريد إلكتروني رسمي', nameEn: 'Official Email' },
        { id: DeliveryMethod.PostalMail, code: 'POST', nameAr: 'البريد الرسمي الممتاز', nameEn: 'Express Postal Mail' }
      ]
    };
  }

  // Queries
  public getWorkItems(filter?: {
    inboxType?: InboxType;
    view?: 'all' | 'unread' | 'important' | 'urgent' | 'reply-requested' | 'ending' | 'internal' | 'external' | 'deleted';
    searchQuery?: string;
  }): WorkItem[] {
    let items = [...this.workItems];

    if (filter?.searchQuery) {
      const q = filter.searchQuery.toLowerCase().trim();
      items = items.filter(
        w =>
          w.correspondence.corrNumber.toLowerCase().includes(q) ||
          w.correspondence.title.toLowerCase().includes(q) ||
          (w.correspondence.siteNameAr && w.correspondence.siteNameAr.toLowerCase().includes(q)) ||
          (w.correspondence.referenceNo && w.correspondence.referenceNo.toLowerCase().includes(q))
      );
    }

    if (filter?.view === 'deleted') {
      return items.filter(w => w.isDeletedFromInbox);
    }

    // Default exclude deleted
    items = items.filter(w => !w.isDeletedFromInbox);

    if (filter?.view === 'unread') {
      items = items.filter(w => !w.isRead || w.status === WorkItemStatus.New);
    } else if (filter?.view === 'important') {
      items = items.filter(w => w.isImportant);
    } else if (filter?.view === 'urgent') {
      items = items.filter(
        w =>
          w.correspondence.priorityLevel === PriorityLevel.Urgent ||
          w.correspondence.priorityLevel === PriorityLevel.TopUrgent ||
          w.correspondence.priorityLevel === PriorityLevel.Immediate
      );
    } else if (filter?.view === 'reply-requested') {
      items = items.filter(w => w.correspondence.expectedResponseDate && !w.correspondence.isReplied);
    } else if (filter?.view === 'internal') {
      items = items.filter(
        w =>
          w.correspondence.corrType === CorrespondenceType.InternalPresentation ||
          w.correspondence.corrType === CorrespondenceType.AdministrativeCircular
      );
    } else if (filter?.view === 'external') {
      items = items.filter(
        w =>
          w.correspondence.corrType === CorrespondenceType.Incoming ||
          w.correspondence.corrType === CorrespondenceType.Outgoing
      );
    }

    return items;
  }

  public getCorrespondenceById(id: number): Correspondence | undefined {
    return this.correspondences.find(c => c.id === id);
  }

  public getDocumentById(id: number) {
    for (const corr of this.correspondences) {
      const doc = corr.documents.find(d => d.id === id);
      if (doc) return doc;
    }
    return undefined;
  }

  public getCorrespondenceByDocumentId(docId: number): Correspondence | undefined {
    for (const corr of this.correspondences) {
      if (corr.documents.some(d => d.id === docId)) {
        return corr;
      }
    }
    return undefined;
  }

  public getRoutesForCorr(corrId: number): RouteItem[] {
    return this.routes.filter(r => r.corrId === corrId);
  }

  public getRoutesByCorrespondenceId(corrId: number): RouteItem[] {
    return this.routes.filter(r => r.corrId === corrId);
  }

  public getCorrespondences(): Correspondence[] {
    return [...this.correspondences];
  }

  public getAllRoutes(): RouteItem[] {
    return [...this.routes];
  }

  public getAllWorkItems(): WorkItem[] {
    return [...this.workItems];
  }

  public getActiveCorrespondenceCounts(): {
    byDepartment: Record<number, { total: number; urgent: number; incoming: number; outgoing: number; internal: number }>;
    byRole: Record<string, number>;
    byEmployee: Record<string, number>;
    totalActive: number;
    totalUrgent: number;
  } {
    // Base workload counts representing institutional correspondence flow
    const deptWorkloads: Record<number, { total: number; urgent: number; incoming: number; outgoing: number; internal: number }> = {
      1: { total: 12, urgent: 3, incoming: 5, outgoing: 4, internal: 3 },
      2: { total: 9, urgent: 2, incoming: 3, outgoing: 4, internal: 2 },
      201: { total: 5, urgent: 1, incoming: 2, outgoing: 2, internal: 1 },
      202: { total: 4, urgent: 1, incoming: 1, outgoing: 2, internal: 1 },
      3: { total: 14, urgent: 4, incoming: 6, outgoing: 5, internal: 3 },
      301: { total: 8, urgent: 2, incoming: 4, outgoing: 3, internal: 1 },
      302: { total: 6, urgent: 2, incoming: 2, outgoing: 2, internal: 2 },
      4: { total: 18, urgent: 5, incoming: 8, outgoing: 6, internal: 4 },
      401: { total: 11, urgent: 3, incoming: 5, outgoing: 4, internal: 2 },
      402: { total: 7, urgent: 2, incoming: 3, outgoing: 2, internal: 2 },
      5: { total: 8, urgent: 1, incoming: 3, outgoing: 3, internal: 2 },
      501: { total: 5, urgent: 1, incoming: 2, outgoing: 2, internal: 1 },
      502: { total: 3, urgent: 0, incoming: 1, outgoing: 1, internal: 1 },
      6: { total: 23, urgent: 6, incoming: 12, outgoing: 8, internal: 3 },
      601: { total: 15, urgent: 4, incoming: 9, outgoing: 5, internal: 1 },
      602: { total: 8, urgent: 2, incoming: 3, outgoing: 3, internal: 2 }
    };

    const roleWorkloads: Record<string, number> = {
      'r-1': 8,
      'r-2': 4,
      'r-20': 5,
      'r-21': 4,
      'r-201': 5,
      'r-202': 4,
      'r-30': 6,
      'r-301': 8,
      'r-302': 6,
      'r-40': 7,
      'r-401': 11,
      'r-402': 7,
      'r-50': 4,
      'r-501': 5,
      'r-502': 3,
      'r-60': 8,
      'r-601': 15,
      'r-602': 8
    };

    const employeeWorkloads: Record<string, number> = {
      'EMP-001': 8,
      'EMP-006': 4,
      'EMP-002': 5,
      'EMP-014': 4,
      'EMP-015': 5,
      'EMP-003': 6,
      'EMP-018': 8,
      'EMP-019': 6,
      'EMP-004': 7,
      'EMP-022': 11,
      'EMP-023': 7,
      'EMP-005': 4,
      'EMP-026': 5,
      'EMP-027': 3,
      'EMP-007': 8
    };

    // Calculate dynamically added correspondences in store
    const addedCorrs = this.correspondences.filter(
      c =>
        c.status !== WorkItemStatus.Completed &&
        c.status !== WorkItemStatus.Archived &&
        c.status !== WorkItemStatus.Rejected
    );

    // Dynamic addition for any newly registered or routed correspondences beyond the initial seed
    for (const corr of addedCorrs) {
      if (corr.id > 1004) {
        const corrRoutes = this.routes.filter(r => r.corrId === corr.id);
        const latestRoute = corrRoutes[corrRoutes.length - 1];
        const targetDeptId = latestRoute ? latestRoute.toDepartmentId : corr.senderDepartmentId || 1;
        const isUrgent =
          corr.priorityLevel === PriorityLevel.Urgent ||
          corr.priorityLevel === PriorityLevel.TopUrgent ||
          corr.priorityLevel === PriorityLevel.Immediate;

        if (!deptWorkloads[targetDeptId]) {
          deptWorkloads[targetDeptId] = { total: 0, urgent: 0, incoming: 0, outgoing: 0, internal: 0 };
        }
        deptWorkloads[targetDeptId].total += 1;
        if (isUrgent) deptWorkloads[targetDeptId].urgent += 1;
        if (corr.corrType === CorrespondenceType.Incoming) deptWorkloads[targetDeptId].incoming += 1;
        else if (corr.corrType === CorrespondenceType.Outgoing) deptWorkloads[targetDeptId].outgoing += 1;
        else deptWorkloads[targetDeptId].internal += 1;

        if (latestRoute?.toEmployeeNameAr) {
          const emp = this.employees.find(
            e => e.id === latestRoute.toEmployeeId || e.fullNameAr === latestRoute.toEmployeeNameAr
          );
          if (emp) {
            employeeWorkloads[emp.userCode] = (employeeWorkloads[emp.userCode] || 0) + 1;
          }
        }
      }
    }

    let totalActive = 0;
    let totalUrgent = 0;
    Object.values(deptWorkloads).forEach(w => {
      totalActive += w.total;
      totalUrgent += w.urgent;
    });

    return {
      byDepartment: deptWorkloads,
      byRole: roleWorkloads,
      byEmployee: employeeWorkloads,
      totalActive,
      totalUrgent
    };
  }

  // CQRS Commands
  public registerIncoming(data: {
    title: string;
    siteId: number;
    referenceNo: string;
    referenceDate?: string;
    deliveryMethod: DeliveryMethod;
    deliveredBy?: string;
    securityLevel: SecurityLevel;
    priorityLevel: PriorityLevel;
    notes?: string;
    fileFolderId?: number;
    expectedResponseDays?: number;
    documents?: {
      subject: string;
      documentType: string;
      pageCount: number;
      fileName: string;
      fileSize: string;
    }[];
  }): Correspondence {
    const id = Date.now();
    const site = this.sites.find(s => s.id === data.siteId);
    const seq = String(this.correspondences.length + 1).padStart(5, '0');
    const corrNumber = `1446/IN/${seq}`;
    const barcode = `446${seq}01`;

    let expectedResponseDate: string | undefined;
    if (data.expectedResponseDays && data.expectedResponseDays > 0) {
      const d = new Date();
      d.setDate(d.getDate() + data.expectedResponseDays);
      expectedResponseDate = d.toISOString();
    }

    const folder = this.fileFolders.find(f => f.id === data.fileFolderId);

    const docItems: DocumentItem[] = (data.documents || []).map((doc, idx) => ({
      id: Date.now() + idx,
      subject: doc.subject,
      documentType: doc.documentType || 'مستند رسمي',
      barcode: `DOC-446-${Date.now() + idx}`,
      pageCount: doc.pageCount || 1,
      isOriginal: true,
      activeDetail: {
        id: Date.now() + 100 + idx,
        version: 1,
        fileName: doc.fileName || 'document.pdf',
        fileSize: doc.fileSize || '1.5 MB',
        mimeType: 'application/pdf',
        uploadedAt: new Date().toISOString(),
        uploadedBy: this.session.user.fullNameAr
      }
    }));

    // If no docs, add default
    if (docItems.length === 0) {
      docItems.push({
        id: Date.now() + 10,
        subject: `أصل كتاب الوارد رقم ${data.referenceNo}`,
        documentType: 'خطاب رسمي وارد',
        barcode: `DOC-446-${id}`,
        pageCount: 2,
        isOriginal: true,
        activeDetail: {
          id: Date.now() + 20,
          version: 1,
          fileName: `Incoming_${data.referenceNo}.pdf`,
          fileSize: '1.2 MB',
          mimeType: 'application/pdf',
          uploadedAt: new Date().toISOString(),
          uploadedBy: this.session.user.fullNameAr
        }
      });
    }

    const newCorr: Correspondence = {
      id,
      corrNumber,
      title: data.title,
      corrType: CorrespondenceType.Incoming,
      deliveryMethod: data.deliveryMethod,
      deliveryDate: new Date().toISOString(),
      deliveredBy: data.deliveredBy || 'مركز الاتصالات الإدارية',
      referenceNo: data.referenceNo,
      referenceDate: data.referenceDate || new Date().toISOString(),
      registerDate: new Date().toISOString(),
      siteId: data.siteId,
      siteNameAr: site ? site.nameAr : 'جهة خارجية',
      securityLevel: data.securityLevel,
      priorityLevel: data.priorityLevel,
      status: WorkItemStatus.New,
      notes: data.notes,
      fileFolderId: data.fileFolderId,
      fileNameAr: folder?.titleAr,
      expectedResponseDate,
      isReplied: false,
      barcode,
      documents: docItems,
      links: [],
      routesCount: 1
    };

    this.correspondences.unshift(newCorr);

    // Initial Route to Central Registry / CEO Office
    const initialRoute: RouteItem = {
      id: Date.now() + 50,
      corrId: id,
      fromEmployeeId: this.session.user.id,
      fromEmployeeNameAr: this.session.user.fullNameAr,
      fromDepartmentNameAr: this.session.department.nameAr,
      toEmployeeId: this.session.user.id,
      toEmployeeNameAr: this.session.user.fullNameAr,
      toDepartmentId: this.session.department.id,
      toDepartmentNameAr: this.session.department.nameAr,
      routeKind: RouteKind.ActionNeeded,
      instructionAr: 'تم قيد الوارد في النظام للاطلاع واتخاذ اللازم',
      routeDate: new Date().toISOString(),
      status: 'PENDING'
    };
    this.routes.unshift(initialRoute);

    // Create WorkItem in user's inbox
    const newWorkItem: WorkItem = {
      id: Date.now() + 60,
      corrId: id,
      inboxId: 1,
      receiverId: this.session.user.id,
      receiveDate: new Date().toISOString(),
      status: WorkItemStatus.New,
      isImportant: false,
      isRead: false,
      lastInstruction: 'تم قيد الوارد في النظام للاطلاع واتخاذ اللازم',
      correspondence: newCorr
    };
    this.workItems.unshift(newWorkItem);

    if (folder) {
      folder.corrCount += 1;
    }

    this.addAuditLog(
      'تسجيل قيد وارد جديد',
      'CORRESPONDENCE',
      corrNumber,
      `تم قيد وارد رسمي جديد برقم: ${corrNumber} - الجهة: ${site?.nameAr}`
    );

    this.addNotification({
      type: 'NEW_CORRESPONDENCE',
      category: 'correspondence',
      titleAr: `تم تسجيل قيد وارد جديد (${corrNumber})`,
      titleEn: `New Incoming Registered (${corrNumber})`,
      descriptionAr: `${data.title} - الجهة: ${site ? site.nameAr : 'جهة خارجية'}`,
      descriptionEn: `${data.title} from ${site ? site.nameEn : 'External Entity'}`,
      priority: data.priorityLevel >= PriorityLevel.Urgent ? 'HIGH' : 'NORMAL',
      corrId: id,
      corrNumber,
      siteNameAr: site?.nameAr,
      deadlineDate: expectedResponseDate
    });

    this.notify();
    return newCorr;
  }

  public createOutgoing(data: {
    title: string;
    siteId: number;
    securityLevel: SecurityLevel;
    priorityLevel: PriorityLevel;
    senderDepartmentId: number;
    notes?: string;
    fileFolderId?: number;
    content?: string;
  }): Correspondence {
    const id = Date.now();
    const site = this.sites.find(s => s.id === data.siteId);
    const dept = this.departments.find(d => d.id === data.senderDepartmentId);
    const seq = String(this.correspondences.length + 1).padStart(5, '0');
    const corrNumber = `1446/OUT/${seq}`;
    const barcode = `446${seq}02`;

    const folder = this.fileFolders.find(f => f.id === data.fileFolderId);

    const docItems: DocumentItem[] = [
      {
        id: Date.now() + 10,
        subject: `أصل كتاب الصادر المعتمد رقم ${corrNumber}`,
        documentType: 'خطاب صادر رسمي',
        barcode: `DOC-446-${id}`,
        pageCount: 1,
        isOriginal: true,
        activeDetail: {
          id: Date.now() + 20,
          version: 1,
          fileName: `Outgoing_${seq}.pdf`,
          fileSize: '950 KB',
          mimeType: 'application/pdf',
          uploadedAt: new Date().toISOString(),
          uploadedBy: this.session.user.fullNameAr
        }
      }
    ];

    const newCorr: Correspondence = {
      id,
      corrNumber,
      title: data.title,
      corrType: CorrespondenceType.Outgoing,
      deliveryMethod: DeliveryMethod.ElectronicSystem,
      deliveryDate: new Date().toISOString(),
      deliveredBy: 'قسم الصادر العام الإلكتروني',
      registerDate: new Date().toISOString(),
      siteId: data.siteId,
      siteNameAr: site?.nameAr,
      senderDepartmentId: data.senderDepartmentId,
      senderDepartmentNameAr: dept?.nameAr,
      securityLevel: data.securityLevel,
      priorityLevel: data.priorityLevel,
      status: WorkItemStatus.Completed,
      notes: data.notes || data.content,
      fileFolderId: data.fileFolderId,
      fileNameAr: folder?.titleAr,
      barcode,
      documents: docItems,
      links: [],
      routesCount: 1,
      digitalSignature: {
        signedBy: this.session.user.fullNameAr,
        jobTitle: this.session.user.jobTitleAr,
        signedAt: new Date().toISOString(),
        certificateHash: `SHA256: ${Math.random().toString(36).substring(2, 15)}`,
        qrData: `LINKFLOW:${corrNumber}:SIGNED:${new Date().toISOString().substring(0, 10)}`
      }
    };

    this.correspondences.unshift(newCorr);

    const newWorkItem: WorkItem = {
      id: Date.now() + 60,
      corrId: id,
      inboxId: 1,
      receiverId: this.session.user.id,
      receiveDate: new Date().toISOString(),
      status: WorkItemStatus.Completed,
      isImportant: false,
      isRead: true,
      lastInstruction: 'تم تصدير الكتاب الصادر إلكترونياً بنجاح',
      correspondence: newCorr
    };
    this.workItems.unshift(newWorkItem);

    if (folder) folder.corrCount += 1;

    this.addAuditLog(
      'إصدار وتصدير صادر رسمي',
      'CORRESPONDENCE',
      corrNumber,
      `تم إصدار وتوقيع صادر رسمي برقم ${corrNumber} موجه إلى: ${site?.nameAr}`
    );

    this.addNotification({
      type: 'ROUTE_UPDATE',
      category: 'correspondence',
      titleAr: `تم تصدير وتوقيع صادر رسمي (${corrNumber})`,
      titleEn: `Outgoing Dispatched & Signed (${corrNumber})`,
      descriptionAr: `تم توجيه المعاملة إلى: ${site?.nameAr || 'الجهة الخارجية'}`,
      descriptionEn: `Official outgoing dispatched to ${site?.nameEn || 'External Entity'}`,
      priority: 'NORMAL',
      corrId: id,
      corrNumber,
      siteNameAr: site?.nameAr
    });

    this.notify();
    return newCorr;
  }

  public forwardWorkItem(
    workItemId: number,
    data: {
      toDepartmentId: number;
      toEmployeeId?: number;
      routeKind: RouteKind;
      instructionAr: string;
      actionRequiredDate?: string;
    }
  ) {
    const wi = this.workItems.find(w => w.id === workItemId);
    if (!wi) throw new Error('المعاملة غير موجودة');

    const toDept = this.departments.find(d => d.id === data.toDepartmentId);
    const toEmp = this.employees.find(e => e.id === data.toEmployeeId);

    const routeItem: RouteItem = {
      id: Date.now(),
      corrId: wi.corrId,
      fromEmployeeId: this.session.user.id,
      fromEmployeeNameAr: this.session.user.fullNameAr,
      fromDepartmentNameAr: this.session.department.nameAr,
      toEmployeeId: data.toEmployeeId,
      toEmployeeNameAr: toEmp?.fullNameAr,
      toDepartmentId: data.toDepartmentId,
      toDepartmentNameAr: toDept ? toDept.nameAr : 'الإدارة المختصة',
      routeKind: data.routeKind,
      instructionAr: data.instructionAr,
      actionRequiredDate: data.actionRequiredDate,
      routeDate: new Date().toISOString(),
      status: 'PENDING'
    };

    this.routes.unshift(routeItem);
    wi.correspondence.routesCount += 1;
    wi.status = WorkItemStatus.InProgress;
    wi.lastInstruction = data.instructionAr;

    this.addAuditLog(
      'إحالة وتوجيه معاملة',
      'ROUTE',
      wi.correspondence.corrNumber,
      `تم توجيه المعاملة إلى: ${toDept?.nameAr} - التأشيرة: ${data.instructionAr}`
    );

    this.addNotification({
      type: data.routeKind === RouteKind.ActionNeeded ? 'URGENT_ACTION' : 'ROUTE_UPDATE',
      category: data.actionRequiredDate ? 'deadline' : 'correspondence',
      titleAr: `إحالة معاملة: ${wi.correspondence.corrNumber}`,
      titleEn: `Correspondence Routed: ${wi.correspondence.corrNumber}`,
      descriptionAr: `تمت الإحالة إلى ${toDept?.nameAr || 'الإدارة'} - ${data.instructionAr}`,
      descriptionEn: `Routed to ${toDept?.nameEn || 'Department'} - ${data.instructionAr}`,
      priority: data.actionRequiredDate ? 'HIGH' : 'NORMAL',
      corrId: wi.corrId,
      corrNumber: wi.correspondence.corrNumber,
      deadlineDate: data.actionRequiredDate
    });

    this.notify();
  }

  public replyWorkItem(
    workItemId: number,
    data: {
      replyTitle: string;
      replyNotes: string;
    }
  ) {
    const wi = this.workItems.find(w => w.id === workItemId);
    if (!wi) throw new Error('المعاملة غير موجودة');

    wi.correspondence.isReplied = true;
    wi.status = WorkItemStatus.Completed;

    const replyRoute: RouteItem = {
      id: Date.now(),
      corrId: wi.corrId,
      fromEmployeeId: this.session.user.id,
      fromEmployeeNameAr: this.session.user.fullNameAr,
      fromDepartmentNameAr: this.session.department.nameAr,
      toDepartmentId: wi.correspondence.senderDepartmentId || 1,
      toDepartmentNameAr: wi.correspondence.senderDepartmentNameAr || 'الإدارة الطالبة',
      routeKind: RouteKind.Reply,
      instructionAr: `رد رسمي: ${data.replyNotes}`,
      routeDate: new Date().toISOString(),
      status: 'EXECUTED'
    };
    this.routes.unshift(replyRoute);

    this.addAuditLog(
      'تسجيل رد رسمي على معاملة',
      'CORRESPONDENCE_REPLY',
      wi.correspondence.corrNumber,
      `تم إرسال رد رسمي: ${data.replyTitle}`
    );

    this.notify();
  }

  public refuseWorkItem(workItemId: number, reason: string) {
    const wi = this.workItems.find(w => w.id === workItemId);
    if (!wi) throw new Error('المعاملة غير موجودة');

    wi.status = WorkItemStatus.Rejected;
    const lastRoute = this.routes.find(r => r.corrId === wi.corrId);

    const returnRoute: RouteItem = {
      id: Date.now(),
      corrId: wi.corrId,
      fromEmployeeId: this.session.user.id,
      fromEmployeeNameAr: this.session.user.fullNameAr,
      fromDepartmentNameAr: this.session.department.nameAr,
      toEmployeeId: lastRoute?.fromEmployeeId || 101,
      toEmployeeNameAr: lastRoute?.fromEmployeeNameAr || 'المرسل',
      toDepartmentId: 1,
      toDepartmentNameAr: lastRoute?.fromDepartmentNameAr || 'الإدارة المرسلة',
      routeKind: RouteKind.Return,
      instructionAr: `إعادة ورفض المعاملة: ${reason}`,
      routeDate: new Date().toISOString(),
      status: 'RETURNED'
    };
    this.routes.unshift(returnRoute);

    this.addAuditLog(
      'إعادة ورفض معاملة',
      'CORRESPONDENCE_REFUSE',
      wi.correspondence.corrNumber,
      `تمت إعادة المعاملة لعدم الاختصاص أو استيفاء المتطلبات: ${reason}`
    );

    this.notify();
  }

  public distributeWorkItem(
    workItemId: number,
    departmentIds: number[],
    instruction: string
  ) {
    const wi = this.workItems.find(w => w.id === workItemId);
    if (!wi) throw new Error('المعاملة غير موجودة');

    for (const deptId of departmentIds) {
      const dept = this.departments.find(d => d.id === deptId);
      if (!dept) continue;

      const distRoute: RouteItem = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        corrId: wi.corrId,
        fromEmployeeId: this.session.user.id,
        fromEmployeeNameAr: this.session.user.fullNameAr,
        fromDepartmentNameAr: this.session.department.nameAr,
        toDepartmentId: deptId,
        toDepartmentNameAr: dept.nameAr,
        routeKind: RouteKind.ForInfo,
        instructionAr: `تعميم وتوزيع: ${instruction}`,
        routeDate: new Date().toISOString(),
        status: 'PENDING',
        isCc: true
      };
      this.routes.unshift(distRoute);
    }

    wi.correspondence.routesCount += departmentIds.length;

    this.addAuditLog(
      'توزيع وتعميم معاملة',
      'CORRESPONDENCE_DISTRIBUTE',
      wi.correspondence.corrNumber,
      `تم تعميم المعاملة على ${departmentIds.length} إدارة`
    );

    this.notify();
  }

  public assignToSelf(workItemId: number) {
    const wi = this.workItems.find(w => w.id === workItemId);
    if (!wi) throw new Error('المعاملة غير موجودة');

    wi.inboxId = 3; // Task Inbox
    wi.status = WorkItemStatus.InProgress;
    wi.isImportant = true;

    this.addAuditLog(
      'تخصيص معاملة للنفس',
      'WORK_ITEM_ASSIGN',
      wi.correspondence.corrNumber,
      'تم تحويل المعاملة إلى صندوق المهام الشخصية للمتابعة والإنجاز'
    );

    this.notify();
  }

  public endCorrespondence(workItemId: number, endReason: string) {
    const wi = this.workItems.find(w => w.id === workItemId);
    if (!wi) throw new Error('المعاملة غير موجودة');

    wi.status = WorkItemStatus.Completed;
    wi.correspondence.status = WorkItemStatus.Completed;

    const endRoute: RouteItem = {
      id: Date.now(),
      corrId: wi.corrId,
      fromEmployeeId: this.session.user.id,
      fromEmployeeNameAr: this.session.user.fullNameAr,
      fromDepartmentNameAr: this.session.department.nameAr,
      toDepartmentId: this.session.department.id,
      toDepartmentNameAr: this.session.department.nameAr,
      routeKind: RouteKind.End,
      instructionAr: `إنهاء وإقفال المعاملة: ${endReason}`,
      routeDate: new Date().toISOString(),
      status: 'EXECUTED'
    };
    this.routes.unshift(endRoute);

    this.addAuditLog(
      'إنهاء وإقفال معاملة',
      'CORRESPONDENCE_END',
      wi.correspondence.corrNumber,
      `تم إقفال المعاملة بنجاح: ${endReason}`
    );

    this.notify();
  }

  public retrieveWorkItem(workItemId: number) {
    const wi = this.workItems.find(w => w.id === workItemId);
    if (!wi) throw new Error('المعاملة غير موجودة');

    wi.status = WorkItemStatus.InProgress;
    this.addAuditLog(
      'استرجاع وسحب معاملة',
      'WORK_ITEM_RETRIEVE',
      wi.correspondence.corrNumber,
      'تم سحب الإحالة السابقة واسترجاع المعاملة لمتابعة التعديل'
    );

    this.notify();
  }

  public archiveWorkItem(workItemId: number, fileFolderId: number) {
    const wi = this.workItems.find(w => w.id === workItemId);
    if (!wi) throw new Error('المعاملة غير موجودة');

    const folder = this.fileFolders.find(f => f.id === fileFolderId);
    if (!folder) throw new Error('ملف الحفظ غير موجود');

    wi.correspondence.fileFolderId = fileFolderId;
    wi.correspondence.fileNameAr = folder.titleAr;
    wi.status = WorkItemStatus.Archived;
    folder.corrCount += 1;

    this.addAuditLog(
      'أرشفة وحفظ معاملة',
      'ARCHIVE',
      wi.correspondence.corrNumber,
      `تم إيداع وحفظ المعاملة داخل ملف الحفظ: ${folder.titleAr} (${folder.storageLocation})`
    );

    this.notify();
  }

  public deleteWorkItem(workItemId: number) {
    const wi = this.workItems.find(w => w.id === workItemId);
    if (!wi) return;
    wi.isDeletedFromInbox = true;
    this.addAuditLog(
      'نقل المعاملة إلى سلة المحذوفات',
      'WORK_ITEM_DELETE',
      wi.correspondence.corrNumber,
      'تم نقل عنصر العمل إلى سلة المحذوفات'
    );
    this.notify();
  }

  public recoverWorkItem(workItemId: number) {
    const wi = this.workItems.find(w => w.id === workItemId);
    if (!wi) return;
    wi.isDeletedFromInbox = false;
    this.addAuditLog(
      'استعادة المعاملة من المحذوفات',
      'WORK_ITEM_RECOVER',
      wi.correspondence.corrNumber,
      'تمت استعادة عنصر العمل إلى الصندوق'
    );
    this.notify();
  }

  public toggleImportance(workItemId: number) {
    const wi = this.workItems.find(w => w.id === workItemId);
    if (!wi) return;
    wi.isImportant = !wi.isImportant;
    this.notify();
  }

  public markAsRead(workItemId: number) {
    const wi = this.workItems.find(w => w.id === workItemId);
    if (!wi) return;
    wi.isRead = true;
    if (wi.status === WorkItemStatus.New) {
      wi.status = WorkItemStatus.Read;
    }
    this.addAuditLog(
      'تحديث حالة القراءة',
      'WORK_ITEM_STATUS',
      wi.correspondence.corrNumber,
      'تم تعيين المعاملة كمقروءة'
    );
    this.notify();
  }

  public markAsUnread(workItemId: number) {
    const wi = this.workItems.find(w => w.id === workItemId);
    if (!wi) return;
    wi.isRead = false;
    if (wi.status === WorkItemStatus.Read) {
      wi.status = WorkItemStatus.New;
    }
    this.addAuditLog(
      'تحديث حالة القراءة',
      'WORK_ITEM_STATUS',
      wi.correspondence.corrNumber,
      'تم تعيين المعاملة يدوياً كغير مقروءة'
    );
    this.notify();
  }

  public toggleReadStatus(workItemId: number): boolean {
    const wi = this.workItems.find(w => w.id === workItemId);
    if (!wi) return false;
    if (wi.isRead) {
      this.markAsUnread(workItemId);
      return false; // Now unread
    } else {
      this.markAsRead(workItemId);
      return true; // Now read
    }
  }

  public markAllAsRead(inboxId?: number) {
    const targetItems = inboxId
      ? this.workItems.filter(w => w.inboxId === inboxId && !w.isRead)
      : this.workItems.filter(w => !w.isRead);

    targetItems.forEach(wi => {
      wi.isRead = true;
      if (wi.status === WorkItemStatus.New) {
        wi.status = WorkItemStatus.Read;
      }
    });

    this.addAuditLog(
      'تحديد الكل كمقروء',
      'WORK_ITEM_BATCH',
      'INBOX_ALL',
      `تم تعيين ${targetItems.length} معاملة كمقروءة دفعة واحدة`
    );
    this.notify();
  }

  public createFileFolder(folderData: {
    titleAr: string;
    titleEn?: string;
    categoryNameAr: string;
    storageLocation: string;
    folderKind?: any;
    kind?: FileKind;
    fileNumber?: string;
    status?: 'active' | 'closed' | 'archived';
  }): FileFolder {
    const newFolder: FileFolder = {
      id: Date.now(),
      fileNumber: folderData.fileNumber || `FIL-446-00${this.fileFolders.length + 1}`,
      titleAr: folderData.titleAr,
      titleEn: folderData.titleEn || folderData.titleAr,
      categoryNameAr: folderData.categoryNameAr,
      storageLocation: folderData.storageLocation,
      kind: folderData.kind || (folderData.folderKind as FileKind) || FileKind.General,
      status: folderData.status || 'active',
      createdDate: new Date().toISOString(),
      corrCount: 0
    };
    this.fileFolders.push(newFolder);
    this.addAuditLog(
      'إنشاء ملف حفظ جديد',
      'FILE_FOLDER',
      newFolder.fileNumber,
      `تم إنشاء ملف حفظ أرشيفي جديد بعنوان: ${newFolder.titleAr}`
    );
    this.notify();
    return newFolder;
  }

  public addSite(siteData: {
    nameAr: string;
    nameEn: string;
    siteTypeCode: string;
    siteTypeNameAr: string;
  }): ExternalSite {
    const newSite: ExternalSite = {
      id: Date.now(),
      code: `SITE-${this.sites.length + 10}`,
      nameAr: siteData.nameAr,
      nameEn: siteData.nameEn,
      siteTypeId: 1,
      siteTypeNameAr: siteData.siteTypeNameAr
    };
    this.sites.push(newSite);
    this.addAuditLog(
      'إضافة جهة خارجية',
      'EXTERNAL_SITE',
      newSite.code,
      `تمت إضافة جهة جديدة: ${newSite.nameAr}`
    );
    this.notify();
    return newSite;
  }

  // Notification Center Methods
  public getNotifications(): SystemNotification[] {
    return [...this.notifications];
  }

  // Simulated incoming queue for periodic polling and GSB synchronization
  private incomingSimulationQueue = [
    {
      title: 'تقرير الامتثال لمعايير وضوابط حوكمة البيانات الوطنية والذكاء الاصطناعي (NDMO)',
      siteNameAr: 'الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا)',
      referenceNo: 'SDAIA/446/7821',
      securityLevel: SecurityLevel.Confidential,
      priorityLevel: PriorityLevel.Urgent,
      expectedDays: 7,
      docTitle: 'وثيقة تدقيق الامتثال الوطني للبيانات.pdf'
    },
    {
      title: 'إشعار ربط واجهات برمجة التطبيقات مع منصة توثيق وتكامل الخدمات الحكومية (GSB)',
      siteNameAr: 'هيئة الحكومة الرقمية (DGA)',
      referenceNo: 'DGA/INT/446/902',
      securityLevel: SecurityLevel.Normal,
      priorityLevel: PriorityLevel.TopUrgent,
      expectedDays: 3,
      docTitle: 'مواصفات الربط التقني المحدثة.pdf'
    },
    {
      title: 'تعميم وزاري عاجل بشأن تقييم وتطوير الأداء الوظيفي لموظفي القطاع العام',
      siteNameAr: 'وزارة الموارد البشرية والتنمية الاجتماعية',
      referenceNo: 'HRSD/GEN/1446/339',
      securityLevel: SecurityLevel.Normal,
      priorityLevel: PriorityLevel.Immediate,
      expectedDays: 2,
      docTitle: 'الدليل الإجرائي لإدارة الأداء.pdf'
    },
    {
      title: 'توجيه سامٍ كريم بشأن اعتماد الخطة الوطنية الاستراتيجية للتحول الرقمي 2030',
      siteNameAr: 'الديوان الملكي',
      referenceNo: 'ROYAL/DIR/1446/019',
      securityLevel: SecurityLevel.TopConfidential,
      priorityLevel: PriorityLevel.TopUrgent,
      expectedDays: 5,
      docTitle: 'الأمر السامي والملحقات التنفيذية.pdf'
    }
  ];
  private incomingQueueIndex = 0;

  /**
   * Polls the repository / backend service for newly arrived correspondence.
   * If simulation is active and queue has items, it registers the incoming item,
   * adds a system notification, and returns the new items for subtle UI alerts.
   */
  public pollForNewCorrespondence(): {
    hasNew: boolean;
    newItems: WorkItem[];
    allWorkItems: WorkItem[];
    timestamp: string;
  } {
    const prevIds = new Set(this.workItems.map(w => w.id));
    const now = new Date();
    const newItems: WorkItem[] = [];

    // Check if simulation queue can yield a new incoming correspondence
    if (this.incomingSimulationQueue.length > 0) {
      const template = this.incomingSimulationQueue[this.incomingQueueIndex % this.incomingSimulationQueue.length];
      this.incomingQueueIndex++;

      const seqNumber = String(this.correspondences.length + 1).padStart(5, '0');
      const corrNumber = `1446/IN/${seqNumber}`;
      const corrId = Date.now();

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + template.expectedDays);

      const newCorr: Correspondence = {
        id: corrId,
        corrNumber,
        title: template.title,
        corrType: CorrespondenceType.Incoming,
        deliveryMethod: DeliveryMethod.ElectronicSystem,
        deliveryDate: now.toISOString(),
        deliveredBy: 'منظومة التكامل الحكومي (GSB)',
        referenceNo: template.referenceNo,
        referenceDate: now.toISOString(),
        registerDate: now.toISOString(),
        siteNameAr: template.siteNameAr,
        securityLevel: template.securityLevel,
        priorityLevel: template.priorityLevel,
        status: WorkItemStatus.New,
        notes: 'تم استلام المعاملة وقيدها تلقائياً عبر خدمة التكامل الدوري (GSB Poller)',
        expectedResponseDate: expectedDate.toISOString(),
        isReplied: false,
        barcode: `446${seqNumber}01`,
        documents: [
          {
            id: corrId + 10,
            subject: `أصل المعاملة الواردة: ${template.title}`,
            documentType: 'خطاب رسمي إلكتروني',
            barcode: `DOC-446-${corrId}`,
            pageCount: 3,
            isOriginal: true,
            activeDetail: {
              id: corrId + 20,
              version: 1,
              fileName: template.docTitle,
              fileSize: '1.8 MB',
              mimeType: 'application/pdf',
              uploadedAt: now.toISOString(),
              uploadedBy: 'منظومة التكامل الحكومي (GSB)'
            }
          }
        ],
        links: [],
        routesCount: 1
      };

      this.correspondences.unshift(newCorr);

      const initialRoute: RouteItem = {
        id: corrId + 50,
        corrId,
        fromEmployeeId: this.session.user.id,
        fromEmployeeNameAr: 'منظومة التكامل GSB',
        fromDepartmentNameAr: 'مركز الاتصالات الإدارية',
        toEmployeeId: this.session.user.id,
        toEmployeeNameAr: this.session.user.fullNameAr,
        toDepartmentId: this.session.department.id,
        toDepartmentNameAr: this.session.department.nameAr,
        routeKind: RouteKind.ActionNeeded,
        instructionAr: 'وارد إلكتروني جديد للاطلاع والتوجيه واتخاذ اللازم',
        routeDate: now.toISOString(),
        status: 'PENDING'
      };
      this.routes.unshift(initialRoute);

      const newWorkItem: WorkItem = {
        id: corrId + 60,
        corrId,
        inboxId: InboxType.Private,
        receiverId: this.session.user.id,
        receiveDate: now.toISOString(),
        status: WorkItemStatus.New,
        isImportant: template.priorityLevel >= PriorityLevel.TopUrgent,
        isRead: false,
        lastInstruction: 'وارد إلكتروني جديد للاطلاع والتوجيه واتخاذ اللازم',
        correspondence: newCorr
      };
      this.workItems.unshift(newWorkItem);
      newItems.push(newWorkItem);

      // Add system notification in notification center
      this.addNotification({
        type: 'NEW_CORRESPONDENCE',
        category: 'correspondence',
        titleAr: 'معاملة واردة جديدة (مزامنة دورية)',
        titleEn: 'New Incoming Correspondence (Auto-Sync)',
        descriptionAr: `تم استلام ${template.title} من ${template.siteNameAr} برقم قيد ${corrNumber}`,
        descriptionEn: `Received ${template.title} from ${template.siteNameAr} (#${corrNumber})`,
        priority: template.priorityLevel >= PriorityLevel.TopUrgent ? 'HIGH' : 'NORMAL',
        corrId,
        corrNumber,
        siteNameAr: template.siteNameAr
      });

      this.addAuditLog(
        'مزامنة واستلام وارد تلقائي',
        'GSB_SYNC_POLLER',
        corrNumber,
        `تم استلام وقيد المعاملة الواردة بنجاح من خلال آلية الاستطلاع والتزامن الدوري: ${template.title}`
      );

      this.notify();
    }

    return {
      hasNew: newItems.length > 0,
      newItems,
      allWorkItems: [...this.workItems],
      timestamp: now.toISOString()
    };
  }

  public getUnreadNotificationCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  public markNotificationAsRead(id: string) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif && !notif.isRead) {
      notif.isRead = true;
      this.notify();
    }
  }

  public markAllNotificationsAsRead() {
    let changed = false;
    this.notifications.forEach(n => {
      if (!n.isRead) {
        n.isRead = true;
        changed = true;
      }
    });
    if (changed) this.notify();
  }

  public dismissNotification(id: string) {
    const prevLen = this.notifications.length;
    this.notifications = this.notifications.filter(n => n.id !== id);
    if (this.notifications.length !== prevLen) {
      this.notify();
    }
  }

  public clearAllNotifications() {
    this.notifications = [];
    this.notify();
  }

  public addNotification(
    data: Omit<SystemNotification, 'id' | 'timestamp' | 'isRead'> & {
      id?: string;
      timestamp?: string;
      isRead?: boolean;
    }
  ): SystemNotification {
    const newNotif: SystemNotification = {
      id: data.id || `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: data.timestamp || new Date().toISOString(),
      isRead: data.isRead ?? false,
      type: data.type,
      category: data.category,
      titleAr: data.titleAr,
      titleEn: data.titleEn,
      descriptionAr: data.descriptionAr,
      descriptionEn: data.descriptionEn,
      priority: data.priority,
      corrId: data.corrId,
      corrNumber: data.corrNumber,
      siteNameAr: data.siteNameAr,
      deadlineDate: data.deadlineDate,
      remainingHours: data.remainingHours
    };

    this.notifications.unshift(newNotif);
    this.notify();
    return newNotif;
  }
}

export const appRepository = new AppRepository();
