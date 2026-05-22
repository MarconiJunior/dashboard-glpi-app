"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import type { GlpiTicket } from "@/lib/glpi/types"
import { StatusBadge, PriorityBadge } from "./badges"
import { formatDate, formatRelative, getRequesterName, isSlaOverdue } from "@/lib/glpi/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/glpi/utils"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, AlertTriangle, Tag, User, Building2, Hash } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  ticket: GlpiTicket | null
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function TicketDetailSheet({ ticket, open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {ticket && (
          <>
            <SheetHeader className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <Hash className="h-3 w-3" />
                <span>#{ticket.id}</span>
              </div>
              <SheetTitle className="text-balance text-lg leading-snug">{ticket.name}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2 pt-1">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                {isSlaOverdue(ticket) && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-3 w-3" /> SLA vencido
                  </span>
                )}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6 px-4">
              <Section title="Solicitante">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/15 text-primary">
                      {getInitials(getRequesterName(ticket))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{getRequesterName(ticket)}</p>
                    <p className="truncate text-xs text-muted-foreground">{ticket.requester.email}</p>
                  </div>
                </div>
              </Section>

              <Separator />

              <Section title="Detalhes">
                <DetailRow icon={Tag} label="Categoria" value={ticket.category?.completename ?? "—"} />
                <DetailRow icon={Building2} label="Entidade" value={ticket.entity} />
                <DetailRow icon={User} label="Técnico" value={ticket.technician ? getRequesterName({ ...ticket, requester: ticket.technician }) : "Não atribuído"} />
                <DetailRow icon={Calendar} label="Aberto em" value={`${formatDate(ticket.date_creation, { hour: "2-digit", minute: "2-digit" })} · ${formatRelative(ticket.date_creation)}`} />
                {ticket.solvedate && (
                  <DetailRow icon={Calendar} label="Resolvido em" value={formatDate(ticket.solvedate, { hour: "2-digit", minute: "2-digit" })} />
                )}
                <DetailRow
                  icon={Clock}
                  label="SLA até"
                  value={ticket.time_to_resolve ? formatDate(ticket.time_to_resolve, { hour: "2-digit", minute: "2-digit" }) : "—"}
                  className={cn(isSlaOverdue(ticket) && "text-red-600 dark:text-red-400")}
                />
              </Section>

              <Separator />

              <Section title="Descrição">
                <p className="whitespace-pre-line rounded-md border border-border/60 bg-muted/30 p-3 text-sm leading-relaxed text-muted-foreground">
                  {ticket.content}
                </p>
              </Section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType
  label: string
  value: string
  className?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className={cn("text-right font-medium", className)}>{value}</span>
    </div>
  )
}
