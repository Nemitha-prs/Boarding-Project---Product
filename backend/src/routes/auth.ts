import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { supabase } from "../supabase.js";
import { ENV } from "../env.js";
import { sendEmailOTP } from "../services/email.js";

const router = Router();
const SALT_ROUNDS = 10;

// In-memory OTP store with strict tracking
interface OTPStoreEntry {
  otp: string;
  otp_created_at: number; // When OTP was generated
  otp_expires_at: number; // When OTP expires (5 minutes)
  last_otp_sent_at: number; // When OTP was last sent (for cooldown)
  otp_attempts: number; // Verification attempts
  otp_verified: boolean; // Whether OTP was successfully verified
}

const otpStore = new Map<string, OTPStoreEntry>();
// Separate OTP store for password reset
const passwordResetOtpStore = new Map<string, OTPStoreEntry>();

// Helper function to clean up expired OTPs (optional, for memory management)
function cleanupExpiredOTPs() {
  const now = Date.now();
  for (const [email, entry] of otpStore.entries()) {
    if (now > entry.otp_expires_at) {
      otpStore.delete(email);
    }
  }
  for (const [email, entry] of passwordResetOtpStore.entries()) {
    if (now > entry.otp_expires_at) {
      passwordResetOtpStore.delete(email);
    }
  }
}

// Clean up expired OTPs every 10 minutes
setInterval(cleanupExpiredOTPs, 10 * 60 * 1000);

// OTP cooldown: 2 minutes (120 seconds) in milliseconds - STRICT
const OTP_COOLDOWN_MS = 2 * 60 * 1000;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_OTP_ATTEMPTS = 5; // Maximum verification attempts

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
    console.error("Check email error:", e);
    return res.status(500).json({ error: "Failed to check email. Please try again." });
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

    // STRICT COOLDOWN CHECK - Must happen BEFORE any OTP generation
    const existingEntry = otpStore.get(email);
    const now = Date.now();
    
    if (existingEntry?.last_otp_sent_at) {
      const timeSinceLastRequest = now - existingEntry.last_otp_sent_at;
      if (timeSinceLastRequest < OTP_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((OTP_COOLDOWN_MS - timeSinceLastRequest) / 1000);
        return res.status(429).json({ 
          success: false,
          error: "Please wait 2 minutes before requesting another OTP",
          cooldownSeconds: remainingSeconds,
          message: `Please wait ${remainingSeconds} seconds before requesting another OTP`
        });
      }
    }

    // Generate NEW OTP only after cooldown check passes
    const otp = generateOTP();
    const otp_created_at = now;
    const otp_expires_at = now + OTP_EXPIRY_MS;

    // Store OTP BEFORE sending email (so we have it even if email fails)
    otpStore.set(email, {
      otp,
      otp_created_at,
      otp_expires_at,
      last_otp_sent_at: now,
      otp_attempts: 0,
      otp_verified: false,
    });

    // Send email - if this fails, OTP is still stored but user won't receive it
    try {
      await sendEmailOTP(email, otp, name);
    } catch (emailError: any) {
      console.error("Failed to send email OTP:", emailError);
      // Remove OTP if email failed - user can't verify what they didn't receive
      otpStore.delete(email);
      return res.status(500).json({ 
        success: false,
        error: "Failed to send OTP email. Please try again." 
      });
    }

    // ONLY return success if email was actually sent
    return res.status(200).json({ 
      success: true,
      message: "OTP sent to email",
      cooldownSeconds: 120
    });
  } catch (e: any) {
    console.error("Send OTP error:", e);
    return res.status(500).json({ error: "Failed to send verification code. Please try again." });
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

    // Check if already verified
    if (entry.otp_verified) {
      return res.status(400).json({ 
        success: false,
        error: "OTP has already been verified. Please request a new code." 
      });
    }

    // Check if expired
    const now = Date.now();
    if (now > entry.otp_expires_at) {
      otpStore.delete(email);
      return res.status(400).json({ 
        success: false,
        error: "OTP expired. Please request a new code." 
      });
    }

    // Check attempt limit
    if (entry.otp_attempts >= MAX_OTP_ATTEMPTS) {
      otpStore.delete(email);
      return res.status(400).json({ 
        success: false,
        error: "Maximum verification attempts exceeded. Please request a new code." 
      });
    }

    // Verify OTP - exact match required
    if (otp.trim() !== entry.otp.trim()) {
      entry.otp_attempts++;
      otpStore.set(email, entry);
      const remainingAttempts = MAX_OTP_ATTEMPTS - entry.otp_attempts;
      return res.status(400).json({ 
        success: false,
        error: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
        remainingAttempts
      });
    }

    // OTP is correct - mark as verified
    otpStore.set(email, { 
      ...entry, 
      otp_verified: true 
    });
    
    return res.status(200).json({ 
      success: true,
      verified: true, 
      message: "OTP verified successfully" 
    });
  } catch (e: any) {
    console.error("Verify OTP error:", e);
    return res.status(500).json({ error: "Failed to verify code. Please try again." });
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

    // Check OTP verification - must be verified
    const otpEntry = otpStore.get(email);
    if (!otpEntry || !otpEntry.otp_verified) {
      return res.status(400).json({ 
        success: false,
        error: "Email not verified. Please verify your email with OTP first." 
      });
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
    console.error("Registration error:", e);
    return res.status(500).json({ error: "Failed to complete registration. Please try again." });
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
      .maybeSingle();

    // Handle Supabase errors (e.g., connection issues)
    if (error) {
      console.error("Supabase error during login:", error);
      return res.status(500).json({ error: "Database error. Please try again." });
    }

    // User not found - this is expected for unregistered emails
    if (!owner) {
      return res.status(401).json({ error: "No account found. Please register first." });
    }

    // Check if user has password
    if (!owner.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, owner.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    try {
      const token = jwt.sign({ id: owner.id }, ENV.JWT_SECRET, { expiresIn: "7d" });
      return res.json({ token, user: { id: owner.id, email: owner.email } });
    } catch (jwtError: any) {
      console.error("JWT signing error:", jwtError);
      return res.status(500).json({ error: "Failed to generate authentication token. Please try again." });
    }
  } catch (e: any) {
    console.error("Login error:", e);
    // Handle specific error types
    if (e.message?.includes("JWT_SECRET") || e.message?.includes("token")) {
      return res.status(500).json({ error: "Authentication service error. Please contact support." });
    }
    // Don't expose internal error details to client
    return res.status(500).json({ error: "An error occurred during login. Please try again." });
  }
});

