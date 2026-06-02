import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionUser {
  id: number
  fullName: string
  email: string
  /** Entidades onde o usuário atua como técnico (visão pessoal). */
  entities: number[]
  /** Entidades onde o usuário tem perfil de supervisor/gestor (visão de gestão). */
  managedEntities: number[]
  role: "technician" | "supervisor"
}

export interface AppSession {
  user?: SessionUser
}

// COOKIE_SECURE=false no .env permite login via HTTP (ex: rede interna sem HTTPS).
// Se omitido, usa true em produção (comportamento seguro padrão).
const cookieSecure =
  process.env.COOKIE_SECURE === "false"
    ? false
    : process.env.NODE_ENV === "production";

export const SESSION_OPTIONS: SessionOptions = {
  password:
    process.env.SESSION_SECRET ??
    "fallback-secret-change-me-in-production!!",
  cookieName: "glpi-desk-session",
  cookieOptions: {
    secure: cookieSecure,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
  },
};

export async function getServerSession() {
  const cookieStore = await cookies();

  return getIronSession<AppSession>(
    cookieStore,
    SESSION_OPTIONS
  );
}