"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OtpInput from "@/components/OtpInput";
import { getApiUrl, setToken } from "@/lib/auth";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form state
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [nic, setNic] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Field-level error state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // OTP state - ONLY string[] of length 6
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  
  // Ref to prevent race conditions - tracks if request is in flight
  const otpRequestInFlight = useRef(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // OTP Timer - 2 minutes (120 seconds) cooldown
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  const emailIsValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const isValidSriLankanNic = (value: string) => {
    const oldNic = /^[0-9]{9}[Vv]$/;
    const newNic = /^[0-9]{12}$/;
    return oldNic.test(value) || newNic.test(value);
  };

  const isValidPhone = (value: string) => {
    return /^[0-9]{10}$/.test(value);
  };

  // Check email availability
  const checkEmailExists = async (emailValue: string) => {
    if (!emailIsValid(emailValue)) {
      setEmailExists(false);
      return;
    }

    setCheckingEmail(true);
    try {
      const res = await fetch(`${getApiUrl("/auth/check-email")}?email=${encodeURIComponent(emailValue)}`);
      if (res.ok) {
        const data = await res.json();
        setEmailExists(data.exists);
        if (data.exists) {
          setErrors((prev) => ({ ...prev, email: "Email already registered" }));
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.email;
            return newErrors;
          });
        }
      }
    } catch (err) {
      console.error("Error checking email:", err);
    } finally {
      setCheckingEmail(false);
    }
  };

  // Validate field on blur
  const handleFieldBlur = (fieldName: string, value: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    const newErrors: Record<string, string> = { ...errors };

    if (fieldName === "email") {
      if (!emailIsValid(value)) {
        newErrors.email = "Invalid email address";
      } else {
        checkEmailExists(value);
      }
    } else if (fieldName === "nic") {
      if (!isValidSriLankanNic(value)) {
        newErrors.nic = "Invalid NIC format";
      } else {
        delete newErrors.nic;
      }
    } else if (fieldName === "password") {
      if (value.trim().length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      } else {
        delete newErrors.password;
      }
    } else if (fieldName === "confirmPassword") {
      if (value !== password) {
        newErrors.confirmPassword = "Passwords do not match";
      } else {
        delete newErrors.confirmPassword;
      }
    } else if (fieldName === "phone") {
      if (!isValidPhone(value)) {
        newErrors.phone = "Phone must be 10 digits";
      } else {
        delete newErrors.phone;
      }
    } else if (fieldName === "name") {
      if (!value.trim()) {
        newErrors.name = "Full name is required";
      } else {
        delete newErrors.name;
      }
    } else if (fieldName === "age") {
      const ageNum = Number(value);
      if (!Number.isFinite(ageNum) || ageNum < 18 || ageNum > 100) {
        newErrors.age = "Enter a valid age between 18 and 100";
      } else {
        delete newErrors.age;
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
          checkEmailExists(value);
        }
      }
    } else if (fieldName === "password") {
      setPassword(value);
      if (touched.password && value.trim().length < 6) {
        setErrors((prev) => ({ ...prev, password: "Password must be at least 6 characters" }));
      } else if (touched.password) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.password;
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
      if (touched.confirmPassword && value !== password) {
        setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
      } else if (touched.confirmPassword) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.confirmPassword;
          return newErrors;
        });
      }
    } else if (fieldName === "nic") {
      setNic(value.trim());
      if (touched.nic && !isValidSriLankanNic(value.trim())) {
        setErrors((prev) => ({ ...prev, nic: "Invalid NIC format" }));
      } else if (touched.nic) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.nic;
          return newErrors;
        });
      }
    } else if (fieldName === "phone") {
      setPhone(value.replace(/\D/g, ""));
      if (touched.phone && !isValidPhone(value.replace(/\D/g, ""))) {
        setErrors((prev) => ({ ...prev, phone: "Phone must be 10 digits" }));
      } else if (touched.phone) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.phone;
          return newErrors;
        });
      }
    } else if (fieldName === "name") {
      setName(value);
      if (touched.name && !value.trim()) {
        setErrors((prev) => ({ ...prev, name: "Full name is required" }));
      } else if (touched.name) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.name;
          return newErrors;
        });
      }
    } else if (fieldName === "age") {
      setAge(value);
      const ageNum = Number(value);
      if (touched.age && (!Number.isFinite(ageNum) || ageNum < 18 || ageNum > 100)) {
        setErrors((prev) => ({ ...prev, age: "Enter a valid age between 18 and 100" }));
      } else if (touched.age) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.age;
          return newErrors;
        });
      }
    }
  };

  // Send OTP
  const handleSendOtp = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();

    // Early validation checks - return BEFORE setting loading state
    if (!emailIsValid(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter your name first.");
      return;
    }

    if (emailExists) {
      setError("Email already registered. Please log in.");
      return;
    }

    // Prevent double-click: use ref for immediate check (not dependent on React state)
    if (otpRequestInFlight.current) {
      return;
    }

    // Mark request as in flight IMMEDIATELY (synchronous)
    otpRequestInFlight.current = true;
    
    // Set loading state BEFORE making request
    setOtpSending(true);
    setError("");

    try {
      const res = await fetch(getApiUrl("/auth/send-email-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setError("Email already registered. Please log in.");
          setEmailExists(true);
          setOtpSending(false);
          otpRequestInFlight.current = false;
          return;
        }
        if (res.status === 429) {
          // Cooldown enforced by backend
          const cooldownSeconds = data.cooldownSeconds || 120;
          setOtpCountdown(cooldownSeconds);
          setError(data.error || "Please wait before requesting another OTP");
          setOtpSending(false);
          otpRequestInFlight.current = false;
          return;
        }
        throw new Error(data.error || "Failed to send OTP");
      }

      // CRITICAL: Only update state AFTER backend confirms success
      const data = await res.json().catch(() => ({}));
      
      // Backend confirmed OTP was sent - now update UI state
      setOtpSent(true);
      setOtpCountdown(120); // 2 minutes cooldown
      setOtp(["", "", "", "", "", ""]);
      setError("");
      setOtpSending(false);
      otpRequestInFlight.current = false;
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.");
      setOtpSent(false);
      setOtpSending(false);
      otpRequestInFlight.current = false;
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
      const res = await fetch(getApiUrl("/auth/verify-email-otp"), {
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

  // Resend OTP - only if cooldown has expired
  const handleResendOtp = async () => {
    if (otpCountdown > 0) {
      setError(`Please wait ${Math.ceil(otpCountdown / 60)} minute(s) before resending`);
      return;
    }
    setOtp(["", "", "", "", "", ""]);
    setError("");
    await handleSendOtp();
  };

  // Final registration submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (loading) {
      return;
    }

    if (!otpVerified) {
      setError("Please verify your email with OTP before completing registration.");
      return;
    }

    const ageNumber = Number(age);
    if (!name.trim() || !ageNumber || ageNumber < 18 || ageNumber > 100 || !isValidSriLankanNic(nic) || !isValidPhone(phone) || !password || password.length < 6) {
      setError("Please fill in all required fields correctly.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(getApiUrl("/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          age: ageNumber,
          NIC: nic,
          phone,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Registration failed");
      }

      const data = await res.json();

      if (data.token) {
        setToken(data.token);
        window.dispatchEvent(new Event("storage"));
        const redirect = searchParams.get("redirect");
        if (redirect) {
          router.push(redirect);
        } else {
          router.push("/owner-dashboard");
        }
      } else {
        throw new Error("No token received");
      }
    } catch (err: any) {
      setError(err.message || "Failed to complete registration.");
    } finally {
      setLoading(false);
    }
  };

  const ageNumber = Number(age);
  const formValid =
    name.trim().length > 0 &&
    !errors.name &&
    Number.isFinite(ageNumber) &&
    ageNumber >= 18 &&
    ageNumber <= 100 &&
    !errors.age &&
    isValidSriLankanNic(nic) &&
    !errors.nic &&
    isValidPhone(phone) &&
    !errors.phone &&
    emailIsValid(email) &&
    !errors.email &&
    !emailExists &&
    password.trim().length >= 6 &&
    !errors.password &&
    password === confirmPassword &&
    !errors.confirmPassword &&
    otpVerified;

  return (
    <>
      <Navbar />
      <main className="bg-[#F7F7F7] min-h-screen pt-28 pb-16 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
        <div className="container mx-auto flex min-h-[calc(100vh-9rem)] items-center justify-center px-4 sm:px-6 lg:px-8">
          <section className="w-full max-w-md">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-lg shadow-slate-200">
              <div className="space-y-2 text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Owner Registration</p>
                <h2 className="text-3xl font-semibold text-slate-900">Create Account</h2>
                <p className="text-sm text-slate-500">
                  Register as a boarding owner to list your properties
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  Full name
                  <input
                    type="text"
                    placeholder="Jane Perera"
                    value={name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    onBlur={(e) => handleFieldBlur("name", e.target.value)}
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 text-slate-900 focus:bg-white focus:outline-none ${
                      touched.name && errors.name
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 bg-slate-50 focus:border-brand-accent"
                    }`}
                    required
                  />
                  {touched.name && errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                  )}
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Age
                  <input
                    type="number"
                    min={18}
                    max={100}
                    placeholder="30"
                    value={age}
                    onChange={(e) => handleFieldChange("age", e.target.value)}
                    onBlur={(e) => handleFieldBlur("age", e.target.value)}
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 text-slate-900 focus:bg-white focus:outline-none ${
                      touched.age && errors.age
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 bg-slate-50 focus:border-brand-accent"
                    }`}
                    required
                  />
                  {touched.age && errors.age && (
                    <p className="mt-1 text-xs text-red-500">{errors.age}</p>
                  )}
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  NIC number
                  <input
                    type="text"
                    placeholder="123456789V or 123456789012"
                    value={nic}
                    onChange={(e) => handleFieldChange("nic", e.target.value)}
                    onBlur={(e) => handleFieldBlur("nic", e.target.value)}
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 text-slate-900 focus:bg-white focus:outline-none ${
                      touched.nic && errors.nic
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 bg-slate-50 focus:border-brand-accent"
                    }`}
                    required
                  />
                  {touched.nic && errors.nic && (
                    <p className="mt-1 text-xs text-red-500">{errors.nic}</p>
                  )}
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Phone number
                  <input
                    type="tel"
                    placeholder="0712345678"
                    value={phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    onBlur={(e) => handleFieldBlur("phone", e.target.value)}
                    maxLength={10}
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 text-slate-900 focus:bg-white focus:outline-none ${
                      touched.phone && errors.phone
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 bg-slate-50 focus:border-brand-accent"
                    }`}
                    required
                  />
                  {touched.phone && errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                  )}
                </label>

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
                      className={`flex-1 rounded-2xl border px-4 py-3 text-slate-900 focus:bg-white focus:outline-none ${
                        touched.email && errors.email
                          ? "border-red-300 bg-red-50"
                          : "border-slate-200 bg-slate-50 focus:border-brand-accent"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        // Ensure click is processed even if button appears disabled
                        e.preventDefault();
                        e.stopPropagation();
                        handleSendOtp(e);
                      }}
                      disabled={!emailIsValid(email) || otpSending || otpVerified || !name.trim() || emailExists || checkingEmail || otpCountdown > 0}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap min-w-[100px]"
                    >
                      {otpSending ? "Sending..." : otpVerified ? "✓ Verified" : otpCountdown > 0 ? `Resend in ${Math.ceil(otpCountdown / 60)}m` : "Send OTP"}
                    </button>
                  </div>
                  {touched.email && errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                  {checkingEmail && (
                    <p className="mt-1 text-xs text-slate-500">Checking email availability...</p>
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

                <label className="block text-sm font-medium text-slate-700">
                  Password
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => handleFieldChange("password", e.target.value)}
                    onBlur={(e) => handleFieldBlur("password", e.target.value)}
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 text-slate-900 focus:bg-white focus:outline-none ${
                      touched.password && errors.password
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 bg-slate-50 focus:border-brand-accent"
                    }`}
                    required
                  />
                  {touched.password && errors.password && (
                    <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                  )}
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Confirm password
                  <input
                    type="password"
                    placeholder="Repeat your password"
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

                {otpVerified && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <p className="text-sm font-medium text-green-700">✓ Email verified successfully</p>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-center text-sm font-medium text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!formValid || loading}
                  className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Completing..." : "Complete Registration"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{" "}
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

export default function SignupPage() {
  return (
    <Suspense fallback={
      <>
        <Navbar />
        <main className="bg-[#F7F7F7] min-h-screen pt-28 pb-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-slate-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </>
    }>
      <SignupForm />
    </Suspense>
  );
}
