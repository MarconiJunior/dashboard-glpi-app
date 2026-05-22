// Repository pattern: camada de acesso a dados.
// Hoje retorna dados mockados; em produção, troque a implementação para usar Prisma:
//
// import { PrismaClient } from "@prisma/client"
// const prisma = new PrismaClient()
//
// export async function getMyTickets(technicianId: number) {
//   return prisma.glpi_tickets.findMany({
//     where: {
//       is_deleted: false,
//       glpi_tickets_users: { some: { users_id: technicianId, type: 2 } },
//     },
//     include: { ... },
//   })
// }

import { CURRENT_TECHNICIAN, MOCK_TICKETS, MOCK_SATISFACTIONS, MOCK_CATEGORIES } from "./mock-data"
import type { GlpiTicket, TicketStatus, TicketPriority } from "./types"

export interface TicketFilters {
  status?: TicketStatus[]
  priority?: TicketPriority[]
  categoryId?: number[]
  search?: string
  dateFrom?: string
  dateTo?: string
  slaOverdue?: boolean
}

export interface DashboardMetrics {
  assigned: number
  newTickets: number
  solved: number
  pending: number
  avgResolutionHours: number
  avgSatisfaction: number
  slaOverdue: number
  total: number
}

function isMine(t: GlpiTicket) {
  return t.technician?.id === CURRENT_TECHNICIAN.id
}

export const ticketsRepository = {
  async getMyTickets(filters: TicketFilters = {}): Promise<GlpiTicket[]> {
    let result = MOCK_TICKETS.filter(isMine)
    return applyFilters(result, filters)
  },

  async getNewTickets(filters: TicketFilters = {}): Promise<GlpiTicket[]> {
    let result = MOCK_TICKETS.filter((t) => t.status === "new" && !t.technician)
    return applyFilters(result, filters)
  },

  async getById(id: number): Promise<GlpiTicket | null> {
    return MOCK_TICKETS.find((t) => t.id === id) ?? null
  },

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const mine = MOCK_TICKETS.filter(isMine)
    const newOnes = MOCK_TICKETS.filter((t) => t.status === "new")
    const solved = mine.filter((t) => t.status === "solved" || t.status === "closed")
    const pending = mine.filter((t) => t.status === "pending" || t.status === "planned")
    const now = Date.now()
    const slaOverdue = mine.filter(
      (t) => t.time_to_resolve && new Date(t.time_to_resolve).getTime() < now && t.status !== "solved" && t.status !== "closed",
    ).length

    const avgResolutionHours =
      solved.reduce((acc, t) => acc + (t.solve_delay_stat ?? 0), 0) / Math.max(1, solved.length) / 3600

    const avgSatisfaction =
      MOCK_SATISFACTIONS.reduce((acc, s) => acc + s.satisfaction, 0) / Math.max(1, MOCK_SATISFACTIONS.length)

    return {
      assigned: mine.filter((t) => t.status === "assigned").length,
      newTickets: newOnes.length,
      solved: solved.length,
      pending: pending.length,
      avgResolutionHours,
      avgSatisfaction,
      slaOverdue,
      total: mine.length,
    }
  },

  async getStatusDistribution() {
    const mine = MOCK_TICKETS.filter(isMine)
    const counts: Record<string, number> = {}
    mine.forEach((t) => {
      counts[t.status] = (counts[t.status] ?? 0) + 1
    })
    return Object.entries(counts).map(([status, count]) => ({ status, count }))
  },

  async getCategoryDistribution() {
    const mine = MOCK_TICKETS.filter(isMine)
    const counts: Record<string, number> = {}
    mine.forEach((t) => {
      const name = t.category?.name ?? "Sem categoria"
      counts[name] = (counts[name] ?? 0) + 1
    })
    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
  },

  async getMonthlyEvolution() {
    const mine = MOCK_TICKETS.filter(isMine)
    const buckets = new Map<string, { opened: number; solved: number; avgHours: number; sumHours: number }>()
    const months: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      months.push(key)
      buckets.set(key, { opened: 0, solved: 0, avgHours: 0, sumHours: 0 })
    }
    mine.forEach((t) => {
      const d = new Date(t.date_creation)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const b = buckets.get(key)
      if (b) {
        b.opened++
        if (t.solve_delay_stat) {
          b.sumHours += t.solve_delay_stat / 3600
          b.solved++
        }
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
  },
}

export const satisfactionRepository = {
  async list() {
    return [...MOCK_SATISFACTIONS].sort(
      (a, b) => new Date(b.date_answered).getTime() - new Date(a.date_answered).getTime(),
    )
  },

  async getStats() {
    const all = MOCK_SATISFACTIONS
    const avg = all.reduce((a, s) => a + s.satisfaction, 0) / Math.max(1, all.length)
    const positive = all.filter((s) => s.satisfaction >= 4).length
    const negative = all.filter((s) => s.satisfaction <= 2).length
    return {
      total: all.length,
      avg,
      positivePct: (positive / Math.max(1, all.length)) * 100,
      negativePct: (negative / Math.max(1, all.length)) * 100,
    }
  },

  async getMonthlyTrend() {
    const buckets = new Map<string, { sum: number; count: number }>()
    const months: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      months.push(key)
      buckets.set(key, { sum: 0, count: 0 })
    }
    MOCK_SATISFACTIONS.forEach((s) => {
      const d = new Date(s.date_answered)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const b = buckets.get(key)
      if (b) {
        b.sum += s.satisfaction
        b.count++
      }
    })
    return months.map((key) => {
      const b = buckets.get(key)!
      const [y, m] = key.split("-")
      const monthName = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("pt-BR", { month: "short" })
      return {
        month: monthName,
        media: b.count > 0 ? Number((b.sum / b.count).toFixed(2)) : 0,
        avaliacoes: b.count,
      }
    })
  },

  async getDistribution() {
    const counts = [1, 2, 3, 4, 5].map((n) => ({
      nota: `${n} ★`,
      total: MOCK_SATISFACTIONS.filter((s) => s.satisfaction === n).length,
    }))
    return counts
  },
}

export const categoriesRepository = {
  async list() {
    return MOCK_CATEGORIES
  },
}

function applyFilters(items: GlpiTicket[], f: TicketFilters): GlpiTicket[] {
  let r = items
  if (f.status?.length) r = r.filter((t) => f.status!.includes(t.status))
  if (f.priority?.length) r = r.filter((t) => f.priority!.includes(t.priority))
  if (f.categoryId?.length) r = r.filter((t) => t.category && f.categoryId!.includes(t.category.id))
  if (f.search) {
    const q = f.search.toLowerCase()
    r = r.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        String(t.id).includes(q) ||
        t.requester.name.toLowerCase().includes(q) ||
        (t.requester.firstname ?? "").toLowerCase().includes(q),
    )
  }
  if (f.dateFrom) r = r.filter((t) => new Date(t.date_creation) >= new Date(f.dateFrom!))
  if (f.dateTo) r = r.filter((t) => new Date(t.date_creation) <= new Date(f.dateTo!))
  if (f.slaOverdue) {
    const now = Date.now()
    r = r.filter(
      (t) =>
        t.time_to_resolve &&
        new Date(t.time_to_resolve).getTime() < now &&
        t.status !== "solved" &&
        t.status !== "closed",
    )
  }
  return r
}
