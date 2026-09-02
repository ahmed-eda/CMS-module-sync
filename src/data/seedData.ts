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
  AuditLogEntry
} from '../types/domain';

export const SEED_DEPARTMENTS: Department[] = [
  {
    id: 1,
    code: 'SEC-01',
    nameAr: 'مكتب معالي الرئيس التنفيذي',
    nameEn: "Executive President's Bureau",
    managerId: 101,
    managerNameAr: 'معالي الدكتور / عبد العزيز بن محمد آل الشيخ'
  },
  {
    id: 2,
    code: 'LEGAL-02',
    nameAr: 'الإدارة العامة للشؤون القانونية والالتزام',
    nameEn: 'General Directorate of Legal Affairs & Compliance',
    parentId: 1,
    managerId: 102,
    managerNameAr: 'سعادة المستشار / طارق بن فهد السديري'
  },
  {
    id: 3,
    code: 'FIN-03',
    nameAr: 'الإدارة العامة للشؤون المالية والميزانية',
    nameEn: 'General Directorate of Financial Affairs & Budgeting',
    parentId: 1,
    managerId: 103,
    managerNameAr: 'الأستاذ / عبد الله بن راشد القحطاني'
  },
  {
    id: 4,
    code: 'TECH-04',
    nameAr: 'الإدارة العامة للتحول الرقمي وتقنية المعلومات',
    nameEn: 'General Directorate of Digital Transformation & IT',
    parentId: 1,
    managerId: 104,
    managerNameAr: 'المهندس / فيصل بن سلطان الحربي'
  },
  {
    id: 5,
    code: 'HR-05',
    nameAr: 'الإدارة العامة للموارد البشرية والتدريب',
    nameEn: 'General Directorate of Human Capital & Development',
    parentId: 1,
    managerId: 105,
    managerNameAr: 'الأستاذة / نورة بنت خالد التميمي'
  },
  {
    id: 6,
    code: 'ARCH-06',
    nameAr: 'مركز الوثائق والاتصالات الإدارية الموحدة',
    nameEn: 'Unified Administrative Communications & Archive Center',
    parentId: 1,
    managerId: 106,
    managerNameAr: 'الأستاذ / خالد بن ناصر الدوسري'
  }
];

