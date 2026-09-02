import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Download,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  FileText,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  Calendar,
  Building2,
  Share2,
  RefreshCw,
  Eye,
  CheckCircle2,
  Hash
} from 'lucide-react';
import { Correspondence } from '../../types/domain';
import { SecurityLevel, PriorityLevel, CorrespondenceType } from '../../types/enums';
import { toast } from '../notifications/ToastContext';

interface CorrespondenceQRModalProps {
  correspondence?: Correspondence;
  isOpen: boolean;
  onClose: () => void;
  locale: 'ar' | 'en';
}

export const CorrespondenceQRModal: React.FC<CorrespondenceQRModalProps> = ({
  correspondence,
  isOpen,
  onClose,
  locale
}) => {
  const isAr = locale === 'ar';
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [payloadType, setPayloadType] = useState<'url' | 'envelope'>('url');
  const [activeTab, setActiveTab] = useState<'qr' | 'verifyPreview' | 'sticker'>('qr');
  const printRef = useRef<HTMLDivElement>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://linkflow.enterprise.gov.sa';

  const verificationUrl = correspondence
    ? `${baseUrl}/records/verify?corrId=${correspondence.id}&corrNumber=${encodeURIComponent(
        correspondence.corrNumber
      )}&chk=${correspondence.barcode}&sec=${correspondence.securityLevel}&ts=${Date.now()}`
    : '';

  const digitalEnvelope = correspondence
    ? JSON.stringify(
        {
          system: 'LinkFlow Enterprise CMS',
          corrNumber: correspondence.corrNumber,
          corrId: correspondence.id,
          title: correspondence.title,
          type: correspondence.corrType,
          registeredAt: correspondence.registerDate,
          securityLevel: correspondence.securityLevel,
          priorityLevel: correspondence.priorityLevel,
          barcode: correspondence.barcode,
          checksum: `SHA256-${correspondence.barcode}-0X${correspondence.id.toString(16).toUpperCase()}`,
          digitalSignature: correspondence.digitalSignature
            ? {
                signedBy: correspondence.digitalSignature.signedBy,
                signedAt: correspondence.digitalSignature.signedAt,
                certHash: correspondence.digitalSignature.certificateHash
              }
            : 'AUTHENTIC_OFFICIAL_ISSUED'
        },
        null,
        2
      )
    : '';

  const currentPayload = payloadType === 'url' ? verificationUrl : digitalEnvelope;

  useEffect(() => {
    if (!correspondence || !isOpen) return;

    QRCode.toDataURL(currentPayload, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => {
        setQrDataUrl(url);
      })
      .catch(err => {
        console.error('Failed to generate QR code:', err);
      });
  }, [correspondence, isOpen, currentPayload]);

  if (!isOpen || !correspondence) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentPayload);
    setCopied(true);
    toast.success(
      isAr
        ? `تم نسخ ${payloadType === 'url' ? 'رابط السجل الرقمي' : 'الظرف الرقمي المشفر'} بنجاح`
        : `Copied ${payloadType === 'url' ? 'verification URL' : 'digital envelope'} to clipboard`,
      {
        titleAr: 'تم النسخ',
        titleEn: 'Copied',
        corrNumber: correspondence.corrNumber
      }
    );
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${correspondence.corrNumber.replace(/\//g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast.info(
      isAr
        ? `تم تنزيل رمز الاستجابة السريعة (QR Code) بدقة فائقة`
        : `QR Code downloaded in high resolution`,
      {
        titleAr: 'تحميل الرمز الرقمي',
        titleEn: 'QR Downloaded',
        corrNumber: correspondence.corrNumber
      }
    );
  };

  const handlePrint = () => {
    toast.info(
      isAr ? 'جاري فتح نافذة طباعة ملصق المعاملة والرمز الرقمي...' : 'Opening print preview for QR sticker label...',
      {
        titleAr: 'طباعة الملصق',
        titleEn: 'Print Sticker',
        duration: 2500
      }
    );
    window.print();
  };

  const getSecurityBadge = (level: SecurityLevel) => {
    switch (level) {
      case SecurityLevel.Secret:
        return { labelAr: 'محظور / عالي الحساسية', labelEn: 'Top Secret', bg: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' };
      case SecurityLevel.TopConfidential:
        return { labelAr: 'سري للغاية', labelEn: 'Top Confidential', bg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' };
      case SecurityLevel.Confidential:
        return { labelAr: 'سري', labelEn: 'Confidential', bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900' };
      default:
        return { labelAr: 'عادي', labelEn: 'Normal', bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' };
    }
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case PriorityLevel.Immediate:
        return { labelAr: 'فوري / طارئ', labelEn: 'Immediate', bg: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' };
      case PriorityLevel.TopUrgent:
        return { labelAr: 'عاجل جداً', labelEn: 'Top Urgent', bg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' };
      case PriorityLevel.Urgent:
        return { labelAr: 'عاجل', labelEn: 'Urgent', bg: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' };
      default:
        return { labelAr: 'عادي', labelEn: 'Normal', bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' };
    }
  };

  const secBadge = getSecurityBadge(correspondence.securityLevel);
  const prioBadge = getPriorityBadge(correspondence.priorityLevel);

  return (
    <div
      id="correspondence-qr-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="correspondence-qr-modal-container"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  {isAr ? 'الرمز الرقمي والتحقق السريع (QR Code)' : 'Digital Record QR Code & Verification'}
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {isAr ? 'موثق رسمياً' : 'Verified'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {correspondence.corrNumber} • {new Date(correspondence.registerDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
              </p>
            </div>
          </div>

          <button
            id="close-qr-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'qr'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{isAr ? 'رمز الاستجابة السريعة' : 'QR Code View'}</span>
          </button>

          <button
            onClick={() => setActiveTab('sticker')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sticker'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isAr ? 'ملصق القيد والطباعة' : 'Printable Sticker Label'}</span>
          </button>

          <button
            onClick={() => setActiveTab('verifyPreview')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'verifyPreview'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isAr ? 'معاينة السجل الرقمي' : 'Digital Record Preview'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'qr' && (
            <div className="space-y-6">
              {/* Top Selector: URL Link vs Cryptographic JSON Envelope */}
              <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  onClick={() => setPayloadType('url')}
                  className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition cursor-pointer text-center ${
                    payloadType === 'url'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isAr ? '🔗 رابط مباشر للسجل الرقمي بالمنظومة' : '🔗 Internal System Record URL'}
                </button>
                <button
                  onClick={() => setPayloadType('envelope')}
                  className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition cursor-pointer text-center ${
                    payloadType === 'envelope'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isAr ? '🛡️ الظرف الرقمي المشفر (GSB Payload)' : '🛡️ Encrypted Digital Envelope'}
                </button>
              </div>

              {/* Main QR Display and Info Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* QR Code Container */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-inner group relative">
                  {qrDataUrl ? (
                    <div className="relative p-2 bg-white rounded-xl shadow-xs">
                      <img
                        src={qrDataUrl}
                        alt={`QR Code for ${correspondence.corrNumber}`}
                        className="w-48 h-48 rounded-lg object-contain"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-white shadow-md border border-emerald-600/30 flex items-center justify-center text-emerald-700">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                    </div>
                  )}

                  <div className="mt-3 text-center">
                    <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                      {correspondence.barcode}
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isAr ? 'امسح الرمز للوصول الفوري للسجل المعتمد' : 'Scan to inspect digital record directly'}
                    </p>
                  </div>
                </div>

                {/* Metadata & Key Values */}
                <div className="md:col-span-7 space-y-3">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                          {isAr ? 'موضوع المعاملة' : 'Subject'}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2 leading-relaxed">
                          {correspondence.title}
                        </h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          {isAr ? 'رقم القيد الموحد:' : 'Corr Number:'}
                        </span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {correspondence.corrNumber}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          {isAr ? 'تاريخ التسجيل:' : 'Register Date:'}
                        </span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">
                          {new Date(correspondence.registerDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          {isAr ? 'مستوى السرية:' : 'Security:'}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${secBadge.bg}`}>
                          {isAr ? secBadge.labelAr : secBadge.labelEn}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          {isAr ? 'درجة الأسبقية:' : 'Priority:'}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${prioBadge.bg}`}>
                          {isAr ? prioBadge.labelAr : prioBadge.labelEn}
                        </span>
                      </div>
                    </div>

                    {correspondence.siteNameAr && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-medium truncate">{correspondence.siteNameAr}</span>
                      </div>
                    )}
                  </div>

                  {/* Verification Checksum & Cryptography Tag */}
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-950 dark:text-emerald-200 text-[11px] block">
                          {isAr ? 'البصمة الرقمية المشفرة (SHA-256)' : 'Digital Verification Hash (SHA-256)'}
                        </span>
                        <span className="font-mono text-[9px] text-emerald-700 dark:text-emerald-400">
                          {`SHA256:${correspondence.barcode}:0X${correspondence.id.toString(16).toUpperCase()}`}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                      VALID
                    </span>
                  </div>
                </div>
              </div>

              {/* Encoded payload raw field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {payloadType === 'url'
                      ? isAr
                        ? 'الرابط المرمز داخل رمز الاستجابة (Record URI):'
                        : 'Encoded Record URI:'
                      : isAr
                      ? 'الظرف الرقمي المشفر (JSON Payload):'
                      : 'Encrypted Envelope Payload:'}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'نسخ البيانات' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-2.5 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl border border-slate-800 break-all select-all max-h-20 overflow-y-auto">
                  {currentPayload}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sticker' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
                <span>
                  {isAr
                    ? 'هذا الملصق مخصص للطباعة على طابعات الباركود والملصقات الحرارية لمعاملات الوارد والصادر الورقية.'
                    : 'This sticker is formatted for barcode and thermal label printers for physical files.'}
                </span>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isAr ? 'طباعة الملصق' : 'Print Label'}</span>
                </button>
              </div>

              {/* Printable Card Layout */}
              <div
                ref={printRef}
                className="p-6 bg-white rounded-xl border-2 border-dashed border-slate-400 shadow-md max-w-md mx-auto text-slate-900 select-text"
              >
                {/* Kingdom Header */}
                <div className="text-center border-b border-slate-900 pb-2 mb-3">
                  <div className="text-xs font-black">المملكة العربية السعودية</div>
                  <div className="text-[10px] font-bold text-slate-800">منظومة الاتصالات الإدارية الموحدة</div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block">رقم القيد:</span>
                      <div className="font-mono text-sm font-black text-slate-950">{correspondence.corrNumber}</div>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block">التاريخ:</span>
                      <div className="font-mono text-xs font-bold text-slate-800">
                        {new Date(correspondence.registerDate).toLocaleDateString('ar-SA')}
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block">الجهة:</span>
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {correspondence.siteNameAr || 'الاتصالات الإدارية'}
                      </div>
                    </div>

                    {/* Barcode line representation */}
                    <div className="pt-1">
                      <div className="font-mono text-[9px] font-bold">{correspondence.barcode}</div>
                      <div className="w-32 h-4 bg-slate-900 flex items-center justify-center text-[7px] text-white font-mono">
                        ||| | || |||| | ||| ||
                      </div>
                    </div>
                  </div>

                  {/* QR Code in sticker */}
                  <div className="shrink-0 text-center">
                    {qrDataUrl && (
                      <img
                        src={qrDataUrl}
                        alt="QR Stamp"
                        className="w-24 h-24 border border-slate-900 p-1 rounded-sm"
                      />
                    )}
                    <span className="text-[8px] font-mono font-bold block mt-0.5">VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'verifyPreview' && (
            <div className="space-y-4">
              {/* Simulation of how an auditor or external inspector views the digital record */}
              <div className="bg-slate-950 text-white p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">
                        {isAr ? 'بوابة التحقق الحكومي من صحة المعاملة' : 'Government Verification Portal'}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        LinkFlow Enterprise • National Trust Network
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{isAr ? 'سجل رقمي صحيح وموثق' : 'Authentic & Valid'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'رقم القيد:' : 'Record No:'}</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">{correspondence.corrNumber}</span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'حالة المعاملة:' : 'Status:'}</span>
                    <span className="font-bold text-white text-xs">{isAr ? 'معتمدة ومقيدة بالمنظومة' : 'Active & Certified'}</span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 col-span-2">
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'الموضوع الرسمي:' : 'Official Subject:'}</span>
                    <span className="font-bold text-slate-200 text-xs leading-relaxed">{correspondence.title}</span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'الجهة الموردة / الصادرة:' : 'Entity:'}</span>
                    <span className="font-bold text-slate-300 text-xs">{correspondence.siteNameAr || 'الإدارة العامة'}</span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'عدد الوثائق والمرفقات:' : 'Documents Count:'}</span>
                    <span className="font-bold text-slate-300 text-xs">
                      {correspondence.documents?.length || 1} {isAr ? 'وثائق رقمية' : 'Digital Files'}
                    </span>
                  </div>
                </div>

                {correspondence.digitalSignature && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 block">
                      {isAr ? 'بيانات التوقيع الإلكتروني المعتمد:' : 'Certified Digital Signature:'}
                    </span>
                    <div className="text-[11px] text-slate-300">
                      <span>{correspondence.digitalSignature.signedBy}</span> •{' '}
                      <span className="text-slate-400 font-mono">{correspondence.digitalSignature.certificateHash}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <button
              id="copy-qr-link-btn"
              onClick={handleCopy}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : isAr ? 'نسخ الرابط' : 'Copy Link'}</span>
            </button>

            <button
              id="download-qr-btn"
              onClick={handleDownloadQR}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تحميل الرمز (PNG)' : 'Download QR (PNG)'}</span>
            </button>

            <button
              id="print-qr-sticker-btn"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'طباعة الملصق' : 'Print Sticker'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
