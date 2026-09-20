import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, AlertCircle, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, ShieldCheck, SwitchCamera, Flashlight, FlashlightOff, ImagePlus } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useScanStore } from '../../store/scanStore';

export const LiveProductCapture: React.FC = () => {
  const { addImages, isProcessing, uploadedImages } = useScanStore();

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showTunnelHelp, setShowTunnelHelp] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement>(null);

  // Stop all camera tracks helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsInitializing(false);
    setIsTorchOn(false);
    setHasTorch(false);
  }, []);

  // Cleanup on unmount or when analysis starts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (isProcessing) {
      stopCamera();
    }
  }, [isProcessing, stopCamera]);

  const startStream = async (targetFacing: 'environment' | 'user') => {
    setCameraError(null);
    setIsInitializing(true);

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // 1. Insecure context detection (e.g. phone accessing http://192.168.x.x:3000)
    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setCameraError('Live camera streaming requires HTTPS on mobile. You can tap "Take Photo (Back Camera)" below to use your native phone camera.');
      setIsInitializing(false);
      return;
    }

    // 2. Browser API support check
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Live Camera stream API is unavailable on this browser. Tap "Take Photo (Back Camera)" below to use your native camera app.'
      );
      setIsInitializing(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setIsCameraActive(true);
      setIsInitializing(false);
      setFacingMode(targetFacing);

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === 'function') {
        const capabilities: any = track.getCapabilities();
        setHasTorch(Boolean(capabilities && 'torch' in capabilities));
      }

      // Attach stream to video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err: any) {
      setIsInitializing(false);
      setIsCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          'Camera permission was denied. Allow camera permissions in your browser site settings, or use the Native Camera button below.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera sensor found on this device.');
      } else {
        setCameraError(
          `Unable to access live camera: ${err.message || 'Device error'}. You can use the Native Camera button below.`
        );
      }
    }
  };

  const handleStartCamera = () => {
    startStream(facingMode);
  };

  const handleToggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    startStream(nextFacing);
  };

  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && typeof track.applyConstraints === 'function') {
      try {
        const nextState = !isTorchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState } as any],
        });
        setIsTorchOn(nextState);
      } catch {
        // Torch toggle failed or not supported
      }
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const fileName = `product-live-capture-${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          addImages([file]);
        }
        stopCamera();
      },
      'image/jpeg',
      0.95
    );
  };

  const handleNativeCameraSnap = () => {
    fallbackInputRef.current?.click();
  };

  const handleNativeCameraFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addImages(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <Card className="border-indigo-200/80 dark:border-indigo-900/60 shadow-sm overflow-hidden">
      <CardContent className="p-3 sm:p-6 space-y-4">
        {!isCameraActive ? (
          /* Idle State */
          <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3.5">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Camera className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>

            <div className="max-w-md space-y-1 px-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Live Back Camera Viewfinder
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Stream from your phone's <span className="font-semibold text-indigo-600 dark:text-indigo-400">Rear Camera</span> to frame and inspect mandatory statutory labels in real time.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto justify-center">
              <Button
                variant="primary"
                onClick={handleStartCamera}
                disabled={isInitializing || isProcessing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md text-xs sm:text-sm gap-2 w-full sm:w-auto min-h-[42px] justify-center"
              >
                {isInitializing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Connecting Rear Camera...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    <span>Start Live Viewfinder</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleNativeCameraSnap}
                disabled={isProcessing}
                className="text-xs sm:text-sm gap-1.5 min-h-[42px] px-4 w-full sm:w-auto border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
              >
                <ImagePlus className="h-4 w-4" />
                <span>Snap Native Camera</span>
              </Button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Back camera is automatically selected • Supports instant snapshot & torch
            </p>

            {uploadedImages.length > 0 && (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold pt-1 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  {uploadedImages.length} {uploadedImages.length === 1 ? 'photo' : 'photos'} queued for statutory audit
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Live Camera Viewfinder */
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl w-full min-h-[280px] max-h-[58vh] flex items-center justify-center mx-auto">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover min-h-[280px] max-h-[58vh]"
              />

              {/* Viewfinder Target Framing Overlay */}
              <div className="absolute inset-4 sm:inset-8 pointer-events-none border border-white/30 rounded-xl flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-indigo-400"></div>
                  <div className="w-6 h-6 border-t-2 border-r-2 border-indigo-400"></div>
                </div>
                <div className="text-center">
                  <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-xs text-[11px] font-mono text-white/95">
                    Align Statutory Declaration Panel
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-2 border-l-2 border-indigo-400"></div>
                  <div className="w-6 h-6 border-b-2 border-r-2 border-indigo-400"></div>
                </div>
              </div>

              {/* Top Bar Indicators & Controls */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-white animate-ping"></span>
                  <span>{facingMode === 'environment' ? 'Rear Camera' : 'Front Camera'}</span>
                </div>

                <div className="flex items-center gap-2">
                  {hasTorch && (
                    <button
                      type="button"
                      onClick={handleToggleTorch}
                      className="p-2 rounded-full bg-black/60 backdrop-blur-xs hover:bg-black/80 text-white transition-all"
                      title={isTorchOn ? 'Turn Flash Off' : 'Turn Flash On'}
                    >
                      {isTorchOn ? (
                        <Flashlight className="h-4 w-4 text-amber-400" />
                      ) : (
                        <FlashlightOff className="h-4 w-4 text-slate-300" />
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleToggleFacingMode}
                    className="p-2 rounded-full bg-black/60 backdrop-blur-xs hover:bg-black/80 text-white transition-all"
                    title="Flip Camera (Rear/Front)"
                  >
                    <SwitchCamera className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Shutter and Cancel controls */}
            <div className="flex items-center justify-center gap-6 pt-1">
              <button
                type="button"
                onClick={stopCamera}
                className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center shadow-xs"
                title="Cancel Live Camera"
                aria-label="Cancel live capture"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Shutter Trigger */}
              <button
                type="button"
                onClick={handleCapturePhoto}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white flex items-center justify-center shadow-lg ring-4 ring-indigo-300 dark:ring-indigo-900/60 transition-all focus:outline-none"
                title="Capture Photo"
                aria-label="Capture photo of packaging"
              >
                <Camera className="h-7 w-7" />
              </button>
            </div>
          </div>
        )}

        {/* Fallback Native Input */}
        <input
          ref={fallbackInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleNativeCameraFile}
        />

        {/* Camera Error / Permission Notice */}
        {cameraError && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-3.5 text-xs text-amber-800 dark:text-amber-300 space-y-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="space-y-1">
                <div className="font-bold">Live Stream Notice</div>
                <div className="leading-relaxed">{cameraError}</div>
              </div>
            </div>

            {/* Instant Fallback Button */}
            <div className="pt-1">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleNativeCameraSnap}
                className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Snap Using Phone Back Camera (Always Works)</span>
              </Button>
            </div>

            {/* Collapsible HTTPS Tunneling Helper */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowTunnelHelp(!showTunnelHelp)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 hover:underline"
              >
                <span>Live video streaming HTTPS guidelines</span>
                {showTunnelHelp ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              {showTunnelHelp && (
                <div className="mt-2 p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-900/40 text-[11px] space-y-2 text-slate-700 dark:text-slate-300 font-sans">
                  <p>
                    Mobile web browsers require <strong>HTTPS</strong> for real-time video streaming:
                  </p>
                  <div className="bg-slate-100 dark:bg-slate-950 p-2 rounded font-mono text-[10px] space-y-1 text-slate-800 dark:text-slate-200">
                    <div># Option A: Cloudflare Tunnel (Instant)</div>
                    <div className="text-blue-600 dark:text-blue-400 font-bold">cloudflared tunnel --url http://localhost:3000</div>
                    <div className="pt-1"># Option B: ngrok</div>
                    <div className="text-blue-600 dark:text-blue-400 font-bold">ngrok http 3000</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