export const SEED_EMPLOYEES: Employee[] = [
  {
    id: 101,
    userCode: 'EMP-001',
    fullNameAr: 'د. عبد العزيز بن محمد آل الشيخ',
    fullNameEn: 'Dr. Abdulaziz Al-Sheikh',
    email: 'ceo.office@linkflow.gov.sa',
    phone: '+966 11 888 1001',
    departmentId: 1,
    departmentNameAr: 'مكتب معالي الرئيس التنفيذي',
    jobTitleAr: 'الرئيس التنفيذي للمنظومة',
    jobTitleEn: 'Chief Executive Officer',
    securityClearance: SecurityLevel.Secret,
    isManager: true
  },
  {
    id: 102,
    userCode: 'EMP-002',
    fullNameAr: 'المستشار / طارق بن فهد السديري',
    fullNameEn: 'Adv. Tariq Al-Sudairi',
    email: 'legal.director@linkflow.gov.sa',
    phone: '+966 11 888 1002',
    departmentId: 2,
    departmentNameAr: 'الإدارة العامة للشؤون القانونية والالتزام',
    jobTitleAr: 'مدير عام الشؤون القانونية',
    jobTitleEn: 'Legal Affairs Director',
    securityClearance: SecurityLevel.TopConfidential,
    isManager: true
  },
  {
    id: 103,
    userCode: 'EMP-003',
    fullNameAr: 'أ. عبد الله بن راشد القحطاني',
    fullNameEn: 'Abdullah Al-Qahtani',
    email: 'finance.director@linkflow.gov.sa',
    phone: '+966 11 888 1003',
    departmentId: 3,
    departmentNameAr: 'الإدارة العامة للشؤون المالية والميزانية',
    jobTitleAr: 'مدير عام الشؤون المالية',
    jobTitleEn: 'Financial Affairs Director',
    securityClearance: SecurityLevel.Confidential,
    isManager: true
  },
  {
    id: 104,
    userCode: 'EMP-004',
    fullNameAr: 'م. فيصل بن سلطان الحربي',
    fullNameEn: 'Eng. Faisal Al-Harbi',
    email: 'it.director@linkflow.gov.sa',
    phone: '+966 11 888 1004',
    departmentId: 4,
    departmentNameAr: 'الإدارة العامة للتحول الرقمي وتقنية المعلومات',
    jobTitleAr: 'مدير عام التحول الرقمي وتقنية المعلومات',
    jobTitleEn: 'IT & Digital Transformation Director',
    securityClearance: SecurityLevel.TopConfidential,
    isManager: true
  },
  {
    id: 105,
    userCode: 'EMP-005',
    fullNameAr: 'أ. نورة بنت خالد التميمي',
    fullNameEn: 'Noura Al-Tamimi',
    email: 'hr.director@linkflow.gov.sa',
    phone: '+966 11 888 1005',
    departmentId: 5,
    departmentNameAr: 'الإدارة العامة للموارد البشرية والتدريب',
    jobTitleAr: 'مديرة عام الموارد البشرية',
    jobTitleEn: 'HR General Director',
    securityClearance: SecurityLevel.Confidential,
    isManager: true
  },
  {
    id: 106,
    userCode: 'EMP-006',
    fullNameAr: 'أ. خالد بن ناصر الدوسري',
    fullNameEn: 'Khalid Al-Dossary',
    email: 'communications@linkflow.gov.sa',
    phone: '+966 11 888 1006',
    departmentId: 6,
    departmentNameAr: 'مركز الوثائق والاتصالات الإدارية الموحدة',
    jobTitleAr: 'مدير مركز الوثائق والاتصالات الإدارية',
    jobTitleEn: 'Communications & Registry Director',
    securityClearance: SecurityLevel.TopConfidential,
    isManager: true
  },
  {
    id: 201,
    userCode: 'EMP-101',
    fullNameAr: 'م. أحمد بن سالم الغامدي',
    fullNameEn: 'Eng. Ahmed Al-Ghamdi',
    email: 'ahmed.ghamdi@linkflow.gov.sa',
    phone: '+966 11 888 2001',
    departmentId: 4,
    departmentNameAr: 'الإدارة العامة للتحول الرقمي وتقنية المعلومات',
    jobTitleAr: 'رئيس قسم البنية التحتية وهندسة البرمجيات',
    jobTitleEn: 'Chief Solutions Architect & Lead Engineer',
    securityClearance: SecurityLevel.TopConfidential
  }
];

export const SEED_SITES: ExternalSite[] = [
  {
    id: 1,
    code: 'SITE-MOF',
    nameAr: 'وزارة المالية',
    nameEn: 'Ministry of Finance',
    siteTypeId: 1,
    siteTypeNameAr: 'وزارة حكومية',
    contactPerson: 'إدارة الاتصالات الإدارية المركزية',
    email: 'inbound@mof.gov.sa',
    phone: '+966 11 405 0000',
    address: 'الرياض - طريق الملك عبد العزيز',
    electronicAddress: 'GSB-MOF-001'
  },
  {
    id: 2,
    code: 'SITE-DGA',
    nameAr: 'هيئة الحكومة الرقمية (DGA)',
    nameEn: 'Digital Government Authority',
    siteTypeId: 2,
    siteTypeNameAr: 'هيئة ومؤسسة عامة',
    contactPerson: 'قسم التكامل والربط البيني',
    email: 'integration@dga.gov.sa',
    phone: '+966 11 829 0000',
    address: 'الرياض - واحة التقنية',
    electronicAddress: 'GSB-DGA-99'
  },
  {
    id: 3,
    code: 'SITE-NCA',
    nameAr: 'الهيئة الوطنية للأمن السيبراني (NCA)',
    nameEn: 'National Cybersecurity Authority',
    siteTypeId: 2,
    siteTypeNameAr: 'هيئة حكومية',
    contactPerson: 'إدارة الالتزام والسياسات الأمنية',
    email: 'compliance@nca.gov.sa',
    phone: '+966 11 800 0000',
    address: 'الرياض - حي الرائد',
    electronicAddress: 'GSB-NCA-40'
  },
  {
    id: 4,
    code: 'SITE-MOC',
    nameAr: 'وزارة التجارة',
    nameEn: 'Ministry of Commerce',
    siteTypeId: 1,
    siteTypeNameAr: 'وزارة حكومية',
    contactPerson: 'مركز الاتصالات الإدارية',
    email: 'support@mc.gov.sa',
    phone: '+966 11 294 4444',
    address: 'الرياض - حي الملز',
    electronicAddress: 'GSB-MOC-12'
  },
  {
    id: 5,
    code: 'SITE-ELM',
    nameAr: 'شركة عِلم لأمن المعلومات',
    nameEn: 'Elm Information Security Company',
    siteTypeId: 4,
    siteTypeNameAr: 'قطاع خاص ومزود حلول تقنية',
    contactPerson: 'إدارة حسابات القطاع الحكومي',
    email: 'enterprise@elm.sa',
    phone: '+966 11 288 7777',
    address: 'الرياض - حي النخيل'
  }
];

