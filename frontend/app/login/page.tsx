import dynamicComponent from "next/dynamic";

export const dynamic = "force-dynamic";

const LoginClient = dynamicComponent(() => import("./LoginClient"), {
  ssr: false,
});

export default function LoginPage() {
  return <LoginClient />;
}
