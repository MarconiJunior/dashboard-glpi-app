// Implementação concreta de ITicketsRepository usando mysql2.
// Todas as queries são somente leitura (SELECT).

import { pool } from "../database/connection"
import type { RowDataPacket } from "mysql2/promise"
import type { GlpiTicket, TicketStatus, TicketPriority } from "@/src/domain/entities/ticket"
import type { ITicketsRepository, TicketFilters, DashboardMetrics } from "@/src/domain/repositories/ITicketsRepository"
import type { UserContext } from "@/src/domain/repositories/UserContext"

// ---------------------------------------------------------------------------
// Helper de query
// ---------------------------------------------------------------------------

async function q<T extends RowDataPacket>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool.query<T[]>(sql, params)
  return rows
}

// ---------------------------------------------------------------------------
// Mapeamentos
// ---------------------------------------------------------------------------

function mapStatus(n: number): TicketStatus {
  const m: Record<number, TicketStatus> = {
    1: "new",
    2: "assigned",
    3: "planned",
    4: "pending",
    5: "solved",
    6: "closed",
  }
  return m[n] ?? "new"
}

interface RawTicketRow extends RowDataPacket {
  id: number
  name: string
  content: string | null
  status: number
  priority: number
  urgency: number
  impact: number
  type: number
  date_creation: Date | null
  date_mod: Date | null
  solvedate: Date | null
  closedate: Date | null
  time_to_resolve: Date | null
  takeintoaccount_delay_stat: number
  solve_delay_stat: number
  req_id: number | null
  req_name: string | null
  req_realname: string | null
  req_firstname: string | null
  tec_id: number | null
  tec_name: string | null
  tec_realname: string | null
  tec_firstname: string | null
  cat_id: number | null
  cat_name: string | null
  cat_completename: string | null
  entity_name: string | null
}

function mapRow(row: RawTicketRow): GlpiTicket {
  return {
    id: row.id,
    name: row.name,
    content: row.content ?? "",
    status: mapStatus(row.status),
    priority: row.priority as TicketPriority,
    urgency: (row.urgency as 1 | 2 | 3 | 4 | 5) || 3,
    impact: (row.impact as 1 | 2 | 3 | 4 | 5) || 3,
    type: (row.type as 1 | 2) || 1,
    date_creation: row.date_creation?.toISOString() ?? new Date().toISOString(),
    date_mod: row.date_mod?.toISOString() ?? new Date().toISOString(),
    solvedate: row.solvedate?.toISOString() ?? null,
    closedate: row.closedate?.toISOString() ?? null,
    time_to_resolve: row.time_to_resolve?.toISOString() ?? null,
    requester: {
      id: row.req_id ?? 0,
      name: row.req_name ?? "—",
      realname: row.req_realname ?? null,
      firstname: row.req_firstname ?? null,
      email: null,
    },
    technician: row.tec_id
      ? {
          id: row.tec_id,
          name: row.tec_name ?? "—",
          realname: row.tec_realname ?? null,
          firstname: row.tec_firstname ?? null,
          email: null,
        }
      : null,
    category: row.cat_id
      ? {
          id: row.cat_id,
          name: row.cat_name ?? "—",
          completename: row.cat_completename ?? row.cat_name ?? "—",
        }
      : null,
    entity: row.entity_name ?? "—",
    takeintoaccount_delay_stat: row.takeintoaccount_delay_stat,
    solve_delay_stat: row.solve_delay_stat > 0 ? row.solve_delay_stat : null,
  }
}

// ---------------------------------------------------------------------------
// Filtros em memória
// ---------------------------------------------------------------------------

