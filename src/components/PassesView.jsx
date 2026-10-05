import React, { useState } from "react";
import {
  CreditCard,
  QrCode,
  Download,
  Search,
  CheckCircle2,
  Clock,
  LogOut,
  AlertTriangle,
  Ban,
  Eye,
  Building,
  User,
  MapPin,
  Calendar,
} from "lucide-react";
import { generateVisitorBadgePdf } from "../utils/pdfGenerator";

export const PassesView = ({
  passes = [],
  currentOrg,
  currentUser,
  onRevokePass,
  onOpenIssuePass,
}) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPassForModal, setSelectedPassForModal] = useState(null);

  const filteredPasses = passes.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.passNumber.toLowerCase().includes(q) ||
        p.visitorName.toLowerCase().includes(q) ||
        p.visitorEmail.toLowerCase().includes(q) ||
        (p.visitorCompany && p.visitorCompany.toLowerCase().includes(q)) ||
        p.hostName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            Visitor Pass Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Issued, active, and expired visitor security credentials with
            printable PDF badge generation.
          </p>
        </div>

        {["admin", "security"].includes(currentUser?.role) && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenIssuePass}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-sm"
            >
              <span>+ Issue New Pass</span>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by pass #, visitor name, company..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          {[
            { id: "all", label: "All Passes" },
            { id: "issued", label: "Issued (Pending In)" },
            { id: "checked_in", label: "Checked In Now" },
            { id: "checked_out", label: "Checked Out" },
            { id: "expired", label: "Expired / Revoked" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPasses.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
            <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">
              No Visitor Passes Found
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your filters or issue a new pass.
            </p>
          </div>
        ) : (
          filteredPasses.map((p) => {
            const isCheckedIn = p.status === "checked_in";
            const isIssued = p.status === "issued";
            const isRevoked = p.status === "revoked";

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {p.passNumber}
                    </span>
                    <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 tracking-wider">
                      {p.passType}
                    </span>
                  </div>

                  <div>
                    {isCheckedIn && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Checked In
                      </span>
                    )}
                    {isIssued && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        <Clock className="w-3 h-3" /> Issued
                      </span>
                    )}
                    {p.status === "checked_out" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        <LogOut className="w-3 h-3" /> Checked Out
                      </span>
                    )}
                    {isRevoked && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        <Ban className="w-3 h-3" /> Revoked
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3 flex-1">
                  <div className="flex items-start gap-3">
                    <img
                      src={p.visitorPhoto}
                      alt={p.visitorName}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-slate-900 truncate">
                        {p.visitorName}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        {p.visitorCompany || "Independent Visitor"}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {p.visitorEmail}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        Host Contact
                      </span>
                      <span className="font-medium text-slate-800 truncate block">
                        {p.hostName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        Department
                      </span>
                      <span className="font-medium text-slate-800 truncate block">
                        {p.hostDepartment}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[10px] text-slate-400 block mb-1">
                      Access Zones
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {p.accessZones &&
                        p.accessZones.map((z) => (
                          <span
                            key={z}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                          >
                            {z}
                          </span>
                        ))}
                    </div>
                  </div>

                  {p.otpCode && (
                    <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 text-[11px] flex items-center justify-between text-emerald-800 font-mono">
                      <span>Verification PIN:</span>
                      <span className="font-bold tracking-widest">
                        {p.otpCode}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedPassForModal(p)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
                      title="View Digital Mobile Badge"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      View Badge
                    </button>

                    <button
                      onClick={() =>
                        generateVisitorBadgePdf(
                          p,
                          currentOrg?.name || "Apex Global Tech HQ",
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition"
                      title="Download printable PDF visitor lanyard badge"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      PDF Badge
                    </button>
                  </div>

                  {p.status !== "revoked" && p.status !== "checked_out" && (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Revoke security pass ${p.passNumber} for ${p.visitorName}?`,
                          )
                        ) {
                          onRevokePass(p.id);
                        }
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Revoke pass authorization"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedPassForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-linear-to-r from-slate-900 to-indigo-950 text-white p-5 text-center relative">
              <button
                onClick={() => setSelectedPassForModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                ✕
              </button>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 block mb-1">
                Official Digital Guest Badge
              </span>
              <h3 className="text-lg font-bold">
                {currentOrg?.name || "Apex Global Tech HQ"}
              </h3>
              <p className="text-xs font-mono text-slate-300 mt-0.5">
                {selectedPassForModal.passNumber}
              </p>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="relative inline-block">
                <img
                  src={selectedPassForModal.visitorPhoto}
                  alt={selectedPassForModal.visitorName}
                  className="w-20 h-20 rounded-2xl object-cover mx-auto border-2 border-slate-900 shadow-md"
                />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  {selectedPassForModal.visitorName}
                </h4>
                <p className="text-xs text-slate-500">
                  {selectedPassForModal.visitorCompany || "Guest"}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
                {selectedPassForModal.qrCodeImage ? (
                  <img
                    src={selectedPassForModal.qrCodeImage}
                    alt={`QR code for ${selectedPassForModal.passNumber}`}
                    className="w-40 h-40 object-contain mx-auto"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-xs text-slate-500">
                    QR unavailable
                  </div>
                )}

                <p className="text-[10px] font-mono text-slate-500 mt-2">
                  Scan at the East or North gate
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 text-left text-xs space-y-1.5 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-400">Host:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedPassForModal.hostName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dept:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedPassForModal.hostDepartment}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valid Until:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(
                      selectedPassForModal.validUntil,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <button
                onClick={() =>
                  generateVisitorBadgePdf(
                    selectedPassForModal,
                    currentOrg?.name || "Apex Global Tech HQ",
                  )
                }
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download Printable PDF Badge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
