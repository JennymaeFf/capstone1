import { NextResponse } from "next/server";
import { createPasswordResetSession, verifyOtp } from "@/lib/otp/store";
import { isValidAuthEmail, normalizeAuthEmail } from "@/lib/supabase/auth-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? normalizeAuthEmail(body.email) : "";
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";

    if (!email || !isValidAuthEmail(email) || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "Valid email and 6-digit OTP are required." }, { status: 400 });
    }

    const result = await verifyOtp(email, "password-reset", otp);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    const resetToken = await createPasswordResetSession(email);
    return NextResponse.json({ message: "OTP verified.", resetToken });
  } catch (error) {
    console.error("[password-reset/verify]", error);
    return NextResponse.json({ error: "Unable to verify password reset OTP right now." }, { status: 500 });
  }
}
