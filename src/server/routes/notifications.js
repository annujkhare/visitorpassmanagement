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
app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      let notifications = await Collections.notifications.find();

      if (req.user.role !== "admin") {
        notifications = notifications.filter(
          (notification) =>
            safeString(notification.recipientEmail).toLowerCase() ===
              safeString(req.user.email).toLowerCase() ||
            notification.recipientRole === req.user.role,
        );
      }

      notifications.sort(
        (a, b) =>
          new Date(b.timestamp || b.createdAt || 0).getTime() -
          new Date(a.timestamp || a.createdAt || 0).getTime(),
      );

      res.json(notifications);
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

app.post(
    "/api/notifications/test",
    requireRole("admin", "security"),
    async (req, res) => {
      try {
        const {
          recipientEmail,
          recipientPhone,
          type = "email",
          subject,
          message,
        } = req.body;

        const notification = await sendNotification({
          recipientEmail: recipientEmail || "visitor@example.com",

          recipientPhone: recipientPhone || "+15550199999",

          recipientRole: "visitor",

          type,

          subject: subject || "Test Notification",

          message:
            message ||
            "This is a test notification from Visitor Pass Management System.",
        });

        res.status(201).json(notification);
      } catch (error) {
        res.status(500).json({
          error: error.message,
        });
      }
    },
  );
}
