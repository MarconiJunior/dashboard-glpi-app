import { NextResponse } from "next/server";
import { verifyOtpAndGetUser } from "@/src/application/use-cases/auth.use-case";
import { getServerSession } from "@/src/infrastructure/auth/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";

  if (!email || !code) {
    return NextResponse.json({ error: "E-mail e código são obrigatórios." }, { status: 400 });
  }

  const result = await verifyOtpAndGetUser(email, code);

  if (!result.ok) {
    const messages: Record<string, string> = {
      invalid_code: "Código incorreto. Verifique e tente novamente.",
      expired: "Código expirado. Solicite um novo código.",
      too_many_attempts: "Muitas tentativas incorretas. Solicite um novo código.",
      not_found: "Sessão expirada. Solicite um novo código.",
    };
    return NextResponse.json(
      { error: messages[result.reason] ?? "Código inválido." },
      { status: 400 },
    );
  }

  // Salva o usuário na sessão
  const session = await getServerSession();
  session.user = result.user;
  await session.save();

  return NextResponse.json({ ok: true });
}
