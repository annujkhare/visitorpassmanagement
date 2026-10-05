import React from "react";
import {
  Shield,
  Building2,
  Users,
  QrCode,
  Calendar,
  CreditCard,
  History,
  Bell,
  Sliders,
  LogOut,
  ChevronDown,
  UserCheck,
} from "lucide-react";

export const Navbar = ({
  currentUser,
  currentOrg,
  organizations = [],
  onSelectOrg,
  onSwitchRole,
  activeTab,
  setActiveTab,
  onOpenIssuePass,
  unreadNotifsCount = 0,
  onToggleNotifs,
  onPremisesCount = 0,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-2.5 border-b border-slate-800/80 gap-2 text-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="relative inline-block">
                <select
                  id="org-selector"
                  value={currentOrg?.id || ""}
                  onChange={(e) => {
                    const found = organizations.find(
                      (o) => o.id === e.target.value,
                    );
                    if (found && onSelectOrg) onSelectOrg(found);
                  }}
                  className="bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-md py-1 px-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] text-slate-300">
                On Premises:{" "}
                <strong className="text-white font-semibold">
                  {onPremisesCount}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-slate-400 hidden md:inline">
              Simulate Role:
            </span>
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              {[
                { role: "admin", label: "Admin", desc: "Full Access" },
                {
                  role: "security",
                  label: "Security",
                  desc: "Scanner & Gates",
                },
                {
                  role: "host",
                  label: "Host/Staff",
                  desc: "Invites & Approvals",
                },
                { role: "visitor", label: "Visitor", desc: "My Mobile Pass" },
              ].map((item) => (
                <button
                  key={item.role}
                  onClick={() => onSwitchRole(item.role)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                    currentUser?.role === item.role
                      ? "bg-emerald-600 text-white font-semibold shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                  title={`Switch view to ${item.label} (${item.desc})`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              onClick={onToggleNotifs}
              className="relative p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Recent SMS & Email Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {unreadNotifsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between h-16">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveTab("dashboard")}
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">
                  PassGate MERN
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-900/80 text-indigo-300 border border-indigo-700/50">
                  Digital Pass
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Visitor Management System
              </p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {[
              {
                id: "dashboard",
                label: "Dashboard",
                icon: Users,
                roles: ["admin", "security", "host"],
              },
              {
                id: "scanner",
                label: "QR Scanner Kiosk",
                icon: QrCode,
                roles: ["admin", "security"],
              },
              {
                id: "passes",
                label: "Visitor Passes",
                icon: CreditCard,
                roles: ["admin", "security", "host", "visitor"],
              },
              {
                id: "appointments",
                label: "Pre-Registration",
                icon: Calendar,
                roles: ["admin", "security", "host", "visitor"],
              },
              {
                id: "logs",
                label: "Check-In Logs",
                icon: History,
                roles: ["admin", "security", "host"],
              },
              {
                id: "notifications",
                label: "Notifications",
                icon: Bell,
                roles: ["admin", "security"],
              },
              {
                id: "admin",
                label: "Admin & Settings",
                icon: Sliders,
                roles: ["admin"],
              },
            ]
              .filter((tab) => tab.roles.includes(currentUser?.role))
              .map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? "bg-slate-800 text-emerald-400 border border-slate-700/80"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`}
                    />
                    {tab.label}
                  </button>
                );
              })}
          </nav>

          <div className="flex items-center gap-3">
            {["admin", "security"].includes(currentUser?.role) && (
              <button
                id="nav-btn-issue-pass"
                onClick={onOpenIssuePass}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
              >
                <UserCheck className="w-4 h-4" />
                <span>Issue New Pass</span>
              </button>
            )}

            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-700"
                />
                <div className="text-left text-xs leading-tight">
                  <p className="font-semibold text-white">{currentUser.name}</p>
                  <p className="text-[10px] text-emerald-400 font-mono capitalize">
                    {currentUser.role}
                  </p>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="ml-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800"
                    title="Sign out"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800 no-scrollbar">
          {[
            {
              id: "dashboard",
              label: "Dashboard",
              icon: Users,
              roles: ["admin", "security", "host"],
            },
            {
              id: "scanner",
              label: "Scanner",
              icon: QrCode,
              roles: ["admin", "security"],
            },
            {
              id: "passes",
              label: "Passes",
              icon: CreditCard,
              roles: ["admin", "security", "host", "visitor"],
            },
            {
              id: "appointments",
              label: "Pre-Reg",
              icon: Calendar,
              roles: ["admin", "security", "host", "visitor"],
            },
            {
              id: "logs",
              label: "Logs",
              icon: History,
              roles: ["admin", "security", "host"],
            },
            {
              id: "notifications",
              label: "Alerts",
              icon: Bell,
              roles: ["admin", "security"],
            },
            { id: "admin", label: "Admin", icon: Sliders, roles: ["admin"] },
          ]
            .filter((tab) => tab.roles.includes(currentUser?.role))
            .map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                    isActive
                      ? "bg-emerald-600 text-white font-semibold"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
        </div>
      </div>
    </header>
  );
};
