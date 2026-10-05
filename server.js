import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  connectDatabase,
  seedDatabase,
  Collections,
  generateQrCodeDataUrl,
} from "./src/server/db.js";
import { sendNotification } from "./src/server/notifications.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import PDFDocument from "pdfkit";
import { createAuthMiddleware } from "./src/server/middleware/auth.js";
import { registerRoutes as registerAuthRoutes } from "./src/server/routes/auth.js";
import { registerRoutes as registerOrganizationsRoutes } from "./src/server/routes/organizations.js";
import { registerRoutes as registerVisitorsRoutes } from "./src/server/routes/visitors.js";
import { registerRoutes as registerAppointmentsRoutes } from "./src/server/routes/appointments.js";
import { registerRoutes as registerPassesRoutes } from "./src/server/routes/passes.js";
import { registerRoutes as registerCheckLogsRoutes } from "./src/server/routes/checkLogs.js";
import { registerRoutes as registerNotificationsRoutes } from "./src/server/routes/notifications.js";
import { registerRoutes as registerExportsRoutes } from "./src/server/routes/exports.js";

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

const JWT_SECRET =
  process.env.JWT_SECRET || "visitor-pass-system-jwt-secret-key-2026";

const getId = (item) => {
  if (!item) return "";

  return String(item.id ?? item._id ?? "").trim();
};

const safeString = (value, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
};

export async function startServer() {
  await connectDatabase();

  await seedDatabase();

  const app = express();

  app.use(
    express.json({
      limit: "10mb",
    }),
  );

  app.use(
    express.urlencoded({
      extended: true,
      limit: "10mb",
    }),
  );

  const { authenticateToken, requireAuth, requireRole } =
    createAuthMiddleware(JWT_SECRET);

  app.use(authenticateToken);

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "Visitor Pass Management API",
      database: "MongoDB",
    });
  });

  const routeContext = {
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
    JWT_SECRET,
  };

  registerAuthRoutes(app, routeContext);
  registerOrganizationsRoutes(app, routeContext);
  registerVisitorsRoutes(app, routeContext);
  registerAppointmentsRoutes(app, routeContext);
  registerPassesRoutes(app, routeContext);
  registerCheckLogsRoutes(app, routeContext);
  registerNotificationsRoutes(app, routeContext);
  registerExportsRoutes(app, routeContext);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");

    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Visitor Pass Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);

  process.exit(1);
});
