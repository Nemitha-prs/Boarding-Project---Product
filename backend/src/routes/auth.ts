import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { supabase } from "../supabase.js";
import { ENV } from "../env.js";
import { sendEmailOTP } from "../services/email.js";

const router = Router();
const SALT_ROUNDS = 10;

// OTP configuration
const OTP_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes for registration
const OTP_PASSWORD_RESET_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes for password reset
const MAX_OTP_ATTEMPTS = 5;

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: Check if OTP can be sent (cooldown check)
async function canSendOTP(
  email: string,
  purpose: "register" | "forgot_password"
): Promise<{ allowed: boolean; remainingSeconds?: number }> {
  const { data: existing } = await supabase
    .from("email_otps")
    .select("last_sent_at")
    .eq("email", email)
    .eq("purpose", purpose)
    .maybeSingle();

  if (!existing || !existing.last_sent_at) {
    return { allowed: true };
  }

  const lastSent = new Date(existing.last_sent_at as string).getTime();
  const now = Date.now();
  const elapsed = now - lastSent;

  if (elapsed < OTP_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000);
    return { allowed: false, remainingSeconds };
  }

  return { allowed: true };
}

// Helper: Create or update OTP in database
async function upsertOTP(
  email: string,
  otp: string,
  purpose: "register" | "forgot_password",
  expiresAt: Date
): Promise<void> {
  const { error } = await supabase
    .from("email_otps")
    .upsert(
      {
        email,
        otp,
        purpose,
        expires_at: expiresAt.toISOString(),
        last_sent_at: new Date().toISOString(),
        attempts: 0,
        verified: false,
      },
      {
        onConflict: "email,purpose",
      }
    );

  if (error) {
    console.error("Failed to upsert OTP:", error);
    throw new Error("Failed to store OTP");
  }
}

// Helper: Get OTP from database
async function getOTP(email: string, purpose: "register" | "forgot_password") {
  const { data, error } = await supabase
    .from("email_otps")
    .select("*")
    .eq("email", email)
    .eq("purpose", purpose)
    .maybeSingle();

  if (error) {
    console.error("Failed to get OTP:", error);
    throw new Error("Failed to retrieve OTP");
  }

  return data as any | null;
}

// Helper: Increment OTP attempts
async function incrementOTPAttempts(
  email: string,
  purpose: "register" | "forgot_password"
): Promise<void> {
  const { error } = await supabase
    .rpc("increment_otp_attempts", { p_email: email, p_purpose: purpose })
    .single();

  // If RPC doesn't exist, do manual update
  if (error) {
    const otp = await getOTP(email, purpose);
    if (otp) {
      await supabase
        .from("email_otps")
        .update({ attempts: (otp as any).attempts + 1 })
        .eq("email", email)
        .eq("purpose", purpose);
    }
  }
}

// Helper: Mark OTP as verified
async function markOTPVerified(
  email: string,
  purpose: "register" | "forgot_password"
): Promise<void> {
  const { error } = await supabase
    .from("email_otps")
    .update({ verified: true })
    .eq("email", email)
    .eq("purpose", purpose);

  if (error) {
    console.error("Failed to mark OTP as verified:", error);
    throw new Error("Failed to verify OTP");
  }
}

// Helper: Delete OTP
async function deleteOTP(
  email: string,
  purpose: "register" | "forgot_password"
): Promise<void> {
  const { error } = await supabase
    .from("email_otps")
    .delete()
    .eq("email", email)
    .eq("purpose", purpose);

  if (error) {
    console.error("Failed to delete OTP:", error);
  }
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
    console.error("Check email error:", e);
    return res
      .status(500)
      .json({ error: "Failed to check email. Please try again." });
  }
});

// POST /auth/send-email-otp - Send OTP to email (registration)
router.post("/send-email-otp", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "email is required" });
    }
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const { data: existingOwner } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .eq("role", "owner")
      .maybeSingle();

    if (existingOwner) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const cooldownCheck = await canSendOTP(email, "register");
    if (!cooldownCheck.allowed) {
      return res.status(429).json({
        error: "Please wait before requesting another code",
        cooldownSeconds: cooldownCheck.remainingSeconds,
      });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    try {
      await upsertOTP(email, otp, "register", expiresAt);
    } catch (dbError: any) {
      console.error("Failed to store OTP:", dbError);
      return res.status(500).json({
        error: "Failed to generate verification code. Please try again.",
      });
    }

    try {
      await sendEmailOTP(email, otp, name);
    } catch (emailError: any) {
      console.error("Failed to send email OTP:", emailError);
      return res.status(500).json({ error: "Failed to send OTP email" });
    }

    return res.json({ message: "OTP sent to email" });
  } catch (e: any) {
    console.error("Send OTP error:", e);
    return res
      .status(500)
      .json({ error: "Failed to send verification code. Please try again." });
  }
});

