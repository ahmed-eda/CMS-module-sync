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
} from './enums';

export {
  CorrespondenceType,
  InboxType,
  SecurityLevel,
  PriorityLevel,
  DeliveryMethod,
  WorkItemStatus,
  RouteKind,
  FileKind,
  RelationType
};

export interface LookupItem {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
}

export interface Department {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  parentId?: number;
  managerId?: number;
  managerNameAr?: string;
}

export interface Employee {
  id: number;
  userCode: string;
  fullNameAr: string;
  fullNameEn: string;
  email: string;
  phone?: string;
  departmentId: number;
  departmentNameAr: string;
  jobTitleAr: string;
  jobTitleEn: string;
  securityClearance: SecurityLevel;
  signatureUrl?: string;
  avatarUrl?: string;
  isManager?: boolean;
}

export interface ExternalSite {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  siteTypeId: number;
  siteTypeNameAr: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  electronicAddress?: string; // GSB / Gov Code
}

export type Site = ExternalSite;

export interface Inbox {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  inboxType: InboxType;
  departmentId?: number;
  ownerEmployeeId?: number;
  unreadCount: number;
  totalCount: number;
}

export interface DocumentVersion {
  id: number;
  version: number;
  fileName: string;
  fileSize: string;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  notes?: string;
  fileUrl?: string;
}

export interface DocumentItem {
  id: number;
  subject: string;
  documentType: string; // خطاب رسمي، قرار، مذكرة، مرفق فني
  barcode: string;
  pageCount: number;
  isOriginal: boolean;
  activeDetail: DocumentVersion;
  historyDetails?: DocumentVersion[];
}

export interface RouteItem {
  id: number;
  corrId: number;
  fromEmployeeId: number;
  fromEmployeeNameAr: string;
  fromDepartmentNameAr: string;
  toEmployeeId?: number;
  toEmployeeNameAr?: string;
  toDepartmentId: number;
  toDepartmentNameAr: string;
  routeKind: RouteKind;
  instructionAr: string;
  actionRequiredDate?: string;
  routeDate: string;
  status: 'PENDING' | 'ACCEPTED' | 'RETURNED' | 'EXECUTED';
  isCc?: boolean;
}

export interface CorrespondenceLink {
  id: number;
  sourceCorrId: number;
  targetCorrId: number;
  targetCorrNumber: string;
  targetSubject: string;
  relationType: RelationType;
  createdDate: string;
}

export interface FileFolder {
  id: number;
  fileNumber: string;
  titleAr: string;
  titleEn: string;
  categoryNameAr: string;
  storageLocation: string; // رقم الخزانة / الرف / المستودع الرقمي
  kind: FileKind;
  status: 'active' | 'closed' | 'archived';
  createdDate: string;
  corrCount: number;
}

export interface PresentationNote {
  id: number;
  noteNumber: string;
  subject: string;
  content: string;
  recommendation: string;
  preparedByEmployeeId: number;
  preparedByEmployeeName: string;
  preparedByDepartmentName: string;
  createdDate: string;
  decisionStatus?: 'PENDING' | 'APPROVED' | 'MODIFIED' | 'REJECTED';
  decisionNote?: string;
  decisionDate?: string;
  decisionByEmployeeName?: string;
}

export interface Correspondence {
  id: number;
  corrNumber: string; // e.g. 1446/IN/00482 or 1446/OUT/00120
  title: string;
  corrType: CorrespondenceType;
  deliveryMethod: DeliveryMethod;
  deliveryDate: string;
  deliveredBy?: string;
  referenceNo?: string; // رقم وتاريخ صادر الجهة الخارجية
  referenceDate?: string;
  registerDate: string;
  siteId?: number;
  siteNameAr?: string;
  senderDepartmentId?: number;
  senderDepartmentNameAr?: string;
  securityLevel: SecurityLevel;
  priorityLevel: PriorityLevel;
  status: WorkItemStatus;
  notes?: string;
  folderPath?: string;
  fileId?: number;
  fileNameAr?: string;
  fileFolderId?: number;
  expectedResponseDate?: string;
  isReplied?: boolean;
  documents: DocumentItem[];
  links: CorrespondenceLink[];
  routesCount: number;
  presentationNotes?: PresentationNote[];
  barcode: string;
  digitalSignature?: {
    signedBy: string;
    jobTitle: string;
    signedAt: string;
    certificateHash: string;
    qrData: string;
  };
}

export interface WorkItem {
  id: number;
  corrId: number;
  inboxId: number;
  receiverId: number;
  receiveDate: string;
  status: WorkItemStatus;
  isImportant?: boolean;
  isRead?: boolean;
  isDeletedFromInbox?: boolean;
  lastInstruction?: string;
  delegatedFromEmployeeId?: number;
  delegatedFromEmployeeName?: string;
  correspondence: Correspondence;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorName: string;
  department: string;
  timestamp: string;
  details: string;
  ipAddress: string;
}

export interface UserNotificationPreferences {
  inAppAlerts: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
  emailAlerts: boolean;
  smsUrgentAlerts: boolean;
  notifyOnNewCorrespondence: boolean;
  notifyOnDeadlineApproaching: boolean;
  notifyOnOverdue: boolean;
  notifyOnUrgentDirectives: boolean;
  notifyOnWorkflowUpdates: boolean;
  notifyOnDelegation: boolean;
  notifyOnSystemSync: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // e.g. "22:00"
  quietHoursEnd: string; // e.g. "07:00"
  toastDurationSeconds: number; // e.g. 5
}

export interface UserRegionalPreferences {
  calendarType: 'hijri' | 'gregorian';
  timeFormat: '12h' | '24h';
  dateFormat: 'YYYY/MM/DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  numberSystem: 'latin' | 'arabic';
}

export interface UserSession {
  user: Employee;
  department: Department;
  locale: 'ar' | 'en';
  theme: 'light' | 'dark';
  notificationPreferences?: UserNotificationPreferences;
  regionalPreferences?: UserRegionalPreferences;
  delegations: {
    fromEmployeeId: number;
    fromEmployeeName: string;
    validUntil: string;
    permissions: string[];
  }[];
}

export type NotificationType =
  | 'NEW_CORRESPONDENCE'
  | 'DEADLINE_APPROACHING'
  | 'DEADLINE_OVERDUE'
  | 'URGENT_ACTION'
  | 'ROUTE_UPDATE'
  | 'SYSTEM_ALERT'
  | 'DELEGATION_ACTIVE';

export type NotificationCategory = 'all' | 'correspondence' | 'deadline' | 'system';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface SystemNotification {
  id: string;
  type: NotificationType;
  category: 'correspondence' | 'deadline' | 'system';
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  timestamp: string;
  isRead: boolean;
  priority: NotificationPriority;
  corrId?: number;
  corrNumber?: string;
  siteNameAr?: string;
  deadlineDate?: string;
  remainingHours?: number;
}
