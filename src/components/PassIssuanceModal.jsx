import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  Upload,
  User,
  Mail,
  Phone,
  Building,
  Shield,
  Clock,
  Car,
  QrCode,
  Download,
  Check,
  AlertCircle,
} from "lucide-react";
import { generateVisitorBadgePdf } from "../utils/pdfGenerator";

export const PassIssuanceModal = ({
  isOpen,
  onClose,
  hosts = [],
  currentOrg,
  onPassIssued,
}) => {
  const [formData, setFormData] = useState({
    visitorName: "",
    visitorEmail: "",
    visitorPhone: "",
    visitorCompany: "",
    idProofType: "National ID",
    idProofNumber: "",
    hostId: "",
    passType: "day_pass",
    validHours: 8,
    accessZones: ["Main Lobby", "Host Floor"],
    vehicleNumber: "",
  });

  const [photoPreview, setPhotoPreview] = useState(
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  );
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedPass, setIssuedPass] = useState(null);

  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  useEffect(() => {
    if (hosts.length > 0 && !formData.hostId) {
      setFormData((prev) => ({ ...prev, hostId: hosts[0].id }));
    }
  }, [hosts]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setIssuedPass(null);
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 480 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        "Camera access not granted or not available. You can upload an image instead.",
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const snapPhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 300, 300);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setPhotoPreview(dataUrl);
      }
      stopCamera();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setPhotoPreview(uploadEvent.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleZoneToggle = (zone) => {
    setFormData((prev) => {
      const exists = prev.accessZones.includes(zone);
      return {
        ...prev,
        accessZones: exists
          ? prev.accessZones.filter((z) => z !== zone)
          : [...prev.accessZones, zone],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.visitorName || !formData.visitorEmail || !formData.hostId) {
      alert("Please provide visitor name, email, and designated host.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/passes/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          visitorPhoto: photoPreview,
          organizationId: currentOrg?.id || "org_apex",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to issue pass");
      }

      const newPass = await res.json();
      setIssuedPass(newPass);
      if (onPassIssued) onPassIssued(newPass);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Issue Digital Visitor Pass & Generate Badge
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live photo capture, identity document validation, access zones,
              and QR pass creation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {issuedPass ? (
          /* Show the new pass and the PDF download option. */
          <div className="p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <Check className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Digital Pass Issued Successfully!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Pass Number:{" "}
                <span className="font-mono font-bold text-emerald-600">
                  {issuedPass.passNumber}
                </span>
              </p>
            </div>

            <div className="max-w-xs mx-auto p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
              <img
                src={issuedPass.visitorPhoto}
                alt={issuedPass.visitorName}
                className="w-20 h-20 rounded-xl object-cover mx-auto mb-2 border border-slate-200"
              />
              <h4 className="font-bold text-sm text-slate-900">
                {issuedPass.visitorName}
              </h4>
              <p className="text-xs text-slate-500">
                {issuedPass.visitorCompany || "Visitor"}
              </p>
              <div className="mt-3 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono">
                Verification PIN: <strong>{issuedPass.otpCode}</strong>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() =>
                  generateVisitorBadgePdf(
                    issuedPass,
                    currentOrg?.name || "Apex Global Tech HQ",
                  )
                }
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download Printable PDF Badge
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
              >
                Done / Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                1. Visitor Photo Capture (Security Requirement)
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-slate-200 border-2 border-slate-300 shrink-0">
                  {isCameraActive ? (
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <p className="text-xs text-slate-600">
                    Capture live webcam photo for physical security
                    identification, or upload an existing headshot.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {isCameraActive ? (
                      <>
                        <button
                          type="button"
                          onClick={snapPhoto}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition"
                        >
                          Snap Photo
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-600"
                        >
                          Cancel Camera
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Take Photo
                        </button>

                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition">
                          <Upload className="w-3.5 h-3.5" />
                          Upload Headshot
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </>
                    )}
                  </div>
                  {cameraError && (
                    <p className="text-[11px] text-amber-600">{cameraError}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Visitor & Contact Details
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Visitor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel Sterling"
                    value={formData.visitorName}
                    onChange={(e) =>
                      setFormData({ ...formData, visitorName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address * (For Digital QR Pass Delivery)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="rachel@fintech.io"
                    value={formData.visitorEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, visitorEmail: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Phone Number (For SMS Verification)
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 923-4567"
                    value={formData.visitorPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, visitorPhone: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Visitor Company / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="Fintech Solutions Inc."
                    value={formData.visitorCompany}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        visitorCompany: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Access Authorization & Host Assignment
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Host Employee *
                  </label>
                  <select
                    value={formData.hostId}
                    onChange={(e) =>
                      setFormData({ ...formData, hostId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {hosts.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} — {h.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pass Type
                  </label>
                  <select
                    value={formData.passType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        passType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="day_pass">Standard Day Pass</option>
                    <option value="vip">VIP Guest Pass</option>
                    <option value="interview">Job Candidate / Interview</option>
                    <option value="contractor">Maintenance Contractor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Identity Proof Type
                  </label>
                  <select
                    value={formData.idProofType}
                    onChange={(e) =>
                      setFormData({ ...formData, idProofType: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
                  >
                    <option value="National ID">National ID</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Employee Badge">Employee Badge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ID Document Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DL-892401"
                    value={formData.idProofNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        idProofNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Validity (Hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={formData.validHours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        validHours: parseInt(e.target.value) || 8,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Authorized Physical Zones
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Main Lobby",
                    "Tower A - Floor 4",
                    "R&D Labs",
                    "Floor 2 - HR Suites",
                    "Executive Boardroom",
                    "Cafeteria & Lounge",
                  ].map((zone) => {
                    const selected = formData.accessZones.includes(zone);
                    return (
                      <button
                        type="button"
                        key={zone}
                        onClick={() => handleZoneToggle(zone)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                          selected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {selected ? `✓ ${zone}` : `+ ${zone}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition active:scale-95"
              >
                {isSubmitting
                  ? "Generating Pass & QR..."
                  : "Issue Visitor Pass"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
