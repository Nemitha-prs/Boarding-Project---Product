"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page since forgot-password feature is not available
    router.push("/login");
  }, [router]);

  return null;
}