// POST /auth/verify-email-otp - Verify registration OTP
router.post("/verify-email-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "email is required" });
    }
    if (!otp || typeof otp !== "string") {
      return res.status(400).json({ error: "otp is required" });
    }

    const entry: any = await getOTP(email, "register");

    if (!entry) {
      return res
        .status(400)
        .json({ error: "No OTP found. Please request a new code." });
    }

    if (entry.verified) {
      return res.status(400).json({ error: "OTP already verified" });
    }

    const expiresAt = new Date(entry.expires_at).getTime();
    if (Date.now() > expiresAt) {
      await deleteOTP(email, "register");
      return res.status(400).json({ error: "Verification code expired" });
    }

    if (entry.attempts >= MAX_OTP_ATTEMPTS) {
      await deleteOTP(email, "register");
      return res
        .status(400)
        .json({ error: "Too many attempts. Please request a new code." });
    }

    if (otp.trim() !== String(entry.otp).trim()) {
      await incrementOTPAttempts(email, "register");
      return res.status(400).json({ error: "Incorrect verification code" });
    }

    await markOTPVerified(email, "register");

    return res.json({ verified: true, message: "Email verified successfully" });
  } catch (e: any) {
    console.error("Verify OTP error:", e);
    return res
      .status(500)
      .json({ error: "Failed to verify code. Please try again." });
  }
});

// POST /auth/register - Owner registration
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, age, phone, NIC } = req.body ?? {};

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

    const otpEntry: any = await getOTP(email, "register");
    if (!otpEntry || !otpEntry.verified) {
      return res.status(400).json({
        error:
          "Email not verified. Please verify your email with OTP first.",
      });
    }

    const { data: existingOwner } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .eq("role", "owner")
      .maybeSingle();

    if (existingOwner) {
      return res.status(409).json({ error: "Email already registered" });
    }

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

    const { data, error } = await supabase
      .from("users")
      .insert(insert)
      .select("id, email")
      .single();
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    await deleteOTP(email, "register");

    const token = jwt.sign({ id: (data as any).id }, ENV.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      token,
      user: { id: (data as any).id, email: (data as any).email },
      message: "Registration successful",
    });
  } catch (e: any) {
    console.error("Registration error:", e);
    return res.status(500).json({
      error: "Failed to complete registration. Please try again.",
    });
  }
});

// POST /auth/login - Owner login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "email is required" });
    }
    if (!password || typeof password !== "string") {
      return res.status(400).json({ error: "password is required" });
    }

    const { data: owner, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("role", "owner")
      .maybeSingle();

    if (error) {
      console.error("Supabase error during login:", error);
      return res
        .status(500)
        .json({ error: "Database error. Please try again." });
    }

    if (!owner) {
      return res
        .status(401)
        .json({ error: "No account found. Please register first." });
    }

    if (!(owner as any).passwordHash) {
      return res
        .status(401)
        .json({ error: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(
      password,
      (owner as any).passwordHash as string
    );
    if (!ok) {
      return res
        .status(401)
        .json({ error: "Invalid email or password" });
    }

    try {
      const token = jwt.sign({ id: (owner as any).id }, ENV.JWT_SECRET, {
        expiresIn: "7d",
      });
      return res.json({
        token,
        user: { id: (owner as any).id, email: (owner as any).email },
      });
    } catch (jwtError: any) {
      console.error("JWT signing error:", jwtError);
      return res.status(500).json({
        error: "Failed to generate authentication token. Please try again.",
      });
    }
  } catch (e: any) {
    console.error("Login error:", e);
    return res.status(500).json({
      error: "An error occurred during login. Please try again.",
    });
  }
});

// POST /auth/forgot-password/send-otp
router.post("/forgot-password/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const { data: existingUser, error: dbError } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("email", email)
      .eq("role", "owner")
      .maybeSingle();

    if (dbError) {
      console.error("Database error during forgot password:", dbError);
      return res.status(500).json({ error: "Database error. Please try again." });
    }

    if (!existingUser) {
      return res.status(404).json({ error: "Email is not registered" });
    }

    const cooldownCheck = await canSendOTP(email, "forgot_password");
    if (!cooldownCheck.allowed) {
      return res.status(429).json({
        error: "Please wait before requesting another code",
        cooldownSeconds: cooldownCheck.remainingSeconds,
      });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_PASSWORD_RESET_EXPIRY_MS);

    try {
      await upsertOTP(email, otp, "forgot_password", expiresAt);
    } catch (dbError: any) {
      console.error("Failed to store OTP:", dbError);
      return res.status(500).json({
        error: "Failed to generate verification code. Please try again.",
      });
    }

    try {
      await sendEmailOTP(
        email,
        otp,
        (existingUser as any).name || "User",
        true
      );
    } catch (emailError: any) {
      console.error("Failed to send password reset OTP email:", emailError);
      return res.status(500).json({ error: "Failed to send OTP email" });
    }

    return res.json({ message: "OTP sent to email" });
  } catch (e: any) {
    console.error("Send password reset OTP error:", e);
    return res
      .status(500)
      .json({ error: "Failed to send verification code. Please try again." });
  }
});

