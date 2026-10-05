import React, { useState } from "react";
import {
  History,
  Search,
  CheckCircle2,
  LogOut,
  FileSpreadsheet,
  Calendar,
  Filter,
  ShieldCheck,
  User,
} from "lucide-react";

export const CheckLogsView = ({ logs = [], onExportLogs }) => {
  const [actionFilter, setActionFilter] = useState("all");
  const [gateFilter, setGateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const uniqueGates = Array.from(new Set(logs.map((l) => l.gate))).filter(
    Boolean,
  );

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== "all" && log.action !== actionFilter) return false;
    if (gateFilter !== "all" && log.gate !== gateFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.visitorName.toLowerCase().includes(q) ||
        log.passNumber.toLowerCase().includes(q) ||
        log.hostName.toLowerCase().includes(q) ||
        log.gate.toLowerCase().includes(q) ||
        log.verifiedBy.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600" />
            Check-In & Check-Out Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Records of visitor entries and exits, including badge
            scans, and security checkouts.
          </p>
        </div>

        <button
          onClick={onExportLogs}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          Export Audit Trail CSV
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by visitor, pass #, officer, gate..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            {[
              { id: "all", label: "All Scans" },
              { id: "check_in", label: "Check-In Entries" },
              { id: "check_out", label: "Check-Out Exits" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActionFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  actionFilter === tab.id
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={gateFilter}
            onChange={(e) => setGateFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Turnstiles / Gates</option>
            {uniqueGates.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Visitor</th>
                <th className="py-3 px-4">Pass Number</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Gate Location</th>
                <th className="py-3 px-4">Host Employee</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Verified By</th>
                <th className="py-3 px-4">Notes / Lanyard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching check-in or check-out logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            log.visitorPhoto ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                          }
                          alt={log.visitorName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <span className="font-semibold text-slate-900">
                          {log.visitorName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 font-medium">
                      {log.passNumber}
                    </td>
                    <td className="py-3 px-4">
                      {log.action === "check_in" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-200">
                          <LogOut className="w-3.5 h-3.5" /> Checked Out
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {log.gate}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{log.hostName}</td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {log.verifiedBy}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {log.notes || "Normal access scan"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