export const SEED_FOLDERS: FileFolder[] = [
  {
    id: 1,
    fileNumber: 'FIL-446-TECH-01',
    titleAr: 'ملف مشاريع التحول الرقمي والبنية السحابية 1446هـ',
    titleEn: 'Digital Transformation & Cloud Infrastructure 1446H',
    categoryNameAr: 'المشاريع الاستراتيجية والتقنية',
    storageLocation: 'خزانة تقنية المعلومات A4 / رف 02 (الأرشيف الرقمي)',
    kind: FileKind.Topic,
    status: 'active',
    createdDate: '2026-01-10T08:00:00Z',
    corrCount: 3
  },
  {
    id: 2,
    fileNumber: 'FIL-446-BUD-02',
    titleAr: 'ملف الميزانية العامة والاعتمادات الإضافية',
    titleEn: 'General Budget & Supplemental Appropriations File',
    categoryNameAr: 'الشؤون المالية والميزانيات',
    storageLocation: 'خزانة الإدارة المالية F1 / رف 05 (الأرشيف السري)',
    kind: FileKind.Specific,
    status: 'active',
    createdDate: '2026-01-15T09:30:00Z',
    corrCount: 2
  },
  {
    id: 3,
    fileNumber: 'FIL-446-SEC-03',
    titleAr: 'ملف ضوابط وإجراءات الأمن السيبراني والامتثال',
    titleEn: 'Cybersecurity Policies & NCA Compliance Audits',
    categoryNameAr: 'الأمن السيبراني والالتزام الرقابي',
    storageLocation: 'الأرشيف الإلكتروني المشفر / مجلد 1446-SEC',
    kind: FileKind.Topic,
    status: 'active',
    createdDate: '2026-02-01T10:00:00Z',
    corrCount: 2
  }
];

