"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (isTimerActive && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setIsTimerActive(false);
    }
  }, [isTimerActive, countdown]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const emailIsValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, "").slice(0, 6).split("");
        const newOtp = [...otp];
        digits.forEach((digit, i) => {
          if (i < 6) newOtp[i] = digit;
        });
        setOtp(newOtp);
        const lastIndex = digits.length < 6 ? digits.length : 5;
        inputRefs.current[lastIndex]?.focus();
      });
    }
  };

  const handleSendOTP = async () => {
    if (!emailIsValid(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(getApiUrl("/auth/forgot-password/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
          // Cooldown enforced by backend
          const cooldownSeconds = data.cooldownSeconds || 120;
          setCountdown(cooldownSeconds);
          setIsTimerActive(true);
          setError(data.error || "Please wait before requesting another OTP");
          return;
        }
        throw new Error(data.error || "Failed to send OTP");
      }

      setSuccess("OTP sent to your email");
      setStep("otp");
      setIsTimerActive(true);
      setCountdown(120); // 2 minutes cooldown
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code");
      inputRefs.current[otp.findIndex((digit) => !digit)]?.focus();
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(getApiUrl("/auth/forgot-password/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Invalid OTP");
      }

      setSuccess("OTP verified successfully");
      setStep("reset");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Verification failed");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    // Prevent double submission
    if (loading) {
      return;
    }
    
    if (newPassword.trim().length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const otpString = otp.join("");
      const res = await fetch(getApiUrl("/auth/forgot-password/reset"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const otpComplete = otp.every((digit) => digit !== "");
  const passwordValid = newPassword.trim().length >= 6 && newPassword === confirmPassword;

  return (
    <>
      <Navbar />
      <main className="bg-[#F7F7F7] min-h-screen pt-28 pb-16 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
        <div className="container mx-auto flex min-h-[calc(100vh-9rem)] items-center justify-center px-4 sm:px-6 lg:px-8">
          <section className="w-full max-w-md">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-lg shadow-slate-200">
              <div className="space-y-2 text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Password Reset</p>
                <h2 className="text-3xl font-semibold text-slate-900">
                  {step === "email" && "Forgot Password"}
                  {step === "otp" && "Verify OTP"}
                  {step === "reset" && "Reset Password"}
                </h2>
                <p className="text-sm text-slate-500">
                  {step === "email" && "Enter your email to receive a verification code"}
                  {step === "otp" && `Enter the 6-digit code sent to ${email}`}
                  {step === "reset" && "Enter your new password"}
                </p>
              </div>

              <div className="mt-6 space-y-6">
                {/* Step 1: Email Input */}
                {step === "email" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="you@example.com"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-brand-accent focus:bg-white focus:outline-none"
                        disabled={sending}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={!emailIsValid(email) || sending || (isTimerActive && countdown > 0)}
                      className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sending ? "Sending..." : isTimerActive && countdown > 0 ? `Resend in ${formatTime(countdown)}` : "Send OTP"}
                    </button>
                  </>
                )}

                {/* Step 2: OTP Input */}
                {step === "otp" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
                        Enter verification code
                      </label>
                      <div className="flex justify-center gap-2">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-12 h-14 text-center text-2xl font-mono font-semibold rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 focus:border-brand-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all"
                            disabled={loading}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          if (countdown > 0) {
                            setError(`Please wait ${Math.ceil(countdown / 60)} minute(s) before resending`);
                            return;
                          }
                          handleSendOTP();
                        }}
                        disabled={sending || (isTimerActive && countdown > 0)}
                        className="text-sm font-semibold text-brand-accent hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed transition-colors"
                      >
                        {sending ? "Sending..." : isTimerActive && countdown > 0 ? `Resend in ${formatTime(countdown)}` : "Resend code"}
                      </button>
                      {isTimerActive && (
                        <span className="text-sm text-slate-500 font-mono">
                          {formatTime(countdown)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyOTP}
                      disabled={!otpComplete || loading}
                      className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                  </>
                )}

                {/* Step 3: Reset Password */}
                {step === "reset" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="Enter new password"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-brand-accent focus:bg-white focus:outline-none"
                        disabled={loading}
                      />
                      {newPassword && newPassword.trim().length < 6 && (
                        <p className="mt-1 text-xs text-red-500">Password must be at least 6 characters</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="Confirm new password"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-brand-accent focus:bg-white focus:outline-none"
                        disabled={loading}
                      />
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={!passwordValid || loading}
                      className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "Resetting..." : "Reset Password"}
                    </button>
                  </>
                )}

                {/* Error message */}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-center text-sm font-medium text-red-700">{error}</p>
                  </div>
                )}

                {/* Success message */}
                {success && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <p className="text-center text-sm font-medium text-green-700">{success}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm font-semibold text-brand-accent hover:underline">
                  Back to login
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

