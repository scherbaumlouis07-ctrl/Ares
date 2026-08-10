import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeAndStore } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const redirectTo = new URL("/business", request.url);

  if (error) {
    redirectTo.searchParams.set("google_calendar", "denied");
    return NextResponse.redirect(redirectTo);
  }

  if (!code) {
    redirectTo.searchParams.set("google_calendar", "error");
    return NextResponse.redirect(redirectTo);
  }

  try {
    await exchangeCodeAndStore(code);
    redirectTo.searchParams.set("google_calendar", "connected");
  } catch (err) {
    console.error("Google callback error:", err);
    redirectTo.searchParams.set("google_calendar", "error");
  }

  return NextResponse.redirect(redirectTo);
}
