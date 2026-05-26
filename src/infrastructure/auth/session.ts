import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionUser {
  id: number
  fullName: string
  email: string
  entities: number[]
}

export interface AppSession {
  user?: SessionUser
}

export const SESSION_OPTIONS: SessionOptions = {
  password:
    process.env.SESSION_SECRET ??
    "fallback-secret-change-me-in-production!!",
  cookieName: "glpi-desk-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
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