import dynamicImport from "next/dynamic";

export const dynamic = "force-dynamic";

const LoginClient = dynamicImport(() => import("./LoginClient"), {
  ssr: false,
});

export default function LoginPage() {
  return <LoginClient />;
}
