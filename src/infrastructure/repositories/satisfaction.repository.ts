// Implementação concreta de ISatisfactionRepository usando mysql2.

import { pool } from "../database/connection"
import type { RowDataPacket } from "mysql2/promise"
import type { GlpiSatisfaction } from "@/src/domain/entities/ticket"
import type { ISatisfactionRepository, SatisfactionStats } from "@/src/domain/repositories/ISatisfactionRepository"
import type { UserContext } from "@/src/domain/repositories/UserContext"

async function q<T extends RowDataPacket>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool.query<T[]>(sql, params)
  return rows
}

class SatisfactionRepository implements ISatisfactionRepository {
  async list(ctx: UserContext): Promise<GlpiSatisfaction[]> {
    if (!ctx.technicianId) return []
    try {
      interface SatRow extends RowDataPacket {
        id: number; tickets_id: number; ticket_name: string
        satisfaction: number; comment: string | null; date_answered: Date | null
        req_id: number | null; req_name: string | null; req_realname: string | null; req_firstname: string | null
        tec_id: number | null; tec_name: string | null; tec_realname: string | null; tec_firstname: string | null
        category_name: string | null
      }

      const rows = await q<SatRow>(
        `
        SELECT
          s.id, s.tickets_id, t.name AS ticket_name,
          s.satisfaction, s.comment, s.date_answered,
          req.id AS req_id, req.name AS req_name, req.realname AS req_realname, req.firstname AS req_firstname,
          tec.id AS tec_id, tec.name AS tec_name, tec.realname AS tec_realname, tec.firstname AS tec_firstname,
          cat.name AS category_name
        FROM glpi_ticketsatisfactions s
        INNER JOIN glpi_tickets t ON t.id = s.tickets_id AND t.is_deleted = 0
        INNER JOIN glpi_tickets_users tu_tec
          ON tu_tec.tickets_id = t.id AND tu_tec.users_id = ? AND tu_tec.type = 2
        LEFT JOIN (
          SELECT tickets_id, MIN(users_id) AS users_id
          FROM glpi_tickets_users WHERE type = 1 GROUP BY tickets_id
        ) AS first_req ON first_req.tickets_id = t.id
        LEFT JOIN glpi_users req ON req.id = first_req.users_id AND req.is_deleted = 0
        LEFT JOIN glpi_users tec ON tec.id = ? AND tec.is_deleted = 0
        LEFT JOIN glpi_itilcategories cat ON cat.id = t.itilcategories_id
        WHERE s.date_answered IS NOT NULL AND s.satisfaction IS NOT NULL
        ORDER BY s.date_answered DESC
        `,
        [ctx.technicianId, ctx.technicianId],
      )

      return rows.map((r): GlpiSatisfaction => ({
        id: r.id,
        ticket_id: r.tickets_id,
        ticket_name: r.ticket_name,
        satisfaction: r.satisfaction,
        comment: r.comment,
        date_answered: r.date_answered?.toISOString() ?? new Date().toISOString(),
        user: { id: r.req_id ?? 0, name: r.req_name ?? "—", realname: r.req_realname ?? null, firstname: r.req_firstname ?? null, email: null },
        category: r.category_name ?? "—",
        technician: { id: r.tec_id ?? ctx.technicianId, name: r.tec_name ?? "—", realname: r.tec_realname ?? null, firstname: r.tec_firstname ?? null, email: null },
      }))
    } catch (err) {
      console.error("[satisfaction.repository] list:", err)
      return []
    }
  }

  async getStats(ctx: UserContext): Promise<SatisfactionStats> {
    const all = await this.list(ctx)
    const avg = all.reduce((a, s) => a + s.satisfaction, 0) / Math.max(1, all.length)
    const positive = all.filter((s) => s.satisfaction >= 4).length
    const negative = all.filter((s) => s.satisfaction <= 2).length
    return {
      total: all.length,
      avg,
      positivePct: (positive / Math.max(1, all.length)) * 100,
      negativePct: (negative / Math.max(1, all.length)) * 100,
    }
  }

  async getMonthlyTrend(ctx: UserContext): Promise<{ month: string; media: number; avaliacoes: number }[]> {
    const all = await this.list(ctx)
    const buckets = new Map<string, { sum: number; count: number }>()
    const months: string[] = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      months.push(key)
      buckets.set(key, { sum: 0, count: 0 })
    }

    all.forEach((s) => {
      const d = new Date(s.date_answered)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const b = buckets.get(key)
      if (b) { b.sum += s.satisfaction; b.count++ }
    })

    return months.map((key) => {
      const b = buckets.get(key)!
      const [y, m] = key.split("-")
      const monthName = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("pt-BR", { month: "short" })
      return { month: monthName, media: b.count > 0 ? Number((b.sum / b.count).toFixed(2)) : 0, avaliacoes: b.count }
    })
  }

  async getDistribution(ctx: UserContext): Promise<{ nota: string; total: number }[]> {
    const all = await this.list(ctx)
    return [1, 2, 3, 4, 5].map((n) => ({ nota: `${n} ★`, total: all.filter((s) => s.satisfaction === n).length }))
  }
}

export const satisfactionRepository: ISatisfactionRepository = new SatisfactionRepository()
