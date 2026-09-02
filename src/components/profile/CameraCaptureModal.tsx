import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Video,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Sliders,
  RotateCw,
  Sun,
  ShieldCheck,
  Upload,
  User,
  Zap,
  Image as ImageIcon
} from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  locale: 'ar' | 'en';
}

type CameraState = 'idle' | 'requesting' | 'streaming' | 'countdown' | 'captured' | 'error';
type FilterType = 'normal' | 'crisp' | 'warm' | 'executive';

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  locale
}) => {
  const isAr = locale === 'ar';
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('normal');
  const [countdown, setCountdown] = useState<number>(3);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isMirrored, setIsMirrored] = useState(true);
  const [flashEffect, setFlashEffect] = useState(false);

  // Stop camera tracks helper
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start Camera
  const startCamera = async (deviceId?: string) => {
    stopCameraStream();
    setCameraState('requesting');
    setErrorMessage('');
    setCapturedImage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('CAMERA_NOT_SUPPORTED');
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: 'user',
              width: { ideal: 640, min: 320 },
              height: { ideal: 640, min: 320 }
            },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraState('streaming');

      // Enumerate camera devices
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = allDevices.filter(d => d.kind === 'videoinput');
        setDevices(videoDevs);
        if (videoDevs.length > 0 && !selectedDeviceId) {
          const currentTrack = stream.getVideoTracks()[0];
          const currentSettings = currentTrack.getSettings();
          if (currentSettings.deviceId) {
            setSelectedDeviceId(currentSettings.deviceId);
          }
        }
      } catch (devErr) {
        console.warn('Could not enumerate devices:', devErr);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      stopCameraStream();
      setCameraState('error');

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(
          isAr
            ? 'تم رفض إذن الوصول للكاميرا. يرجى تفعيل الكاميرا من إعدادات المتصفح في شريط العنوان.'
            : 'Camera access permission denied. Please allow camera permissions in your browser settings.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage(
          isAr
            ? 'لم يتم العثور على كاميرا متصلة بالجهاز. يمكنك رفع صورة من الملفات.'
            : 'No connected camera found. You can upload an image file instead.'
        );
      } else if (err.message === 'CAMERA_NOT_SUPPORTED') {
        setErrorMessage(
          isAr
            ? 'متصفحك لا يدعم الوصول المباشر للكاميرا. يرجى استخدام رفع الملفات.'
            : 'Your browser does not support WebRTC Camera API. Please use file upload.'
        );
      } else {
        setErrorMessage(
          isAr
            ? 'تعذر تشغيل الكاميرا. يرجى التأكد من عدم استخدامها بواسطة تطبيق آخر.'
            : 'Could not access the camera. Ensure it is not in use by another app.'
        );
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCameraStream();
      setCapturedImage(null);
      setCameraState('idle');
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen]);

  // Shutter Sound & Flash
  const triggerShutterFlash = () => {
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    // Audio click
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch {}
  };

  // Perform Snapshot
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    triggerShutterFlash();

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 480, video.videoHeight || 480);
    canvas.width = 400;
    canvas.height = 400;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply mirroring if enabled
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Center crop to square
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, canvas.width, canvas.height);

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Apply Filter if not normal
    applyFilterToCanvas(ctx, canvas.width, canvas.height, activeFilter);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    setCameraState('captured');
    stopCameraStream();
  };

  const applyFilterToCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    filter: FilterType
  ) => {
    if (filter === 'normal') return;

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      if (filter === 'crisp') {
        // High contrast studio
        r = Math.min(255, (r - 128) * 1.15 + 128 + 10);
        g = Math.min(255, (g - 128) * 1.15 + 128 + 10);
        b = Math.min(255, (b - 128) * 1.15 + 128 + 12);
      } else if (filter === 'warm') {
        // Warm government tone
        r = Math.min(255, r * 1.08 + 10);
        g = Math.min(255, g * 1.02 + 4);
        b = Math.min(255, b * 0.92);
      } else if (filter === 'executive') {
        // High quality grayscale / monochrome executive
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const contrastGray = Math.min(255, Math.max(0, (gray - 128) * 1.2 + 128));
        r = contrastGray;
        g = contrastGray;
        b = contrastGray;
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    ctx.putImageData(imgData, 0, 0);
  };

  // 3-Second Timer Countdown
  const startCountdown = () => {
    if (cameraState !== 'streaming') return;
    setIsCountingDown(true);
    setCountdown(3);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        setIsCountingDown(false);
        takeSnapshot();
      }
    }, 1000);
  };

  // Re-apply filter to current captured image
  const reapplyFilter = (filter: FilterType) => {
    setActiveFilter(filter);
    if (!capturedImage) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 400, 400);
      applyFilterToCanvas(ctx, 400, 400, filter);
      setCapturedImage(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = capturedImage;
  };

  // Retake
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(selectedDeviceId);
  };

  // Confirm and save
  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  // Fallback File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(isAr ? 'يرجى اختيار ملف صورة صالح' : 'Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setCapturedImage(dataUrl);
          setCameraState('captured');
          stopCameraStream();
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        id="camera-capture-dialog"
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {isAr ? 'التقاط الصورة الشخصية بالكاميرا' : 'Capture Profile Photo via Camera'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAr
                  ? 'التقاط صورة رسمية مباشرة للملف التعريفي وبطاقة العمل'
                  : 'Take a high-resolution live portrait for your system profile'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="p-5 flex flex-col items-center bg-gradient-to-b from-slate-950 to-slate-900">
          <div className="relative w-72 h-72 rounded-full overflow-hidden border-4 border-emerald-500/40 shadow-2xl bg-slate-950 flex items-center justify-center">
            {/* Live Camera View */}
            {cameraState === 'streaming' && (
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
              />
            )}

            {/* Captured Static Preview */}
            {cameraState === 'captured' && capturedImage && (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            )}

            {/* Requesting State Loader */}
            {cameraState === 'requesting' && (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                <span className="text-xs font-semibold">
                  {isAr ? 'جاري بدء تشغيل الكاميرا...' : 'Initializing camera stream...'}
                </span>
              </div>
            )}

            {/* Error State */}
            {cameraState === 'error' && (
              <div className="flex flex-col items-center gap-2 text-center p-6 text-rose-400">
                <AlertCircle className="w-10 h-10 text-rose-500 shrink-0" />
                <span className="text-xs font-bold">{isAr ? 'تعذر تشغيل الكاميرا' : 'Camera Error'}</span>
                <p className="text-[11px] text-slate-400 max-w-[200px] leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            )}

            {/* Face Centering Oval Guide Overlay during streaming */}
            {cameraState === 'streaming' && !isCountingDown && (
              <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-white/25 rounded-full m-6 flex items-center justify-center">
                <div className="w-32 h-44 rounded-full border border-emerald-400/40" />
              </div>
            )}

            {/* Countdown Overlay */}
            {isCountingDown && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center">
                <span className="text-7xl font-black text-white animate-ping font-mono">
                  {countdown}
                </span>
              </div>
            )}

            {/* Shutter White Flash Animation */}
            {flashEffect && (
              <div className="absolute inset-0 bg-white z-20 animate-out fade-out duration-200" />
            )}
          </div>

          {/* Camera Controls Toolbar */}
          {cameraState === 'streaming' && (
            <div className="mt-5 w-full flex items-center justify-between gap-3 px-4">
              {/* Mirror Toggle */}
              <button
                onClick={() => setIsMirrored(!isMirrored)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  isMirrored
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
                title={isAr ? 'عكس الصورة أفقياً' : 'Mirror camera'}
              >
                <RotateCw className="w-4 h-4" />
                <span className="hidden sm:inline">{isAr ? 'مرآة' : 'Mirror'}</span>
              </button>

              {/* Main Shutter Trigger Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={startCountdown}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                  title={isAr ? 'التقاط بمؤقت 3 ثواني' : '3-Second Countdown'}
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>3s</span>
                </button>

                <button
                  id="camera-take-shutter-btn"
                  onClick={takeSnapshot}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/60 hover:scale-105 active:scale-95 transition cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                  <span>{isAr ? 'التقاط الصورة' : 'Take Photo'}</span>
                </button>
              </div>

              {/* Device Selector if multiple */}
              {devices.length > 1 && (
                <div className="relative">
                  <select
                    value={selectedDeviceId}
                    onChange={e => {
                      setSelectedDeviceId(e.target.value);
                      startCamera(e.target.value);
                    }}
                    className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {devices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {devices.length <= 1 && (
                <label className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">{isAr ? 'ملف' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {/* Captured Review & Enhancements */}
          {cameraState === 'captured' && capturedImage && (
            <div className="mt-5 w-full space-y-4">
              {/* Photo Filter Pills */}
              <div className="flex items-center justify-center gap-1.5 overflow-x-auto p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
                <button
                  onClick={() => reapplyFilter('normal')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeFilter === 'normal'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {isAr ? 'طبيعي' : 'Natural'}
                </button>
                <button
                  onClick={() => reapplyFilter('crisp')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    activeFilter === 'crisp'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{isAr ? 'استوديو ناصع' : 'Studio Crisp'}</span>
                </button>
                <button
                  onClick={() => reapplyFilter('warm')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    activeFilter === 'warm'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span>{isAr ? 'إضاءة دافئة' : 'Warm Glow'}</span>
                </button>
                <button
                  onClick={() => reapplyFilter('executive')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    activeFilter === 'executive'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3 text-sky-400" />
                  <span>{isAr ? 'رسمي أحادي' : 'Executive B&W'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleRetake}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-slate-400" />
                  <span>{isAr ? 'إعادة التقاط' : 'Retake Photo'}</span>
                </button>

                <button
                  id="confirm-camera-photo-btn"
                  onClick={handleConfirm}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'اعتماد الصورة للملف' : 'Use as Profile Avatar'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Fallback File Upload when Camera Error */}
          {cameraState === 'error' && (
            <div className="mt-4 w-full space-y-3">
              <label className="w-full py-3 px-4 rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'رفع صورة من جهازك بدلاً من ذلك' : 'Upload photo from your computer'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => startCamera(selectedDeviceId)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isAr ? 'إعادة محاولة تشغيل الكاميرا' : 'Retry Camera Access'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Security & Privacy Notice */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isAr
                ? 'تتم معالجة الصورة محلياً وحفظها في التخزين الآمن'
                : 'Image is processed locally on your client and securely saved'}
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">WebRTC 400x400</span>
        </div>
      </div>
    </div>
  );
};
