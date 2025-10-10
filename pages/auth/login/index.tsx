import { FormEvent, useState } from "react";
import { useRouter } from "next/router";

import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function LoginStepEmail() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed request");
      }

      const data = (await response.json()) as { exists: boolean };
      await router.push({
        pathname: "/auth/login/password",
        query: { email, mode: data.exists ? "signin" : "signup" },
      });
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      showToast({
        title: "Unable to continue",
        description: "Check your email and try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome to Huntaze" subtitle="Access your workspace with your email address">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-gray-300" htmlFor="email">
          Email address
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-describedby={error ? "email-error" : undefined}
        />
        {error ? (
          <p id="email-error" className="text-sm text-red-400">
            {error}
          </p>
        ) : null}
        <Button type="submit" loading={loading} className="w-full">
          Continue
        </Button>
        <p className="text-center text-sm text-gray-400">
          Need an account? Submit your email to get started.
        </p>
      </form>
    </AuthLayout>
  );
}
