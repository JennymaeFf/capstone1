import { NextResponse } from "next/server";
import { createOtp, getCooldownSeconds, type OtpPurpose } from "@/lib/otp/store";
import { sendOtpEmail } from "@/lib/otp/mailer";

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

    if (!isOtpEnabled(purpose)) {
      return NextResponse.json({ enabled: false });
    }

    const cooldownSeconds = getCooldownSeconds(email, purpose);
    if (cooldownSeconds > 0) {
      return NextResponse.json(
        { error: `Please wait ${cooldownSeconds} seconds before requesting another OTP.`, cooldownSeconds },
        { status: 429 }
      );
    }

    const code = createOtp(email, purpose);
    await sendOtpEmail({ email, code, purpose });

    return NextResponse.json({ enabled: true, message: "OTP sent." });
  } catch (error) {
    console.error("[otp/send]", error);
    return NextResponse.json({ error: "Unable to send OTP right now." }, { status: 500 });
  }
}
