import React, { useState, useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { DashboardView } from "./components/DashboardView";
import { QrScannerView } from "./components/QrScannerView";
import { AppointmentsView } from "./components/AppointmentsView";
import { PassesView } from "./components/PassesView";
import { CheckLogsView } from "./components/CheckLogsView";
import { NotificationsView } from "./components/NotificationsView";
import { AdminView } from "./components/AdminView";
import { PassIssuanceModal } from "./components/PassIssuanceModal";
import { LoginView } from "./components/LoginView";
import { RegisterView } from "./components/RegisterView";
import {
  Bell,
  X,
  CheckCircle2,
  ShieldCheck,
  Mail,
  Smartphone,
} from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [passes, setPasses] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [checkLogs, setCheckLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [analyticsStats, setAnalyticsStats] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const pathToTab = {
    "/": "dashboard",
    "/dashboard": "dashboard",
    "/scanner": "scanner",
    "/passes": "passes",
    "/appointments": "appointments",
    "/logs": "logs",
    "/admin": "admin",
    "/notifications": "notifications",
  };
  const activeTab = pathToTab[location.pathname] || "dashboard";
  const setActiveTab = (tab) =>
    navigate(
      tab === "dashboard" ? "/" : `/${tab === "settings" ? "admin" : tab}`,
    );
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (title, desc, type = "success") => {
    setToastMessage({ title, desc, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.title === title ? null : prev));
    }, 4500);
  };

  useEffect(() => {
    checkSession();
  }, []);

  const loadInitialData = async () => {
    try {
      const orgRes = await fetch("/api/organizations");
      if (orgRes.ok) {
        const orgData = await orgRes.json();
        setOrganizations(orgData);
        if (orgData.length > 0) setCurrentOrg(orgData[0]);
      }

      const [usersRes, passesRes, aptsRes, logsRes, notifsRes, statsRes] =
        await Promise.all([
          fetch("/api/users"),
          fetch("/api/passes"),
          fetch("/api/appointments"),
          fetch("/api/check-logs"),
          fetch("/api/notifications"),
          fetch("/api/analytics"),
        ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (passesRes.ok) setPasses(await passesRes.json());
      if (aptsRes.ok) setAppointments(await aptsRes.json());
      if (logsRes.ok) setCheckLogs(await logsRes.json());
      if (notifsRes.ok) setNotifications(await notifsRes.json());
      if (statsRes.ok) setAnalyticsStats(await statsRes.json());
    } catch (err) {
      console.error("Failed to load visitor system data:", err);
    }
  };

  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return;
      const { user } = await res.json();
      setCurrentUser(user);
      if (user.role === "visitor") navigate("/passes");
      await loadInitialData();
    } finally {
      setAuthChecked(true);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      setCurrentUser(data.user);
      if (data.user.role === "visitor") navigate("/passes");
      await loadInitialData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const handleDemoLogin = async (role) => {
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      setCurrentUser(data.user);
      await loadInitialData();
      if (role === "visitor") setActiveTab("passes");
      if (role === "security") setActiveTab("scanner");
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const handleSwitchRole = async (role) => {
    const result = await handleDemoLogin(role);
    if (result.success) {
      showToast(
        "Active Persona Switched",
        `Logged in as ${role.toUpperCase()}`,
      );
    }
  };

  const handleAppointmentStatusChange = async (
    appointmentId,
    status,
    remarks,
  ) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, remarks }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update appointment");
      }

      const { appointment: updatedApt, pass: newPass } = await res.json();

      setAppointments((prev) =>
        prev.map((a) => (a.id === updatedApt.id ? updatedApt : a)),
      );

      if (newPass) {
        setPasses((prev) => [newPass, ...prev]);
        showToast(
          "Pass Issued Automatically",
          `Pre-registration approved! Digital Pass #${newPass.passNumber} generated for ${newPass.visitorName}.`,
        );
      } else {
        showToast("Appointment Updated", `Visit request marked as ${status}.`);
      }

      refreshAnalytics();
      refreshNotifications();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAppointmentCreated = (newApt) => {
    setAppointments((prev) => [newApt, ...prev]);
    showToast(
      "Guest Invited",
      `Appointment booked for ${newApt.visitorName}. Host notification sent.`,
    );
    refreshAnalytics();
    refreshNotifications();
  };

  const handlePassIssued = (newPass) => {
    setPasses((prev) => [newPass, ...prev]);
    showToast(
      "Digital Pass Issued",
      `Pass #${newPass.passNumber} for ${newPass.visitorName} is active.`,
    );
    refreshAnalytics();
    refreshNotifications();
  };

  const handleRevokePass = async (passId) => {
    try {
      const res = await fetch(`/api/passes/${passId}/revoke`, {
        method: "PUT",
      });
      if (res.ok) {
        const updated = await res.json();
        setPasses((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p)),
        );
        showToast(
          "Pass Revoked",
          `Pass #${updated.passNumber} has been revoked by security.`,
        );
        refreshAnalytics();
      }
    } catch (err) {
      console.error("Revoke pass error:", err);
    }
  };

  const handleScanSuccess = ({ action, pass, log }) => {
    setPasses((prev) => prev.map((p) => (p.id === pass.id ? pass : p)));
    setCheckLogs((prev) => [log, ...prev]);
    showToast(
      action === "check_in" ? "Check-In Confirmed" : "Check-Out Completed",
      `${pass.visitorName} successfully verified at ${log.gate}. Host alert dispatched!`,
    );
    refreshAnalytics();
    refreshNotifications();
  };

  const refreshAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const stats = await res.json();
        setAnalyticsStats(stats);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const refreshNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const list = await res.json();
        setNotifications(list);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportPasses = () => {
    window.open("/api/export/passes", "_blank");
  };

  const handleExportLogs = () => {
    window.open("/api/export/logs", "_blank");
  };

  const handleSendTestNotification = async (payload) => {
    const res = await fetch("/api/notifications/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Notification failed");
    setNotifications((prev) => [data, ...prev]);
    showToast(
      "Notification Dispatched",
      `${payload.type.toUpperCase()} notification queued.`,
    );
  };

  const hostList = users.filter((u) => u.role === "host" || u.role === "admin");
  const roleGuard = (roles, element) =>
    roles.includes(currentUser?.role) ? (
      element
    ) : (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">
            Access Restricted
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Your role does not have access to this section.
          </p>
          <button
            onClick={() =>
              setActiveTab(
                currentUser?.role === "visitor" ? "passes" : "dashboard",
              )
            }
            className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  const onPremisesCount = passes.filter(
    (p) => p.status === "checked_in",
  ).length;

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-sm">
        Checking your session...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Routes>
        <Route
          path="/register"
          element={
            <RegisterView
              onRegistered={async (user) => {
                setCurrentUser(user);
                await loadInitialData();
              }}
            />
          }
        />
        <Route
          path="*"
          element={
            <LoginView onLogin={handleLogin} onDemoLogin={handleDemoLogin} />
          }
        />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-start gap-3 animate-in slide-in-from-top-5 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-white">
              {toastMessage.title}
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              {toastMessage.desc}
            </p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <Navbar
        currentUser={currentUser}
        currentOrg={currentOrg}
        organizations={organizations}
        onSelectOrg={(org) => {
          setCurrentOrg(org);
          showToast("Facility Switched", `Active organization: ${org.name}`);
        }}
        onSwitchRole={handleSwitchRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenIssuePass={() => setIsPassModalOpen(true)}
        unreadNotifsCount={notifications.length}
        onToggleNotifs={() => setIsNotifDrawerOpen(!isNotifDrawerOpen)}
        onPremisesCount={onPremisesCount}
        onLogout={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          setCurrentUser(null);
          navigate("/");
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route
            path="/"
            element={roleGuard(
              ["admin", "security", "host"],
              <DashboardView
                stats={analyticsStats}
                onNavigateTab={setActiveTab}
                onOpenIssuePass={() => setIsPassModalOpen(true)}
                onExportPasses={handleExportPasses}
                onExportLogs={handleExportLogs}
              />,
            )}
          />
          <Route
            path="/dashboard"
            element={roleGuard(
              ["admin", "security", "host"],
              <DashboardView
                stats={analyticsStats}
                onNavigateTab={setActiveTab}
                onOpenIssuePass={() => setIsPassModalOpen(true)}
                onExportPasses={handleExportPasses}
                onExportLogs={handleExportLogs}
              />,
            )}
          />
          <Route
            path="/scanner"
            element={roleGuard(
              ["admin", "security"],
              <QrScannerView
                activePasses={passes}
                onScanSuccess={handleScanSuccess}
              />,
            )}
          />
          <Route
            path="/appointments"
            element={
              <AppointmentsView
                appointments={appointments}
                currentUser={currentUser}
                currentOrg={currentOrg}
                hosts={hostList}
                passes={passes}
                onAppointmentStatusChange={handleAppointmentStatusChange}
                onAppointmentCreated={handleAppointmentCreated}
              />
            }
          />
          <Route
            path="/passes"
            element={
              <PassesView
                passes={passes}
                currentOrg={currentOrg}
                currentUser={currentUser}
                onRevokePass={handleRevokePass}
                onOpenIssuePass={() => setIsPassModalOpen(true)}
              />
            }
          />
          <Route
            path="/logs"
            element={roleGuard(
              ["admin", "security", "host"],
              <CheckLogsView
                logs={checkLogs}
                onExportLogs={handleExportLogs}
              />,
            )}
          />
          <Route
            path="/notifications"
            element={roleGuard(
              ["admin", "security"],
              <NotificationsView
                notifications={notifications}
                onSendTestNotification={handleSendTestNotification}
              />,
            )}
          />
          <Route
            path="/admin"
            element={roleGuard(
              ["admin"],
              <AdminView
                users={users}
                organizations={organizations}
                currentOrg={currentOrg}
                onUpdateOrg={async (updatedOrg) => {
                  const res = await fetch(
                    `/api/organizations/${updatedOrg.id}`,
                    {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(updatedOrg),
                    },
                  );
                  const data = await res.json();
                  if (!res.ok)
                    throw new Error(
                      data.error || "Unable to save organization settings",
                    );
                  setCurrentOrg(data);
                  setOrganizations((prev) =>
                    prev.map((o) => (o.id === data.id ? data : o)),
                  );
                  showToast(
                    "Settings Saved",
                    "Organization security policies updated.",
                  );
                }}
                onCreateOrg={async (data) => {
                  const res = await fetch("/api/organizations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                  });
                  const created = await res.json();
                  if (!res.ok)
                    throw new Error(
                      created.error || "Unable to create organization",
                    );
                  setOrganizations((prev) => [...prev, created]);
                  showToast(
                    "Organization Created",
                    `Tenant ${created.name} registered.`,
                  );
                }}
                onCreateStaff={async (data) => {
                  const res = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...data,
                      password: data.password || "pass123",
                      organizationId: currentOrg?.id || "org_apex",
                    }),
                  });
                  const created = await res.json();
                  if (!res.ok)
                    throw new Error(
                      created.error || "Unable to create staff account",
                    );
                  setUsers((prev) => [...prev, created.user]);
                  showToast(
                    "Staff Member Added",
                    `${created.user.name} registered as ${created.user.role}.`,
                  );
                }}
              />,
            )}
          />
          <Route
            path="*"
            element={
              <DashboardView
                stats={analyticsStats}
                onNavigateTab={setActiveTab}
                onOpenIssuePass={() => setIsPassModalOpen(true)}
                onExportPasses={handleExportPasses}
                onExportLogs={handleExportLogs}
              />
            }
          />
        </Routes>
      </main>

      {isNotifDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-slate-900">
                    System Notification Feed
                  </h3>
                </div>
                <button
                  onClick={() => setIsNotifDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-2 mb-4">
                SMS arrival alerts and email passes sent to visitors and
                hosts.
              </p>

              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">
                        {n.subject}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                        {n.type}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                      <span>To: {n.recipientEmail}</span>
                      <span>{new Date(n.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-400">
                Alerts are shown as they are received
              </span>
              <button
                onClick={() => setIsNotifDrawerOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <PassIssuanceModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        hosts={hostList}
        currentOrg={currentOrg}
        onPassIssued={handlePassIssued}
      />
    </div>
  );
}
