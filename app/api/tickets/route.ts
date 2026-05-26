import { NextResponse } from "next/server"
import { getMyTickets, getNewTickets } from "@/src/application/use-cases/tickets.use-case"
import type { TicketFilters } from "@/src/domain/repositories/ITicketsRepository"
import type { TicketPriority, TicketStatus } from "@/src/domain/entities/ticket"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const scope = searchParams.get("scope") ?? "mine"

  const filters: TicketFilters = {
    search: searchParams.get("search") ?? undefined,
    status: (searchParams.getAll("status") as TicketStatus[]) || undefined,
    priority: searchParams.getAll("priority").map(Number) as TicketPriority[],
    categoryId: searchParams.getAll("categoryId").map(Number),
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    slaOverdue: searchParams.get("slaOverdue") === "true",
  }

  const tickets = scope === "new"
    ? await getNewTickets(filters)
    : await getMyTickets(filters)

  return NextResponse.json({ tickets })
}
