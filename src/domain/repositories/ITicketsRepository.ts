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

export interface ITicketsRepository {
  getMyTickets(ctx: UserContext, filters?: TicketFilters): Promise<GlpiTicket[]>
  getNewTickets(ctx: UserContext, filters?: TicketFilters): Promise<GlpiTicket[]>
  getById(id: number): Promise<GlpiTicket | null>
  getDashboardMetrics(ctx: UserContext): Promise<DashboardMetrics>
  getStatusDistribution(ctx: UserContext): Promise<{ status: string; count: number }[]>
  getCategoryDistribution(ctx: UserContext): Promise<{ category: string; count: number }[]>
  getMonthlyEvolution(ctx: UserContext): Promise<{ month: string; abertos: number; resolvidos: number; tempoMedio: number }[]>
}