export const SEED_CORRESPONDENCES: Correspondence[] = [
  {
    id: 1001,
    corrNumber: '1446/IN/00482',
    title: 'بشأن مراجعة الاعتمادات الإضافية لمشاريع التحول الرقمي والبنية السحابية للربع الرابع',
    corrType: CorrespondenceType.Incoming,
    deliveryMethod: DeliveryMethod.ElectronicSystem,
    deliveryDate: '2026-08-25T08:30:00Z',
    deliveredBy: 'منظومة التكامل الحكومي (GSB)',
    referenceNo: 'MOF-446-9921',
    referenceDate: '2026-08-24T12:00:00Z',
    registerDate: '2026-08-25T08:30:00Z',
    siteId: 1,
    siteNameAr: 'وزارة المالية',
    securityLevel: SecurityLevel.Confidential,
    priorityLevel: PriorityLevel.Urgent,
    status: WorkItemStatus.InProgress,
    fileFolderId: 2,
    fileNameAr: 'ملف الميزانية العامة والاعتمادات الإضافية',
    expectedResponseDate: '2026-09-05T15:00:00Z',
    isReplied: false,
    barcode: '4460048201',
    notes: 'خطاب رسمي وارد من وكالة الميزانية والشؤون التنظيمية يتضمن طلب تفصيل التكاليف التشغيلية للمرحلة الثانية.',
    routesCount: 3,
    documents: [
      {
        id: 501,
        subject: 'أصل خطاب وزارة المالية رقم 9921',
        documentType: 'خطاب رسمي',
        barcode: 'DOC-446-501',
        pageCount: 3,
        isOriginal: true,
        activeDetail: {
          id: 601,
          version: 1,
          fileName: 'MOF_Official_Letter_9921.pdf',
          fileSize: '1.8 MB',
          mimeType: 'application/pdf',
          uploadedAt: '2026-08-25T08:32:00Z',
          uploadedBy: 'مركز الاتصالات الإدارية'
        },
        historyDetails: []
      },
      {
        id: 502,
        subject: 'جدول الاعتمادات المالية والمخصصات المقترحة',
        documentType: 'مرفق مالي',
        barcode: 'DOC-446-502',
        pageCount: 6,
        isOriginal: false,
        activeDetail: {
          id: 602,
          version: 2,
          fileName: 'Budget_Allocations_Q4_v2.xlsx',
          fileSize: '420 KB',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          uploadedAt: '2026-08-26T11:15:00Z',
          uploadedBy: 'الإدارة العامة للشؤون المالية'
        },
        historyDetails: [
          {
            id: 603,
            version: 1,
            fileName: 'Budget_Allocations_Q4_v1.xlsx',
            fileSize: '390 KB',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            uploadedAt: '2026-08-25T09:00:00Z',
            uploadedBy: 'مركز الوثائق'
          }
        ]
      }
    ],
    links: [],
    presentationNotes: [
      {
        id: 701,
        noteNumber: 'NOTE-446-01',
        subject: 'مذكرة دراسة الميزانية المقترحة من الإدارة المالية',
        content: 'تمت دراسة متطلبات وزارة المالية، وتمت إعادة توزيع بنود الميزانية لتفادي أي زيادة في الإنفاق الرأسمالي.',
        recommendation: 'الموافقة على الرد على وزارة المالية بالجدول المرفق المعدل.',
        preparedByEmployeeId: 103,
        preparedByEmployeeName: 'أ. عبد الله بن راشد القحطاني',
        preparedByDepartmentName: 'الإدارة العامة للشؤون المالية والميزانية',
        createdDate: '2026-08-26T14:30:00Z',
        decisionStatus: 'APPROVED',
        decisionNote: 'معتمد للإرسال وتجهيز كتاب الصادر الخارجي.',
        decisionDate: '2026-08-27T09:00:00Z',
        decisionByEmployeeName: 'د. عبد العزيز بن محمد آل الشيخ'
      }
    ],
    digitalSignature: {
      signedBy: 'د. عبد العزيز بن محمد آل الشيخ',
      jobTitle: 'الرئيس التنفيذي للمنظومة',
      signedAt: '2026-08-27T09:05:00Z',
      certificateHash: 'SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      qrData: 'LINKFLOW:446/IN/00482:SIGNED:2026-08-27'
    }
  },
  {
    id: 1002,
    corrNumber: '1446/IN/00495',
    title: 'طلب الرأي النظامي حيال مشروع اللائحة التنفيذية لحوكمة أمن المعلومات وسياسات التخزين السحابي',
    corrType: CorrespondenceType.Incoming,
    deliveryMethod: DeliveryMethod.ElectronicSystem,
    deliveryDate: '2026-08-27T10:00:00Z',
    deliveredBy: 'منظومة التكامل الحكومي (GSB)',
    referenceNo: 'NCA-REG-2026-88',
    referenceDate: '2026-08-27T08:15:00Z',
    registerDate: '2026-08-27T10:00:00Z',
    siteId: 3,
    siteNameAr: 'الهيئة الوطنية للأمن السيبراني (NCA)',
    securityLevel: SecurityLevel.TopConfidential,
    priorityLevel: PriorityLevel.TopUrgent,
    status: WorkItemStatus.New,
    fileFolderId: 3,
    fileNameAr: 'ملف ضوابط وإجراءات الأمن السيبراني والامتثال',
    expectedResponseDate: '2026-09-02T12:00:00Z',
    isReplied: false,
    barcode: '4460049502',
    notes: 'خطاب عاجل جداً يتضمن إبداء مرئيات المنظومة حول متطلبات تشفير وحفظ البيانات الحساسة.',
    routesCount: 1,
    documents: [
      {
        id: 503,
        subject: 'مشروع مسودة اللائحة التنفيذية للأمن السيبراني',
        documentType: 'مسودة تنظيمية',
        barcode: 'DOC-446-503',
        pageCount: 24,
        isOriginal: true,
        activeDetail: {
          id: 604,
          version: 1,
          fileName: 'NCA_Draft_Cybersecurity_Framework_2026.pdf',
          fileSize: '3.4 MB',
          mimeType: 'application/pdf',
          uploadedAt: '2026-08-27T10:05:00Z',
          uploadedBy: 'مركز الوثائق والاتصالات الإدارية'
        }
      }
    ],
    links: []
  },
  {
    id: 1003,
    corrNumber: '1446/OUT/00120',
    title: 'تزويد هيئة الحكومة الرقمية بالتقرير ربع السنوي لامتثال الأنظمة ومؤشرات الأداء',
    corrType: CorrespondenceType.Outgoing,
    deliveryMethod: DeliveryMethod.ElectronicSystem,
    deliveryDate: '2026-08-28T11:00:00Z',
    deliveredBy: 'قسم الصادر العام الإلكتروني',
    registerDate: '2026-08-28T11:00:00Z',
    siteId: 2,
    siteNameAr: 'هيئة الحكومة الرقمية (DGA)',
    senderDepartmentId: 4,
    senderDepartmentNameAr: 'الإدارة العامة للتحول الرقمي وتقنية المعلومات',
    securityLevel: SecurityLevel.Normal,
    priorityLevel: PriorityLevel.Normal,
    status: WorkItemStatus.Completed,
    fileFolderId: 1,
    fileNameAr: 'ملف مشاريع التحول الرقمي والبنية السحابية 1446هـ',
    barcode: '4460012003',
    notes: 'كتاب صادر رسمي معتمد متضمناً مؤشرات نضج الخدمات الرقمية والتحول نحو معمارية .NET Core النظيفة.',
    routesCount: 2,
    documents: [
      {
        id: 504,
        subject: 'أصل كتاب الصادر المعتمد رقم 00120',
        documentType: 'خطاب صادر رسمي',
        barcode: 'DOC-446-504',
        pageCount: 2,
        isOriginal: true,
        activeDetail: {
          id: 605,
          version: 1,
          fileName: 'LinkFlow_Outgoing_00120_DGA.pdf',
          fileSize: '1.2 MB',
          mimeType: 'application/pdf',
          uploadedAt: '2026-08-28T11:02:00Z',
          uploadedBy: 'الإدارة العامة للتحول الرقمي'
        }
      }
    ],
    links: [],
    digitalSignature: {
      signedBy: 'م. فيصل بن سلطان الحربي',
      jobTitle: 'مدير عام التحول الرقمي وتقنية المعلومات',
      signedAt: '2026-08-28T10:45:00Z',
      certificateHash: 'SHA256: 4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
      qrData: 'LINKFLOW:1446/OUT/00120:SIGNED:2026-08-28'
    }
  },
  {
    id: 1004,
    corrNumber: '1446/INT/00055',
    title: 'مذكرة عرض: اعتماد ترقية البنية التحتية البرمجية وتطبيق منظومة LinkFlow Enterprise بنظام .NET Core',
    corrType: CorrespondenceType.InternalPresentation,
    deliveryMethod: DeliveryMethod.ElectronicSystem,
    deliveryDate: '2026-08-29T09:00:00Z',
    registerDate: '2026-08-29T09:00:00Z',
    senderDepartmentId: 4,
    senderDepartmentNameAr: 'الإدارة العامة للتحول الرقمي وتقنية المعلومات',
    securityLevel: SecurityLevel.TopConfidential,
    priorityLevel: PriorityLevel.Immediate,
    status: WorkItemStatus.InProgress,
    fileFolderId: 1,
    fileNameAr: 'ملف مشاريع التحول الرقمي والبنية السحابية 1446هـ',
    expectedResponseDate: '2026-09-01T10:00:00Z',
    isReplied: false,
    barcode: '4460005504',
    notes: 'مذكرة عرض إدارية موجهة لمعالي الرئيس التنفيذي تتضمن خطة الانتقال لمعمارية Clean Architecture و SOLID principles.',
    routesCount: 2,
    documents: [
      {
        id: 505,
        subject: 'وثيقة المعمارية الهندسية ومبادئ Clean Architecture & SOLID',
        documentType: 'مذكرة فنية ومعمارية',
        barcode: 'DOC-446-505',
        pageCount: 15,
        isOriginal: true,
        activeDetail: {
          id: 606,
          version: 1,
          fileName: 'LinkFlow_Clean_Architecture_Specification.pdf',
          fileSize: '2.9 MB',
          mimeType: 'application/pdf',
          uploadedAt: '2026-08-29T09:10:00Z',
          uploadedBy: 'م. أحمد بن سالم الغامدي'
        }
      }
    ],
    links: [],
    presentationNotes: [
      {
        id: 702,
        noteNumber: 'NOTE-446-02',
        subject: 'مذكرة تفصيلية عن منظومة المراسلات والاتصالات الإدارية الموحدة',
        content: 'تستعرض المذكرة فصل طبقات النطاق (Domain)، والتطبيق (Application CQRS/Mediator)، والبنية التحتية (Infrastructure)، والعرض (Presentation) لضمان أداء عالٍ وسهولة الصيانة والاختبار.',
        recommendation: 'الموافقة على التدشين الميداني واعتماد المعمارية المؤسسية.',
        preparedByEmployeeId: 201,
        preparedByEmployeeName: 'م. أحمد بن سالم الغامدي',
        preparedByDepartmentName: 'الإدارة العامة للتحول الرقمي وتقنية المعلومات',
        createdDate: '2026-08-29T09:15:00Z',
        decisionStatus: 'APPROVED',
        decisionNote: 'نبارك هذه الجهود وموافق على خطة العمل والتدشين الفوري.',
        decisionDate: '2026-08-29T11:00:00Z',
        decisionByEmployeeName: 'د. عبد العزيز بن محمد آل الشيخ'
      }
    ]
  }
];

