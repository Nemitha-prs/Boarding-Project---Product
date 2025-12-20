"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OtpInput from "@/components/OtpInput";
import { getApiUrl } from "@/lib/auth";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

type Step = "email" | "otp" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Loading states
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  
  // UI states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);

  // OTP Timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  const emailIsValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailIsValid(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setSendingOtp(true);
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
          const cooldownSeconds = data.cooldownSeconds || 120;
          setOtpCountdown(cooldownSeconds);
          setError(data.error || "Please wait before requesting another code");
          return;
        }
        throw new Error(data.error || "Failed to send OTP");
      }

      setSuccess("OTP sent to your email");
      setStep("otp");
      setOtpCountdown(120); // 2 minutes cooldown
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setVerifyingOtp(true);
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

      const data = await res.json();
      if (data.verified) {
        setOtpVerified(true);
        setStep("reset");
        setSuccess("OTP verified successfully");
        setError("");
      } else {
        setError("Verification failed");
      }
    } catch (err: any) {
      setError(err.message || "OTP verification failed");
      setOtp(["", "", "", "", "", ""]);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!otpVerified) {
      setError("Please verify your OTP first");
      return;
    }

    setResettingPassword(true);
    setError("");
    setSuccess("");

    try {
      const otpString = otp.join("");
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

      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setResettingPassword(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setResendingOtp(true);
    setOtpCountdown(0);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    
    try {
      const res = await fetch(getApiUrl("/auth/forgot-password/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
          const cooldownSeconds = data.cooldownSeconds || 120;
          setOtpCountdown(cooldownSeconds);
          setError(data.error || "Please wait before requesting another code");
        } else {
          setError(data.error || "Failed to resend OTP");
        }
        return;
      }

      setSuccess("OTP resent to your email");
      setOtpCountdown(120);
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setResendingOtp(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="bg-[#F7F7F7] min-h-screen pt-28 pb-16">
        <div className="container mx-auto flex min-h-[calc(100vh-9rem)] items-center justify-center px-4">
          <section className="w-full max-w-md">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-lg shadow-slate-200">
              <div className="space-y-2 text-center mb-6">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Password Recovery</p>
                <h2 className="text-3xl font-semibold text-slate-900">
                  {step === "email" && "Forgot Password"}
                  {step === "otp" && "Verify Your Email"}
                  {step === "reset" && "Reset Password"}
                </h2>
                <p className="text-sm text-slate-500">
                  {step === "email" && "Enter your email to receive a verification code"}
                  {step === "otp" && `Enter the 6-digit code sent to ${email}`}
                  {step === "reset" && "Enter your new password"}
                </p>
              </div>

              {/* Step 1: Email Input */}
              {step === "email" && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email address
                    </label>
                    <input
                      type="email"
                      placeholder="owner@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:bg-white focus:outline-none focus:border-brand-accent"
                      required
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-center text-sm font-medium text-red-700">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                      <p className="text-center text-sm font-medium text-green-700">{success}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!emailIsValid(email) || sendingOtp}
                    className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sendingOtp ? "Sending..." : "Send Verification Code"}
                  </button>

                  <div className="text-center">
                    <Link
                      href="/login"
                      className="text-sm text-slate-600 hover:text-slate-900 hover:underline transition-colors"
                    >
                      Back to login
                    </Link>
                  </div>
                </form>
              )}

              {/* Step 2: OTP Input */}
              {step === "otp" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-900"
                    />
                  </div>

                  <OtpInput
                    otp={otp}
                    setOtp={setOtp}
                    onVerify={handleVerifyOtp}
                    verifying={verifyingOtp}
                    countdown={otpCountdown}
                    onResend={handleResendOtp}
                    resending={resendingOtp}
                  />

                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-center text-sm font-medium text-red-700">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                      <p className="text-center text-sm font-medium text-green-700">{success}</p>
                    </div>
                  )}

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setError("");
                        setSuccess("");
                        setOtp(["", "", "", "", "", ""]);
                      }}
                      className="text-sm text-slate-600 hover:text-slate-900 hover:underline transition-colors"
                    >
                      Change email
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Reset Password */}
              {step === "reset" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError("");
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:bg-white focus:outline-none focus:border-brand-accent"
                      required
                      minLength={6}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:bg-white focus:outline-none focus:border-brand-accent"
                      required
                      minLength={6}
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-center text-sm font-medium text-red-700">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                      <p className="text-center text-sm font-medium text-green-700">{success}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={newPassword.length < 6 || newPassword !== confirmPassword || resettingPassword}
                    className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resettingPassword ? "Resetting..." : "Reset Password"}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("otp");
                        setError("");
                        setSuccess("");
                      }}
                      className="text-sm text-slate-600 hover:text-slate-900 hover:underline transition-colors"
                    >
                      Back to verification
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
