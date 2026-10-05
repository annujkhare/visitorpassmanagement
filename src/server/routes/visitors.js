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
app.get("/api/visitors", requireAuth, async (req, res) => {
    try {
      const { organizationId, search } = req.query;

      let visitors = await Collections.visitors.find();

      if (organizationId) {
        visitors = visitors.filter(
          (visitor) =>
            String(visitor.organizationId) === String(organizationId),
        );
      }

      if (req.user.role === "visitor") {
        visitors = visitors.filter(
          (visitor) =>
            String(visitor.email || "").toLowerCase() ===
            String(req.user.email || "").toLowerCase(),
        );
      }

      if (search) {
        const q = String(search).toLowerCase();

        visitors = visitors.filter(
          (visitor) =>
            safeString(visitor.fullName).toLowerCase().includes(q) ||
            safeString(visitor.email).toLowerCase().includes(q) ||
            safeString(visitor.phone).toLowerCase().includes(q) ||
            safeString(visitor.company).toLowerCase().includes(q),
        );
      }

      res.json(visitors);
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

app.post(
    "/api/visitors",
    requireRole("admin", "security", "host", "visitor"),
    async (req, res) => {
      try {
        const {
          fullName,
          email,
          phone,
          company,
          idProofType,
          idProofNumber,
          photoUrl,
          organizationId = "org_apex",
        } = req.body;

        if (!fullName || !email || !phone) {
          return res.status(400).json({
            error: "Full name, email, and phone number are required",
          });
        }

        const visitor = await Collections.visitors.insertOne({
          id: "vis_" + Date.now().toString(36),
          fullName,
          email: String(email).toLowerCase().trim(),
          phone,
          company: company || "",
          idProofType: idProofType || "National ID",
          idProofNumber:
            idProofNumber || "ID-" + Math.floor(10000 + Math.random() * 90000),
          photoUrl:
            photoUrl ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
          organizationId,
          createdAt: new Date().toISOString(),
        });

        res.status(201).json(visitor);
      } catch (error) {
        res.status(500).json({
          error: error.message,
        });
      }
    },
  );
}
