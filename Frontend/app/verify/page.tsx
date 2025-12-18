"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getApiUrl, setToken } from "@/lib/auth";
import { getCurrentUserRole } from "@/lib/jwt";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [isTimerActive, setIsTimerActive] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

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

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Handle paste
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, "").slice(0, 6).split("");
        const newOtp = [...otp];
        digits.forEach((digit, i) => {
          if (i < 6) newOtp[i] = digit;
        });
        setOtp(newOtp);
        // Focus last filled input or first empty
        const lastIndex = digits.length < 6 ? digits.length : 5;
        inputRefs.current[lastIndex]?.focus();
      });
    }
  };

  async function sendOTP() {
    if (!email) {
      setError("Email is required");
      return;
    }
    setSending(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(getApiUrl("/auth/send-email-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send OTP");
      }
      setSuccess("OTP sent to your email");
      setIsTimerActive(true);
      setCountdown(300); // Reset to 5 minutes
      setOtp(["", "", "", "", "", ""]); // Clear OTP inputs
      inputRefs.current[0]?.focus(); // Focus first input
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setSending(false);
    }
  }

  async function verifyOTP() {
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
      const res = await fetch(getApiUrl("/auth/verify-email"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Invalid OTP");
      }

      const responseData = await res.json();
      
      if (responseData.token) {
        setToken(responseData.token);
        setSuccess("Email verified successfully! Redirecting...");
        window.dispatchEvent(new Event("storage"));
        
        // Get user role and redirect
        const role = getCurrentUserRole();
        const redirectUrl = role === "owner" ? "/owner-dashboard" : "/";
        
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1500);
      } else {
        throw new Error("Failed to receive authentication token");
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  const otpComplete = otp.every((digit) => digit !== "");

  return (
    <>
      <Navbar />
      <main className="bg-[#F7F7F7] min-h-screen pt-28 pb-16 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
        <div className="container mx-auto flex min-h-[calc(100vh-9rem)] items-center justify-center px-4 sm:px-6 lg:px-8">
          <section className="w-full max-w-md">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-lg shadow-slate-200">
              <div className="space-y-2 text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Verification</p>
                <h2 className="text-3xl font-semibold text-slate-900">Verify your email</h2>
                <p className="text-sm text-slate-500">
                  Enter the 6-digit code sent to <span className="font-medium">{email || "your email"}</span>
                </p>
              </div>

              <div className="mt-6 space-y-6">
                {/* Email display */}
                {email && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled
                      className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-900"
                    />
                  </div>
                )}

                {/* 6-digit OTP input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
                    Enter verification code
                  </label>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
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

                {/* Timer and Resend */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={sendOTP}
                    disabled={sending || isTimerActive}
                    className="text-sm font-semibold text-brand-accent hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? "Sending..." : isTimerActive ? `Resend in ${formatTime(countdown)}` : "Resend code"}
                  </button>
                  {isTimerActive && (
                    <span className="text-sm text-slate-500 font-mono">
                      {formatTime(countdown)}
                    </span>
                  )}
                </div>

                {/* Verify button */}
                <button
                  type="button"
                  onClick={verifyOTP}
                  disabled={!otpComplete || loading}
                  className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Verifying..." : "Verify email"}
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-center text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              {/* Success message */}
              {success && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-center text-sm font-medium text-green-700">{success}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