// POST /auth/forgot-password/verify-otp
router.post("/forgot-password/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "email is required" });
    }
    if (!otp || typeof otp !== "string") {
      return res.status(400).json({ error: "otp is required" });
    }

    const entry: any = await getOTP(email, "forgot_password");

    if (!entry) {
      return res
        .status(400)
        .json({ error: "No OTP found. Please request a new code." });
    }

    if (entry.verified) {
      return res.status(400).json({ error: "OTP already verified" });
    }

    const expiresAt = new Date(entry.expires_at).getTime();
    if (Date.now() > expiresAt) {
      await deleteOTP(email, "forgot_password");
      return res
        .status(400)
        .json({ error: "Verification code expired" });
    }

    if (entry.attempts >= MAX_OTP_ATTEMPTS) {
      await deleteOTP(email, "forgot_password");
      return res.status(400).json({
        error: "Too many attempts. Please request a new code.",
      });
    }

    if (otp.trim() !== String(entry.otp).trim()) {
      await incrementOTPAttempts(email, "forgot_password");
      return res
        .status(400)
        .json({ error: "Incorrect verification code" });
    }

    await markOTPVerified(email, "forgot_password");

    return res.json({
      verified: true,
      message: "OTP verified successfully",
    });
  } catch (e: any) {
    console.error("Verify password reset OTP error:", e);
    return res
      .status(500)
      .json({ error: "Failed to verify code. Please try again." });
  }
});

// POST /auth/forgot-password/reset
router.post("/forgot-password/reset", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "email is required" });
    }
    if (!otp || typeof otp !== "string") {
      return res.status(400).json({ error: "otp is required" });
    }
    if (!newPassword || typeof newPassword !== "string") {
      return res.status(400).json({ error: "newPassword is required" });
    }

    if (newPassword.trim().length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const entry: any = await getOTP(email, "forgot_password");
    if (!entry || !entry.verified) {
      return res.status(400).json({
        error: "OTP not verified. Please verify your OTP first.",
      });
    }

    if (otp.trim() !== String(entry.otp).trim()) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const expiresAt = new Date(entry.expires_at).getTime();
    if (Date.now() > expiresAt) {
      await deleteOTP(email, "forgot_password");
      return res
        .status(400)
        .json({ error: "OTP expired. Please request a new code." });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .eq("role", "owner")
      .maybeSingle();

    if (userError || !user) {
      console.error(
        "User not found during password reset:",
        userError
      );
      return res.status(404).json({ error: "User not found" });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const { error: updateError } = await supabase
      .from("users")
      .update({ passwordHash })
      .eq("id", (user as any).id);

    if (updateError) {
      console.error("Failed to update password:", updateError);
      return res.status(500).json({
        error: "Failed to reset password. Please try again.",
      });
    }

    await deleteOTP(email, "forgot_password");

    return res.json({ message: "Password reset successfully" });
  } catch (e: any) {
    console.error("Reset password error:", e);
    return res
      .status(500)
      .json({ error: "Failed to reset password. Please try again." });
  }
});

export default router;

 