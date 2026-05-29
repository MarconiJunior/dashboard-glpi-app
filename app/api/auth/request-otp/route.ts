import { NextResponse } from "next/server";
import { requestOtp } from "@/src/application/use-cases/auth.use-case";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }

  const result = await requestOtp(email);

  if (!result.ok) {
    const messages: Record<string, string> = {
      user_not_found: "Nenhum usuário encontrado com este e-mail no GLPI.",
      not_authorized: "Este usuário não possui perfil de técnico ou gestor.",
      otp_already_sent: "Já enviamos um código. Aguarde alguns minutos antes de tentar novamente.",
      send_error: "Falha ao enviar o e-mail. Tente novamente em instantes.",
    };
    return NextResponse.json(
      { error: messages[result.reason] ?? "Erro desconhecido." },
      { status: result.reason === "otp_already_sent" ? 429 : 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
