// Caso de uso de autenticação — OTP por e-mail para técnicos e supervisores GLPI.

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
  | { ok: false; reason: "user_not_found" | "not_authorized" | "otp_already_sent" | "send_error" }

export type VerifyOtpResult =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: VerifyOtpResultReason }

export type VerifyOtpResultReason = "invalid_code" | "expired" | "too_many_attempts" | "not_found"

// ---------------------------------------------------------------------------
// Perfis GLPI que concedem acesso de supervisor/gestor
// ---------------------------------------------------------------------------

const SUPERVISOR_PROFILE_KEYWORDS = ["super", "admin", "supervisor", "gestor", "manager", "gerente"];

export function isSupervisorProfile(name: string): boolean {
  const lower = name.toLowerCase();
  return SUPERVISOR_PROFILE_KEYWORDS.some((kw) => lower.includes(kw));
}

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
// Determina papel e separa entidades por perfil
// ---------------------------------------------------------------------------

interface EntitySets {
  role: "supervisor" | "technician" | null
  /** Entidades onde o usuário tem perfil técnico (visão pessoal). */
  technicianEntities: number[]
  /** Entidades onde o usuário tem perfil supervisor/gestor (visão de gestão). */
  supervisorEntities: number[]
}

async function getEntitySets(userId: number): Promise<EntitySets> {
  interface ProfileEntityRow extends RowDataPacket {
    profile_name: string
    entities_id: number
  }

  // Busca todos os perfis do usuário com suas entidades
  const [rows] = await pool.query<ProfileEntityRow[]>(
    `
    SELECT p.name AS profile_name, pu.entities_id
    FROM glpi_profiles p
    INNER JOIN glpi_profiles_users pu ON pu.profiles_id = p.id
    WHERE pu.users_id = ?
      AND pu.entities_id IS NOT NULL
    `,
    [userId],
  );

  const supervisorEntities: number[] = [];
  const technicianEntities: number[] = [];

  for (const row of rows) {
    if (isSupervisorProfile(row.profile_name)) {
      supervisorEntities.push(row.entities_id);
    } else {
      technicianEntities.push(row.entities_id);
    }
  }

  // Deduplica
  const supUniq = [...new Set(supervisorEntities)];
  const techUniq = [...new Set(technicianEntities)];

  // Define papel: supervisor se tiver qualquer entidade de supervisor
  if (supUniq.length > 0) {
    return { role: "supervisor", technicianEntities: techUniq, supervisorEntities: supUniq };
  }

  // Fallback: verifica atribuições em chamados para confirmar técnico
  if (techUniq.length > 0) {
    return { role: "technician", technicianEntities: techUniq, supervisorEntities: [] };
  }

  // Última chance: verificar se foi atribuído como técnico em algum chamado
  interface CountRow extends RowDataPacket { c: number }
  const [techRows] = await pool.query<CountRow[]>(
    "SELECT COUNT(*) AS c FROM glpi_tickets_users WHERE users_id = ? AND type = 2 LIMIT 1",
    [userId],
  );
  if ((techRows[0]?.c ?? 0) > 0) {
    // Técnico sem entidade de perfil — pega entidades dos chamados dele
    interface TicketEntityRow extends RowDataPacket { entities_id: number }
    const [ticketEntityRows] = await pool.query<TicketEntityRow[]>(
      `SELECT DISTINCT t.entities_id
       FROM glpi_tickets t
       INNER JOIN glpi_tickets_users tu ON tu.tickets_id = t.id
       WHERE tu.users_id = ? AND tu.type = 2 AND t.is_deleted = 0`,
      [userId],
    );
    const fromTickets = ticketEntityRows.map((r) => r.entities_id);
    return { role: "technician", technicianEntities: fromTickets, supervisorEntities: [] };
  }

  return { role: null, technicianEntities: [], supervisorEntities: [] };
}

// ---------------------------------------------------------------------------
// Caso de uso: solicitar OTP
// ---------------------------------------------------------------------------

export async function requestOtp(email: string): Promise<RequestOtpResult> {
  if (hasActiveOtp(email)) {
    return { ok: false, reason: "otp_already_sent" };
  }

  const user = await findUserByEmail(email);
  if (!user) return { ok: false, reason: "user_not_found" };

  const { role } = await getEntitySets(user.id);
  if (!role) return { ok: false, reason: "not_authorized" };

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

  const { role, technicianEntities, supervisorEntities } = await getEntitySets(user.id);
  if (!role) return { ok: false, reason: "not_found" };

  const fullName = `${user.firstname ?? ""} ${user.realname ?? ""}`.trim() || user.name;

  // Entidades para visão pessoal (técnico):
  //   - técnico puro: suas entidades de perfil
  //   - supervisor que também é técnico: suas entidades técnicas
  //   - supervisor sem entidades técnicas: fallback para supervisorEntities
  const personalEntities =
    technicianEntities.length > 0 ? technicianEntities : supervisorEntities;

  return {
    ok: true,
    user: {
      id: user.id,
      fullName,
      email: email.toLowerCase(),
      entities: personalEntities,
      managedEntities: supervisorEntities,
      role,
    },
  };
}
