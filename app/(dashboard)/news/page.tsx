"use client"

import { AlertTriangle, Clock, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PriorityBadge, StatusBadge } from "@/components/tickets/badges";
import { TicketDetailSheet } from "@/components/tickets/ticket-detail-sheet";
import { TicketsTable } from "@/components/tickets/tickets-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
    formatRelative, getInitials, getRequesterName, isSlaOverdue
} from "@/src/presentation/utils/ticket";
import { useTickets } from "@/src/presentation/viewmodels/use-tickets";

import type { GlpiTicket } from "@/src/domain/entities/ticket"
export default function NewTicketsPage() {
  const { data, isLoading } = useTickets({ scope: "new" })
  const tickets = data?.tickets ?? []
  const critical = tickets.filter((t) => t.priority >= 5)

  const [selected, setSelected] = useState<GlpiTicket | null>(null)
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Novos chamados</h1>
          <p className="text-sm text-muted-foreground">
            Chamados recém abertos aguardando atribuição. Atualizado em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          {tickets.length} aguardando · atualiza a cada 15s
        </div>
      </div>

      {critical.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-semibold">Críticos / Urgentes</h2>
            <span className="text-xs text-muted-foreground">({critical.length})</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {critical.map((t) => {
              const overdue = isSlaOverdue(t)
              return (
                <Card
                  key={t.id}
                  className={cn(
                    "cursor-pointer border-red-500/30 bg-red-500/5 transition-all hover:border-red-500/50 hover:shadow-md",
                    overdue && "border-red-500/60",
                  )}
                  onClick={() => {
                    setSelected(t)
                    setOpen(true)
                  }}
                >
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground">#{t.id}</span>
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <p className="line-clamp-2 text-sm font-medium leading-snug">{t.name}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="bg-muted text-[9px]">
                            {getInitials(getRequesterName(t))}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{getRequesterName(t)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelative(t.date_creation)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        toast.success("Chamado atribuído", { description: `#${t.id} agora é seu.` })
                      }}
                    >
                      Assumir chamado
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Em cards</TabsTrigger>
          <TabsTrigger value="table">Em tabela</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-3">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Sparkles />
                </EmptyMedia>
                <EmptyTitle>Tudo em dia!</EmptyTitle>
                <EmptyDescription>Nenhum chamado novo aguardando atribuição.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {tickets.map((t) => {
                const overdue = isSlaOverdue(t)
                return (
                  <Card
                    key={t.id}
                    className="cursor-pointer border-border/60 transition-all hover:border-primary/40 hover:shadow-md"
                    onClick={() => {
                      setSelected(t)
                      setOpen(true)
                    }}
                  >
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-muted-foreground">#{t.id}</span>
                        <div className="flex items-center gap-1">
                          {overdue && (
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500" aria-label="SLA vencido" />
                          )}
                          <PriorityBadge priority={t.priority} />
                        </div>
                      </div>
                      <p className="line-clamp-2 text-sm font-medium leading-snug">{t.name}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={t.status} />
                        {t.category && (
                          <span className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {t.category.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="bg-muted text-[9px]">
                              {getInitials(getRequesterName(t))}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{getRequesterName(t)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelative(t.date_creation)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="table">
          <TicketsTable scope="new" />
        </TabsContent>
      </Tabs>

      <TicketDetailSheet ticket={selected} open={open} onOpenChange={setOpen} />
    </div>
  )
}
