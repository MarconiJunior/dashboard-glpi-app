import { getIronSession } from "iron-session";
import { NextResponse } from "next/server";

import { SESSION_OPTIONS } from "@/src/infrastructure/auth/session";

import type { NextRequest } from "next/server"
import type { AppSession } from "@/src/infrastructure/auth/session"

const PUBLIC_PATHS = ["/login", "/api/auth"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Deixa passar rotas públicas e assets estáticos
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  const res = NextResponse.next()

  // Lê a sessão do cookie
  const session = await getIronSession<AppSession>(req, res, SESSION_OPTIONS)

  if (!session.user) {
    // Não autenticado — redireciona para /login
    const loginUrl = new URL("/login", req.url)
    return NextResponse.redirect(loginUrl)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Aplica middleware a todas as rotas exceto:
     * - _next/static, _next/image (assets do Next.js)
     * - favicon.ico, ícones públicos
     */
    "/((?!_next/static|_next/image|favicon\\.ico|icon|apple-icon|placeholder).*)",
  ],
}