export const SEED_WORK_ITEMS: WorkItem[] = [
  {
    id: 9001,
    corrId: 1001,
    inboxId: 1,
    receiverId: 201,
    receiveDate: '2026-08-25T09:30:00Z',
    status: WorkItemStatus.InProgress,
    isImportant: true,
    isRead: true,
    lastInstruction: 'يرجى مراجعة البنود المالية وتنسيق الموقف مع الإدارة المالية',
    correspondence: SEED_CORRESPONDENCES[0]
  },
  {
    id: 9002,
    corrId: 1002,
    inboxId: 1,
    receiverId: 201,
    receiveDate: '2026-08-27T10:15:00Z',
    status: WorkItemStatus.New,
    isImportant: true,
    isRead: false,
    lastInstruction: 'عاجل جداً: إعداد مرئيات التحول الرقمي للأمن السيبراني',
    correspondence: SEED_CORRESPONDENCES[1]
  },
  {
    id: 9003,
    corrId: 1003,
    inboxId: 1,
    receiverId: 201,
    receiveDate: '2026-08-28T11:10:00Z',
    status: WorkItemStatus.Completed,
    isImportant: false,
    isRead: true,
    lastInstruction: 'للإحاطة والتوثيق بعد التصدير بنجاح',
    correspondence: SEED_CORRESPONDENCES[2]
  },
  {
    id: 9004,
    corrId: 1004,
    inboxId: 1,
    receiverId: 201,
    receiveDate: '2026-08-29T09:20:00Z',
    status: WorkItemStatus.InProgress,
    isImportant: true,
    isRead: true,
    lastInstruction: 'تم الاعتماد من معالي الرئيس التنفيذي، يرجى استكمال التنفيذ',
    correspondence: SEED_CORRESPONDENCES[3]
  }
];

