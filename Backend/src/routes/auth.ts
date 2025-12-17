import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { supabase } from "../supabase";
import { ENV } from "../env";
import { sendEmailOTP } from "../services/email";

const router = Router();
const SALT_ROUNDS = 10;

// In-memory OTP store
interface OTPStoreEntry {
  otp: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
}

const otpStore = new Map<string, OTPStoreEntry>();

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// GET /auth/check-email - Check if email exists (for owners only)
router.get("/check-email", async (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    const { data: existingOwner } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .eq("role", "owner")
      .maybeSingle();

    return res.json({ exists: !!existingOwner });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
});

// POST /auth/send-email-otp - Send OTP to email (in-memory store)
router.post("/send-email-otp", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "email is required" });
    }
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if email already registered
    const { data: existingOwner } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .eq("role", "owner")
      .maybeSingle();

    if (existingOwner) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Generate OTP and store in memory
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(email, {
      otp,
      expiresAt,
      attempts: 0,
      verified: false,
    });

    // Send email
    try {
      await sendEmailOTP(email, otp, name);
    } catch (emailError: any) {
      console.error("Failed to send email OTP:", emailError);
      otpStore.delete(email);
      return res.status(500).json({ error: "Failed to send OTP email" });
    }

    return res.json({ message: "OTP sent to email" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
});

// POST /auth/verify-email-otp - Verify OTP (in-memory store with attempt tracking)
router.post("/verify-email-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "email is required" });
    }
    if (!otp || typeof otp !== "string") {
      return res.status(400).json({ error: "otp is required" });
    }

    const entry = otpStore.get(email);

    // No OTP found
    if (!entry) {
      return res.status(400).json({ error: "No OTP found. Please request a new code." });
    }

    // Check expiry
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: "Verification code expired" });
    }

    // Check attempts
    if (entry.attempts >= 5) {
      otpStore.delete(email);
      return res.status(400).json({ error: "Too many attempts. Please request a new code." });
    }

    // Verify OTP
    if (otp.trim() !== entry.otp.trim()) {
      entry.attempts++;
      otpStore.set(email, entry);
      return res.status(400).json({ error: "Incorrect verification code" });
    }

    // Success - mark as verified
    entry.verified = true;
    otpStore.set(email, entry);

    return res.json({ verified: true, message: "Email verified successfully" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
});

// POST /auth/register - Owner registration only
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, age, phone, NIC } = req.body ?? {};

    // Basic validation
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "email is required" });
    }
    if (!password || typeof password !== "string") {
      return res.status(400).json({ error: "password is required" });
    }
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name is required" });
    }
    if (age === undefined || age === null) {
      return res.status(400).json({ error: "age is required" });
    }
    if (!phone) {
      return res.status(400).json({ error: "phone is required" });
    }
    if (!NIC) {
      return res.status(400).json({ error: "NIC is required" });
    }

    // Check OTP verification
    const otpEntry = otpStore.get(email);
    if (!otpEntry || !otpEntry.verified) {
      return res.status(400).json({ error: "Email not verified. Please verify your email with OTP first." });
    }

    // Check if email already exists (owners only)
    const { data: existingOwner } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .eq("role", "owner")
      .maybeSingle();

    if (existingOwner) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Check if NIC already exists (owners only)
    const { data: existingNIC } = await supabase
      .from("users")
      .select("id")
      .eq("NIC", NIC)
      .eq("role", "owner")
      .maybeSingle();

    if (existingNIC) {
      return res.status(409).json({ error: "NIC already registered" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const insert = {
      email,
      passwordHash,
      role: "owner",
      name,
      age: Number(age),
      phone,
      NIC,
      createdAt: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("users").insert(insert).select("id, email").single();
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Clear OTP from memory
    otpStore.delete(email);

    // Generate JWT
    const token = jwt.sign({ id: data.id }, ENV.JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({
      token,
      user: { id: data.id, email: data.email },
      message: "Registration successful",
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
});

// POST /auth/login - Owner login only
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "email is required" });
    }
    if (!password || typeof password !== "string") {
      return res.status(400).json({ error: "password is required" });
    }

    // Check owners table only
    const { data: owner, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("role", "owner")
      .single();

    if (error || !owner) {
      return res.status(401).json({ error: "No account found. Please register first." });
    }

    // Check if user has password (not Google OAuth only)
    if (!owner.passwordHash) {
      return res.status(401).json({ error: "Please use Google sign-in for this account" });
    }

    const ok = await bcrypt.compare(password, owner.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: owner.id }, ENV.JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token, user: { id: owner.id, email: owner.email } });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
});

// Configure Google OAuth Strategy (owner-only)
if (ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET) {
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || `${ENV.API_URL}/auth/google/callback`;
  passport.use(
    "google-owner",
    new GoogleStrategy(
      {
        clientID: ENV.GOOGLE_CLIENT_ID,
        clientSecret: ENV.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL,
      },
      async (accessToken, refreshToken, profile: any, done) => {
        try {
          const { displayName, emails } = profile;
          const email = emails?.[0]?.value;

          if (!email) {
            return done(new Error("No email found in Google profile"), undefined);
          }

          // Check if owner exists
          const { data: existingOwner } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .eq("role", "owner")
            .maybeSingle();

          if (existingOwner) {
            // Login existing owner
            return done(null, existingOwner);
          }

          // Create new owner account
          // Generate random password hash to satisfy NOT NULL constraint
          const randomPassword = Math.random().toString(36).slice(-12);
          const passwordHash = await bcrypt.hash(randomPassword, SALT_ROUNDS);

          const { data: newOwner, error } = await supabase
            .from("users")
            .insert({
              email,
              name: displayName || "Owner",
              passwordHash,
              role: "owner",
              createdAt: new Date().toISOString(),
            })
            .select("*")
            .single();

          if (error) {
            return done(error, undefined);
          }

          return done(null, newOwner);
        } catch (error: any) {
          return done(error, undefined);
        }
      }
    )
  );
}

// GET /auth/google - Google OAuth (owner-only)
router.get("/google", passport.authenticate("google-owner", { scope: ["profile", "email"] }));

// GET /auth/google/callback - Google OAuth callback (owner-only)
router.get(
  "/google/callback",
  passport.authenticate("google-owner", { session: false, failureRedirect: `${ENV.FRONTEND_URL}/login?error=oauth_failed` }),
  async (req: any, res) => {
    try {
      const owner = req.user as any;

      if (!owner) {
        return res.redirect(`${ENV.FRONTEND_URL}/login?error=oauth_failed`);
      }

      const token = jwt.sign({ id: owner.id }, ENV.JWT_SECRET, { expiresIn: "7d" });
      return res.redirect(`${ENV.FRONTEND_URL}/owner-dashboard?token=${token}`);
    } catch (error: any) {
      console.error("Google OAuth callback error:", error);
      return res.redirect(`${ENV.FRONTEND_URL}/login?error=oauth_error`);
    }
  }
);

export default router;
