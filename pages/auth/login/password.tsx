import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type Mode = "signin" | "signup";

export default function LoginPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const email = typeof router.query.email === "string" ? router.query.email : "";
  const mode = (typeof router.query.mode === "string" ? router.query.mode : "signin") as Mode;

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      void router.replace("/auth/login");
    }
  }, [email, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        throw new Error(data.error ?? "Auth failed");
      }

      showToast({
        title: mode === "signin" ? "Welcome back" : "Account created",
        description: "Redirecting you to the dashboard…",
        variant: "success",
      });

      await router.push("/home");
    } catch (err) {
      console.error(err);
      const message = "Authentication failed. Please try again.";
      setError(message);
      showToast({ title: "Unable to authenticate", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={mode === "signin" ? "Sign in" : "Create your account"}
      subtitle={
        email ? (
          <span className="text-sm text-gray-300">
            Continue as <span className="font-semibold text-white">{email}</span>
          </span>
        ) : null
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-gray-300" htmlFor="password">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby={error ? "password-error" : undefined}
        />
        {error ? (
          <p id="password-error" className="text-sm text-red-400">
            {error}
          </p>
        ) : null}
        <Button type="submit" loading={loading} className="w-full">
          {mode === "signin" ? "Sign in" : "Create my account"}
        </Button>
        <div className="text-center text-sm text-gray-400">
          <Link
            href="/auth/login"
            className="font-semibold text-gray-200 underline-offset-4 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            Change email
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
