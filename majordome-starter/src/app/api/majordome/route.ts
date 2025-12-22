import { NextResponse } from "next/server";
import { askMajordome } from "@/lib/ai/majordome";

// POST /api/majordome
// Body: { message: string, history?: {role,content}[], pending?: [{name,arguments}] }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = String(body?.message ?? "");
    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const history = Array.isArray(body?.history) ? body.history : undefined;
    const pending = Array.isArray(body?.pending) ? body.pending : undefined;

    // TODO: inject userId from your auth/session middleware
    const result = await askMajordome(message, { userId: body?.userId, history, pending });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { type: "ERROR", message: "Majordome endpoint failed", details: e?.message ?? String(e) },
      { status: 500 },
    );
  }
}
