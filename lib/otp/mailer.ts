import nodemailer from "nodemailer";

type SendOtpEmailParams = {
  email: string;
  code: string;
  purpose: "registration" | "login";
};

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} in .env.local`);
  }
  return value;
}

export async function sendOtpEmail({ email, code, purpose }: SendOtpEmailParams) {
  const host = process.env.OTP_SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.OTP_SMTP_PORT || 587);
  const secure = port === 465;
  const user = process.env.EMAIL_USER || process.env.GMAIL_USER || getRequiredEnv("GMAIL_USER");
  const pass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || getRequiredEnv("GMAIL_APP_PASSWORD");
  const from = process.env.OTP_SENDER_EMAIL || user;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    requireTLS: process.env.OTP_SMTP_TLS !== "false",
  });

  const title = purpose === "login" ? "Login Verification" : "Account Verification";

  await transporter.sendMail({
    from: `"Indabest Crave Corner" <${from}>`,
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
