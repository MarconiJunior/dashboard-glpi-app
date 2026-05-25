// Domain entities — tipos puros baseados na estrutura do banco GLPI.
// Sem dependências de frameworks ou infraestrutura.

export type TicketStatus = "new" | "assigned" | "planned" | "pending" | "solved" | "closed"
export type TicketPriority = 1 | 2 | 3 | 4 | 5 | 6 // 1=muito baixa … 6=crítica
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
  content: string // descrição HTML
  status: TicketStatus
  priority: TicketPriority
  urgency: TicketUrgency
  impact: TicketImpact
  type: 1 | 2 // 1=incident, 2=request
  date_creation: string // ISO
  date_mod: string // ISO
  solvedate: string | null
  closedate: string | null
  time_to_resolve: string | null // prazo SLA
  requester: GlpiUser
  technician: GlpiUser | null
  category: GlpiCategory | null
  entity: string
  takeintoaccount_delay_stat: number | null // segundos até 1ª ação
  solve_delay_stat: number | null // segundos até resolução
}

export interface GlpiSatisfaction {
  id: number
  ticket_id: number
  ticket_name: string
  satisfaction: number // 1–5
  comment: string | null
  date_answered: string // ISO
  user: GlpiUser
  category: string
  technician: GlpiUser
}

// ---------------------------------------------------------------------------
// Constantes de domínio
// ---------------------------------------------------------------------------

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
