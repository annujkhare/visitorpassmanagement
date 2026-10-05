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
app.get(
    "/api/export/passes",
    requireRole("admin", "security"),
    async (req, res) => {
      try {
        const passes = await Collections.passes.find();

        const headers =
          "Pass Number,Visitor Name,Email,Phone,Company,Host,Department,Status,Valid From,Valid Until\n";

        const rows = passes
          .map(
            (pass) =>
              `"${safeString(pass.passNumber)}","${safeString(
                pass.visitorName,
              )}","${safeString(pass.visitorEmail)}","${safeString(
                pass.visitorPhone,
              )}","${safeString(pass.visitorCompany)}","${safeString(
                pass.hostName,
              )}","${safeString(pass.hostDepartment)}","${safeString(
                pass.status,
              )}","${safeString(pass.validFrom)}","${safeString(
                pass.validUntil,
              )}"`,
          )
          .join("\n");

        res.setHeader("Content-Type", "text/csv");

        res.setHeader(
          "Content-Disposition",
          'attachment; filename="visitor_passes_export.csv"',
        );

        res.send(headers + rows);
      } catch (error) {
        res.status(500).json({
          error: error.message,
        });
      }
    },
  );

app.get(
    "/api/export/logs",
    requireRole("admin", "security"),
    async (req, res) => {
      try {
        const logs = await Collections.checkLogs.find();

        const headers =
          "Timestamp,Pass Number,Visitor Name,Host,Action,Gate,Verified By,Status,Notes\n";

        const rows = logs
          .map(
            (log) =>
              `"${safeString(log.timestamp)}","${safeString(
                log.passNumber,
              )}","${safeString(log.visitorName)}","${safeString(
                log.hostName,
              )}","${safeString(log.action)}","${safeString(
                log.gate,
              )}","${safeString(log.verifiedBy)}","${safeString(
                log.status,
              )}","${safeString(log.notes)}"`,
          )
          .join("\n");

        res.setHeader("Content-Type", "text/csv");

        res.setHeader(
          "Content-Disposition",
          'attachment; filename="checkin_checkout_logs.csv"',
        );

        res.send(headers + rows);
      } catch (error) {
        res.status(500).json({
          error: error.message,
        });
      }
    },
  );
}
