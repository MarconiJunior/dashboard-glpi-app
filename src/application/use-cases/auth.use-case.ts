// Caso de uso de autenticação — OTP por e-mail para técnicos GLPI.

import { sendOtpEmail } from "@/src/infrastructure/auth/email";
import { createOtp, hasActiveOtp, verifyOtp } from "@/src/infrastructure/auth/otp-store";
import { pool } from "@/src/infrastructure/database/connection";

import type { RowDataPacket } from "mysql2/promise";
import type { SessionUser } from "@/src/infrastructure/auth/session";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type RequestOtpResult =
  | { ok: true }
  | { ok: false; reason: "user_not_found" | "not_a_technician" | "otp_already_sent" | "send_error" }

export type VerifyOtpResult =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: VerifyOtpResultReason }

export type VerifyOtpResultReason = "invalid_code" | "expired" | "too_many_attempts" | "not_found"

// ---------------------------------------------------------------------------
// Busca usuário pelo e-mail no banco GLPI
// ---------------------------------------------------------------------------

interface GlpiUserRow extends RowDataPacket {
  id: number
  name: string
  firstname: string | null
  realname: string | null
}

async function findUserByEmail(email: string): Promise<GlpiUserRow | null> {
  const [rows] = await pool.query<GlpiUserRow[]>(
    `
    SELECT u.id, u.name, u.firstname, u.realname
    FROM glpi_users u
    INNER JOIN glpi_useremails ue ON ue.users_id = u.id
    WHERE ue.email = ?
      AND u.is_deleted = 0
    LIMIT 1
    `,
    [email.toLowerCase()],
  );
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Valida se o usuário é técnico (já foi atribuído como técnico em algum chamado)
// ---------------------------------------------------------------------------

async function isTechnician(userId: number): Promise<boolean> {
  interface CountRow extends RowDataPacket { c: number }
  const [rows] = await pool.query<CountRow[]>(
    "SELECT COUNT(*) AS c FROM glpi_tickets_users WHERE users_id = ? AND type = 2 LIMIT 1",
    [userId],
  );
  return (rows[0]?.c ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Busca as entidades do usuário em glpi_profiles_users
// ---------------------------------------------------------------------------

async function getUserEntities(userId: number): Promise<number[]> {
  interface EntityRow extends RowDataPacket { entities_id: number }
  const [rows] = await pool.query<EntityRow[]>(
    `
    SELECT DISTINCT entities_id
    FROM glpi_profiles_users
    WHERE users_id = ?
      AND entities_id IS NOT NULL
    `,
    [userId],
  );
  return rows.map((r) => r.entities_id);
}

// ---------------------------------------------------------------------------
// Caso de uso: solicitar OTP
// ---------------------------------------------------------------------------

export async function requestOtp(email: string): Promise<RequestOtpResult> {
  // Rate-limit: não reenviar se já existe OTP ativo
  if (hasActiveOtp(email)) {
    return { ok: false, reason: "otp_already_sent" };
  }

  const user = await findUserByEmail(email);
  if (!user) return { ok: false, reason: "user_not_found" };

  const technician = await isTechnician(user.id);
  if (!technician) return { ok: false, reason: "not_a_technician" };

  const code = createOtp(email);

  try {
    await sendOtpEmail(email, code);
    return { ok: true };
  } catch (err) {
    console.error("[auth] sendOtpEmail error:", err);
    return { ok: false, reason: "send_error" };
  }
}

// ---------------------------------------------------------------------------
// Caso de uso: verificar OTP e construir SessionUser
// ---------------------------------------------------------------------------

export async function verifyOtpAndGetUser(email: string, code: string): Promise<VerifyOtpResult> {
  const result = verifyOtp(email, code);
  if (!result.ok) {
    return { ok: false, reason: result.reason || "not_found" };
  }

  const user = await findUserByEmail(email);
  if (!user) return { ok: false, reason: "not_found" };

  const fullName = `${user.firstname ?? ""} ${user.realname ?? ""}`.trim() || user.name;
  const entities = await getUserEntities(user.id);

  return {
    ok: true,
    user: {
      id: user.id,
      fullName,
      email: email.toLowerCase(),
      entities,
    },
  };
}
