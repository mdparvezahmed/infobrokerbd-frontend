import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Create account", robots: { index: false, follow: true } };

export default function RegisterPage() {
  return (
    <Suspense>
      <AuthForm mode="register" />
    </Suspense>
  );
}
