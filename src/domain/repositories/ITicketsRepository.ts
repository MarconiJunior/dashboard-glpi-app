// Interface do repositório de tickets — define o contrato sem implementação.

import type { GlpiTicket, TicketStatus, TicketPriority } from "../entities/ticket"

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
  getMyTickets(filters?: TicketFilters): Promise<GlpiTicket[]>
  getNewTickets(filters?: TicketFilters): Promise<GlpiTicket[]>
  getById(id: number): Promise<GlpiTicket | null>
  getDashboardMetrics(): Promise<DashboardMetrics>
  getStatusDistribution(): Promise<{ status: string; count: number }[]>
  getCategoryDistribution(): Promise<{ category: string; count: number }[]>
  getMonthlyEvolution(): Promise<{ month: string; abertos: number; resolvidos: number; tempoMedio: number }[]>
}
