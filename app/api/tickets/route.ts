import { NextResponse } from "next/server"
import { ticketsRepository, type TicketFilters } from "@/lib/glpi/repository"
import type { TicketPriority, TicketStatus } from "@/lib/glpi/types"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const scope = searchParams.get("scope") ?? "mine" // mine | new

  const filters: TicketFilters = {
    search: searchParams.get("search") ?? undefined,
    status: (searchParams.getAll("status") as TicketStatus[]) || undefined,
    priority: searchParams.getAll("priority").map(Number) as TicketPriority[],
    categoryId: searchParams.getAll("categoryId").map(Number),
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    slaOverdue: searchParams.get("slaOverdue") === "true",
  }

  const tickets = scope === "new" ? await ticketsRepository.getNewTickets(filters) : await ticketsRepository.getMyTickets(filters)

  return NextResponse.json({ tickets })
}