export const SEED_ROUTES: RouteItem[] = [
  {
    id: 8001,
    corrId: 1001,
    fromEmployeeId: 106,
    fromEmployeeNameAr: 'أ. خالد بن ناصر الدوسري',
    fromDepartmentNameAr: 'مركز الوثائق والاتصالات الإدارية الموحدة',
    toEmployeeId: 101,
    toEmployeeNameAr: 'د. عبد العزيز بن محمد آل الشيخ',
    toDepartmentId: 1,
    toDepartmentNameAr: 'مكتب معالي الرئيس التنفيذي',
    routeKind: RouteKind.ForInfo,
    instructionAr: 'وارد رسمي من وزارة المالية للاطلاع والتوجيه الكريم',
    routeDate: '2026-08-25T08:45:00Z',
    status: 'EXECUTED'
  },
  {
    id: 8002,
    corrId: 1001,
    fromEmployeeId: 101,
    fromEmployeeNameAr: 'د. عبد العزيز بن محمد آل الشيخ',
    fromDepartmentNameAr: 'مكتب معالي الرئيس التنفيذي',
    toEmployeeId: 104,
    toEmployeeNameAr: 'م. فيصل بن سلطان الحربي',
    toDepartmentId: 4,
    toDepartmentNameAr: 'الإدارة العامة للتحول الرقمي وتقنية المعلومات',
    routeKind: RouteKind.ActionNeeded,
    instructionAr: 'سعادة مدير عام التحول الرقمي: لدراسة التكاليف والرد بشكل عاجل',
    actionRequiredDate: '2026-09-02T12:00:00Z',
    routeDate: '2026-08-25T09:15:00Z',
    status: 'EXECUTED'
  },
  {
    id: 8003,
    corrId: 1001,
    fromEmployeeId: 104,
    fromEmployeeNameAr: 'م. فيصل بن سلطان الحربي',
    fromDepartmentNameAr: 'الإدارة العامة للتحول الرقمي وتقنية المعلومات',
    toEmployeeId: 201,
    toEmployeeNameAr: 'م. أحمد بن سالم الغامدي',
    toDepartmentId: 4,
    toDepartmentNameAr: 'الإدارة العامة للتحول الرقمي وتقنية المعلومات',
    routeKind: RouteKind.ForStudy,
    instructionAr: 'م. أحمد: يرجى مراجعة البنود المالية وتنسيق الموقف مع الإدارة المالية',
    routeDate: '2026-08-25T09:30:00Z',
    status: 'ACCEPTED'
  }
];

