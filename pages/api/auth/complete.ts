import type { NextApiRequest, NextApiResponse } from "next";

import { isRateLimited } from "@/lib/server/rate-limit";

type CompleteResponse = {
  ok: boolean;
  error?: string;
};

export default function handler(req: NextApiRequest, res: NextApiResponse<CompleteResponse>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? "unknown";
  if (isRateLimited(`auth-complete:${ip}`)) {
    return res.status(429).json({ ok: false, error: "Too many requests" });
  }

  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || typeof email !== "string" || !password || typeof password !== "string") {
    return res.status(400).json({ ok: false, error: "Invalid request" });
  }

  if (password.length < 8) {
    return res.status(400).json({ ok: false, error: "Authentication failed" });
  }

  return res.status(200).json({ ok: true });
}
