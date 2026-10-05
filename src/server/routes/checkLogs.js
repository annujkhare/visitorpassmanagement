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
app.post(
    "/api/check-logs/scan",
    requireRole("admin", "security"),
    async (req, res) => {
      try {
        const {
          qrData,
          passNumber,
          gate = "Main Entrance Gate A",
          verifiedBy = "Security Officer",
          action = "auto",
          temperature = "98.6 F",
          notes = "",
        } = req.body;

        if (!qrData && !passNumber) {
          return res.status(400).json({
            error: "QR Code payload or Pass Number is required",
          });
        }

        let targetPassNumber = passNumber;

        if (qrData) {
          try {
            const parsed = JSON.parse(qrData);

            targetPassNumber = parsed.passNumber || parsed.id || qrData;
          } catch {
            targetPassNumber = String(qrData).trim();
          }
        }

        let pass = await Collections.passes.findOne({
          passNumber: targetPassNumber,
        });

        if (!pass) {
          const passes = await Collections.passes.find();

          const target = String(targetPassNumber || "").toLowerCase();

          pass = passes.find(
            (item) =>
              safeString(item.passNumber).toLowerCase() === target ||
              safeString(item.id).toLowerCase() === target ||
              safeString(item.qrCodeData).toLowerCase().includes(target),
          );
        }

        if (!pass) {
          return res.status(404).json({
            valid: false,
            error: "Pass not recognized in system database",
            details: `Identifier "${targetPassNumber}" not found`,
          });
        }

        /*
         * Revoked
         */
        if (pass.status === "revoked") {
          return res.status(400).json({
            valid: false,
            error: "PASS REVOKED: This pass has been revoked.",
            pass,
          });
        }

        const now = Date.now();

        const validUntilTime = new Date(pass.validUntil).getTime();

        const validFromTime = new Date(pass.validFrom).getTime();

        /*
         * Expired
         */
        if (now > validUntilTime) {
          await Collections.passes.updateOne(
            {
              id: getId(pass),
            },
            {
              status: "expired",
            },
          );

          return res.status(400).json({
            valid: false,
            error: `PASS EXPIRED: This pass expired on ${new Date(
              pass.validUntil,
            ).toLocaleString()}.`,
            pass: {
              ...pass,
              status: "expired",
            },
          });
        }

        /*
         * Not yet active
         */
        if (now < validFromTime - 30 * 60 * 1000) {
          return res.status(400).json({
            valid: false,
            error: `PASS NOT YET ACTIVE: Pass is scheduled for ${new Date(
              pass.validFrom,
            ).toLocaleString()}`,
            pass,
          });
        }

        /*
         * Determine action.
         */
        let resolvedAction;

        if (action === "auto") {
          resolvedAction =
            pass.status === "checked_in" ? "check_out" : "check_in";
        } else {
          resolvedAction = action;
        }

        if (!["check_in", "check_out"].includes(resolvedAction)) {
          return res.status(400).json({
            error: "Action must be check_in, check_out, or auto",
          });
        }

        const nextStatus =
          resolvedAction === "check_in" ? "checked_in" : "checked_out";

        await Collections.passes.updateOne(
          {
            id: getId(pass),
          },
          {
            status: nextStatus,
          },
        );

        const logRecord = await Collections.checkLogs.insertOne({
          id: "log_" + Date.now().toString(36),

          passId: getId(pass),

          passNumber: pass.passNumber,

          visitorName: pass.visitorName,

          visitorPhoto: pass.visitorPhoto,

          hostId: pass.hostId,

          hostName: pass.hostName,

          organizationId: pass.organizationId,

          action: resolvedAction,

          timestamp: new Date().toISOString(),

          gate,

          verifiedBy,

          status: "success",

          notes:
            notes ||
            (resolvedAction === "check_in"
              ? "QR Code scanned and identity verified"
              : "Visitor badge returned"),

          temperature,
        });

        /*
         * Notify host.
         */
        try {
          const hostUser = await Collections.users.findOne({
            id: pass.hostId,
          });

          const hostEmail = hostUser?.email || pass.visitorEmail;

          const hostPhone = hostUser?.phone || pass.visitorPhone;

          if (resolvedAction === "check_in") {
            await sendNotification({
              recipientEmail: hostEmail,

              recipientPhone: hostPhone,

              recipientRole: "host",

              type: "email",

              subject: `Guest Arrival: ${pass.visitorName} Checked In`,

              message: `${pass.visitorName} has checked in through ${gate}.`,
            });
          } else {
            await sendNotification({
              recipientEmail: hostEmail,

              recipientPhone: hostPhone,

              recipientRole: "host",

              type: "email",

              subject: `Guest Departure: ${pass.visitorName} Checked Out`,

              message: `${pass.visitorName} has checked out through ${gate}.`,
            });
          }
        } catch (notificationError) {
          console.error("Check log notification error:", notificationError);
        }

        return res.json({
          valid: true,

          action: resolvedAction,

          message:
            resolvedAction === "check_in"
              ? `Welcome! Check-In verified for ${pass.visitorName}`
              : `Check-Out completed for ${pass.visitorName}.`,

          pass: {
            ...pass,
            status: nextStatus,
            id: getId(pass),
          },

          log: logRecord,
        });
      } catch (error) {
        console.error("QR scan error:", error);

        return res.status(500).json({
          error: error.message,
        });
      }
    },
  );

