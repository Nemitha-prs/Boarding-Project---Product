"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getApiUrl, setToken } from "@/lib/auth";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Handle token from redirect (if any)
  useEffect(() => {
    const token = searchParams.get("token");
    const redirect = searchParams.get("redirect");
    
    if (token) {
      setToken(token);
      setSuccess(true);
      // Redirect to redirect param, owner dashboard, or home
      setTimeout(() => {
        if (redirect) {
          router.push(redirect);
        } else {
          router.push("/owner-dashboard");
        }
      }, 1000);
    }
  }, [searchParams, router]);

  const emailIsValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const formValid = emailIsValid(email) && password.trim().length >= 6;

  return (
    <>
      <Navbar />
      <main className="bg-[#F7F7F7] min-h-screen pt-28 pb-16 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
        <div className="container mx-auto flex min-h-[calc(100vh-9rem)] items-center justify-center px-4 sm:px-6 lg:px-8">
          <section className="w-full max-w-md">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-lg shadow-slate-200">
              <div className="space-y-2 text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Welcome back</p>
                <h2 className="text-3xl font-semibold text-slate-900">Log in</h2>
                <p className="text-sm text-slate-500">Access your account to manage your boardings.</p>
              </div>

              <form
                className="mt-6 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  
                  // Prevent double submission
                  if (loading) {
                    return;
                  }
                  
                  setTouched(true);
                  if (!formValid) return;
                  setLoading(true);
                  setError("");
                  try {
                    const res = await fetch(getApiUrl("/auth/login"), {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email, password }),
                    });
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      throw new Error(data.error || "Login failed");
                    }
                    const data = await res.json();
                    
                    setToken(data.token);
                    setSuccess(true);
                    // Redirect to redirect param, owner dashboard, or home
                    const redirect = searchParams.get("redirect");
                    setTimeout(() => {
                      if (redirect) {
                        router.push(redirect);
                      } else {
                        window.location.href = "/owner-dashboard";
                      }
                    }, 1200);
                  } catch (err: any) {
                    setError(err.message || "Login failed");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <label className="block text-sm font-medium text-slate-700">
                  Email address
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-brand-accent focus:bg-white focus:outline-none"
                  />
                  {touched && !emailIsValid(email) && (
                    <p className="mt-1 text-xs text-red-500">Enter a valid email address.</p>
                  )}
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Password
                  <input
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-brand-accent focus:bg-white focus:outline-none"
                  />
                  {touched && password.trim().length < 6 && (
                    <p className="mt-1 text-xs text-red-500">Password must be at least 6 characters.</p>
                  )}
                </label>

                <div className="flex items-center justify-between text-xs">
                  <label className="inline-flex items-center gap-2 text-slate-600">
                    <input type="checkbox" className="rounded border-slate-300" />
                    Remember me
                  </label>
                  <Link href="/forgot-password" className="font-semibold text-brand-accent hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={!formValid || loading}
                  className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Logging in..." : "Log in"}
                </button>
                {error && (
                  <p className="mt-2 text-center text-sm text-red-500">{error}</p>
                )}
                {success && (
                  <p className="mt-2 text-center text-sm text-green-600">Login successful! Redirecting...</p>
                )}
              </form>

              <p className="mt-4 text-center text-sm text-slate-600">
                Don’t have an account?{" "}
                <Link href="/signup" className="font-semibold text-brand-accent hover:underline">
                  Sign up
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

export default function LoginPage() {
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
      <LoginForm />
    </Suspense>
  );
}
