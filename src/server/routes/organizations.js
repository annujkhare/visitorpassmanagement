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
app.get("/api/organizations", requireAuth, async (req, res) => {
    try {
      const organizations = await Collections.organizations.find();

      res.json(organizations);
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

app.post("/api/organizations", requireRole("admin"), async (req, res) => {
    try {
      const {
        name,
        code,
        address,
        email,
        phone,
        passValidityHours = 8,
        requireHostApproval = true,
        requireOtp = false,
      } = req.body;

      if (!name || !code) {
        return res.status(400).json({
          error: "Organization name and code are required",
        });
      }

      const organization = await Collections.organizations.insertOne({
        id:
          "org_" +
          String(code)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_"),
        name,
        code: String(code).toUpperCase(),
        address: address || "",
        email: email || "",
        phone: phone || "",
        passValidityHours: Number(passValidityHours),
        requireHostApproval: Boolean(requireHostApproval),
        requireOtp: Boolean(requireOtp),
        createdAt: new Date().toISOString(),
      });

      res.status(201).json(organization);
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

app.put("/api/organizations/:id", requireRole("admin"), async (req, res) => {
    try {
      const id = String(req.params.id);
      const existing = await Collections.organizations.findOne({ id });
      if (!existing)
        return res.status(404).json({ error: "Organization not found" });

      const allowed = [
        "name",
        "code",
        "address",
        "email",
        "phone",
        "passValidityHours",
        "requireHostApproval",
        "requireOtp",
      ];
      const updates = {};
      for (const key of allowed)
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      if (updates.code) updates.code = String(updates.code).toUpperCase();
      if (updates.passValidityHours !== undefined)
        updates.passValidityHours = Number(updates.passValidityHours);
      if (updates.requireHostApproval !== undefined)
        updates.requireHostApproval = Boolean(updates.requireHostApproval);
      if (updates.requireOtp !== undefined)
        updates.requireOtp = Boolean(updates.requireOtp);

      await Collections.organizations.updateOne({ id }, updates);
      res.json(await Collections.organizations.findOne({ id }));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const { organizationId, role } = req.query;

      let users = await Collections.users.find();

      if (organizationId) {
        users = users.filter(
          (user) => String(user.organizationId) === String(organizationId),
        );
      }

      if (role) {
        users = users.filter(
          (user) =>
            String(user.role).toLowerCase() === String(role).toLowerCase(),
        );
      }

      const safeUsers = users.map((user) => {
        const { passwordHash, ...safeUser } = user;

        return {
          ...safeUser,
          id: getId(user),
        };
      });

      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });
}
