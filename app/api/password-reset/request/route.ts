import { NextResponse } from "next/server";
import { createOtp, getCooldownSeconds } from "@/lib/otp/store";
import { getOtpMailerDiagnostics, sendOtpEmail } from "@/lib/otp/mailer";
import { findAuthUserByEmail, isValidAuthEmail, normalizeAuthEmail } from "@/lib/supabase/auth-admin";

export const runtime = "nodejs";

function getSafeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to send password reset OTP.";
  return message
    .replace(/pass(word)?=[^&\s]+/gi, "password=[hidden]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [hidden]");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? normalizeAuthEmail(body.email) : "";

    if (!email || !isValidAuthEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid registered email address." }, { status: 400 });
    }

    const user = await findAuthUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "No registered account was found for this email." }, { status: 404 });
    }

    const cooldownSeconds = await getCooldownSeconds(email, "password-reset");
    if (cooldownSeconds > 0) {
      return NextResponse.json(
        { error: `Please wait ${cooldownSeconds} seconds before requesting another OTP.`, cooldownSeconds },
        { status: 429 }
      );
    }

    console.log("[password-reset/request] Sending OTP", {
      email,
      mailer: getOtpMailerDiagnostics(),
    });

    const code = await createOtp(email, "password-reset");
    await sendOtpEmail({ email, code, purpose: "password-reset" });

    return NextResponse.json({ message: "Password reset OTP sent." });
  } catch (error) {
    const safeError = getSafeError(error);
    console.error("[password-reset/request] failed", {
      error: safeError,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: safeError }, { status: 500 });
  }
}
