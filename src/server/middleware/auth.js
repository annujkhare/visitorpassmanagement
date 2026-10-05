import jwt from "jsonwebtoken";

export function createAuthMiddleware(JWT_SECRET) {
  const authenticateToken = (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      const cookieToken = (req.headers.cookie || "")
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("visitor_token="))
        ?.split("=")
        .slice(1)
        .join("=");

      let token = null;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }

      if (!token && cookieToken) {
        token = cookieToken;
      }

      if (!token) {
        return next();
      }

      jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
        if (!err && decodedUser) {
          req.user = decodedUser;
        }

        next();
      });
    } catch (error) {
      console.error("Authentication middleware error:", error);
      next();
    }
  };

  const requireAuth = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    next();
  };

  const requireRole =
    (...roles) =>
    (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
        });
      }

      const userRole = String(req.user.role || "").toLowerCase();
      const allowedRoles = roles.map((role) => String(role).toLowerCase());

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: "You do not have permission for this action",
        });
      }

      next();
    };

  return { authenticateToken, requireAuth, requireRole };
}