function applyFilters(items: GlpiTicket[], f: TicketFilters): GlpiTicket[] {
  let r = items
  if (f.status?.length) r = r.filter((t) => f.status!.includes(t.status))
  if (f.priority?.length) r = r.filter((t) => f.priority!.includes(t.priority))
  if (f.categoryId?.length) r = r.filter((t) => t.category != null && f.categoryId!.includes(t.category.id))
  if (f.search) {
    const term = f.search.toLowerCase()
    r = r.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        String(t.id).includes(term) ||
        t.requester.name.toLowerCase().includes(term) ||
        (t.requester.firstname ?? "").toLowerCase().includes(term),
    )
  }
  if (f.dateFrom) r = r.filter((t) => new Date(t.date_creation) >= new Date(f.dateFrom!))
  if (f.dateTo) r = r.filter((t) => new Date(t.date_creation) <= new Date(f.dateTo!))
  if (f.slaOverdue) {
    const now = Date.now()
    r = r.filter(
      (t) =>
        t.time_to_resolve != null &&
        new Date(t.time_to_resolve).getTime() < now &&
        t.status !== "solved" &&
        t.status !== "closed",
    )
  }
  return r
}

// ---------------------------------------------------------------------------
// Fetch base: meus chamados (técnico atribuído, type=2)
// ---------------------------------------------------------------------------

async function fetchMyTicketsRaw(ctx: UserContext): Promise<GlpiTicket[]> {
  if (!ctx.technicianId) return []
  const entities = ctx.allowedEntities.join(",") || "0"
  try {
    const rows = await q<RawTicketRow>(
      `
      SELECT
        t.id, t.name, t.content, t.status, t.priority, t.urgency, t.impact, t.type,
        t.date_creation, t.date_mod, t.solvedate, t.closedate, t.time_to_resolve,
        t.takeintoaccount_delay_stat, t.solve_delay_stat,
        req.id        AS req_id,
        req.name      AS req_name,
        req.realname  AS req_realname,
        req.firstname AS req_firstname,
        tec.id        AS tec_id,
        tec.name      AS tec_name,
        tec.realname  AS tec_realname,
        tec.firstname AS tec_firstname,
        cat.id           AS cat_id,
        cat.name         AS cat_name,
        cat.completename AS cat_completename,
        ent.completename AS entity_name
      FROM glpi_tickets t
      INNER JOIN glpi_tickets_users tu_mine
        ON tu_mine.tickets_id = t.id
        AND tu_mine.users_id = ?
        AND tu_mine.type = 2
      LEFT JOIN (
        SELECT tickets_id, MIN(users_id) AS users_id
        FROM glpi_tickets_users WHERE type = 1
        GROUP BY tickets_id
      ) AS first_req ON first_req.tickets_id = t.id
      LEFT JOIN glpi_users req
        ON req.id = first_req.users_id AND req.is_deleted = 0
      LEFT JOIN glpi_users tec
        ON tec.id = ? AND tec.is_deleted = 0
      LEFT JOIN glpi_itilcategories cat
        ON cat.id = t.itilcategories_id
      LEFT JOIN glpi_entities ent
        ON ent.id = t.entities_id
      WHERE t.is_deleted = 0
        AND t.entities_id IN (${entities})
      ORDER BY t.date_creation DESC
      `,
      [ctx.technicianId, ctx.technicianId],
    )
    return rows.map(mapRow)
  } catch (err) {
    console.error("[tickets.repository] fetchMyTicketsRaw:", err)
    return []
  }
}

// ---------------------------------------------------------------------------
// Implementação
// ---------------------------------------------------------------------------

class TicketsRepository implements ITicketsRepository {
  async getMyTickets(ctx: UserContext, filters: TicketFilters = {}): Promise<GlpiTicket[]> {
    return applyFilters(await fetchMyTicketsRaw(ctx), filters)
  }

