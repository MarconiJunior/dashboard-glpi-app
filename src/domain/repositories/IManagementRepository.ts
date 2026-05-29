// Interface do repositório de gestão geral (visão de supervisor).

export interface ManagementOverview {
  totalOpen: number        // chamados em aberto (status 1-4)
  newUnassigned: number    // chamados novos sem técnico
  resolvedInPeriod: number // resolvidos/fechados no período
  slaOverdue: number       // SLA vencido (abertos)
  avgResolutionHours: number
  avgSatisfaction: number
}

export interface TechnicianStats {
  id: number
  fullName: string
  assigned: number
  resolved: number
  pending: number
  slaOverdue: number
  avgSatisfaction: number | null
  avgResolutionHours: number | null
}

export interface DateFilters {
  dateFrom?: string // "YYYY-MM-DD"
  dateTo?: string   // "YYYY-MM-DD"
}

export interface IManagementRepository {
  getOverview(entities: number[], filters?: DateFilters): Promise<ManagementOverview>
  getTechnicianStats(entities: number[], filters?: DateFilters): Promise<TechnicianStats[]>
  getStatusDistribution(entities: number[], filters?: DateFilters): Promise<{ status: string; count: number }[]>
  getCategoryDistribution(entities: number[], filters?: DateFilters): Promise<{ category: string; count: number }[]>
  getMonthlyEvolution(entities: number[]): Promise<{ month: string; abertos: number; resolvidos: number }[]>
}
