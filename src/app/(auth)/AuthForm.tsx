"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LogoMark } from "@/components/Logo";
import { toast } from "@/components/Toaster";
import { Button, Field, Input } from "@/components/ui";
import { ApiError, post } from "@/lib/api";
import type { User } from "@/lib/types";

/** Only allow redirects back into this site. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser } = useAuth();
  const next = safeNext(params.get("next"));

  const [form, setForm] = useState({ login: "", email: "", username: "", displayName: "", password: "", area: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res =
        mode === "login"
          ? await post<{ user: User }>("/auth/login", { login: form.login, password: form.password })
          : await post<{ user: User }>("/auth/register", {
              email: form.email,
              username: form.username,
              displayName: form.displayName,
              password: form.password,
              area: form.area || undefined,
            });
      setUser(res.user);
      toast.success(mode === "login" ? `Welcome back, ${res.user.displayName}!` : "Account created — welcome! 🎉");
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong, please try again");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-8">
      <div className="mb-6 text-center">
        <div className="mb-3 inline-block">
          <LogoMark size={48} />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">{mode === "login" ? "Welcome back" : "Join InfoBrokerBD"}</h1>
        <p className="mt-1 text-sm text-stone-500">
          {mode === "login"
            ? "Log in to vote, track your posts and climb the ranking."
            : "Earn points for every useful finding and appear on the ranking."}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-5 shadow-card sm:p-6">
        {mode === "login" ? (
          <>
            <Field label="Email or username">
              <Input value={form.login} onChange={set("login")} autoComplete="username" autoCapitalize="none" required />
            </Field>
            <Field label="Password">
              <Input type="password" value={form.password} onChange={set("password")} autoComplete="current-password" required />
            </Field>
          </>
        ) : (
          <>
            <Field label="Your name" hint="Shown on your posts">
              <Input value={form.displayName} onChange={set("displayName")} autoComplete="name" maxLength={60} required />
            </Field>
            <Field label="Username" hint="Letters, numbers and _ only">
              <Input
                value={form.username}
                onChange={set("username")}
                autoComplete="username"
                autoCapitalize="none"
                pattern="[A-Za-z0-9_]{3,32}"
                maxLength={32}
                required
              />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={set("email")} autoComplete="email" required />
            </Field>
            <Field label="Password" hint="At least 8 characters">
              <Input type="password" value={form.password} onChange={set("password")} autoComplete="new-password" minLength={8} required />
            </Field>
            <Field label="Your area" optional hint="e.g. Mirpur, Dhaka — shown on the ranking">
              <Input value={form.area} onChange={set("area")} maxLength={120} />
            </Field>
          </>
        )}

        {error && <p className="rounded-xl bg-accent-50 px-3 py-2 text-sm font-medium text-accent-600">{error}</p>}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {mode === "login" ? "Log in" : "Create account"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-stone-600">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-bold text-brand-700">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-bold text-brand-700">
              Log in
            </Link>
          </>
        )}
      </p>
      <p className="mt-2 text-center text-xs text-stone-400">You can also post and comment without an account.</p>
    </div>
  );
}
