// Tipos baseados na estrutura do banco GLPI
// Mapeia tabelas: glpi_tickets, glpi_users, glpi_itilcategories, glpi_ticketsatisfactions

export type TicketStatus = "new" | "assigned" | "planned" | "pending" | "solved" | "closed"
export type TicketPriority = 1 | 2 | 3 | 4 | 5 | 6 // 1=very low ... 6=major
export type TicketUrgency = 1 | 2 | 3 | 4 | 5
export type TicketImpact = 1 | 2 | 3 | 4 | 5

export interface GlpiUser {
  id: number
  name: string
  realname: string | null
  firstname: string | null
  email: string | null
  avatar?: string | null
}

export interface GlpiCategory {
  id: number
  name: string
  completename: string
}

export interface GlpiTicket {
  id: number
  name: string // título
  content: string // descrição (HTML do GLPI)
  status: TicketStatus
  priority: TicketPriority
  urgency: TicketUrgency
  impact: TicketImpact
  type: 1 | 2 // 1=incident, 2=request
  date_creation: string // ISO
  date_mod: string
  solvedate: string | null
  closedate: string | null
  time_to_resolve: string | null // SLA TTR
  requester: GlpiUser
  technician: GlpiUser | null
  category: GlpiCategory | null
  entity: string
  takeintoaccount_delay_stat: number | null // tempo até primeira ação (s)
  solve_delay_stat: number | null // tempo até resolução (s)
}

export interface GlpiSatisfaction {
  id: number
  ticket_id: number
  ticket_name: string
  satisfaction: number // 1-5
  comment: string | null
  date_answered: string
  user: GlpiUser
  category: string
  technician: GlpiUser
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  new: "Novo",
  assigned: "Atribuído",
  planned: "Planejado",
  pending: "Pendente",
  solved: "Resolvido",
  closed: "Fechado",
}

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  1: "Muito Baixa",
  2: "Baixa",
  3: "Média",
  4: "Alta",
  5: "Muito Alta",
  6: "Crítica",
}
