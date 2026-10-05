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
app.get("/api/passes", requireAuth, async (req, res) => {
    try {
      const { organizationId, status, visitorEmail, search } = req.query;

      let passes = await Collections.passes.find();

      if (organizationId) {
        passes = passes.filter(
          (pass) => String(pass.organizationId) === String(organizationId),
        );
      }

      if (status) {
        passes = passes.filter(
          (pass) => String(pass.status) === String(status),
        );
      }

      if (visitorEmail) {
        passes = passes.filter(
          (pass) =>
            safeString(pass.visitorEmail).toLowerCase() ===
            String(visitorEmail).toLowerCase(),
        );
      }

      if (search) {
        const q = String(search).toLowerCase();

        passes = passes.filter(
          (pass) =>
            safeString(pass.passNumber).toLowerCase().includes(q) ||
            safeString(pass.visitorName).toLowerCase().includes(q) ||
            safeString(pass.visitorCompany).toLowerCase().includes(q) ||
            safeString(pass.hostName).toLowerCase().includes(q),
        );
      }

      if (req.user.role === "visitor") {
        passes = passes.filter(
          (pass) =>
            safeString(pass.visitorEmail).toLowerCase() ===
            safeString(req.user.email).toLowerCase(),
        );
      }

      if (req.user.role === "host") {
        passes = passes.filter(
          (pass) => String(pass.hostId) === String(req.user.id),
        );
      }
      for (const pass of passes) {
        if (!pass.qrCodeImage && pass.qrCodeData) {
          pass.qrCodeImage = await generateQrCodeDataUrl(pass.qrCodeData);
        }

        pass.id = getId(pass);
      }

      res.json(passes);
    } catch (error) {
      console.error("Get passes error:", error);

      res.status(500).json({
        error: error.message,
      });
    }
  });

