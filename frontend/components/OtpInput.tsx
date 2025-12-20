"use client";
import { useState, useEffect, useRef } from "react";

interface OtpInputProps {
  otp: string[];
  setOtp: (otp: string[]) => void;
  onVerify: () => void;
  verifying: boolean;
  countdown: number;
  onResend: () => void;
  resending: boolean;
  disabled?: boolean;
}

export default function OtpInput({
  otp,
  setOtp,
  onVerify,
  verifying,
  countdown,
  onResend,
  resending,
  disabled = false,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    if (otp.every((d) => d === "")) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [otp]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
          Enter verification code
        </label>
        <div className="flex justify-center gap-2">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <input
              key={`otp-${index}`}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={otp[index] || ""}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => {
                try {
                  e.preventDefault();
                  const pastedText = e.clipboardData.getData("text");
                  if (!pastedText) return;
                  
                  const digits = pastedText.replace(/\D/g, "").slice(0, 6).split("");
                  const newOtp: string[] = ["", "", "", "", "", ""];
                  digits.forEach((digit, i) => {
                    if (i < 6 && /^\d$/.test(digit)) {
                      newOtp[i] = digit;
                    }
                  });
                  setOtp(newOtp);
                  const lastIndex = digits.length < 6 ? Math.max(0, digits.length - 1) : 5;
                  setTimeout(() => {
                    if (inputRefs.current[lastIndex]) {
                      inputRefs.current[lastIndex]?.focus();
                    }
                  }, 0);
                } catch (err) {
                  console.error("Paste error:", err);
                  // Silently fail - user can type manually
                }
              }}
              className="w-12 h-14 text-center text-2xl font-mono font-semibold rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 focus:border-brand-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all disabled:opacity-50"
              disabled={verifying || disabled}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-center text-slate-500">
          Enter the code we sent to your email
        </p>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onResend}
          disabled={resending || countdown > 0}
          className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed transition-colors"
        >
          {resending ? (
            "Sending code..."
          ) : countdown > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <span>Resend code in</span>
              <span className="font-mono font-semibold text-slate-700">{formatTime(countdown)}</span>
            </span>
          ) : (
            "Resend verification code"
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={onVerify}
        disabled={otp.join("").length !== 6 || verifying}
        className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {verifying ? "Verifying..." : "Verify code"}
      </button>
    </div>
  );
}



