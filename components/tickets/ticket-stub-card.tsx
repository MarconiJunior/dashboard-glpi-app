"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { GlpiTicket } from "@/src/domain/entities/ticket";

interface Props {
  ticket: GlpiTicket
  critical?: boolean
  overdue?: boolean
  onClick?: () => void
  children: ReactNode
  className?: string
}

function priorityDot(p: number): string {
  if (p >= 5) return "bg-signal-crit";
  if (p >= 4) return "bg-signal-warn";
  if (p >= 3) return "bg-signal-warn/70";
  if (p >= 2) return "bg-signal-info";
  return "bg-muted-foreground/40";
}

/**
 * Card de chamado no formato de canhoto de bilhete: o ID e a prioridade
 * ficam num talão picotado à esquerda, separado por uma linha de perfuração.
 */
export function TicketStubCard({ ticket, critical, overdue, onClick, children, className }: Props) {
  return (
    <div
      className={cn(
        "group relative flex overflow-hidden rounded-lg border bg-card transition-all",
        critical ? "border-signal-crit/35 bg-signal-crit/[0.04]" : "border-border/60",
        overdue && "border-signal-crit/60",
        onClick && "cursor-pointer hover:border-primary/40 hover:shadow-md",
        className,
      )}
      onClick={onClick}
    >
      {/* Talão */}
      <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-2 border-r border-dashed border-border/70 py-3">
        <span className={cn("h-2 w-2 rounded-full", priorityDot(ticket.priority))} aria-hidden />
        <span className="font-mono text-[10px] text-muted-foreground">#{ticket.id}</span>
      </div>

      {/* Picotes — recortam a borda do talão como um bilhete real */}
      <span
        className="absolute left-14 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background"
        aria-hidden
      />
      <span
        className="absolute bottom-0 left-14 h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-background"
        aria-hidden
      />

      <div className="min-w-0 flex-1 space-y-3 p-4">{children}</div>
    </div>
  );
}