export const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'LOG-001',
    action: 'تسجيل قيد وارد جديد',
    entityType: 'CORRESPONDENCE',
    entityId: '1446/IN/00482',
    actorName: 'أ. خالد بن ناصر الدوسري',
    department: 'مركز الوثائق والاتصالات الإدارية الموحدة',
    timestamp: '2026-08-25T08:30:00Z',
    details: 'تم تقييد وارد برقم 1446/IN/00482 صادر من وزارة المالية مع إصدار باركود 4460048201',
    ipAddress: '10.20.1.15'
  },
  {
    id: 'LOG-002',
    action: 'إحالة وتوجيه معاملة',
    entityType: 'ROUTE',
    entityId: '1446/IN/00482',
    actorName: 'د. عبد العزيز بن محمد آل الشيخ',
    department: 'مكتب معالي الرئيس التنفيذي',
    timestamp: '2026-08-25T09:15:00Z',
    details: 'إحالة المعاملة إلى الإدارة العامة للتحول الرقمي وتقنية المعلومات بتأشيرة لاتخاذ اللازم',
    ipAddress: '10.20.1.5'
  },
  {
    id: 'LOG-003',
    action: 'اعتماد مذكرة عرض',
    entityType: 'PRESENTATION_NOTE',
    entityId: 'NOTE-446-02',
    actorName: 'د. عبد العزيز بن محمد آل الشيخ',
    department: 'مكتب معالي الرئيس التنفيذي',
    timestamp: '2026-08-29T11:00:00Z',
    details: 'اعتماد مذكرة العرض الخاصة بترقية النظام لمعمارية Clean Architecture و SOLID principles',
    ipAddress: '10.20.1.5'
  }
];
