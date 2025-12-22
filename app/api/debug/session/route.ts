import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession();
    
    return NextResponse.json({
      authenticated: !!session,
      session: session ? {
        userId: session.user?.id,
        email: session.user?.email,
        name: session.user?.name,
      } : null,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