  async getNewTickets(ctx: UserContext, filters: TicketFilters = {}): Promise<GlpiTicket[]> {
    const entities = ctx.allowedEntities.join(",") || "0"
    try {
      const rows = await q<RawTicketRow>(
        `
        SELECT
          t.id, t.name, t.content, t.status, t.priority, t.urgency, t.impact, t.type,
          t.date_creation, t.date_mod, t.solvedate, t.closedate, t.time_to_resolve,
          t.takeintoaccount_delay_stat, t.solve_delay_stat,
          req.id        AS req_id,
          req.name      AS req_name,
          req.realname  AS req_realname,
          req.firstname AS req_firstname,
          NULL AS tec_id, NULL AS tec_name, NULL AS tec_realname, NULL AS tec_firstname,
          cat.id           AS cat_id,
          cat.name         AS cat_name,
          cat.completename AS cat_completename,
          ent.completename AS entity_name
        FROM glpi_tickets t
        LEFT JOIN glpi_tickets_users tu_tec
          ON tu_tec.tickets_id = t.id AND tu_tec.type = 2
        LEFT JOIN (
          SELECT tickets_id, MIN(users_id) AS users_id
          FROM glpi_tickets_users WHERE type = 1
          GROUP BY tickets_id
        ) AS first_req ON first_req.tickets_id = t.id
        LEFT JOIN glpi_users req
          ON req.id = first_req.users_id AND req.is_deleted = 0
        LEFT JOIN glpi_itilcategories cat
          ON cat.id = t.itilcategories_id
        LEFT JOIN glpi_entities ent
          ON ent.id = t.entities_id
        WHERE t.is_deleted = 0
          AND t.status = 1
          AND t.entities_id IN (${entities})
          AND tu_tec.id IS NULL
        ORDER BY t.priority DESC, t.date_creation ASC
        LIMIT 500
        `,
        [],
      )
      return applyFilters(rows.map(mapRow), filters)
    } catch (err) {
      console.error("[tickets.repository] getNewTickets:", err)
      return []
    }
  }

  async getById(id: number): Promise<GlpiTicket | null> {
    try {
      const rows = await q<RawTicketRow>(
        `
        SELECT
          t.id, t.name, t.content, t.status, t.priority, t.urgency, t.impact, t.type,
          t.date_creation, t.date_mod, t.solvedate, t.closedate, t.time_to_resolve,
          t.takeintoaccount_delay_stat, t.solve_delay_stat,
          req.id        AS req_id, req.name AS req_name,
          req.realname  AS req_realname, req.firstname AS req_firstname,
          tec.id        AS tec_id, tec.name AS tec_name,
          tec.realname  AS tec_realname, tec.firstname AS tec_firstname,
          cat.id           AS cat_id,
          cat.name         AS cat_name,
          cat.completename AS cat_completename,
          ent.completename AS entity_name
        FROM glpi_tickets t
        LEFT JOIN (
          SELECT tickets_id, MIN(users_id) AS users_id
          FROM glpi_tickets_users WHERE type = 1 GROUP BY tickets_id
        ) AS first_req ON first_req.tickets_id = t.id
        LEFT JOIN (
          SELECT tickets_id, MIN(users_id) AS users_id
          FROM glpi_tickets_users WHERE type = 2 GROUP BY tickets_id
        ) AS first_tec ON first_tec.tickets_id = t.id
        LEFT JOIN glpi_users req
          ON req.id = first_req.users_id AND req.is_deleted = 0
        LEFT JOIN glpi_users tec
          ON tec.id = first_tec.users_id AND tec.is_deleted = 0
        LEFT JOIN glpi_itilcategories cat ON cat.id = t.itilcategories_id
        LEFT JOIN glpi_entities ent ON ent.id = t.entities_id
        WHERE t.id = ? AND t.is_deleted = 0
        LIMIT 1
        `,
        [id],
      )
      return rows.length > 0 ? mapRow(rows[0]) : null
    } catch (err) {
      console.error("[tickets.repository] getById:", err)
      return null
    }
  }

