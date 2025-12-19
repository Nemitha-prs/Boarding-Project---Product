    }

    // Hash new password
import { supabase } from "../supabase";
import { ENV } from "../env";
import { sendEmailOTP } from "../services/email";
    const { error: updateError } = await supabase
      .from("users")
      .update({ passwordHash })
      .eq("id", user.id);
// In-memory OTP store with strict tracking
    if (updateError) {
      console.error("Error updating password:", updateError);
  otp_created_at: number; // When OTP was generated
  otp_expires_at: number; // When OTP expires (5 minutes)
  last_otp_sent_at: number; // When OTP was last sent (for cooldown)
  otp_attempts: number; // Verification attempts
  otp_verified: boolean; // Whether OTP was successfully verified
    // Clear OTP from memory
    passwordResetOtpStore.delete(email);

    return res.json({ message: "Password reset successfully" });
  } catch (e: any) {
    console.error("Reset password error:", e);
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

    return res.status(500).json({ error: "Failed to reset password. Please try again." });
  }
});

export default router;
    // Check if user has password    // Hash new password    // Update password      console.error("Error updating password:", updateError);    // STRICT COOLDOWN CHECK - Must happen BEFORE any OTP generation
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

    // Generate NEW OTP only after cooldown check passes    const otp_created_at = now;
    const otp_expires_at = now + OTP_EXPIRY_MS;    // Store OTP BEFORE sending email (so we have it even if email fails)
      otp_created_at,
      otp_expires_at,
      last_otp_sent_at: now,
      otp_attempts: 0,
      otp_verified: false,    // Send email - if this fails, OTP is still stored but user won't receive it      // Remove OTP if email failed - user can't verify what they didn't receive
      return res.status(500).json({ 
        success: false,
        error: "Failed to send OTP email. Please try again." 
      });    // ONLY return success if email was actually sent
    return res.status(200).json({ 
      success: true,
      message: "OTP sent to email",
      cooldownSeconds: 120
    });    // Check if already verified
    if (entry.otp_verified) {
      return res.status(400).json({ 
        success: false,
        error: "OTP has already been verified. Please request a new code." 
      });
    }

    // Check if expired
    const now = Date.now();
    if (now > entry.otp_expires_at) {      return res.status(400).json({ 
        success: false,
        error: "OTP expired. Please request a new code." 
      });    // Check attempt limit
    if (entry.otp_attempts >= MAX_OTP_ATTEMPTS) {      return res.status(400).json({ 
        success: false,
        error: "Maximum verification attempts exceeded. Please request a new code." 
      });    // Verify OTP - exact match required      entry.otp_attempts++;      const remainingAttempts = MAX_OTP_ATTEMPTS - entry.otp_attempts;
      return res.status(400).json({ 
        success: false,
        error: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
        remainingAttempts
      });    // OTP is correct - mark as verified
    otpStore.set(email, { 
      ...entry, 
      otp_verified: true 
    });
    
    return res.status(200).json({ 
      success: true,
      verified: true, 
      message: "OTP verified successfully" 
    });    // Check OTP verification - must be verified    if (!otpEntry || !otpEntry.otp_verified) {
      return res.status(400).json({ 
        success: false,
        error: "Email not verified. Please verify your email with OTP first." 
      });    // Check if user has password    // STRICT COOLDOWN CHECK for password reset
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

    // Generate NEW OTP only after cooldown check passes    const otp_created_at = now;
    const otp_expires_at = now + (10 * 60 * 1000); // 10 minutes for password reset      otp_created_at,
      otp_expires_at,
      last_otp_sent_at: now,
      otp_attempts: 0,
      otp_verified: false,    // Check if already verified
    if (entry.otp_verified) {
      return res.status(400).json({ 
        success: false,
        error: "OTP has already been verified. Please request a new code." 
      });
    }

    // Check if expired
    const now = Date.now();
    if (now > entry.otp_expires_at) {      return res.status(400).json({ 
        success: false,
        error: "OTP expired. Please request a new code." 
      });    // Check attempt limit
    if (entry.otp_attempts >= MAX_OTP_ATTEMPTS) {      return res.status(400).json({ 
        success: false,
        error: "Maximum verification attempts exceeded. Please request a new code." 
      });    // Verify OTP - exact match required      entry.otp_attempts++;      const remainingAttempts = MAX_OTP_ATTEMPTS - entry.otp_attempts;
      return res.status(400).json({ 
        success: false,
        error: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
        remainingAttempts
      });    // OTP is correct - mark as verified
    passwordResetOtpStore.set(email, { 
      ...entry, 
      otp_verified: true 
    });
    
    return res.status(200).json({ 
      success: true,
      verified: true, 
      message: "OTP verified successfully" 
    });    // Check OTP verification - must be verified    const now = Date.now();
    
    if (!entry || !entry.otp_verified) {
      return res.status(400).json({ 
        success: false,
        error: "OTP not verified. Please verify your OTP first." 
      });      return res.status(400).json({ 
        success: false,
        error: "Invalid OTP" 
      });    if (now > entry.otp_expires_at) {      return res.status(400).json({ 
        success: false,
        error: "OTP expired. Please request a new code." 
      });    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    const { error: updateError } = await supabase
      .from("users")
      .update({ passwordHash })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating password:", updateError);
      return res.status(500).json({ error: "Failed to reset password. Please try again." });
    // Clear OTP from memory
    passwordResetOtpStore.delete(email);

    return res.json({ message: "Password reset successfully" });
  } catch (e: any) {
    console.error("Reset password error:", e);
    return res.status(500).json({ error: "Failed to reset password. Please try again." });
});