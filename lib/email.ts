import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "AI Agent <no-reply@example.com>";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

export type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
};

export async function sendEmail(args: SendEmailArgs): Promise<{ sent: boolean; provider: "smtp" | "resend" | "ethereal" | "none"; info?: string; previewUrl?: string }> {
  // Prefer SMTP if provided
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      attachments: args.attachments?.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
    });

    return { sent: true, provider: "smtp", info: info.messageId };
  }

  // Try Resend API if available (no SDK dependency)
  if (RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: args.to,
          subject: args.subject,
          html: args.html,
          // Attachments as base64
          attachments: (args.attachments || []).map((a) => ({
            filename: a.filename,
            content: a.content.toString("base64"),
          })),
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
      }

      const data = await response.json();
      return { sent: true, provider: "resend", info: data?.id };
    } catch (err) {
      // fall through to ethereal
    }
  }

  // Ethereal test account as last resort (preview URL, useful for dev/demo)
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });

  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
    attachments: args.attachments?.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
  });

  const url = nodemailer.getTestMessageUrl(info) || undefined;
  return { sent: true, provider: "ethereal", info: info.messageId, previewUrl: url };
}
