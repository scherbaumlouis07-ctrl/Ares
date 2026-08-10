import { NextResponse } from "next/server";
import { buildGoogleAuthUrl } from "@/lib/google-calendar";

export async function GET() {
  try {
    return NextResponse.redirect(buildGoogleAuthUrl());
  } catch (error) {
    console.error("Google auth URL error:", error);
    return NextResponse.json(
      { error: "Google Calendar ist noch nicht konfiguriert." },
      { status: 503 }
    );
  }
}
