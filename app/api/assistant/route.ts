import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    console.log("[Assistant API] Session:", session ? `User ${session.user?.id}` : "No session");
    console.log("[Assistant API] Full session:", JSON.stringify(session, null, 2));
    
    if (!session?.user?.id) {
      console.log("[Assistant API] Unauthorized - no session or user id");
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
    }

    const body = (await req.json()) as {
      conversationId?: string;
      message: string;
    };
    console.log("[Assistant API] Request body:", body);

    const userId = Number(session.user.id);
    console.log("[Assistant API] User ID:", userId);
    let conversationId = body.conversationId;

    // Create conversation if not provided
    if (!conversationId) {
      console.log("[Assistant API] Creating new conversation for user:", userId);
      const conv = await prisma.assistantConversation.create({
        data: { userId, title: body.message.slice(0, 50) || "New conversation" },
      });
      conversationId = conv.id;
      console.log("[Assistant API] Created conversation:", conversationId);
    }

    // Save user message
    console.log("[Assistant API] Saving user message to conversation:", conversationId);
    await prisma.assistantMessage.create({
      data: {
        conversationId,
        role: "user",
        content: body.message,
      },
    });

    // TODO: Replace with real AI call (Azure OpenAI, etc.)
    const reply =
      `Got it, CEO. I understand: "${body.message}".\n` +
      `Would you like a short answer, or a 3-step action plan?`;

    // Save assistant message
    console.log("[Assistant API] Saving assistant reply");
    await prisma.assistantMessage.create({
      data: {
        conversationId,
        role: "assistant",
        content: reply,
      },
    });

    // Update conversation title if first message
    const msgCount = await prisma.assistantMessage.count({
      where: { conversationId },
    });
    if (msgCount === 2) {
      await prisma.assistantConversation.update({
        where: { id: conversationId },
        data: { title: body.message.slice(0, 50) },
      });
    }

    // Update conversation timestamp
    console.log("[Assistant API] Updating conversation timestamp");
    await prisma.assistantConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    console.log("[Assistant API] Success! Returning response");
    return NextResponse.json({ reply, conversationId });
  } catch (error) {
    console.error("[Assistant API] Error:", error);
    console.error("[Assistant API] Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { error: "Internal error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
