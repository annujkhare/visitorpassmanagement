import React, { useState } from "react";
import {
  Bell,
  Mail,
  Smartphone,
  CheckCheck,
  Send,
  User,
  Clock,
  MessageSquare,
} from "lucide-react";

export const NotificationsView = ({
  notifications = [],
  onSendTestNotification,
}) => {
  const [filterType, setFilterType] = useState("all");
  const [isComposing, setIsComposing] = useState(false);
  const [formData, setFormData] = useState({
    recipientEmail: "elena.rostova@apexcorp.com",
    recipientPhone: "+1 (555) 890-1234",
    type: "email",
    subject: "Security Alert: Guest Arrival at Main Gate",
    message:
      "Your pre-registered visitor has checked in at the main gate.",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSendTestNotification) {
      await onSendTestNotification(formData);
    }
    setIsComposing(false);
  };

  const filteredNotifs = notifications.filter((n) => {
    if (filterType !== "all" && n.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-500" />
            Email & SMS Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            History of SMS alerts and host notifications
            invites, and visitor QR pass emails.
          </p>
        </div>

        <button
          onClick={() => setIsComposing(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition active:scale-95"
        >
          <Send className="w-4 h-4 text-emerald-400" />
          Test Dispatch Notification
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setFilterType("all")}
          className={`px-3 py-1.5 rounded-lg transition ${
            filterType === "all"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All Channels ({notifications.length})
        </button>
        <button
          onClick={() => setFilterType("email")}
          className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
            filterType === "email"
              ? "bg-indigo-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          Email Dispatches (
          {notifications.filter((n) => n.type === "email").length})
        </button>
        <button
          onClick={() => setFilterType("sms")}
          className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
            filterType === "sms"
              ? "bg-emerald-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          SMS Alerts ({notifications.filter((n) => n.type === "sms").length})
        </button>
      </div>

      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">
              No Notifications Sent
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Notifications automatically dispatch upon pass issuance and
              check-in.
            </p>
          </div>
        ) : (
          filteredNotifs.map((notif) => {
            const isEmail = notif.type === "email";
            return (
              <div
                key={notif.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:border-slate-300 transition flex items-start gap-4"
              >
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    isEmail
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {isEmail ? (
                    <Mail className="w-5 h-5" />
                  ) : (
                    <Smartphone className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {notif.subject}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>{new Date(notif.timestamp).toLocaleString()}</span>
                      <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold">
                        <CheckCheck className="w-3 h-3" /> Delivered
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-1">{notif.message}</p>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                    <span>
                      To:{" "}
                      <strong className="text-slate-700">
                        {notif.recipientEmail}
                      </strong>
                    </span>
                    {notif.recipientPhone && (
                      <span>
                        Phone:{" "}
                        <strong className="text-slate-700">
                          {notif.recipientPhone}
                        </strong>
                      </span>
                    )}
                    <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-slate-100 font-bold text-slate-600">
                      {notif.recipientRole}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isComposing && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Simulate Outbound Dispatch
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "email" })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                    formData.type === "email"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "sms" })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                    formData.type === "sms"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  SMS
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={formData.recipientEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, recipientEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message Content
                </label>
                <textarea
                  rows={3}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs"
                >
                  Send Simulated Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
