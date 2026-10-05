// API routes for this part of PassPoint.

export function registerRoutes(app, {
  Collections,
  requireAuth,
  requireRole,
  jwt,
  bcrypt,
  sendNotification,
  generateQrCodeDataUrl,
  PDFDocument,
  getId,
  safeString,
}) {
app.get("/api/appointments", requireAuth, async (req, res) => {
    try {
      const { organizationId, hostId, status } = req.query;

      let appointments = await Collections.appointments.find();

      if (organizationId) {
        appointments = appointments.filter(
          (appointment) =>
            String(appointment.organizationId) === String(organizationId),
        );
      }

      if (hostId) {
        appointments = appointments.filter(
          (appointment) => String(appointment.hostId) === String(hostId),
        );
      }

      if (status) {
        appointments = appointments.filter(
          (appointment) => String(appointment.status) === String(status),
        );
      }

      if (req.user.role === "visitor") {
        appointments = appointments.filter(
          (appointment) =>
            safeString(appointment.visitorEmail).toLowerCase() ===
            safeString(req.user.email).toLowerCase(),
        );
      }

      if (req.user.role === "host") {
        appointments = appointments.filter(
          (appointment) => String(appointment.hostId) === String(req.user.id),
        );
      }

      appointments = appointments.map((appointment, index) => {
        const id = getId(appointment) || `appointment-${index}`;

        return {
          ...appointment,
          id,
        };
      });

      console.log(
        "[Appointments] Sending:",
        appointments.map((appointment) => ({
          id: appointment.id,
          visitorName: appointment.visitorName,
          status: appointment.status,
        })),
      );

      res.json(appointments);
    } catch (error) {
      console.error("Get appointments error:", error);

      res.status(500).json({
        error: "Failed to load appointments",
      });
    }
  });

app.post(
    "/api/appointments",
    requireRole("admin", "host", "visitor", "security"),
    async (req, res) => {
      try {
        const {
          visitorName,
          visitorEmail,
          visitorPhone,
          visitorCompany,
          visitorPhoto,
          hostId,
          organizationId = "org_apex",
          purpose,
          scheduledDate,
          scheduledTimeSlot,
          notes,
        } = req.body;

        if (!visitorName || !visitorEmail || !hostId || !scheduledDate) {
          return res.status(400).json({
            error: "Visitor name, email, host, and scheduled date are required",
          });
        }

        const host = await Collections.users.findOne({
          id: String(hostId),
        });

        if (!host) {
          return res.status(404).json({
            error: "Designated host employee was not found",
          });
        }

        const normalizedVisitorEmail = String(visitorEmail)
          .toLowerCase()
          .trim();
        let visitorRecord = await Collections.visitors.findOne({
          email: normalizedVisitorEmail,
        });
        if (!visitorRecord) {
          visitorRecord = await Collections.visitors.insertOne({
            id: "vis_" + Date.now().toString(36),
            fullName: visitorName,
            email: normalizedVisitorEmail,
            phone: visitorPhone || "",
            company: visitorCompany || "",
            idProofType: "Government ID",
            idProofNumber: "",
            photoUrl: visitorPhoto || "",
            organizationId,
            createdAt: new Date().toISOString(),
          });
        }

        const appointment = await Collections.appointments.insertOne({
          id: "apt_" + Date.now().toString(36),

          visitorName,

          visitorEmail: normalizedVisitorEmail,

          visitorPhone: visitorPhone || "",

          visitorCompany: visitorCompany || "",

          visitorPhoto:
            visitorPhoto ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",

          visitorId: getId(visitorRecord),

          hostId: getId(host),

          hostName: host.name,

          hostDepartment: host.department || "General",

          organizationId,

          purpose: purpose || "Client Meeting",

          scheduledDate,

          scheduledTimeSlot: scheduledTimeSlot || "09:00 AM - 11:00 AM",

          status: "pending",

          notes: notes || "",

          approvalRemarks: "",

          createdAt: new Date().toISOString(),
        });

        try {
          await sendNotification({
            recipientEmail: host.email,
            recipientPhone: host.phone,
            recipientRole: "host",
            type: "email",
            subject: `New Visitor Appointment Request: ${visitorName}`,
            message: `${visitorName} (${visitorCompany || "Independent"}) has requested an appointment with you on ${scheduledDate} (${scheduledTimeSlot || "scheduled time"}) for "${purpose || "Client Meeting"}". Please review and approve in the system.`,
          });
          if (host.phone) {
            await sendNotification({
              recipientEmail: host.email,
              recipientPhone: host.phone,
              recipientRole: "host",
              type: "sms",
              subject: `Visitor Appointment: ${visitorName}`,
              message: `${visitorName} requested a visit on ${scheduledDate}. Please review the appointment in PassPoint.`,
            });
          }
        } catch (notificationError) {
          console.error("Host notification error:", notificationError);
        }

        res.status(201).json({
          ...appointment,
          id: getId(appointment),
        });
      } catch (error) {
        console.error("Create appointment error:", error);

        res.status(500).json({
          error: error.message,
        });
      }
    },
  );

app.put(
    "/api/appointments/:id/status",
    requireRole("admin", "host", "security"),
    async (req, res) => {
      try {
        const requestedId = String(req.params.id || "").trim();
        const { status, remarks } = req.body;

        console.log("[Appointment] Status request:", {
          requestedId,
          status,
          remarks,
        });

        if (!requestedId) {
          return res.status(400).json({
            error: "Appointment ID is required",
          });
        }

        if (!["approved", "rejected", "cancelled"].includes(status)) {
          return res.status(400).json({
            error: "Invalid appointment status",
          });
        }

        let appointment = await Collections.appointments.findOne({
          id: requestedId,
        });

        if (!appointment) {
          try {
            appointment = await Collections.appointments.findOne({
              _id: requestedId,
            });
          } catch {}
        }

        if (!appointment) {
          const allAppointments = await Collections.appointments.find();

          appointment = allAppointments.find((item) => {
            return (
              getId(item) === requestedId ||
              String(item.appointmentId || "").trim() === requestedId ||
              String(item.visitorId || "").trim() === requestedId
            );
          });
        }

        if (!appointment) {
          console.error("[Appointment] NOT FOUND:", requestedId);

          return res.status(404).json({
            error: "Appointment not found",
            appointmentId: requestedId,
          });
        }

        const appointmentId = getId(appointment);

        if (
          req.user.role === "host" &&
          String(appointment.hostId) !== String(req.user.id)
        ) {
          return res.status(403).json({
            error: "Hosts can only approve their own visitor appointments",
          });
        }

        console.log("[Appointment] Found:", {
          requestedId,
          appointmentId,
          visitorName: appointment.visitorName,
          status: appointment.status,
        });

        const finalRemarks =
          String(remarks || "").trim() ||
          (status === "approved"
            ? "Approved by Host"
            : status === "rejected"
              ? "Rejected by Host"
              : "Cancelled");

        let createdPass = null;

        if (status === "approved") {
          // Avoid creating a second pass for the same appointment.
          if (appointment.passId) {
            console.log(
              "[Appointment] Existing pass found:",
              appointment.passId,
            );
          } else {
            const passNumber =
              "VP-" +
              new Date().getFullYear() +
              "-" +
              Math.floor(1000 + Math.random() * 9000);

            const now = new Date();

            const validFrom = appointment.scheduledDate
              ? `${appointment.scheduledDate}T08:00:00.000Z`
              : now.toISOString();

            const validUntil = new Date(
              new Date(validFrom).getTime() + 10 * 60 * 60 * 1000,
            ).toISOString();

            const qrPayload = JSON.stringify({
              passNumber,
              visitorName: appointment.visitorName,
              visitorEmail: appointment.visitorEmail,
              hostName: appointment.hostName,
              validUntil,
              orgId: appointment.organizationId,
            });

            const qrCodeImage = await generateQrCodeDataUrl(qrPayload);

            let visitorRecord = await Collections.visitors.findOne({
              email: String(appointment.visitorEmail).toLowerCase().trim(),
            });
            if (!visitorRecord) {
              visitorRecord = await Collections.visitors.insertOne({
                id: "vis_" + Date.now().toString(36),
                fullName: appointment.visitorName,
                email: String(appointment.visitorEmail).toLowerCase().trim(),
                phone: appointment.visitorPhone || "",
                company: appointment.visitorCompany || "",
                idProofType: "Government ID",
                idProofNumber: "",
                photoUrl: appointment.visitorPhoto || "",
                organizationId: appointment.organizationId,
                createdAt: new Date().toISOString(),
              });
            }

            createdPass = await Collections.passes.insertOne({
              id: "pass_" + Date.now().toString(36),
              passNumber,
              qrCodeData: qrPayload,
              qrCodeImage,

              visitorId: appointment.visitorId || getId(visitorRecord),

              visitorName: appointment.visitorName,
              visitorEmail: appointment.visitorEmail,
              visitorPhone: appointment.visitorPhone || "",
              visitorCompany: appointment.visitorCompany || "",
              visitorPhoto: appointment.visitorPhoto || "",

              idProofType: "Government ID",
              idProofNumber: "ID-" + Math.floor(10000 + Math.random() * 90000),

              hostId: appointment.hostId,
              hostName: appointment.hostName,
              hostDepartment: appointment.hostDepartment || "General",

              appointmentId,

              organizationId: appointment.organizationId,

              passType:
                appointment.purpose === "Interview" ? "interview" : "day_pass",

              validFrom,
              validUntil,
              status: "issued",

              accessZones: [
                "Main Lobby",
                "Host Department Floor",
                "Conference Rooms",
              ],

              otpCode: Math.floor(100000 + Math.random() * 900000).toString(),

              createdAt: new Date().toISOString(),
            });

            console.log("[Appointment] Pass created:", getId(createdPass));

            try {
              const visitorEmail = String(
                appointment.visitorEmail || "",
              ).trim();

              const visitorPhone = String(
                appointment.visitorPhone || "",
              ).trim();

              const visitorName = appointment.visitorName || "Visitor";

              const hostName = appointment.hostName || "Host";

              const hostDepartment = appointment.hostDepartment || "General";

              const purpose = appointment.purpose || "Visitor Appointment";

              const scheduledDate = appointment.scheduledDate || "N/A";

              const scheduledTime = appointment.scheduledTimeSlot || "N/A";

              const approvedPassNumber =
                createdPass?.passNumber || passNumber || "N/A";

              const approvedValidFrom =
                createdPass?.validFrom || validFrom || "";

              const approvedValidUntil =
                createdPass?.validUntil || validUntil || "";

              function formatDate(value) {
                if (!value) return "N/A";

                const date = new Date(value);

                if (Number.isNaN(date.getTime())) {
                  return String(value);
                }

                return date.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                });
              }

              function formatDateTime(value) {
                if (!value) return "N/A";

                const date = new Date(value);

                if (Number.isNaN(date.getTime())) {
                  return String(value);
                }

                return date.toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
              }

              const emailAttachments = [];

              if (qrCodeImage) {
                try {
                  const qrBase64 = String(qrCodeImage).replace(
                    /^data:image\/\w+;base64,/,
                    "",
                  );

                  emailAttachments.push({
                    filename: "visitor-pass-qr.png",

                    content: qrBase64,

                    encoding: "base64",

                    cid: "visitor-pass-qr",
                  });

                  console.log(
                    "[Notification] QR image prepared for email attachment",
                  );
                } catch (qrAttachmentError) {
                  console.error(
                    "[Notification] QR attachment preparation failed:",
                    qrAttachmentError.message,
                  );
                }
              } else {
                console.warn(
                  "[Notification] QR image is not available for email",
                );
              }

              const approvalEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">

  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
    }

    .wrapper {
      width: 100%;
      padding: 30px 0;
    }

    .container {
      width: 600px;
      max-width: 94%;
      margin: auto;
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 4px 18px rgba(15, 23, 42, 0.08);
    }

    .header {
      background: #0f172a;
      padding: 28px 30px;
      color: white;
    }

    .brand {
      font-size: 14px;
      font-weight: bold;
      letter-spacing: 1px;
      text-transform: uppercase;
      opacity: 0.8;
    }

    .title {
      margin-top: 10px;
      font-size: 27px;
      font-weight: bold;
    }

    .subtitle {
      margin-top: 8px;
      font-size: 14px;
      color: #cbd5e1;
    }

    .content {
      padding: 30px;
    }

    .success {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 10px;
      padding: 15px;
      color: #065f46;
      font-weight: bold;
      margin-bottom: 25px;
    }

    .section-title {
      font-size: 17px;
      font-weight: bold;
      margin-bottom: 15px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    td {
      padding: 11px 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }

    td:first-child {
      color: #64748b;
      width: 42%;
    }

    td:last-child {
      color: #0f172a;
      font-weight: 600;
    }

    .pass-box {
      margin-top: 25px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }

    .pass-number {
      font-size: 21px;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 15px;
    }

    .qr {
      width: 190px;
      height: 190px;
      margin: 10px auto;
      display: block;
    }

    .qr-text {
      font-size: 12px;
      color: #64748b;
      margin-top: 10px;
    }

    .instructions {
      margin-top: 25px;
      padding: 18px;
      background: #f8fafc;
      border-radius: 10px;
      font-size: 13px;
      line-height: 1.7;
      color: #475569;
    }

    .footer {
      padding: 20px 30px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>

<body>

<div class="wrapper">

  <div class="container">

    <div class="header">

      <div class="brand">
        PassPoint Visitor Management
      </div>

      <div class="title">
        Your Visitor Pass is Ready
      </div>

      <div class="subtitle">
        Your appointment has been approved successfully.
      </div>

    </div>

    <div class="content">

      <div class="success">
        ✓ Appointment Approved
      </div>

      <div class="section-title">
        Visitor Details
      </div>

      <table>

        <tr>
          <td>Visitor Name</td>
          <td>${appointment.visitorName || "Visitor"}</td>
        </tr>

        <tr>
          <td>Company</td>
          <td>${appointment.visitorCompany || "N/A"}</td>
        </tr>

        <tr>
          <td>Host</td>
          <td>${appointment.hostName || "N/A"}</td>
        </tr>

        <tr>
          <td>Department</td>
          <td>${appointment.hostDepartment || "N/A"}</td>
        </tr>

        <tr>
          <td>Visit Date</td>
          <td>${scheduledDate}</td>
        </tr>

        <tr>
          <td>Visit Time</td>
          <td>${scheduledTime}</td>
        </tr>

      </table>


      <div class="pass-box">

        <div class="pass-number">
          ${approvedPassNumber}
        </div>

        <img
          src="cid:visitor-pass-qr"
          class="qr"
          alt="Visitor Pass QR Code"
        />

        <div class="qr-text">
          Present this QR code at the security/front desk
          for check-in.
        </div>

      </div>


      <div class="instructions">

        <strong>Important Instructions</strong>

        <br><br>

        • Carry a valid identification document.<br>
        • Keep this visitor pass available during your visit.<br>
        • Present the QR code at the security/front desk.<br>
        • The pass is valid only for the approved visit period.<br>
        • Follow all facility security guidelines.

      </div>

    </div>


    <div class="footer">

      <strong>PassPoint Visitor Management System</strong>

      <br>

      Visitor notification — please do not reply
      to this email.

    </div>

  </div>

</div>

</body>
</html>
`;

              if (visitorEmail) {
                await sendNotification({
                  recipientEmail: visitorEmail,
                  recipientPhone: visitorPhone,
                  recipientRole: "visitor",

                  type: "email",

                  subject: `Your Visitor Pass is Ready: ${approvedPassNumber}`,

                  message:
                    `Your visitor appointment has been approved. ` +
                    `Your visitor pass ${approvedPassNumber} has been issued.`,

                  html: approvalEmailHtml,

                  attachments: emailAttachments,
                });

                console.log(
                  `[Appointment] Approval email sent to ${visitorEmail}`,
                );

                console.log(
                  `[Appointment] QR attachment included: ${
                    emailAttachments.length > 0 ? "YES" : "NO"
                  }`,
                );
              } else {
                console.warn(
                  "[Appointment] Visitor email is missing. Approval email not sent.",
                );
              }

              if (visitorPhone) {
                await sendNotification({
                  recipientEmail: visitorEmail,

                  recipientPhone: visitorPhone,

                  recipientRole: "visitor",

                  type: "sms",

                  subject: `Digital Pass Approved: ${approvedPassNumber}`,

                  message:
                    `Your visit is approved. Pass ${approvedPassNumber} ` +
                    `is ready. Show the QR code at security reception.`,
                });
              }
            } catch (notificationError) {
              console.error(
                "[Appointment] Visitor notification error:",
                notificationError,
              );
            }
          }
        }
        const updateData = {
          status,
          approvalRemarks: finalRemarks,
          passId: createdPass ? getId(createdPass) : appointment.passId || "",
        };

        await Collections.appointments.updateOne(
          {
            id: appointmentId,
          },
          updateData,
        );

        let updated = await Collections.appointments.findOne({
          id: appointmentId,
        });

        if (!updated) {
          updated = {
            ...appointment,
            ...updateData,
          };
        }

        updated = {
          ...updated,
          id: getId(updated),
        };

        console.log("[Appointment] Successfully updated:", {
          id: updated.id,
          status: updated.status,
          passId: updated.passId,
        });

        return res.json({
          success: true,
          message:
            status === "approved"
              ? "Appointment approved and visitor pass issued successfully."
              : status === "rejected"
                ? "Appointment rejected successfully."
                : "Appointment cancelled successfully.",
          appointment: updated,
          pass: createdPass,
        });
      } catch (error) {
        console.error("[Appointment] Status update error:", error);

        return res.status(500).json({
          error: error.message || "Failed to update appointment",
        });
      }
    },
  );
}
