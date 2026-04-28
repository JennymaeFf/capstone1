import { NextResponse } from "next/server";
import { createOtp, getCooldownSeconds, type OtpPurpose } from "@/lib/otp/store";
import { getOtpMailerDiagnostics, sendOtpEmail } from "@/lib/otp/mailer";

export const runtime = "nodejs";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

function getSafeOtpSendError(error: unknown) {
  const message = getErrorMessage(error);
  return message
    .replace(/pass(word)?=[^&\s]+/gi, "password=[hidden]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [hidden]");
}

function isPurpose(value: unknown): value is OtpPurpose {
  return value === "registration" || value === "login";
}

function isOtpEnabled(purpose: OtpPurpose) {
  if (purpose === "login") return process.env.ENABLE_LOGIN_OTP === "true";
  return true;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const purpose = body.purpose;

    if (!email || !email.includes("@") || !isPurpose(purpose)) {
      return NextResponse.json({ error: "Valid email and purpose are required." }, { status: 400 });
    }

    console.log("[otp/send] Request received", {
      email,
      purpose,
      mailer: getOtpMailerDiagnostics(),
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });

    if (!isOtpEnabled(purpose)) {
      return NextResponse.json({ enabled: false });
    }

    const cooldownSeconds = await getCooldownSeconds(email, purpose);
    if (cooldownSeconds > 0) {
      return NextResponse.json(
        { error: `Please wait ${cooldownSeconds} seconds before requesting another OTP.`, cooldownSeconds },
        { status: 429 }
      );
    }

    const code = await createOtp(email, purpose);
    await sendOtpEmail({ email, code, purpose });

    console.log("[otp/send] OTP email sent", { email, purpose });
    return NextResponse.json({ enabled: true, message: "OTP sent." });
  } catch (error) {
    const safeError = getSafeOtpSendError(error);
    console.error("[otp/send] failed", {
      error: safeError,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: `Unable to send OTP: ${safeError}` }, { status: 500 });
  }
}