// POST /auth/forgot-password/send-otp - Send OTP for password reset
router.post("/forgot-password/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "email is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if email exists in users table
    const { data: existingUser, error: dbError } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("email", email)
      .eq("role", "owner")
      .maybeSingle();

    // Handle database errors
    if (dbError) {
      console.error("Database error during forgot password:", dbError);
      return res.status(500).json({ error: "Database error. Please try again." });
    }

    // Email does NOT exist - show error
    if (!existingUser) {
      return res.status(404).json({ error: "Email is not registered" });
    }

    // STRICT COOLDOWN CHECK for password reset
    const existingEntry = passwordResetOtpStore.get(email);
    const now = Date.now();
    
    if (existingEntry?.last_otp_sent_at) {
      const timeSinceLastRequest = now - existingEntry.last_otp_sent_at;
      if (timeSinceLastRequest < OTP_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((OTP_COOLDOWN_MS - timeSinceLastRequest) / 1000);
        return res.status(429).json({ 
          success: false,
          error: "Please wait 2 minutes before requesting another OTP",
          cooldownSeconds: remainingSeconds,
          message: `Please wait ${remainingSeconds} seconds before requesting another OTP`
        });
      }
    }

    // Generate NEW OTP only after cooldown check passes
    const otp = generateOTP();
    const otp_created_at = now;
    const otp_expires_at = now + (10 * 60 * 1000); // 10 minutes for password reset

    passwordResetOtpStore.set(email, {
      otp,
      otp_created_at,
      otp_expires_at,
      last_otp_sent_at: now,
      otp_attempts: 0,
      otp_verified: false,
    });

    // Send email
    try {
      await sendEmailOTP(email, otp, existingUser.name || "User", true);
    } catch (emailError: any) {
      console.error("Failed to send password reset OTP email:", emailError);
      passwordResetOtpStore.delete(email);
      return res.status(500).json({ error: "Failed to send OTP email" });
    }

    return res.json({ message: "OTP sent to email" });
  } catch (e: any) {
    console.error("Send password reset OTP error:", e);
    return res.status(500).json({ error: "Failed to send verification code. Please try again." });
  }
});

