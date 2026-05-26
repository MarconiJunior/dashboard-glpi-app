// Envio de e-mails via SMTP corporativo usando Nodemailer.

import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true", // true para porta 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
})

const FROM = process.env.SMTP_FROM ?? "GLPI Desk <noreply@glpi.local>"
const APP_NAME = "GLPI Desk"

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `${code} — seu código de acesso ao ${APP_NAME}`,
    text: [
      `Seu código de acesso ao ${APP_NAME} é:`,
      ``,
      `  ${code}`,
      ``,
      `Este código expira em 5 minutos.`,
      `Se você não solicitou este código, ignore este e-mail.`,
    ].join("\n"),
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px 24px">
        <h2 style="margin:0 0 8px;font-size:18px;color:#111">${APP_NAME}</h2>
        <p style="margin:0 0 24px;color:#555;font-size:14px">Seu código de acesso:</p>
        <div style="letter-spacing:8px;font-size:36px;font-weight:700;font-family:monospace;
                    background:#f4f4f5;border-radius:8px;padding:16px 24px;text-align:center;
                    color:#111;margin-bottom:24px">
          ${code}
        </div>
        <p style="color:#888;font-size:12px;margin:0">
          Expira em 5 minutos. Se você não solicitou este acesso, ignore este e-mail.
        </p>
      </div>
    `,
  })
}
