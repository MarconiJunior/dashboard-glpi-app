"use client"

import { Badge } from "@/components/ui/badge"
import { STATUS_LABELS, type TicketStatus, type TicketPriority, PRIORITY_LABELS } from "@/lib/glpi/types"
import { priorityColor, statusColor } from "@/lib/glpi/utils"
import { cn } from "@/lib/utils"

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", statusColor(status))}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <Badge variant="outline" className={cn("font-medium", priorityColor(priority))}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  )
}