app.get(
    "/api/check-logs",
    requireRole("admin", "security", "host"),
    async (req, res) => {
      try {
        const { organizationId, action, gate, search } = req.query;

        let logs = await Collections.checkLogs.find();

        if (organizationId) {
          logs = logs.filter(
            (log) => String(log.organizationId) === String(organizationId),
          );
        }

        if (action) {
          logs = logs.filter((log) => String(log.action) === String(action));
        }

        if (gate) {
          logs = logs.filter((log) => String(log.gate) === String(gate));
        }

        if (search) {
          const q = String(search).toLowerCase();

          logs = logs.filter(
            (log) =>
              safeString(log.visitorName).toLowerCase().includes(q) ||
              safeString(log.passNumber).toLowerCase().includes(q) ||
              safeString(log.hostName).toLowerCase().includes(q) ||
              safeString(log.gate).toLowerCase().includes(q),
          );
        }

        if (req.user.role === "host") {
          logs = logs.filter(
            (log) => String(log.hostId) === String(req.user.id),
          );
        }

        logs.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        res.json(logs);
      } catch (error) {
        res.status(500).json({
          error: error.message,
        });
      }
    },
  );

app.get(
    "/api/analytics",
    requireRole("admin", "security", "host"),
    async (req, res) => {
      try {
        const { organizationId } = req.query;

        let passes = await Collections.passes.find();

        let checkLogs = await Collections.checkLogs.find();

        let appointments = await Collections.appointments.find();

        if (organizationId) {
          passes = passes.filter(
            (pass) => String(pass.organizationId) === String(organizationId),
          );

          checkLogs = checkLogs.filter(
            (log) => String(log.organizationId) === String(organizationId),
          );

          appointments = appointments.filter(
            (appointment) =>
              String(appointment.organizationId) === String(organizationId),
          );
        }

        const now = new Date();

        const today = now.toISOString().split("T")[0];

        const currentlyOnPremises = passes.filter(
          (pass) => pass.status === "checked_in",
        ).length;

        const todayTotalPasses = passes.filter((pass) =>
          safeString(pass.createdAt).startsWith(today),
        ).length;

        const todayCheckedIn = checkLogs.filter(
          (log) =>
            log.action === "check_in" &&
            safeString(log.timestamp).startsWith(today),
        ).length;

        const todayCheckedOut = checkLogs.filter(
          (log) =>
            log.action === "check_out" &&
            safeString(log.timestamp).startsWith(today),
        ).length;

        const pendingApprovals = appointments.filter(
          (appointment) => appointment.status === "pending",
        ).length;

        const overstayedPasses = passes.filter(
          (pass) =>
            pass.status === "checked_in" &&
            pass.validUntil &&
            new Date(pass.validUntil).getTime() < now.getTime(),
        ).length;

        /*
         * Hourly traffic.
         */
        const hours = [
          "08:00",
          "09:00",
          "10:00",
          "11:00",
          "12:00",
          "13:00",
          "14:00",
          "15:00",
          "16:00",
          "17:00",
          "18:00",
        ];

        const hourlyTraffic = hours.map((hour) => {
          const hourNumber = Number(hour.split(":")[0]);

          const checkIns = checkLogs.filter((log) => {
            const date = new Date(log.timestamp);

            return log.action === "check_in" && date.getHours() === hourNumber;
          }).length;

          const checkOuts = checkLogs.filter((log) => {
            const date = new Date(log.timestamp);

            return log.action === "check_out" && date.getHours() === hourNumber;
          }).length;

          return {
            hour,
            checkIns,
            checkOuts,
          };
        });

        /*
         * Purpose breakdown.
         */
        const purposeMap = {};

        appointments.forEach((appointment) => {
          const purpose = appointment.purpose || "Other";

          purposeMap[purpose] = (purposeMap[purpose] || 0) + 1;
        });

        const purposeBreakdown = Object.entries(purposeMap).map(
          ([purpose, count]) => ({
            purpose,
            count,
          }),
        );

        /*
         * Zone breakdown.
         */
        const zoneMap = {};

        passes.forEach((pass) => {
          if (Array.isArray(pass.accessZones)) {
            pass.accessZones.forEach((zone) => {
              zoneMap[zone] = (zoneMap[zone] || 0) + 1;
            });
          }
        });

        const zoneBreakdown = Object.entries(zoneMap).map(([zone, count]) => ({
          zone,
          count,
        }));

        const recentLogs = [...checkLogs]
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          .slice(0, 10);

        res.json({
          currentlyOnPremises,
          todayTotalPasses,
          todayCheckedIn,
          todayCheckedOut,
          pendingApprovals,
          overstayedPasses,
          hourlyTraffic,
          purposeBreakdown,
          zoneBreakdown,
          recentLogs,
        });
      } catch (error) {
        console.error("Analytics error:", error);

        res.status(500).json({
          error: error.message,
        });
      }
    },
  );
}
