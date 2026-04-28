import crypto from "crypto";

export type OtpPurpose = "registration" | "login";

type OtpRecord = {
  codeHash: string;
  expiresAt: number;
  attempts: number;
  resendAvailableAt: number;
};

type OtpStore = Map<string, OtpRecord>;

const globalForOtp = globalThis as typeof globalThis & {
  indabestOtpStore?: OtpStore;
};

const store = globalForOtp.indabestOtpStore ?? new Map<string, OtpRecord>();
globalForOtp.indabestOtpStore = store;

const OTP_TTL_MS = 5 * 60 * 1000;

function getKey(email: string, purpose: OtpPurpose) {
  return `${purpose}:${email.trim().toLowerCase()}`;
}

function getSecret() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "indabest-otp-secret";
}

function hashOtp(email: string, purpose: OtpPurpose, code: string) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`${purpose}:${email.trim().toLowerCase()}:${code}`)
    .digest("hex");
}

export function getCooldownSeconds(email: string, purpose: OtpPurpose) {
  const record = store.get(getKey(email, purpose));
  if (!record) return 0;

  const remainingMs = record.resendAvailableAt - Date.now();
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

export function createOtp(email: string, purpose: OtpPurpose) {
  const code = crypto.randomInt(100000, 1000000).toString();
  const cooldownSeconds = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60);
  const now = Date.now();

  store.set(getKey(email, purpose), {
    codeHash: hashOtp(email, purpose, code),
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    resendAvailableAt: now + cooldownSeconds * 1000,
  });

  return code;
}

export function verifyOtp(email: string, purpose: OtpPurpose, code: string) {
  const key = getKey(email, purpose);
  const record = store.get(key);
  const maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS || 3);

  if (!record) {
    return { ok: false, message: "No verification code found. Please request a new OTP." };
  }

  if (Date.now() > record.expiresAt) {
    store.delete(key);
    return { ok: false, message: "Your OTP has expired. Please request a new one." };
  }

  if (record.attempts >= maxAttempts) {
    store.delete(key);
    return { ok: false, message: "Too many invalid attempts. Please request a new OTP." };
  }

  const expectedHash = record.codeHash;
  const actualHash = hashOtp(email, purpose, code);

  if (expectedHash !== actualHash) {
    record.attempts += 1;
    return { ok: false, message: "Invalid OTP. Please check the code and try again." };
  }

  store.delete(key);
  return { ok: true, message: "OTP verified." };
}
