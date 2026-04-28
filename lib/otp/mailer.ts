import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

type SendOtpEmailParams = {
  email: string;
  code: string;
  purpose: "registration" | "login";
};

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value.trim();
}

function getBooleanEnv(name: string, fallback: boolean) {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}

export function getOtpMailerConfig() {
  const host = (process.env.OTP_SMTP_HOST || "smtp.gmail.com").trim();
  const port = Number(process.env.OTP_SMTP_PORT || 587);
  const user = (process.env.EMAIL_USER || process.env.GMAIL_USER || getRequiredEnv("EMAIL_USER")).trim();
  const pass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || getRequiredEnv("EMAIL_PASS");
  const from = (process.env.OTP_SENDER_EMAIL || user).trim();
  const secure = port === 465;
  const requireTLS = getBooleanEnv("OTP_SMTP_TLS", true);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid OTP_SMTP_PORT value: ${process.env.OTP_SMTP_PORT}`);
  }

  return {
    host,
    port,
    secure,
    requireTLS,
    user,
    pass,
    from,
  };
}

export function getOtpMailerDiagnostics() {
  const config = getOtpMailerConfig();

  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: config.requireTLS,
    from: config.from,
    hasEmailUser: Boolean(process.env.EMAIL_USER),
    hasEmailPass: Boolean(process.env.EMAIL_PASS),
    hasOtpSenderEmail: Boolean(process.env.OTP_SENDER_EMAIL),
    hasSmtpHost: Boolean(process.env.OTP_SMTP_HOST),
    hasSmtpPort: Boolean(process.env.OTP_SMTP_PORT),
    hasSmtpTls: Boolean(process.env.OTP_SMTP_TLS),
  };
}

export async function sendOtpEmail({ email, code, purpose }: SendOtpEmailParams) {
  const config = getOtpMailerConfig();

  const transportOptions: SMTPTransport.Options = {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    requireTLS: config.requireTLS,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  };

  const transporter = nodemailer.createTransport(transportOptions);

  const title = purpose === "login" ? "Login Verification" : "Account Verification";

  await transporter.sendMail({
    from: `"Indabest Crave Corner" <${config.from}>`,
    to: email,
    subject: `${title} Code`,
    text: `Your Indabest Crave Corner verification code is: ${code}\n\nThis code will expire in 5 minutes.`,
    html: `
      <div style="margin:0;padding:24px;background:#fff7e8;font-family:Arial,Helvetica,sans-serif;color:#5b3924;">
        <div style="max-width:520px;margin:0 auto;background:#fffaf1;border:1px solid #ead7b7;border-radius:18px;overflow:hidden;">
          <div style="background:#2f6b3f;color:#fff7e8;padding:22px;text-align:center;font-size:24px;font-weight:700;">Indabest Crave Corner</div>
          <div style="padding:34px 24px;text-align:center;">
            <p style="margin:0 0 18px;font-size:17px;line-height:1.5;">Your Indabest Crave Corner verification code is:</p>
            <div style="display:inline-block;margin:0 0 20px;padding:16px 26px;background:#f3dfbd;border:1px solid #e8862f;border-radius:12px;color:#214d2e;font-size:36px;font-weight:700;letter-spacing:6px;">${code}</div>
            <p style="margin:0;color:#74513a;font-size:15px;">This code will expire in 5 minutes</p>
          </div>
        </div>
      </div>
    `,
  });
}
