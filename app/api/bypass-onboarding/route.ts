import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const goto = searchParams.get("goto") || "onboarding";
    
    // Set a simple dev cookie
    cookies().set("dev-bypass", "true", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 // 24 hours
    });
    
    // Mock user data in cookie
    cookies().set("dev-user", JSON.stringify({
      id: "dev-123",
      email: "dev@huntaze.com",
      name: "Dev User",
      picture: "https://ui-avatars.com/api/?name=Dev+User"
    }), {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24
    });

    // Redirect based on parameter
    const redirectMap: Record<string, string> = {
      "onboarding": "/onboarding/setup",
      "dashboard": "/dashboard",
      "messages": "/messages",
      "analytics": "/analytics"
    };

    const redirectUrl = redirectMap[goto] || "/dashboard";
    
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error("Bypass error:", error);
    // Fallback redirect
    return NextResponse.redirect(new URL("/onboarding/setup", request.url));
  }
}
