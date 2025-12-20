"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getApiUrl, setToken } from "@/lib/auth";

export default function LoginClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(
        errorParam === "oauth_failed"
          ? "Google sign-in failed. Please try again."
          : "An error occurred during sign-in."
      );
      return;
    }

    if (token) {
      setToken(token);
      setSuccess(true);
      setTimeout(() => router.push("/"), 1000);
    }
  }, [searchParams, router]);

  const emailIsValid = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const formValid = emailIsValid(email) && password.length >= 6;

  return (
    <>
      <Navbar />
      <main className="bg-[#F7F7F7] min-h-screen pt-28 pb-16">
        <div className="container mx-auto flex min-h-[calc(100vh-9rem)] items-center justify-center">
          <section className="w-full max-w-md">
            <div className="rounded-3xl border bg-white p-8 shadow">
              <h2 className="text-3xl font-semibold text-center">Log in</h2>

              <form
                className="mt-6 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
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
                      const data = await res.json();
                      throw new Error(data.error || "Login failed");
                    }

                    const data = await res.json();
                    setToken(data.token);
                    setSuccess(true);

                    setTimeout(() => {
                      window.location.href = "/owner-dashboard";
                    }, 1200);
                  } catch (err: any) {
                    setError(err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border px-4 py-3"
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border px-4 py-3"
                />

                <button
                  disabled={!formValid || loading}
                  className="w-full rounded bg-black py-3 text-white"
                >
                  {loading ? "Logging in..." : "Log in"}
                </button>

                {error && <p className="text-red-500">{error}</p>}
                {success && <p className="text-green-600">Success</p>}
              </form>

              <div className="mt-4 text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm text-slate-600 hover:text-slate-900 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <p className="mt-4 text-center text-sm">
                Don't have an account?{" "}
                <Link href="/signup" className="underline">
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
