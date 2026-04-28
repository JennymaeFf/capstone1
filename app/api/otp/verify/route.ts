import { NextResponse } from "next/server";
import { type OtpPurpose, verifyOtp } from "@/lib/otp/store";

function isPurpose(value: unknown): value is OtpPurpose {
  return value === "registration" || value === "login";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";
    const purpose = body.purpose;

    if (!email || !email.includes("@") || !/^\d{6}$/.test(otp) || !isPurpose(purpose)) {
      return NextResponse.json({ error: "Valid email, purpose, and 6-digit OTP are required." }, { status: 400 });
    }

    const result = verifyOtp(email, purpose, otp);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error("[otp/verify]", error);
    return NextResponse.json({ error: "Unable to verify OTP right now." }, { status: 500 });
  }
}
