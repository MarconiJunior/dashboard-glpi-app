import { ticketsRepository } from "@/src/infrastructure/repositories/tickets.repository"
import type { TicketFilters } from "@/src/domain/repositories/ITicketsRepository"
import type { UserContext } from "@/src/domain/repositories/UserContext"

export async function getMyTickets(ctx: UserContext, filters: TicketFilters = {}) {
  return ticketsRepository.getMyTickets(ctx, filters)
}

export async function getNewTickets(ctx: UserContext, filters: TicketFilters = {}) {
  return ticketsRepository.getNewTickets(ctx, filters)
}

export async function getTicketById(id: number) {
  return ticketsRepository.getById(id)
}
