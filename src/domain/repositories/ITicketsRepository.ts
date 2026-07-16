// Interface do repositório de tickets — define o contrato sem implementação.

import type { GlpiTicket, TicketStatus, TicketPriority } from "../entities/ticket";
import type { UserContext } from "./UserContext";

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

export interface DashboardData {
  metrics: DashboardMetrics
  statusDist: { status: string; count: number }[]
  categoryDist: { category: string; count: number }[]
  monthly: { month: string; abertos: number; resolvidos: number; tempoMedio: number }[]
}

export interface ITicketsRepository {
  getMyTickets(ctx: UserContext, filters?: TicketFilters): Promise<GlpiTicket[]>
  getNewTickets(ctx: UserContext, filters?: TicketFilters): Promise<GlpiTicket[]>
  getById(id: number): Promise<GlpiTicket | null>
  /** Busca os chamados do técnico uma única vez e deriva métricas, distribuições e evolução mensal. */
  getDashboardData(ctx: UserContext, filters?: Pick<TicketFilters, "dateFrom" | "dateTo">): Promise<DashboardData>
}
