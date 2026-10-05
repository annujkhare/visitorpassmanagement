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
  JWT_SECRET,
}) {
app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: "Email and password are required",
        });
      }

      const normalizedEmail = String(email).toLowerCase().trim();

      const user = await Collections.users.findOne({
        email: normalizedEmail,
      });

      if (!user) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash || "");

      if (!isMatch) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      const token = jwt.sign(
        {
          id: getId(user),
          email: user.email,
          role: user.role,
          name: user.name,
          organizationId: user.organizationId,
        },
        JWT_SECRET,
        {
          expiresIn: "7d",
        },
      );

      const { passwordHash, ...userProfile } = user;

      res.cookie("visitor_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        token,
        user: {
          ...userProfile,
          id: getId(user),
        },
      });
    } catch (error) {
      console.error("Login error:", error);

      return res.status(500).json({
        error: error.message || "Internal login error",
      });
    }
  });

app.post("/api/auth/demo-login", async (req, res) => {
    try {
      const { role } = req.body;

      let targetUser = await Collections.users.findOne({
        role,
      });

      if (!targetUser) {
        targetUser = await Collections.users.findOne({
          role: "admin",
        });
      }

      if (!targetUser) {
        return res.status(404).json({
          error: "Demo user not found",
        });
      }

      const token = jwt.sign(
        {
          id: getId(targetUser),
          email: targetUser.email,
          role: targetUser.role,
          name: targetUser.name,
          organizationId: targetUser.organizationId,
        },
        JWT_SECRET,
        {
          expiresIn: "7d",
        },
      );

      const { passwordHash, ...userProfile } = targetUser;

      res.cookie("visitor_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        token,
        user: {
          ...userProfile,
          id: getId(targetUser),
        },
      });
    } catch (error) {
      console.error("Demo login error:", error);

      return res.status(500).json({
        error: error.message || "Demo login failed",
      });
    }
  });

app.post("/api/auth/register", async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role = "visitor",
        organizationId = "org_apex",
        department,
        phone,
        photoUrl,
      } = req.body;

      const requestedRole = ["admin", "security", "host", "visitor"].includes(
        role,
      )
        ? role
        : "visitor";

      if (
        requestedRole !== "visitor" &&
        (!req.user || req.user.role !== "admin")
      ) {
        return res.status(403).json({
          error: "Only an admin can create staff accounts",
        });
      }

      if (!name || !email || !password) {
        return res.status(400).json({
          error: "Name, email, and password are required",
        });
      }

      const normalizedEmail = String(email).toLowerCase().trim();

      const existing = await Collections.users.findOne({
        email: normalizedEmail,
      });

      if (existing) {
        return res.status(409).json({
          error: "User with this email already exists",
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = await Collections.users.insertOne({
        id: "usr_" + Date.now().toString(36),
        name,
        email: normalizedEmail,
        passwordHash,
        role: requestedRole,
        organizationId,
        department: department || "General",
        phone: phone || "",
        avatar:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        createdAt: new Date().toISOString(),
      });

      const token = jwt.sign(
        {
          id: getId(newUser),
          email: newUser.email,
          role: newUser.role,
          name: newUser.name,
          organizationId: newUser.organizationId,
        },
        JWT_SECRET,
        {
          expiresIn: "7d",
        },
      );

      if (requestedRole === "visitor") {
        const existingVisitor = await Collections.visitors.findOne({
          email: normalizedEmail,
        });
        if (!existingVisitor) {
          await Collections.visitors.insertOne({
            id: "vis_" + Date.now().toString(36),
            fullName: name,
            email: normalizedEmail,
            phone: phone || "",
            company: req.body.company || "",
            idProofType: "National ID",
            idProofNumber: "",
            photoUrl: photoUrl || "",
            organizationId,
            createdAt: new Date().toISOString(),
          });
        }
      }

      const { passwordHash: removedPassword, ...userProfile } = newUser;

      res.cookie("visitor_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        token,
        user: {
          ...userProfile,
          id: getId(newUser),
        },
      });
    } catch (error) {
      console.error("Registration error:", error);

      return res.status(500).json({
        error: error.message || "Registration failed",
      });
    }
  });

app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await Collections.users.findOne({
        id: req.user.id,
      });

      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      const { passwordHash, ...userProfile } = user;

      res.json({
        user: {
          ...userProfile,
          id: getId(user),
        },
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("visitor_token", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.json({ success: true, message: "Signed out successfully" });
  });

app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { phoneOrEmail, purpose = "Visitor Verification" } = req.body;

      if (!phoneOrEmail) {
        return res.status(400).json({
          error: "Phone or email is required",
        });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();

      const expiresAt = Date.now() + 10 * 60 * 1000;

      await Collections.otps.insertOne({
        phoneOrEmail,
        code,
        expiresAt,
        purpose,
        createdAt: new Date().toISOString(),
      });

      const isEmail = String(phoneOrEmail).includes("@");

      await sendNotification({
        recipientEmail: isEmail ? phoneOrEmail : undefined,
        recipientPhone: isEmail ? undefined : phoneOrEmail,
        recipientRole: "visitor",
        type: isEmail ? "email" : "sms",
        subject: `Verification Code: ${code}`,
        message: `Your one-time verification code for ${purpose} is ${code}. Valid for 10 minutes.`,
      });

      return res.json({
        success: true,
        message: "OTP sent successfully",
        ...(process.env.NODE_ENV !== "production"
          ? {
              demoCode: code,
            }
          : {}),
      });
    } catch (error) {
      console.error("Send OTP error:", error);

      res.status(500).json({
        error: error.message,
      });
    }
  });

app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { phoneOrEmail, code } = req.body;

      if (!phoneOrEmail || !code) {
        return res.status(400).json({
          valid: false,
          error: "Phone/Email and code are required",
        });
      }

      const otps = await Collections.otps.find({
        phoneOrEmail,
      });

      const valid = otps.find(
        (otp) =>
          String(otp.code) === String(code).trim() &&
          Number(otp.expiresAt) > Date.now(),
      );

      if (!valid) {
        return res.status(400).json({
          valid: false,
          error: "Invalid or expired OTP code",
        });
      }

      await Collections.otps.deleteOne({
        id: valid.id,
      });

      return res.json({
        valid: true,
        message: "OTP verified successfully",
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });
}
