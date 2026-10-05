import React, { useState } from "react";
import {
  Calendar,
  Clock,
  User,
  Check,
  X,
  Plus,
  FileText,
  Search,
} from "lucide-react";
import { generateVisitorBadgePdf } from "../utils/pdfGenerator";

const getId = (item) => {
  if (!item) return "";

  return String(item.id ?? item._id ?? "").trim();
};

const getAppointmentId = (appointment) => {
  if (!appointment) return "";

  // Normal/new records
  const directId = getId(appointment);
  if (directId) return directId;

  if (appointment.visitorId) {
    return String(appointment.visitorId).trim();
  }

  if (appointment.appointmentId) {
    return String(appointment.appointmentId).trim();
  }

  return "";
};

const getPassId = (pass) => {
  return getId(pass);
};

export const AppointmentsView = ({
  appointments = [],
  currentUser,
  currentOrg,
  hosts = [],
  passes = [],
  onAppointmentStatusChange,
  onAppointmentCreated,
}) => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [processingAppointmentId, setProcessingAppointmentId] = useState(null);

  const [rejectingId, setRejectingId] = useState(null);
  const [rejectRemark, setRejectRemark] = useState("");

  const getDefaultHostId = () => {
    if (currentUser?.role === "host") {
      return getId(currentUser);
    }

    return getId(hosts[0]);
  };

  const [formData, setFormData] = useState({
    visitorName: "",
    visitorEmail: "",
    visitorPhone: "",
    visitorCompany: "",
    hostId: getDefaultHostId(),
    purpose: "Client Meeting",
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTimeSlot: "10:00 AM - 11:30 AM",
    notes: "",
  });

  const handleCreateAppointment = async (e) => {
    e.preventDefault();

    if (
      !formData.visitorName.trim() ||
      !formData.visitorEmail.trim() ||
      !formData.hostId
    ) {
      alert("Please provide visitor name, email, and host employee.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          organizationId: currentOrg?.id || currentOrg?._id || "org_apex",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to submit appointment");
      }

      if (onAppointmentCreated) {
        onAppointmentCreated(data);
      }

      setIsInviteModalOpen(false);

      setFormData({
        visitorName: "",
        visitorEmail: "",
        visitorPhone: "",
        visitorCompany: "",
        hostId: getDefaultHostId(),
        purpose: "Client Meeting",
        scheduledDate: new Date().toISOString().split("T")[0],
        scheduledTimeSlot: "10:00 AM - 11:30 AM",
        notes: "",
      });
    } catch (err) {
      console.error("Create appointment error:", err);
      alert(err.message || "Unable to create appointment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const status = String(apt?.status ?? "").toLowerCase();

    if (filterStatus !== "all" && status !== filterStatus.toLowerCase()) {
      return false;
    }

    if (!searchQuery.trim()) {
      return true;
    }

    const q = searchQuery.toLowerCase();

    return (
      String(apt?.visitorName ?? "")
        .toLowerCase()
        .includes(q) ||
      String(apt?.visitorEmail ?? "")
        .toLowerCase()
        .includes(q) ||
      String(apt?.visitorCompany ?? "")
        .toLowerCase()
        .includes(q) ||
      String(apt?.hostName ?? "")
        .toLowerCase()
        .includes(q) ||
      String(apt?.purpose ?? "")
        .toLowerCase()
        .includes(q)
    );
  });

  const handleApprove = async (appointment) => {
    const appointmentId = getAppointmentId(appointment);

    console.log("Approve appointment:", {
      appointmentId,
      appointment,
    });

    if (!appointmentId) {
      console.error("Appointment ID missing:", appointment);

      alert(
        "Appointment ID is missing. Please refresh the page and try again.",
      );

      return;
    }

    if (!onAppointmentStatusChange) {
      alert("Appointment update handler is not available.");
      return;
    }

    setProcessingAppointmentId(appointmentId);

    try {
      await onAppointmentStatusChange(
        appointmentId,
        "approved",
        "Approved by Host",
      );
    } catch (error) {
      console.error("Approve appointment error:", error);

      alert(error?.message || "Unable to approve appointment.");
    } finally {
      setProcessingAppointmentId(null);
    }
  };

  const handleOpenReject = (appointment) => {
    const appointmentId = getAppointmentId(appointment);

    console.log("Reject appointment:", {
      appointmentId,
      appointment,
    });

    if (!appointmentId) {
      alert(
        "Appointment ID is missing. Please refresh the page and try again.",
      );

      return;
    }

    setRejectingId(appointmentId);
    setRejectRemark("");
  };

  const handleReject = async () => {
    if (!rejectingId) {
      return;
    }

    setProcessingAppointmentId(rejectingId);

    try {
      await onAppointmentStatusChange(
        rejectingId,
        "rejected",
        rejectRemark.trim() || "Rejected by Host",
      );

      setRejectingId(null);
      setRejectRemark("");
    } catch (error) {
      console.error("Reject appointment error:", error);

      alert(error?.message || "Unable to reject appointment.");
    } finally {
      setProcessingAppointmentId(null);
    }
  };

  const findAssociatedPass = (appointment) => {
    if (!appointment) {
      return null;
    }

    const appointmentPassId = String(appointment.passId ?? "").trim();

    const appointmentVisitorId = String(appointment.visitorId ?? "").trim();

    return (
      passes.find((pass) => {
        const passId = getPassId(pass);

        const passVisitorId = String(pass.visitorId ?? "").trim();

        if (appointmentPassId && passId === appointmentPassId) {
          return true;
        }

        if (appointmentVisitorId && passVisitorId === appointmentVisitorId) {
          return true;
        }

        return false;
      }) || null
    );
  };

  const handlePrintBadge = (appointment) => {
    const associatedPass = findAssociatedPass(appointment);

    if (!associatedPass) {
      alert("No issued pass was found for this appointment.");

      console.error("Pass not found for appointment:", appointment);

      return;
    }

    try {
      generateVisitorBadgePdf(
        associatedPass,
        currentOrg?.name ||
          currentOrg?.organizationName ||
          "Apex Global Tech HQ",
      );
    } catch (error) {
      console.error("PDF generation error:", error);

      alert("Unable to generate the visitor badge.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Visitor Pre-Registration & Host Invitations
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pre-register expected guests, send digital invites, and review host
            approvals prior to visitor arrival.
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Pre-Register Visitor Invite
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by visitor, host, company..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          {[
            {
              id: "all",
              label: "All Invites",
            },
            {
              id: "pending",
              label: "Pending Approval",
            },
            {
              id: "approved",
              label: "Approved & Issued",
            },
            {
              id: "rejected",
              label: "Rejected",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                filterStatus === tab.id
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAppointments.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />

            <p className="text-sm font-semibold text-slate-600">
              No Pre-Registered Appointments
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Pre-register an upcoming visitor or invite a client.
            </p>
          </div>
        ) : (
          filteredAppointments.map((apt, index) => {
            const appointmentId = getAppointmentId(apt);

            const isPending =
              String(apt?.status ?? "").toLowerCase() === "pending";

            const isApproved =
              String(apt?.status ?? "").toLowerCase() === "approved";

            const isRejected =
              String(apt?.status ?? "").toLowerCase() === "rejected";

            const associatedPass = findAssociatedPass(apt);

            const isProcessing = processingAppointmentId === appointmentId;

            return (
              <div
                key={appointmentId || `appointment-${index}`}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          apt?.visitorPhoto ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                        }
                        alt={apt?.visitorName || "Visitor"}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                      />

                      <div>
                        <h3 className="font-bold text-sm text-slate-900">
                          {apt?.visitorName || "Unknown Visitor"}
                        </h3>

                        <p className="text-xs text-slate-500">
                          {apt?.visitorCompany || "Independent Guest"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-800"
                          : isPending
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {apt?.status || "Unknown"}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                      <span>
                        {apt?.scheduledDate || "Date not set"} (
                        {apt?.scheduledTimeSlot || "Time not set"})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                      <span>
                        Host:{" "}
                        <strong className="text-slate-800">
                          {apt?.hostName || "Not assigned"}
                        </strong>{" "}
                        {apt?.hostDepartment ? `(${apt.hostDepartment})` : ""}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 text-[11px] text-slate-600">
                      <strong className="text-slate-700">Purpose:</strong>{" "}
                      {apt?.purpose || "Not specified"}
                      {apt?.notes && (
                        <p className="mt-0.5 text-slate-500 italic">
                          "{apt.notes}"
                        </p>
                      )}
                    </div>

                    {apt?.approvalRemarks && (
                      <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                        <strong>Host Remark:</strong> {apt.approvalRemarks}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {isPending && (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        disabled={isProcessing}
                        onClick={() => handleApprove(apt)}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs transition flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />

                        {isProcessing ? "Issuing..." : "Approve & Issue Pass"}
                      </button>

                      <button
                        disabled={isProcessing}
                        onClick={() => handleOpenReject(apt)}
                        className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-60 font-semibold text-xs transition"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {isApproved && associatedPass && (
                    <button
                      onClick={() => handlePrintBadge(apt)}
                      className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      Print Badge ({associatedPass.passNumber || "Pass"})
                    </button>
                  )}

                  {isApproved && !associatedPass && (
                    <div className="w-full text-center text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
                      Pass is being prepared or could not be found.
                    </div>
                  )}

                  {isRejected && (
                    <span className="text-xs text-rose-500 italic w-full text-center">
                      Pre-registration invite declined
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Pre-Register Guest & Send Digital Invite
              </h2>

              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              {/* Visitor name and email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Visitor Full Name *
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan Miller"
                    value={formData.visitorName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        visitorName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Visitor Email *
                  </label>

                  <input
                    type="email"
                    required
                    placeholder="jordan@company.com"
                    value={formData.visitorEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        visitorEmail: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Visitor Phone
                  </label>

                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={formData.visitorPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        visitorPhone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company / Organization
                  </label>

                  <input
                    type="text"
                    placeholder="Partner Corp"
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designated Host / Employee *
                </label>

                <select
                  value={formData.hostId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hostId: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
                >
                  <option value="">Select a host</option>

                  {hosts.map((h, index) => {
                    const hostId = getId(h) || `host-${index}`;

                    return (
                      <option key={hostId} value={hostId}>
                        {h.name || "Unknown Host"}{" "}
                        {h.department ? `(${h.department})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Visit Purpose
                  </label>

                  <select
                    value={formData.purpose}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purpose: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
                  >
                    <option value="Client Meeting">Client Meeting</option>

                    <option value="Interview">Interview</option>

                    <option value="Vendor / Delivery">Vendor / Delivery</option>

                    <option value="Audit / Inspection">
                      Audit / Inspection
                    </option>

                    <option value="Personal Visit">Personal Visit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scheduled Date
                  </label>

                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scheduled Time
                </label>

                <select
                  value={formData.scheduledTimeSlot}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      scheduledTimeSlot: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
                >
                  <option>09:00 AM - 10:30 AM</option>

                  <option>10:00 AM - 11:30 AM</option>

                  <option>11:30 AM - 01:00 PM</option>

                  <option>02:00 PM - 03:30 PM</option>

                  <option>04:00 PM - 05:30 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meeting Notes / Agenda
                </label>

                <textarea
                  rows={2}
                  placeholder="Security clearance instructions, conference room booking..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition"
                >
                  {isSubmitting
                    ? "Registering..."
                    : "Dispatch Pre-Registration Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-xl">
            <h3 className="font-bold text-sm text-slate-900">
              Decline Visitor Appointment
            </h3>

            <textarea
              rows={3}
              placeholder="State reason for declining invite..."
              value={rejectRemark}
              onChange={(e) => setRejectRemark(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectRemark("");
                }}
                className="px-3 py-1.5 text-xs text-slate-600"
              >
                Cancel
              </button>

              <button
                disabled={processingAppointmentId === rejectingId}
                onClick={handleReject}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-xs font-semibold"
              >
                {processingAppointmentId === rejectingId
                  ? "Rejecting..."
                  : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
