"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OtpInput from "@/components/OtpInput";
import { getApiUrl } from "@/lib/auth";


export default function ForgotPasswordPage() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Field-level error state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // OTP state
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // OTP Timer - 10 minutes (600 seconds)
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  const emailIsValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  // Validate field on blur
  const handleFieldBlur = (fieldName: string, value: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    const newErrors: Record<string, string> = { ...errors };

    if (fieldName === "email") {
      if (!emailIsValid(value)) {
        newErrors.email = "Invalid email address";
      } else {
        delete newErrors.email;
      }
    } else if (fieldName === "newPassword") {
      if (value.trim().length < 6) {
        newErrors.newPassword = "Password must be at least 6 characters";
      } else {
        delete newErrors.newPassword;
      }
    } else if (fieldName === "confirmPassword") {
      if (value !== newPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      } else {
        delete newErrors.confirmPassword;
      }
    }

    setErrors(newErrors);
  };

  // Validate field on change (if already touched)
  const handleFieldChange = (fieldName: string, value: string) => {
    if (fieldName === "email") {
      setEmail(value);
      if (touched.email) {
        if (!emailIsValid(value)) {
          setErrors((prev) => ({ ...prev, email: "Invalid email address" }));
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.email;
            return newErrors;
          });
        }
      }
    } else if (fieldName === "newPassword") {
      setNewPassword(value);
      if (touched.newPassword && value.trim().length < 6) {
        setErrors((prev) => ({ ...prev, newPassword: "Password must be at least 6 characters" }));
      } else if (touched.newPassword) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.newPassword;
          return newErrors;
        });
      }
      // Re-check confirm password if it's been touched
      if (touched.confirmPassword && confirmPassword !== value) {
        setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
      } else if (touched.confirmPassword) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.confirmPassword;
          return newErrors;
        });
      }
    } else if (fieldName === "confirmPassword") {
      setConfirmPassword(value);
      if (touched.confirmPassword && value !== newPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
      } else if (touched.confirmPassword) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.confirmPassword;
          return newErrors;
        });
      }
    }
  };

  // Send OTP
  const handleSendOtp = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!emailIsValid(email)) {
      setError("Please enter a valid email address.");
      setTouched((prev) => ({ ...prev, email: true }));
      return;
    }

    // Prevent double-click - disable immediately
    if (otpSending) {
      return;
    }

    setOtpSending(true);
    setError("");

    try {
      const res = await fetch(getApiUrl("/auth/forgot-password/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 404) {
          setError("Email is not registered. Please check your email address.");
          setOtpSent(false);
        } else if (res.status === 429) {
          // Cooldown active - set countdown from server response
          const cooldownSeconds = data.cooldownSeconds || 120;
          setOtpCountdown(cooldownSeconds);
          setOtpSent(true); // Show OTP input even during cooldown
          setError(data.error || "Please wait before requesting another code.");
        } else {
          setError(data.error || "Failed to send OTP");
          setOtpSent(false);
        }
        return;
      }

      // CRITICAL: Set otpSent to true IMMEDIATELY after successful API call
      setOtpSent(true);
      setOtpCountdown(120); // 2 minutes cooldown
      setOtp(["", "", "", "", "", ""]);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.");
      setOtpSent(false);
    } finally {
      setOtpSending(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setOtpVerifying(true);
    setError("");

    try {
      const res = await fetch(getApiUrl("/auth/forgot-password/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMessage = data.error || "Invalid OTP";
        setError(errorMessage);
        // Don't clear OTP on error - allow retry
        return;
      }

      const data = await res.json();

      if (data.verified) {
        setOtpVerified(true);
        setError("");
      } else {
        setError("Verification failed");
      }
    } catch (err: any) {
      setError(err.message || "OTP verification failed");
      // Don't clear OTP on error - allow retry
    } finally {
      setOtpVerifying(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setOtpCountdown(0);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    await handleSendOtp();
  };

  // Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpVerified) {
      setError("Please verify your email with OTP before resetting password.");
      return;
    }

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please verify your OTP first.");
      return;
    }

    if (!newPassword || newPassword.trim().length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(getApiUrl("/auth/forgot-password/reset"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: otpString,
          newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const formValid =
    emailIsValid(email) &&
    !errors.email &&
    otpVerified &&
    newPassword.trim().length >= 6 &&
    !errors.newPassword &&
    newPassword === confirmPassword &&
    !errors.confirmPassword;

  return (
    <>
      <Navbar />
      <main className="bg-[#F7F7F7] min-h-screen pt-28 pb-16 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
        <div className="container mx-auto flex min-h-[calc(100vh-9rem)] items-center justify-center px-4 sm:px-6 lg:px-8">
          <section className="w-full max-w-md">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-lg shadow-slate-200">
              <div className="space-y-2 text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Password Recovery</p>
                <h2 className="text-3xl font-semibold text-slate-900">Reset Password</h2>
                <p className="text-sm text-slate-500">
                  Enter your email to receive a verification code
                </p>
              </div>

              {success ? (
                <div className="mt-8 space-y-4">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="text-center text-sm font-medium text-green-700">
                      ✓ Password reset successfully! Redirecting to login...
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="mt-8 space-y-4">
                  <div className="block text-sm font-medium text-slate-700">
                    <label htmlFor="email-input">
                      Email address
                    </label>
                    <div className="mt-2 flex gap-2">
                      <input
                        id="email-input"
                        type="email"
                        placeholder="owner@example.com"
                        value={email}
                        onChange={(e) => handleFieldChange("email", e.target.value)}
                        onBlur={(e) => handleFieldBlur("email", e.target.value)}
                        disabled={otpSent}
                        className={`flex-1 rounded-2xl border px-4 py-3 text-slate-900 focus:bg-white focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                          touched.email && errors.email
                            ? "border-red-300 bg-red-50"
                            : "border-slate-200 bg-slate-50 focus:border-brand-accent"
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={(e) => handleSendOtp(e)}
                        disabled={!emailIsValid(email) || otpSending || otpVerified || (otpSent && otpCountdown > 0)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap min-w-[100px]"
                      >
                        {otpSending ? "Sending..." : otpVerified ? "✓ Verified" : otpSent && otpCountdown > 0 ? `${Math.ceil(otpCountdown / 60)}:${String(otpCountdown % 60).padStart(2, '0')}` : otpSent ? "Sent" : "Send OTP"}
                      </button>
                    </div>
                    {touched.email && errors.email && (
                      <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                    )}
                    {otpSent && (
                      <p className="mt-2 text-xs text-center text-green-600 font-medium">
                        ✓ Verification code sent to {email}
                      </p>
                    )}

                    {/* OTP INPUT UI - RENDERS WHEN otpSent === true */}
                    {otpSent && !otpVerified && (
                      <div className="mt-4 animate-[fadeIn_0.3s_ease-out]">
                        <OtpInput
                          otp={otp}
                          setOtp={setOtp}
                          onVerify={handleVerifyOtp}
                          verifying={otpVerifying}
                          countdown={otpCountdown}
                          onResend={handleResendOtp}
                          resending={otpSending}
                        />
                      </div>
                    )}
                  </div>

                  {/* Password fields - only show after OTP is verified */}
                  {otpVerified && (
                    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                        <p className="text-sm font-medium text-green-700">✓ Email verified successfully</p>
                      </div>

                      <label className="block text-sm font-medium text-slate-700">
                        New password
                        <input
                          type="password"
                          placeholder="At least 6 characters"
                          value={newPassword}
                          onChange={(e) => handleFieldChange("newPassword", e.target.value)}
                          onBlur={(e) => handleFieldBlur("newPassword", e.target.value)}
                          className={`mt-2 w-full rounded-2xl border px-4 py-3 text-slate-900 focus:bg-white focus:outline-none ${
                            touched.newPassword && errors.newPassword
                              ? "border-red-300 bg-red-50"
                              : "border-slate-200 bg-slate-50 focus:border-brand-accent"
                          }`}
                          required
                        />
                        {touched.newPassword && errors.newPassword && (
                          <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>
                        )}
                      </label>

                      <label className="block text-sm font-medium text-slate-700">
                        Confirm new password
                        <input
                          type="password"
                          placeholder="Repeat your new password"
                          value={confirmPassword}
                          onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
                          onBlur={(e) => handleFieldBlur("confirmPassword", e.target.value)}
                          className={`mt-2 w-full rounded-2xl border px-4 py-3 text-slate-900 focus:bg-white focus:outline-none ${
                            touched.confirmPassword && errors.confirmPassword
                              ? "border-red-300 bg-red-50"
                              : "border-slate-200 bg-slate-50 focus:border-brand-accent"
                          }`}
                          required
                        />
                        {touched.confirmPassword && errors.confirmPassword && (
                          <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                        )}
                      </label>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-center text-sm font-medium text-red-700">{error}</p>
                    </div>
                  )}

                  {otpVerified && (
                    <button
                      type="submit"
                      disabled={!formValid || loading}
                      className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "Resetting..." : "Reset Password"}
                    </button>
                  )}
                </form>
              )}

              <p className="mt-6 text-center text-sm text-slate-500">
                Remember your password?{" "}
                <Link href="/login" className="font-semibold text-brand-accent hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
 
  
 