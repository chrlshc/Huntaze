import type { NextApiRequest, NextApiResponse } from "next";

import { isRateLimited } from "@/lib/server/rate-limit";

type StartResponse = {
  exists: boolean;
};

export default function handler(req: NextApiRequest, res: NextApiResponse<StartResponse | { error: string }>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? "unknown";
  if (isRateLimited(`auth-start:${ip}`)) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment and try again." });
  }

  const { email } = req.body as { email?: string };
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Missing email" });
  }

  const exists = email.toLowerCase().endsWith("@huntaze.com");

  return res.status(200).json({ exists });
}
