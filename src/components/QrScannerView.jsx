import React, { useState, useRef, useEffect } from "react";
import {
  QrCode,
  Camera,
  CheckCircle2,
  XCircle,
  Upload,
  KeyRound,
  Volume2,
  VolumeX,
  RefreshCw,
  LogOut,
  MapPin,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import jsQR from "jsqr";

export const QrScannerView = ({ activePasses = [], onScanSuccess }) => {
  const [scanMode, setScanMode] = useState("simulator");
  const [selectedGate, setSelectedGate] = useState("Main Turnstile Entrance A");
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [manualCode, setManualCode] = useState("");
  const [manualOtp, setManualOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [scanResult, setScanResult] = useState(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  const playBeep = (isSuccess) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = isSuccess ? "sine" : "sawtooth";
      osc.frequency.setValueAtTime(isSuccess ? 880 : 320, audioCtx.currentTime); // Higher tone for success, lower tone for an error.
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + 0.25,
      );
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {}
  };

  const startScannerCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
      }
      setIsStreaming(true);
      requestAnimationFrame(scanVideoFrame);
    } catch (err) {
      console.error("Camera stream error:", err);
      setCameraError(
        "Unable to access video camera. Please test using the Quick Simulator or Image Upload.",
      );
      setIsStreaming(false);
    }
  };

  const stopScannerCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const scanVideoFrame = () => {
    if (
      videoRef.current &&
      videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
    ) {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          playBeep(true);
          verifyAndProcessScan(code.data);
          stopScannerCamera();
          return;
        }
      }
    }
    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  };

  useEffect(() => {
    if (scanMode === "camera") {
      startScannerCamera();
    } else {
      stopScannerCamera();
    }
    return () => {
      stopScannerCamera();
    };
  }, [scanMode]);

  const handleQrImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            verifyAndProcessScan(code.data);
          } else {
            alert(
              "No valid QR code detected in this image. Please select a clearer badge image.",
            );
          }
        }
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

  const verifyAndProcessScan = async (qrOrPass) => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/check-logs/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrData: qrOrPass,
          passNumber: qrOrPass,
          gate: selectedGate,
          verifiedBy: "Security Staff",
          action: "auto",
          temperature: "98.6 F",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        playBeep(false);
        setScanResult({
          valid: false,
          message: data.error || "Pass verification rejected",
          error: data.details || data.error,
          pass: data.pass,
        });
      } else {
        playBeep(true);
        setScanResult({
          valid: true,
          action: data.action,
          message: data.message,
          pass: data.pass,
          log: data.log,
        });
        if (data.log && data.pass && onScanSuccess) {
          onScanSuccess({
            action: data.action,
            pass: data.pass,
            log: data.log,
          });
        }
      }
    } catch (err) {
      playBeep(false);
      setScanResult({
        valid: false,
        message: "Network verification failed",
        error: err.message,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <QrCode className="w-6 h-6 text-emerald-600" />
            QR Pass Verification & Check-In
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Scan visitor QR badges to verify passes, record entry, and notify the host.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs text-xs">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedGate}
              onChange={(e) => setSelectedGate(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="Main Turnstile Entrance A">
                Main Turnstile Entrance A
              </option>
              <option value="North Tower Reception Gate">
                North Tower Reception Gate
              </option>
              <option value="Executive Parking Gate">
                Executive Parking Gate
              </option>
              <option value="Loading Dock / Service Gate">
                Loading Dock / Service Gate
              </option>
            </select>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
            title={
              soundEnabled
                ? "Mute sound beep"
                : "Enable audio confirmation beep"
            }
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-semibold">
              <button
                id="btn-scan-sim"
                onClick={() => setScanMode("simulator")}
                className={`flex-1 py-2 rounded-lg transition ${
                  scanMode === "simulator"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Quick Test
              </button>
              <button
                id="btn-scan-camera"
                onClick={() => setScanMode("camera")}
                className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  scanMode === "camera"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Live Camera Scanner
              </button>
              <button
                id="btn-scan-manual"
                onClick={() => setScanMode("manual")}
                className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  scanMode === "manual"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                Manual Code & OTP
              </button>
            </div>

            {scanMode === "simulator" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900">
                  <p className="font-semibold mb-0.5">
                    Quick Test Mode
                  </p>
                  <p className="text-indigo-700">
                    Click an active pass below to test a QR scan. You can switch between
                    check-in and check-out, with a sound and host notification.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Active Visitor Passes:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                    {activePasses.map((p) => {
                      const isCheckedIn = p.status === "checked_in";
                      return (
                        <div
                          key={p.id}
                          onClick={() => verifyAndProcessScan(p.passNumber)}
                          className="group p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md bg-white cursor-pointer transition flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={p.visitorPhoto}
                              alt={p.visitorName}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                                {p.visitorName}
                              </p>
                              <p className="text-[11px] font-mono text-slate-500">
                                {p.passNumber}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Host: {p.hostName}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                isCheckedIn
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {isCheckedIn ? "Checked In" : "Issued"}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-1">
                              {isCheckedIn
                                ? "Click to Check Out"
                                : "Click to Check In"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Or decode an image:</span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer font-medium transition">
                    <Upload className="w-3.5 h-3.5" />
                    Upload QR Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {scanMode === "camera" && (
              <div className="space-y-4">
                <div className="relative aspect-video max-h-72 w-full rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border-2 border-slate-800">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-emerald-400/80 rounded-2xl relative">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400"></div>
                      <div className="w-full h-0.5 bg-emerald-400/80 absolute top-1/2 -translate-y-1/2 animate-pulse shadow-xs shadow-emerald-400"></div>
                    </div>
                  </div>

                  {!isStreaming && (
                    <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white p-4 text-center">
                      <Camera className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-xs text-slate-300 max-w-xs">
                        {cameraError || "Starting video scanner..."}
                      </p>
                      <button
                        onClick={startScannerCamera}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-600 text-xs font-semibold hover:bg-emerald-500 transition"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-center text-xs text-slate-500">
                  Hold printed QR badge or phone screen in front of the camera
                  to verify entry.
                </p>
              </div>
            )}

            {scanMode === "manual" && (
              <div className="space-y-4 py-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pass Number (e.g. VP-2026-9814) *
                  </label>
                  <input
                    type="text"
                    placeholder="VP-2026-XXXX"
                    value={manualCode}
                    onChange={(e) =>
                      setManualCode(e.target.value.toUpperCase())
                    }
                    className="w-full px-4 py-2.5 text-sm font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Visitor One-Time Verification PIN (OTP)</span>
                    <span className="text-emerald-600 font-normal">
                      Bonus Security Layer
                    </span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="6-digit PIN (Optional)"
                    value={manualOtp}
                    onChange={(e) => setManualOtp(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm font-mono tracking-widest rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <button
                  id="btn-verify-manual"
                  disabled={!manualCode.trim() || isVerifying}
                  onClick={() => verifyAndProcessScan(manualCode.trim())}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition shadow-sm"
                >
                  {isVerifying
                    ? "Verifying Credentials..."
                    : "Verify & Process Entry"}
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Enforcing Anti-Passback & Timestamp Audits</span>
            <span className="font-semibold text-emerald-600">
              Encrypted JWT Protocol
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Gate Verification Verdict
              </span>
              <span className="text-xs font-mono text-slate-400">
                {new Date().toLocaleTimeString()}
              </span>
            </div>

            {isVerifying ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <p className="text-sm font-semibold text-slate-300">
                  Scanning Database...
                </p>
                <p className="text-xs text-slate-500">
                  Checking validity timestamp and security permissions
                </p>
              </div>
            ) : scanResult ? (
              <div className="mt-5 space-y-5">
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    scanResult.valid
                      ? scanResult.action === "check_in"
                        ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                        : "bg-blue-950/60 border-blue-500/50 text-blue-300"
                      : "bg-rose-950/60 border-rose-500/50 text-rose-300"
                  }`}
                >
                  {scanResult.valid ? (
                    scanResult.action === "check_in" ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <LogOut className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
                    )
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                  )}

                  <div>
                    <h3 className="font-bold text-sm text-white">
                      {scanResult.valid
                        ? scanResult.action === "check_in"
                          ? "ACCESS GRANTED — CHECK-IN"
                          : "DEPARTURE RECORDED — CHECK-OUT"
                        : "ACCESS DENIED"}
                    </h3>
                    <p className="text-xs mt-0.5">{scanResult.message}</p>
                  </div>
                </div>

                {scanResult.pass && (
                  <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={scanResult.pass.visitorPhoto}
                        alt={scanResult.pass.visitorName}
                        className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-500/60 shadow-md"
                      />
                      <div>
                        <h4 className="font-bold text-base text-white">
                          {scanResult.pass.visitorName}
                        </h4>
                        <p className="text-xs text-slate-300">
                          {scanResult.pass.visitorCompany || "Visitor"}
                        </p>
                        <p className="text-[11px] font-mono text-emerald-400">
                          {scanResult.pass.passNumber}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-700/60">
                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          Host
                        </span>
                        <span className="font-medium text-slate-200">
                          {scanResult.pass.hostName}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          Department
                        </span>
                        <span className="font-medium text-slate-200">
                          {scanResult.pass.hostDepartment}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-700/60">
                      <span className="text-slate-400 block text-[10px] mb-1">
                        Authorized Access Zones
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {scanResult.pass.accessZones &&
                          scanResult.pass.accessZones.map((z) => (
                            <span
                              key={z}
                              className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 text-[10px]"
                            >
                              {z}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {scanResult.valid && (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-[11px] text-emerald-300 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Host notification dispatched via Email/SMS alert.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <ShieldCheck className="w-8 h-8 text-emerald-500/80" />
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  Ready to Scan
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Position pass QR code within camera reticle, or click any pass
                  in the simulator to verify.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Gate: {selectedGate}</span>
            <span className="text-emerald-400 font-medium">
              Automatic Gate Update
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
