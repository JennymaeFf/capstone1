import { NextResponse } from "next/server";
import { consumePasswordResetSession } from "@/lib/otp/store";
import { findAuthUserByEmail } from "@/lib/supabase/auth-admin";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resetToken = typeof body.resetToken === "string" ? body.resetToken.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (!resetToken) {
      return NextResponse.json({ error: "Please verify your OTP before changing your password." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    const session = await consumePasswordResetSession(resetToken);
    if (!session.ok) {
      return NextResponse.json({ error: session.message }, { status: 400 });
    }

    const user = await findAuthUserByEmail(session.email);
    if (!user) {
      return NextResponse.json({ error: "Registered account was not found." }, { status: 404 });
    }

    const supabase = getSupabaseServiceClient();
    const { error } = await supabase.auth.admin.updateUserById(user.id, { password });

    if (error) {
      console.error("[password-reset/update] Supabase update failed", error, { userId: user.id });
      return NextResponse.json({ error: error.message || "Unable to update password." }, { status: 500 });
    }

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("[password-reset/update]", error);
    return NextResponse.json({ error: "Unable to update password right now." }, { status: 500 });
  }
}
