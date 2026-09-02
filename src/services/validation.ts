export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export class CorrespondenceValidator {
  public static validateIncoming(data: {
    title?: string;
    siteId?: number;
    referenceNo?: string;
    deliveryMethod?: number;
    securityLevel?: number;
    priorityLevel?: number;
  }): ValidationResult {
    const errors: Record<string, string> = {};

    if (!data.title || data.title.trim().length < 5) {
      errors.title = 'موضوع المعاملة إلزامي ويجب ألا يقل عن 5 أحرف.';
    }

    if (!data.siteId) {
      errors.siteId = 'يرجى اختيار الجهة الخارجية المصدرة للمعاملة.';
    }

    if (!data.referenceNo || data.referenceNo.trim().length === 0) {
      errors.referenceNo = 'رقم قيد/صادر الجهة المصدرة إلزامي.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  public static validateOutgoing(data: {
    title?: string;
    siteId?: number;
    securityLevel?: number;
    priorityLevel?: number;
    senderDepartmentId?: number;
  }): ValidationResult {
    const errors: Record<string, string> = {};

    if (!data.title || data.title.trim().length < 5) {
      errors.title = 'موضوع الكتاب الصادر إلزامي ويجب ألا يقل عن 5 أحرف.';
    }

    if (!data.siteId) {
      errors.siteId = 'يرجى اختيار الجهة الموجه إليها الصادر.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  public static validateForward(data: {
    toDepartmentId?: number;
    instructionAr?: string;
  }): ValidationResult {
    const errors: Record<string, string> = {};

    if (!data.toDepartmentId) {
      errors.toDepartmentId = 'يرجى اختيار الإدارة الموجه إليها.';
    }

    if (!data.instructionAr || data.instructionAr.trim().length < 3) {
      errors.instructionAr = 'نص التأشيرة/التوجيه إلزامي ومطلوب.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}
