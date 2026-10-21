import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Log in", robots: { index: false, follow: true } };

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
