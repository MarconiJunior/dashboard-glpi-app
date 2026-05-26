import { getIronSession } from "iron-session";

import type { IronSession, SessionOptions } from "iron-session"

// ---------------------------------------------------------------------------
// Tipo da sessão
// ---------------------------------------------------------------------------

export interface SessionUser {
  id: number
  fullName: string
  email: string
  entities: number[] // entidades GLPI do técnico
}

export interface AppSession {
  user?: SessionUser
}

// ---------------------------------------------------------------------------
// Configuração iron-session
// ---------------------------------------------------------------------------

export const SESSION_OPTIONS = <SessionOptions>{
  password: process.env.SESSION_SECRET ?? "fallback-secret-change-me-in-production!!",
  cookieName: "glpi-desk-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 8, // 8 horas
  },
}

// ---------------------------------------------------------------------------
// Helpers para App Router (Server Components / Route Handlers)
// ---------------------------------------------------------------------------

/** Obtém a sessão a partir do objeto Request (usado em Route Handlers). */
export async function getSessionFromRequest(req: Request): Promise<IronSession<AppSession>> {
  // iron-session v8 com Next.js App Router usa cookies() do next/headers
  // mas para Route Handlers precisamos usar a assinatura de Request/Response
  const { NextRequest, NextResponse } = await import("next/server")
  const nextReq = req as InstanceType<typeof NextRequest>
  const res = new NextResponse()
  const { getIronSession: gis } = await import("iron-session")
  return gis<AppSession>(nextReq.cookies as unknown as Parameters<typeof gis>[0], res.cookies as unknown as Parameters<typeof gis>[1], SESSION_OPTIONS)
}

/** Obtém a sessão a partir de next/headers (usado em Server Components e Server Actions). */
export async function getServerSession(): Promise<IronSession<AppSession>> {
  const { cookies: nextCookies } = await import("next/headers")
  const cookieStore = await nextCookies()
  return getIronSession<AppSession>(cookieStore, SESSION_OPTIONS)
}
