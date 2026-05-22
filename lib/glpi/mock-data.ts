import type { GlpiTicket, GlpiSatisfaction, GlpiUser, GlpiCategory, TicketStatus, TicketPriority } from "./types"

const technicianMe: GlpiUser = {
  id: 42,
  name: "tec.silva",
  realname: "Silva",
  firstname: "Carlos",
  email: "carlos.silva@empresa.com",
}

const users: GlpiUser[] = [
  { id: 101, name: "ana.costa", realname: "Costa", firstname: "Ana", email: "ana.costa@empresa.com" },
  { id: 102, name: "joao.pereira", realname: "Pereira", firstname: "João", email: "joao.pereira@empresa.com" },
  { id: 103, name: "maria.santos", realname: "Santos", firstname: "Maria", email: "maria.santos@empresa.com" },
  { id: 104, name: "pedro.alves", realname: "Alves", firstname: "Pedro", email: "pedro.alves@empresa.com" },
  { id: 105, name: "lucia.oliveira", realname: "Oliveira", firstname: "Lúcia", email: "lucia.o@empresa.com" },
  { id: 106, name: "rafael.lima", realname: "Lima", firstname: "Rafael", email: "rafael.lima@empresa.com" },
  { id: 107, name: "fernanda.dias", realname: "Dias", firstname: "Fernanda", email: "fernanda.d@empresa.com" },
  { id: 108, name: "marcos.rocha", realname: "Rocha", firstname: "Marcos", email: "marcos.rocha@empresa.com" },
]

const categories: GlpiCategory[] = [
  { id: 1, name: "Hardware", completename: "Hardware" },
  { id: 2, name: "Software", completename: "Software" },
  { id: 3, name: "Rede", completename: "Infraestrutura > Rede" },
  { id: 4, name: "E-mail", completename: "Software > E-mail" },
  { id: 5, name: "Acesso", completename: "Segurança > Acesso" },
  { id: 6, name: "Impressora", completename: "Hardware > Impressora" },
  { id: 7, name: "Sistema ERP", completename: "Software > ERP" },
  { id: 8, name: "VPN", completename: "Infraestrutura > VPN" },
]

const titles = [
  "Computador não liga após queda de energia",
  "Erro ao acessar sistema ERP",
  "Solicitação de instalação do Office 365",
  "Internet lenta no setor financeiro",
  "Não consigo enviar e-mails externos",
  "Impressora travando ao imprimir relatórios",
  "Solicitação de acesso à pasta compartilhada",
  "VPN desconecta a cada 10 minutos",
  "Tela azul ao iniciar o Windows",
  "Mouse e teclado não funcionam",
  "Erro 500 ao gerar nota fiscal",
  "Solicitação de novo monitor",
  "Wi-Fi não conecta no andar 3",
  "Senha expirada - reset solicitado",
  "Backup automático falhando",
  "Atualização do antivírus pendente",
  "Software de design travando",
  "Telefone IP sem áudio",
  "Compartilhamento de impressora",
  "Configurar e-mail no celular",
]

const comments = [
  "Atendimento excelente, muito rápido!",
  "Problema resolvido em poucas horas, parabéns.",
  "Técnico muito atencioso e prestativo.",
  "Demorou um pouco mas foi resolvido.",
  "Solução funcionou perfeitamente.",
  "Atendimento muito demorado.",
  "Não foi resolvido completamente, voltei a abrir chamado.",
  "Excelente comunicação durante todo o processo.",
  "Recomendo o profissional, super competente.",
  "Tive que insistir para conseguir atendimento.",
  null,
  null,
  "Muito satisfeito com o suporte recebido.",
  "Resolveu rapidamente, obrigado!",
]

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const rand = seededRandom(20260522)

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(Math.floor(rand() * 24), Math.floor(rand() * 60), 0, 0)
  return d
}

const STATUSES: TicketStatus[] = ["new", "assigned", "planned", "pending", "solved", "closed"]
const PRIORITIES: TicketPriority[] = [1, 2, 3, 4, 5, 6]

function generateTickets(count: number): GlpiTicket[] {
  const tickets: GlpiTicket[] = []
  for (let i = 0; i < count; i++) {
    const created = daysAgo(Math.floor(rand() * 90))
    const status: TicketStatus = pick(STATUSES)
    const priority: TicketPriority = PRIORITIES[Math.floor(rand() * PRIORITIES.length)]
    const isMine = rand() > 0.35 // 65% atribuídos a mim
    const isUnassigned = !isMine && rand() > 0.5
    const solved = status === "solved" || status === "closed"
    const solveDate = solved ? new Date(created.getTime() + (rand() * 7 + 0.1) * 86400000) : null
    const ttr = new Date(created.getTime() + (priority >= 5 ? 4 : priority >= 3 ? 24 : 72) * 3600000)

    tickets.push({
      id: 1000 + i,
      name: pick(titles),
      content: "Descrição detalhada do chamado fornecida pelo usuário.",
      status,
      priority,
      urgency: Math.min(5, priority) as 1 | 2 | 3 | 4 | 5,
      impact: Math.min(5, priority) as 1 | 2 | 3 | 4 | 5,
      type: rand() > 0.5 ? 1 : 2,
      date_creation: created.toISOString(),
      date_mod: created.toISOString(),
      solvedate: solveDate?.toISOString() ?? null,
      closedate: status === "closed" ? solveDate?.toISOString() ?? null : null,
      time_to_resolve: ttr.toISOString(),
      requester: pick(users),
      technician: isUnassigned ? null : isMine ? technicianMe : pick(users),
      category: pick(categories),
      entity: "Matriz",
      takeintoaccount_delay_stat: Math.floor(rand() * 3600 * 4),
      solve_delay_stat: solved ? Math.floor(rand() * 3600 * 48 + 600) : null,
    })
  }
  return tickets.sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime())
}

export const MOCK_TICKETS: GlpiTicket[] = generateTickets(120)
export const MOCK_CATEGORIES = categories
export const MOCK_USERS = users
export const CURRENT_TECHNICIAN = technicianMe

export const MOCK_SATISFACTIONS: GlpiSatisfaction[] = MOCK_TICKETS.filter(
  (t) => t.technician?.id === technicianMe.id && (t.status === "solved" || t.status === "closed"),
)
  .slice(0, 35)
  .map((t, i) => ({
    id: i + 1,
    ticket_id: t.id,
    ticket_name: t.name,
    satisfaction: Math.max(1, Math.min(5, Math.round(3 + (rand() - 0.3) * 3))),
    comment: pick(comments),
    date_answered: t.solvedate ?? t.date_creation,
    user: t.requester,
    category: t.category?.name ?? "—",
    technician: technicianMe,
  }))
