import nodemailer from "nodemailer";

type OrderStatusEmailItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  size?: string | null;
};

type RiderInfo = {
  name?: string;
  phone?: string;
};

type SendOrderStatusEmailParams = {
  to: string;
  customerName: string;
  orderNumber: string;
  status: string;
  items: OrderStatusEmailItem[];
  totalAmount: number;
  deliveryAddress: string;
  rider?: RiderInfo;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function peso(value: number) {
  return `P${Number(value || 0).toFixed(2)}`;
}

function getStatusMessage(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("way") || normalized.includes("shipped")) {
    return "Good news! Your cravings are on the way.";
  }

  if (normalized.includes("delivered")) {
    return "Your order has been delivered. We hope it reached you fresh and warm.";
  }

  if (normalized.includes("completed")) {
    return "Your order is now completed. Thank you for choosing us.";
  }

  return "Your order status has been updated.";
}

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} in .env.local`);
  }
  return value;
}

export async function sendOrderStatusEmail({
  to,
  customerName,
  orderNumber,
  status,
  items,
  totalAmount,
  deliveryAddress,
  rider,
}: SendOrderStatusEmailParams) {
  const host = process.env.OTP_SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.OTP_SMTP_PORT || 587);
  const secure = port === 465;
  const user = process.env.EMAIL_USER || process.env.GMAIL_USER || getRequiredEnv("GMAIL_USER");
  const pass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || getRequiredEnv("GMAIL_APP_PASSWORD");
  const from = process.env.OTP_SENDER_EMAIL || user;
  const safeStatus = escapeHtml(status);
  const safeCustomerName = escapeHtml(customerName || "Customer");
  const safeOrderNumber = escapeHtml(orderNumber);
  const safeDeliveryAddress = escapeHtml(deliveryAddress || "Not provided");
  const riderRows = rider?.name || rider?.phone
    ? `
      <tr>
        <td style="padding:12px 0;border-top:1px solid #ead7b7;color:#74513a;font-size:14px;">Rider</td>
        <td align="right" style="padding:12px 0;border-top:1px solid #ead7b7;color:#5b3924;font-size:14px;font-weight:700;">
          ${escapeHtml(rider.name || "Assigned rider")}${rider.phone ? `<br><span style="font-weight:400;color:#74513a;">${escapeHtml(rider.phone)}</span>` : ""}
        </td>
      </tr>
    `
    : "";

  const itemRows = items.map((item) => {
    const itemName = `${item.quantity}x ${item.name}${item.size ? ` (${item.size})` : ""}`;
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1dfc4;color:#5b3924;font-size:14px;">${escapeHtml(itemName)}</td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid #f1dfc4;color:#5b3924;font-size:14px;font-weight:700;">${peso(item.quantity * item.unitPrice)}</td>
      </tr>
    `;
  }).join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <body style="margin:0;padding:0;background-color:#fff7e8;font-family:Arial,Helvetica,sans-serif;color:#5b3924;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background-color:#fff7e8;margin:0;padding:28px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background-color:#fffaf1;border:1px solid #ead7b7;border-radius:18px;box-shadow:0 10px 28px rgba(91,57,36,0.14);overflow:hidden;">
              <tr>
                <td align="center" style="background-color:#2f6b3f;padding:22px 20px;">
                  <div style="font-size:24px;line-height:1;color:#fff7e8;font-weight:700;">Indabest Crave Corner</div>
                  <div style="margin-top:8px;color:#f3dfbd;font-size:13px;">Order Status Update</div>
                </td>
              </tr>
              <tr>
                <td style="padding:30px 24px 24px;">
                  <p style="margin:0 0 8px;color:#74513a;font-size:15px;line-height:1.5;">Hi ${safeCustomerName},</p>
                  <h1 style="margin:0 0 14px;color:#214d2e;font-size:25px;line-height:1.25;">Your order is ${safeStatus}</h1>
                  <p style="margin:0 0 22px;color:#74513a;font-size:15px;line-height:1.6;">${escapeHtml(getStatusMessage(status))}</p>

                  <div style="margin:0 0 22px;padding:16px 18px;background-color:#f3dfbd;border:1px solid #e8862f;border-radius:14px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color:#74513a;font-size:13px;">Order Number</td>
                        <td align="right" style="color:#214d2e;font-size:16px;font-weight:700;">#${safeOrderNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding-top:10px;color:#74513a;font-size:13px;">Status</td>
                        <td align="right" style="padding-top:10px;color:#e8862f;font-size:16px;font-weight:700;">${safeStatus}</td>
                      </tr>
                    </table>
                  </div>

                  <h2 style="margin:0 0 10px;color:#214d2e;font-size:17px;">Ordered Items</h2>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:18px;">
                    ${itemRows}
                    <tr>
                      <td style="padding:14px 0 0;color:#214d2e;font-size:16px;font-weight:700;">Total Amount</td>
                      <td align="right" style="padding:14px 0 0;color:#214d2e;font-size:18px;font-weight:700;">${peso(totalAmount)}</td>
                    </tr>
                  </table>

                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;">
                    <tr>
                      <td style="padding:12px 0;border-top:1px solid #ead7b7;color:#74513a;font-size:14px;">Delivery Address</td>
                      <td align="right" style="padding:12px 0;border-top:1px solid #ead7b7;color:#5b3924;font-size:14px;font-weight:700;">${safeDeliveryAddress}</td>
                    </tr>
                    ${riderRows}
                  </table>

                  <p style="margin:22px 0 0;color:#74513a;font-size:15px;line-height:1.6;">Thank you for ordering from Indabest Crave Corner. We got your cravings covered!</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:18px 24px;background-color:#f5e4c5;">
                  <p style="margin:0;color:#866348;font-size:13px;line-height:1.5;">This is an automated order notification.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = [
    `Hi ${customerName || "Customer"},`,
    `Your Indabest Crave Corner order #${orderNumber} is ${status}.`,
    getStatusMessage(status),
    "",
    "Items:",
    ...items.map((item) => `- ${item.quantity}x ${item.name}: ${peso(item.quantity * item.unitPrice)}`),
    `Total: ${peso(totalAmount)}`,
    `Delivery Address: ${deliveryAddress || "Not provided"}`,
    rider?.name || rider?.phone ? `Rider: ${rider.name || "Assigned rider"} ${rider.phone || ""}` : "",
    "",
    "Thank you for ordering from Indabest Crave Corner.",
  ].filter(Boolean).join("\n");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    requireTLS: process.env.OTP_SMTP_TLS !== "false",
  });

  await transporter.sendMail({
    from: `"Indabest Crave Corner" <${from}>`,
    to,
    subject: `Order #${orderNumber} is ${status}`,
    text,
    html,
  });
}
