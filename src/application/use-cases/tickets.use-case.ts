// Caso de uso: consulta de chamados.

import { ticketsRepository } from "@/src/infrastructure/repositories/tickets.repository"
import type { TicketFilters } from "@/src/domain/repositories/ITicketsRepository"

export async function getMyTickets(filters: TicketFilters = {}) {
  return ticketsRepository.getMyTickets(filters)
}

export async function getNewTickets(filters: TicketFilters = {}) {
  return ticketsRepository.getNewTickets(filters)
}

export async function getTicketById(id: number) {
  return ticketsRepository.getById(id)
}
