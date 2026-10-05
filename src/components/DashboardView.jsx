import React from "react";
import {
  Users,
  CheckCircle2,
  LogOut,
  Clock,
  AlertTriangle,
  QrCode,
  CalendarPlus,
  FileSpreadsheet,
  ArrowUpRight,
  ShieldCheck,
  UserCheck,
  Activity,
  MapPin,
} from "lucide-react";

export const DashboardView = ({
  stats,
  onNavigateTab,
  onOpenIssuePass,
  onExportPasses,
  onExportLogs,
}) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <Activity className="w-6 h-6 animate-spin mr-2 text-emerald-500" />
        Loading Visitor Operations Dashboard...
      </div>
    );
  }

  const maxTraffic = Math.max(
    ...stats.hourlyTraffic.map((t) => Math.max(t.checkIns, t.checkOuts)),
    15,
  );

  return (
    <div className="space-y-6">
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl border border-slate-700/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Live Gate Operations Active
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Visitor Management & Security Portal
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Digital pass verification and QR check-ins,
            host notifications, and attendance records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            id="btn-dash-scanner"
            onClick={() => onNavigateTab("scanner")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-sm transition active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            Launch Scanner Kiosk
          </button>
          <button
            id="btn-dash-issue"
            onClick={onOpenIssuePass}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-sm transition active:scale-95"
          >
            <UserCheck className="w-4 h-4" />
            Issue Pass
          </button>
          <button
            id="btn-dash-prereg"
            onClick={() => onNavigateTab("appointments")}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition"
          >
            <CalendarPlus className="w-4 h-4 text-slate-400" />
            Pre-Registration
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              On-Premises Now
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {stats.currentlyOnPremises}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center">
              Active In
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{
                width: `${Math.min(100, (stats.currentlyOnPremises / 20) * 100)}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Total Today Passes
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {stats.todayTotalPasses}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Issued
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Digital QR Badges</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Checked In
            </span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {stats.todayCheckedIn}
            </span>
            <span className="text-[11px] text-teal-600 font-medium">
              Scanned
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Entry gate passes</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Checked Out
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <LogOut className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {stats.todayCheckedOut}
            </span>
            <span className="text-[11px] text-blue-600 font-medium">
              Departed
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Gate exits</p>
        </div>

        <div
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-amber-400 transition"
          onClick={() => onNavigateTab("appointments")}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Pending Host Approvals
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">
              {stats.pendingApprovals}
            </span>
            <span className="text-[11px] text-amber-600 font-medium">
              Awaiting
            </span>
          </div>
          <p className="text-[11px] text-amber-700/80 font-medium mt-2 flex items-center gap-1">
            Review invites <ArrowUpRight className="w-3 h-3" />
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Overstayed Alerts
            </span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {stats.overstayedPasses}
            </span>
            <span className="text-[11px] text-rose-600 font-medium">
              Exceeded
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Past the valid time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Today's Gate Traffic Volume
              </h2>
              <p className="text-xs text-slate-500">
                Hourly distribution of visitor check-in vs check-out scans
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                <span className="text-slate-600 font-medium">Check-In</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-500"></span>
                <span className="text-slate-600 font-medium">Check-Out</span>
              </div>
            </div>
          </div>

          <div className="mt-6 h-56 flex items-end justify-between gap-1 sm:gap-2 px-2 pt-6">
            {stats.hourlyTraffic.map((hourData, idx) => {
              const inHeightPercent = Math.round(
                (hourData.checkIns / maxTraffic) * 100,
              );
              const outHeightPercent = Math.round(
                (hourData.checkOuts / maxTraffic) * 100,
              );

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
                >
                  <div className="hidden group-hover:block absolute -translate-y-24 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-lg z-10 whitespace-nowrap">
                    <p className="font-bold">{hourData.hour}</p>
                    <p className="text-emerald-300">In: {hourData.checkIns}</p>
                    <p className="text-blue-300">Out: {hourData.checkOuts}</p>
                  </div>

                  <div className="w-full flex items-end justify-center gap-1 h-44">
                    <div
                      className="w-2.5 sm:w-3.5 bg-emerald-500 hover:bg-emerald-400 rounded-t-sm transition-all duration-300 relative"
                      style={{ height: `${Math.max(inHeightPercent, 4)}%` }}
                    ></div>

                    <div
                      className="w-2.5 sm:w-3.5 bg-blue-500 hover:bg-blue-400 rounded-t-sm transition-all duration-300 relative"
                      style={{ height: `${Math.max(outHeightPercent, 4)}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-1 truncate">
                    {hourData.hour}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Visit Purpose Distribution
              </h2>
              <span className="text-xs text-slate-400">Total Visits</span>
            </div>

            <div className="mt-4 space-y-3">
              {stats.purposeBreakdown.map((item, i) => {
                const total =
                  stats.purposeBreakdown.reduce(
                    (acc, curr) => acc + curr.count,
                    0,
                  ) || 1;
                const percentage = Math.round((item.count / total) * 100);

                const colors = [
                  "bg-indigo-500",
                  "bg-emerald-500",
                  "bg-amber-500",
                  "bg-blue-500",
                  "bg-purple-500",
                ];
                const color = colors[i % colors.length];

                return (
                  <div key={item.purpose}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-700 font-medium">
                        {item.purpose}
                      </span>
                      <span className="text-slate-500 font-semibold">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`${color} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              High-Traffic Authorized Zones
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {stats.zoneBreakdown.slice(0, 4).map((z) => (
                <span
                  key={z.zone}
                  className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                >
                  {z.zone} ({z.count})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Check-In & Gate Logs
            </h2>
            <p className="text-xs text-slate-500">
              Log of QR scans at security and reception
              desks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-dash-export-passes"
              onClick={onExportPasses}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              Export Passes CSV
            </button>
            <button
              id="btn-dash-export-logs"
              onClick={onExportLogs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              Export Logs CSV
            </button>
            <button
              onClick={() => onNavigateTab("logs")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 ml-2"
            >
              View All Logs <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Visitor</th>
                <th className="py-3 px-4">Pass ID</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Gate / Point</th>
                <th className="py-3 px-4">Host</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Officer</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No gate check logs recorded yet today. Use the QR Scanner
                    Kiosk to check visitors in.
                  </td>
                </tr>
              ) : (
                stats.recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            log.visitorPhoto ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                          }
                          alt={log.visitorName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                        <span className="font-semibold text-slate-900">
                          {log.visitorName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {log.passNumber}
                    </td>
                    <td className="py-3 px-4">
                      {log.action === "check_in" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Check In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-200">
                          <LogOut className="w-3 h-3" /> Check Out
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {log.gate}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{log.hostName}</td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {log.verifiedBy}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{" "}
                        Verified
                      </span>
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