  async getDashboardMetrics(ctx: UserContext): Promise<DashboardMetrics> {
    const mine = await fetchMyTicketsRaw(ctx)
    const entities = ctx.allowedEntities.join(",") || "0"
    const solved = mine.filter((t) => t.status === "solved" || t.status === "closed")
    const pending = mine.filter((t) => t.status === "pending" || t.status === "planned")
    const now = Date.now()

    const slaOverdue = mine.filter(
      (t) =>
        t.time_to_resolve != null &&
        new Date(t.time_to_resolve).getTime() < now &&
        t.status !== "solved" &&
        t.status !== "closed",
    ).length

    const avgResolutionHours =
      solved.reduce((acc, t) => acc + (t.solve_delay_stat ?? 0), 0) /
      Math.max(1, solved.length) /
      3600

    let avgSatisfaction = 0
    try {
      interface SatAvg extends RowDataPacket { avg_sat: number | null }
      const rows = await q<SatAvg>(
        `SELECT AVG(s.satisfaction) AS avg_sat
         FROM glpi_ticketsatisfactions s
         INNER JOIN glpi_tickets_users tu
           ON tu.tickets_id = s.tickets_id AND tu.users_id = ? AND tu.type = 2
         WHERE s.satisfaction IS NOT NULL AND s.date_answered IS NOT NULL`,
        [ctx.technicianId],
      )
      avgSatisfaction = rows[0]?.avg_sat ?? 0
    } catch (err) {
      console.error("[tickets.repository] getDashboardMetrics/satisfaction:", err)
    }

    let newTickets = 0
    try {
      interface CountRow extends RowDataPacket { c: number }
      const rows = await q<CountRow>(
        `SELECT COUNT(DISTINCT t.id) AS c
         FROM glpi_tickets t
         LEFT JOIN glpi_tickets_users tu_tec
           ON tu_tec.tickets_id = t.id AND tu_tec.type = 2
         WHERE t.is_deleted = 0
           AND t.status = 1
           AND t.entities_id IN (${entities})
           AND tu_tec.id IS NULL`,
        [],
      )
      newTickets = rows[0]?.c ?? 0
    } catch (err) {
      console.error("[tickets.repository] getDashboardMetrics/newTickets:", err)
    }

    return {
      assigned: mine.filter((t) => t.status === "assigned").length,
      newTickets,
      solved: solved.length,
      pending: pending.length,
      avgResolutionHours,
      avgSatisfaction,
      slaOverdue,
      total: mine.length,
    }
  }

  async getStatusDistribution(ctx: UserContext): Promise<{ status: string; count: number }[]> {
    const mine = await fetchMyTicketsRaw(ctx)
    const counts: Record<string, number> = {}
    mine.forEach((t) => { counts[t.status] = (counts[t.status] ?? 0) + 1 })
    return Object.entries(counts).map(([status, count]) => ({ status, count }))
  }

  async getCategoryDistribution(ctx: UserContext): Promise<{ category: string; count: number }[]> {
    const mine = await fetchMyTicketsRaw(ctx)
    const counts: Record<string, number> = {}
    mine.forEach((t) => {
      const name = t.category?.name ?? "Sem categoria"
      counts[name] = (counts[name] ?? 0) + 1
    })
    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
  }

  async getMonthlyEvolution(ctx: UserContext): Promise<{ month: string; abertos: number; resolvidos: number; tempoMedio: number }[]> {
    const mine = await fetchMyTicketsRaw(ctx)
    const buckets = new Map<string, { opened: number; solved: number; sumHours: number }>()
    const months: string[] = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      months.push(key)
      buckets.set(key, { opened: 0, solved: 0, sumHours: 0 })
    }

    mine.forEach((t) => {
      const d = new Date(t.date_creation)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const b = buckets.get(key)
      if (b) {
        b.opened++
        if (t.solve_delay_stat) { b.sumHours += t.solve_delay_stat / 3600; b.solved++ }
      }
    })

    return months.map((key) => {
      const b = buckets.get(key)!
      const [y, m] = key.split("-")
      const monthName = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("pt-BR", { month: "short" })
      return {
        month: monthName,
        abertos: b.opened,
        resolvidos: b.solved,
        tempoMedio: b.solved > 0 ? Number((b.sumHours / b.solved).toFixed(1)) : 0,
      }
    })
  }
}

export const ticketsRepository: ITicketsRepository = new TicketsRepository()
