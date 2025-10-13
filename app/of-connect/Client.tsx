"use client";

import React, { useEffect, useState } from "react";
import { BridgeLauncher } from "@/components/of/BridgeLauncher";

// Lightweight icons (no external deps)
function Pill({ children, color = "slate" }: { children: React.ReactNode; color?: "slate" | "green" | "amber" | "red" | "blue" }) {
  const colors: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    green: "bg-green-100 text-green-800 ring-1 ring-green-200",
    amber: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
    red: "bg-rose-100 text-rose-800 ring-1 ring-rose-200",
    blue: "bg-sky-100 text-sky-800 ring-1 ring-sky-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>{children}</span>
  );
}

const STATUS_COLORS: Record<string, { label: string; color: "slate" | "green" | "amber" | "red" | "blue" }> = {
  PENDING: { label: "Pending", color: "slate" },
  LOGIN_STARTED: { label: "Login started", color: "blue" },
  OTP_REQUIRED: { label: "OTP required", color: "amber" },
  FACEID_REQUIRED: { label: "ID/Face verification", color: "amber" },
  CONNECTED: { label: "Connected", color: "green" },
  FAILED: { label: "Failed", color: "red" },
};

// Small loading dot animation
function LoadingDots() {
  return (
    <span className="inline-flex gap-1 ml-1" aria-hidden>
      <span className="size-1.5 rounded-full bg-current animate-pulse [animation-delay:0ms]"></span>
      <span className="size-1.5 rounded-full bg-current animate-pulse [animation-delay:150ms]"></span>
      <span className="size-1.5 rounded-full bg-current animate-pulse [animation-delay:300ms]"></span>
    </span>
  );
}

function Step({ active, done, label }: { active?: boolean; done?: boolean; label: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 size-2.5 rounded-full ${done ? "bg-green-500" : active ? "bg-sky-500" : "bg-slate-300"}`}></div>
      <div className="text-sm text-slate-700">{label}</div>
    </div>
  );
}

export default function Client() {
  const [status, setStatus] = useState<keyof typeof STATUS_COLORS>("PENDING");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const isOtpVisible = status === "OTP_REQUIRED"; // progressive disclosure

  // Poll server status every 1s
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/of/connect/status", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;
        if (data?.state && STATUS_COLORS[data.state]) {
          setStatus(data.state);
          setLastUpdated(new Date());
        }
      } catch {}
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/of/login/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, otp: otp || undefined }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      // status will update via polling
    } catch (err: any) {
      setError(err?.message || "Unable to start login");
    } finally {
      setSubmitting(false);
    }
  };

  const statusMeta = STATUS_COLORS[status] ?? STATUS_COLORS.PENDING;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="mx-auto max-w-5xl px-4 pb-24 pt-12">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Connect OnlyFans</h1>
            <p className="mt-1 text-slate-600">
              Secure, server-side login. Your session is created on the server (HttpOnly cookies) and never exposed to the browser.
            </p>
            <div className="mt-3">
              <BridgeLauncher compact />
            </div>
          </div>
          <Pill color={statusMeta.color}>
            {statusMeta.label}
            {status === "LOGIN_STARTED" && <LoadingDots />}
          </Pill>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Status / Timeline */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-medium text-slate-900">Connection status</h2>
                <Pill color={statusMeta.color}>{statusMeta.label}</Pill>
              </div>
              <p className="text-sm text-slate-600">This reflects the server status only. Manual cookie upload is still available.</p>
              <div className="my-4 h-px bg-slate-100" />
              <div className="space-y-3">
                <Step done={status !== "PENDING"} active={status === "PENDING"} label="Pending" />
                <Step
                  done={status === "CONNECTED" || status === "OTP_REQUIRED" || status === "FACEID_REQUIRED" || status === "FAILED"}
                  active={status === "LOGIN_STARTED"}
                  label="Login started"
                />
                <Step done={status === "CONNECTED" || status === "FAILED"} active={status === "OTP_REQUIRED"} label="OTP required (if 2FA enabled)" />
                <Step done={status === "CONNECTED" || status === "FAILED"} active={status === "FACEID_REQUIRED"} label="ID/Face verification (complete in OF, then retry)" />
                <Step done={status === "CONNECTED"} active={status === "CONNECTED"} label="Connected" />
              </div>
              <div className="mt-4 text-xs text-slate-500">Last update: {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}</div>
            </div>

            {/* Manual cookie upload */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-medium text-slate-900">Manual cookie upload (optional)</h2>
              <p className="mt-1 text-sm text-slate-600">
                Upload a Playwright storageState for <code className="rounded bg-slate-50 px-1">onlyfans.com</code> if you already have one.
              </p>
              <a
                href="/of-connect/cookies"
                className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Go to cookie upload →
              </a>
            </div>
          </div>

          {/* Connect form */}
          <div className="lg:col-span-7">
            <form onSubmit={onSubmit} noValidate aria-describedby={error ? "form-error" : undefined} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-medium text-slate-900">Connect OnlyFans</h2>
              <p className="mt-1 text-sm text-slate-600">
                Start a secure server-side login using your OnlyFans credentials. If 2FA is enabled, you’ll be prompted for an OTP.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-800">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-800">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                    />
                    <button
                      type="button"
                      aria-label="Show password"
                      onClick={() => {
                        const el = document.getElementById("password") as HTMLInputElement | null;
                        if (!el) return;
                        el.type = el.type === "password" ? "text" : "password";
                      }}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700"
                    >
                      <span className="text-xs select-none">👁</span>
                    </button>
                  </div>
                  <p id="password-hint" className="mt-1 text-xs text-slate-500">
                    Your password is never stored client-side. Session cookies are created on the server.
                  </p>
                </div>
                {isOtpVisible && (
                  <div className="sm:col-span-2">
                    <label htmlFor="otp" className="mb-1 block text-sm font-medium text-slate-800">
                      One-time code (OTP)
                    </label>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]*"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                    />
                    <p className="mt-1 text-xs text-slate-500">If 2FA is enabled on your account, enter the 6-digit code from your authenticator app.</p>
                  </div>
                )}
              </div>

              {error && (
                <div id="form-error" role="alert" aria-live="assertive" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Starting…" : "Connect now"}
                </button>
                <div className="text-sm text-slate-600">
                  Status: <span className="font-medium text-slate-900">{statusMeta.label}</span>
                  {status === "LOGIN_STARTED" && <LoadingDots />}
                </div>
              </div>

              <ul className="mt-5 list-disc pl-5 text-xs text-slate-500">
                <li>Possible states: PENDING → LOGIN_STARTED → CONNECTED, or OTP_REQUIRED / FACEID_REQUIRED / FAILED.</li>
                <li>We use server-side cookies (HttpOnly). They are never exposed to JavaScript.</li>
              </ul>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