app.get("/api/passes/:id", requireAuth, async (req, res) => {
    try {
      const requestedId = String(req.params.id);

      let pass = await Collections.passes.findOne({
        id: requestedId,
      });

      if (!pass) {
        pass = await Collections.passes.findOne({
          passNumber: requestedId,
        });
      }

      if (!pass) {
        return res.status(404).json({
          error: "Pass not found",
        });
      }

      if (
        req.user.role === "visitor" &&
        safeString(pass.visitorEmail).toLowerCase() !==
          safeString(req.user.email).toLowerCase()
      ) {
        return res
          .status(403)
          .json({ error: "You can only access your own visitor pass" });
      }
      if (
        req.user.role === "host" &&
        String(pass.hostId) !== String(req.user.id)
      ) {
        return res
          .status(403)
          .json({ error: "You can only access passes assigned to you" });
      }

      if (!pass.qrCodeImage && pass.qrCodeData) {
        pass.qrCodeImage = await generateQrCodeDataUrl(pass.qrCodeData);
      }

      res.json({
        ...pass,
        id: getId(pass),
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

app.get("/api/passes/:id/pdf", requireAuth, async (req, res) => {
    try {
      const requestedId = String(req.params.id);

      let pass = await Collections.passes.findOne({
        id: requestedId,
      });

      if (!pass) {
        pass = await Collections.passes.findOne({
          passNumber: requestedId,
        });
      }

      if (!pass) {
        return res.status(404).json({
          error: "Pass not found",
        });
      }

      const document = new PDFDocument({
        size: "A6",
        margin: 24,
      });

      let qrBuffer = null;

      if (pass.qrCodeData) {
        const qrDataUrl = await generateQrCodeDataUrl(pass.qrCodeData);

        const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");

        qrBuffer = Buffer.from(base64Data, "base64");
      }

      const filename = `${pass.passNumber || "visitor-pass"}.pdf`;

      res.setHeader("Content-Type", "application/pdf");

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );

      document.pipe(res);

      document.fontSize(18).text("VISITOR PASS", {
        align: "center",
      });

      document.moveDown(0.5);

      document.fontSize(11).text(`Pass Number: ${pass.passNumber || "-"}`);

      document.text(`Visitor: ${pass.visitorName || "-"}`);

      document.text(`Company: ${pass.visitorCompany || "-"}`);

      document.text(`Host: ${pass.hostName || "-"}`);

      document.text(`Type: ${pass.passType || "day_pass"}`);

      document.text(
        `Valid From: ${
          pass.validFrom ? new Date(pass.validFrom).toLocaleString() : "-"
        }`,
      );

      document.text(
        `Valid Until: ${
          pass.validUntil ? new Date(pass.validUntil).toLocaleString() : "-"
        }`,
      );

      document.text(`Status: ${pass.status || "-"}`);

      document.moveDown(0.5);

      document.text(
        `Access: ${
          Array.isArray(pass.accessZones)
            ? pass.accessZones.join(", ")
            : "Main Lobby"
        }`,
      );
      document.moveDown(0.5);

      if (qrBuffer) {
        document.image(qrBuffer, {
          fit: [150, 150],
          align: "center",
        });

        document.moveDown(0.5);

        document
          .fontSize(9)
          .text("Scan this QR code at the security/frontdesk counter.", {
            align: "center",
          });

        document.moveDown(0.5);
      }
      document
        .fontSize(9)
        .text(
          "Show this pass at the security/frontdesk counter for QR verification.",
          {
            align: "center",
          },
        );

      document.end();
    } catch (error) {
      console.error("PDF generation error:", error);

      res.status(500).json({
        error: error.message,
      });
    }
  });

app.post(
    "/api/passes/issue",
    requireRole("admin", "security"),
    async (req, res) => {
      try {
        const {
          visitorName,
          visitorEmail,
          visitorPhone,
          visitorCompany,
          visitorPhoto,
          idProofType = "National ID",
          idProofNumber,
          hostId,
          organizationId = "org_apex",
          passType = "day_pass",
          validHours = 8,
          accessZones = ["Main Lobby", "Host Floor"],
          vehicleNumber,
        } = req.body;

        if (!visitorName || !visitorEmail || !hostId) {
          return res.status(400).json({
            error: "Visitor name, email, and host are required",
          });
        }

        const host = await Collections.users.findOne({
          id: String(hostId),
        });

        const hostName = host?.name || "Frontdesk Reception";

        const hostDepartment = host?.department || "General Facilities";

        const passNumber =
          "VP-" +
          new Date().getFullYear() +
          "-" +
          Math.floor(1000 + Math.random() * 9000);

        const now = new Date();

        const validFrom = now.toISOString();

        const validUntil = new Date(
          now.getTime() + Number(validHours) * 60 * 60 * 1000,
        ).toISOString();

        const qrPayload = JSON.stringify({
          passNumber,
          visitorName,
          visitorEmail,
          hostName,
          validUntil,
          orgId: organizationId,
        });

        const qrCodeImage = await generateQrCodeDataUrl(qrPayload);

        const normalizedVisitorEmail = String(visitorEmail)
          .toLowerCase()
          .trim();
        const existingVisitor = await Collections.visitors.findOne({
          email: normalizedVisitorEmail,
        });
        const visitorRecord = existingVisitor
          ? existingVisitor
          : await Collections.visitors.insertOne({
              id: "vis_" + Date.now().toString(36),
              fullName: visitorName,
              email: normalizedVisitorEmail,
              phone: visitorPhone || "",
              company: visitorCompany || "",
              idProofType,
              idProofNumber: idProofNumber || "",
              photoUrl: visitorPhoto || "",
              organizationId,
              createdAt: new Date().toISOString(),
            });

        const pass = await Collections.passes.insertOne({
          id: "pass_" + Date.now().toString(36),

          passNumber,

          qrCodeData: qrPayload,

          qrCodeImage,

          visitorId: getId(visitorRecord),

          visitorName,

          visitorEmail: String(visitorEmail).toLowerCase().trim(),

          visitorPhone: visitorPhone || "",

          visitorCompany: visitorCompany || "",

          visitorPhoto:
            visitorPhoto ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",

          idProofType,

          idProofNumber:
            idProofNumber || "ID-" + Math.floor(10000 + Math.random() * 90000),

          hostId,

          hostName,

          hostDepartment,

          organizationId,

          passType,

          validFrom,

          validUntil,

          status: "issued",

          accessZones,

          vehicleNumber: vehicleNumber || "",

          otpCode: Math.floor(100000 + Math.random() * 900000).toString(),

          createdAt: new Date().toISOString(),
        });

        try {
          await sendNotification({
            recipientEmail: visitorEmail,
            recipientPhone: visitorPhone,
            recipientRole: "visitor",
            type: "email",

            subject: `Your Visitor Pass is Ready: ${passNumber}`,

            message: `Welcome to our facility! Your visitor pass ${passNumber} has been issued.`,

            html: passEmailHtml,

            attachments: emailAttachments,
          });

          if (visitorPhone) {
            await sendNotification({
              recipientEmail: visitorEmail,
              recipientPhone: visitorPhone,
              recipientRole: "visitor",
              type: "sms",
              subject: `Visitor Pass ${passNumber}`,
              message: `Your visitor pass ${passNumber} is ready. Present the QR code at the security/frontdesk gate.`,
            });
          }
        } catch (notificationError) {
          console.error("Pass notification error:", notificationError);
        }

        res.status(201).json(pass);
      } catch (error) {
        console.error("Issue pass error:", error);

        res.status(500).json({
          error: error.message,
        });
      }
    },
  );

app.put(
    "/api/passes/:id/revoke",
    requireRole("admin", "security"),
    async (req, res) => {
      try {
        const id = String(req.params.id);

        const existing = await Collections.passes.findOne({
          id,
        });

        if (!existing) {
          return res.status(404).json({
            error: "Pass not found",
          });
        }

        await Collections.passes.updateOne(
          {
            id: getId(existing),
          },
          {
            status: "revoked",
          },
        );

        const updated = await Collections.passes.findOne({
          id: getId(existing),
        });

        res.json(updated);
      } catch (error) {
        res.status(500).json({
          error: error.message,
        });
      }
    },
  );
}
