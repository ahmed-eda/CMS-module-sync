export enum CorrespondenceType {
  Incoming = 1,          // وارد خارجي
  Outgoing = 2,          // صادر خارجي
  InternalPresentation = 3, // مذكرة عرض داخلية
  AdministrativeCircular = 4 // تعميم إداري
}

export enum InboxType {
  Private = 1,    // صندوق خاص (شخصي)
  General = 2,    // صندوق عام (الإدارة)
  Task = 3,       // صندوق المهام (المخصصة للذات)
  Assignment = 4, // صندوق التكليفات الصادرة
  Delegate = 5    // صندوق التفويضات والصلاحيات
}

export enum SecurityLevel {
  Normal = 1,       // عادي
  Confidential = 2, // سري
  TopConfidential = 3, // سري للغاية
  Secret = 4        // محظور / عالي الحساسية
}

export enum PriorityLevel {
  Normal = 1,    // عادي
  Urgent = 2,    // عاجل
  TopUrgent = 3, // عاجل جداً
  Immediate = 4  // فوري / طارئ
}

export enum DeliveryMethod {
  ManualCourier = 1,    // مناولة باليد / مراسل
  ElectronicSystem = 2, // منظومة التراسل الإلكتروني الحكومي
  Email = 3,            // البريد الإلكتروني الرسمي
  GovIntegration = 4,   // الربط البيني (API / GSB)
  PostalMail = 5        // البريد الرسمي الممتاز
}

export enum WorkItemStatus {
  New = 1,          // جديد غير مقروء
  Read = 2,         // مقروء
  InProgress = 3,   // قيد المعالجة
  PendingReply = 4, // بانتظار الرد / تحت الإجراء
  Completed = 5,    // منتهية / مكتملة
  Archived = 6,     // مؤرشفة
  Rejected = 7      // معادة / مرفوضة
}

export enum RouteKind {
  ActionNeeded = 1, // لاتخاذ اللازم
  ForInfo = 2,      // للاطلاع والإحاطة
  ForApproval = 3,  // للاعتماد والتوقيع
  ForStudy = 4,     // للدراسة وإبداء الرأي
  Delegate = 5,     // للتفويض والإنابة
  Reply = 6,        // رد رسمي
  End = 7,          // إنهاء وحفظ
  Return = 8        // إعادة وتعديل
}

export enum FileKind {
  General = 1,  // ملف عام
  Specific = 2, // ملف نوعي / إداري
  Topic = 3     // ملف موضوعي / سري
}

export enum RelationType {
  SubCorrespondence = 1, // إلحاقية لمعاملة
  AttachedTo = 2,        // مرفقة مع
  ResponseTo = 3,        // رداً على كتاب
  Reference = 4          // إشارة ومراجعة
}