// POST /auth/forgot-password/verify-otp - Verify OTP for password reset
router.post("/forgot-password/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "email is required" });
    }
    if (!otp || typeof otp !== "string") {
      return res.status(400).json({ error: "otp is required" });
    }

    const entry = passwordResetOtpStore.get(email);

    // No OTP found
    if (!entry) {
      return res.status(400).json({ error: "No OTP found. Please request a new code." });
    }

    // Check if already verified
    if (entry.otp_verified) {
      return res.status(400).json({ 
        success: false,
        error: "OTP has already been verified. Please request a new code." 
      });
    }

    // Check if expired
    const now = Date.now();
    if (now > entry.otp_expires_at) {
      passwordResetOtpStore.delete(email);
      return res.status(400).json({ 
        success: false,
        error: "OTP expired. Please request a new code." 
      });
    }

    // Check attempt limit
    if (entry.otp_attempts >= MAX_OTP_ATTEMPTS) {
      passwordResetOtpStore.delete(email);
      return res.status(400).json({ 
        success: false,
        error: "Maximum verification attempts exceeded. Please request a new code." 
      });
    }

    // Verify OTP - exact match required
    if (otp.trim() !== entry.otp.trim()) {
      entry.otp_attempts++;
      passwordResetOtpStore.set(email, entry);
      const remainingAttempts = MAX_OTP_ATTEMPTS - entry.otp_attempts;
      return res.status(400).json({ 
        success: false,
        error: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
        remainingAttempts
      });
    }

    // OTP is correct - mark as verified
    passwordResetOtpStore.set(email, { 
      ...entry, 
      otp_verified: true 
    });
    
    return res.status(200).json({ 
      success: true,
      verified: true, 
      message: "OTP verified successfully" 
    });
  } catch (e: any) {
    console.error("Verify password reset OTP error:", e);
    return res.status(500).json({ error: "Failed to verify code. Please try again." });
  }
});

// POST /auth/forgot-password/reset - Reset password with verified OTP
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

    // Validate password length
    if (newPassword.trim().length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check OTP verification - must be verified
    const entry = passwordResetOtpStore.get(email);
    const now = Date.now();
    
    if (!entry || !entry.otp_verified) {
      return res.status(400).json({ 
        success: false,
        error: "OTP not verified. Please verify your OTP first." 
      });
    }

    // Verify OTP one more time before reset
    if (otp.trim() !== entry.otp.trim()) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid OTP" 
      });
    }

    // Check if OTP expired
    if (now > entry.otp_expires_at) {
      passwordResetOtpStore.delete(email);
      return res.status(400).json({ 
        success: false,
        error: "OTP expired. Please request a new code." 
      });
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .eq("role", "owner")
      .maybeSingle();

    if (userError || !user) {
      console.error("User not found during password reset:", userError);
      return res.status(404).json({ error: "User not found" });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    const { error: updateError } = await supabase
      .from("users")
      .update({ passwordHash })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating password:", updateError);
      return res.status(500).json({ error: "Failed to reset password. Please try again." });
    }

    // Clear OTP from memory
    passwordResetOtpStore.delete(email);

    return res.json({ message: "Password reset successfully" });
  } catch (e: any) {
    console.error("Reset password error:", e);
    return res.status(500).json({ error: "Failed to reset password. Please try again." });
  }
});

export default router;
