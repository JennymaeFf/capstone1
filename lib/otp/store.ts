import crypto from "crypto";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export type OtpPurpose = "registration" | "login";

type OtpRecord = {
  codeHash: string;
  expiresAt: number;
  attempts: number;
  resendAvailableAt: number;
  email: string;
  purpose: OtpPurpose;
};

const OTP_TTL_MS = 5 * 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getKey(email: string, purpose: OtpPurpose) {
  const safeEmail = normalizeEmail(email).replace(/[^a-z0-9@._-]/g, "");
  return `otp:${purpose}:${safeEmail}`;
}

function getSecret() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "indabest-otp-secret";
}

function hashOtp(email: string, purpose: OtpPurpose, code: string) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`${purpose}:${normalizeEmail(email)}:${code}`)
    .digest("hex");
}

function formatOtpStoreError(step: string, error: { message?: string; details?: string; hint?: string; code?: string }) {
  return [
    `${step}: ${error.message || "Unknown Supabase error"}`,
    error.details ? `Details: ${error.details}` : "",
    error.hint ? `Hint: ${error.hint}` : "",
    error.code ? `Code: ${error.code}` : "",
  ].filter(Boolean).join(" ");
}

function mapOtpRow(row: {
  code_hash: string;
  expires_at: string;
  attempts: number;
  resend_available_at: string;
  email: string;
  purpose: OtpPurpose;
} | null): OtpRecord | null {
  if (!row) return null;
  return {
    codeHash: row.code_hash,
    expiresAt: new Date(row.expires_at).getTime(),
    attempts: Number(row.attempts),
    resendAvailableAt: new Date(row.resend_available_at).getTime(),
    email: row.email,
    purpose: row.purpose,
  };
}

async function readOtpRecord(email: string, purpose: OtpPurpose) {
  const supabase = getSupabaseServiceClient();
  const key = getKey(email, purpose);
  const { data, error } = await supabase
    .from("otp_verifications")
    .select("code_hash, expires_at, attempts, resend_available_at, email, purpose")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    console.error("[otp/store] read failed", error, { key, email: normalizeEmail(email), purpose });
    throw new Error(formatOtpStoreError("OTP read failed", error));
  }

  return mapOtpRow(data);
}

async function writeOtpRecord(email: string, purpose: OtpPurpose, record: OtpRecord) {
  const supabase = getSupabaseServiceClient();
  const key = getKey(email, purpose);
  const { error } = await supabase
    .from("otp_verifications")
    .upsert({
      key,
      email: record.email,
      purpose: record.purpose,
      code_hash: record.codeHash,
      attempts: record.attempts,
      expires_at: new Date(record.expiresAt).toISOString(),
      resend_available_at: new Date(record.resendAvailableAt).toISOString(),
    }, { onConflict: "key" });

  if (error) {
    console.error("[otp/store] write failed", error, { key, email: normalizeEmail(email), purpose });
    throw new Error(formatOtpStoreError("OTP save failed", error));
  }
}

async function deleteOtpRecord(email: string, purpose: OtpPurpose) {
  const supabase = getSupabaseServiceClient();
  const key = getKey(email, purpose);
  const { error } = await supabase.from("otp_verifications").delete().eq("key", key);

  if (error) {
    console.error("[otp/store] delete failed", error, { key, email: normalizeEmail(email), purpose });
    throw new Error(formatOtpStoreError("OTP delete failed", error));
  }
}

export async function getCooldownSeconds(email: string, purpose: OtpPurpose) {
  const record = await readOtpRecord(email, purpose);
  if (!record) return 0;

  const remainingMs = record.resendAvailableAt - Date.now();
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

export async function createOtp(email: string, purpose: OtpPurpose) {
  const normalizedEmail = normalizeEmail(email);
  const code = crypto.randomInt(100000, 1000000).toString();
  const cooldownSeconds = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60);
  const now = Date.now();

  await writeOtpRecord(normalizedEmail, purpose, {
    codeHash: hashOtp(normalizedEmail, purpose, code),
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    resendAvailableAt: now + cooldownSeconds * 1000,
    email: normalizedEmail,
    purpose,
  });

  console.log("[otp/store] OTP saved", {
    email: normalizedEmail,
    purpose,
    expiresAt: new Date(now + OTP_TTL_MS).toISOString(),
  });

  return code;
}

export async function verifyOtp(email: string, purpose: OtpPurpose, code: string) {
  const normalizedEmail = normalizeEmail(email);
  const record = await readOtpRecord(normalizedEmail, purpose);
  const maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS || 3);

  if (!record) {
    console.error("[otp/store] OTP missing", { email: normalizedEmail, purpose });
    return { ok: false, message: "No verification code found. Please request a new OTP." };
  }

  if (Date.now() > record.expiresAt) {
    await deleteOtpRecord(normalizedEmail, purpose);
    return { ok: false, message: "Your OTP has expired. Please request a new one." };
  }

  if (record.attempts >= maxAttempts) {
    await deleteOtpRecord(normalizedEmail, purpose);
    return { ok: false, message: "Too many invalid attempts. Please request a new OTP." };
  }

  const expectedHash = record.codeHash;
  const actualHash = hashOtp(normalizedEmail, purpose, code);

  if (expectedHash !== actualHash) {
    await writeOtpRecord(normalizedEmail, purpose, {
      ...record,
      attempts: record.attempts + 1,
    });
    console.error("[otp/store] OTP mismatch", {
      email: normalizedEmail,
      purpose,
      attempts: record.attempts + 1,
      maxAttempts,
    });
    return { ok: false, message: "Invalid OTP. Please check the code and try again." };
  }

  await deleteOtpRecord(normalizedEmail, purpose);
  console.log("[otp/store] OTP verified", { email: normalizedEmail, purpose });
  return { ok: true, message: "OTP verified." };
}
