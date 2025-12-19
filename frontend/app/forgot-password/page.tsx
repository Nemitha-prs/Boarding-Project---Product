import { redirect } from "next/navigation";

export default function ForgotPasswordPage() {
  // Redirect to login page since forgot-password feature is not available
  redirect("/login");
}

