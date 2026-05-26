"use client"

import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, Inbox, Download, Filter, X } from "lucide-react"
import { useTickets } from "@/src/presentation/viewmodels/use-tickets"
import { useCategories } from "@/src/presentation/viewmodels/use-categories"
import { StatusBadge, PriorityBadge } from "./badges"
import { TicketDetailSheet } from "./ticket-detail-sheet"
import { formatDate, formatRelative, getInitials, getRequesterName, isSlaOverdue, exportToCSV } from "@/src/presentation/utils/ticket"
import type { GlpiTicket, TicketStatus, TicketPriority } from "@/src/domain/entities/ticket"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

type SortKey = "id" | "name" | "priority" | "date_creation" | "time_to_resolve"
type SortDir = "asc" | "desc"

interface Props {
  scope: "mine" | "new"
}

const PAGE_SIZE = 12

export function TicketsTable({ scope }: Props) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [slaOverdue, setSlaOverdue] = useState(false)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "date_creation", dir: "desc" })
  const [selected, setSelected] = useState<GlpiTicket | null>(null)
  const [open, setOpen] = useState(false)

  const { data: catData } = useCategories()
  const { data, isLoading } = useTickets({
    scope,
    search: search.length > 1 ? search : undefined,
    status: statusFilter !== "all" ? [statusFilter] : undefined,
    priority: priorityFilter !== "all" ? [Number(priorityFilter)] : undefined,
    categoryId: categoryFilter !== "all" ? [Number(categoryFilter)] : undefined,
    slaOverdue,
  })

  const sorted = useMemo(() => {
    const items = [...(data?.tickets ?? [])]
    items.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1
      const av = a[sort.key]
      const bv = b[sort.key]
      if (av == null) return 1
      if (bv == null) return -1
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })
    return items
  }, [data, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleSort = (key: SortKey) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }))
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sort.key !== k) return <ArrowUpDown className="h-3 w-3 opacity-40" />
    return sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setPriorityFilter("all")
    setCategoryFilter("all")
    setSlaOverdue(false)
  }

  const hasActiveFilters =
    search.length > 0 || statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all" || slaOverdue

  const handleExport = () => {
    const rows = sorted.map((t) => ({
      ID: t.id,
      Titulo: t.name,
      Solicitante: getRequesterName(t),
      Categoria: t.category?.name ?? "",
      Prioridade: t.priority,
      Status: t.status,
      "Data de abertura": formatDate(t.date_creation),
      "SLA": t.time_to_resolve ? formatDate(t.time_to_resolve) : "",
    }))
    exportToCSV(rows, `chamados-${scope}-${new Date().toISOString().slice(0, 10)}.csv`)
    toast.success("Exportação concluída", { description: `${rows.length} chamados exportados.` })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, título ou solicitante..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="new">Novo</SelectItem>
              <SelectItem value="assigned">Atribuído</SelectItem>
              <SelectItem value="planned">Planejado</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="solved">Resolvido</SelectItem>
              <SelectItem value="closed">Fechado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas prioridades</SelectItem>
              <SelectItem value="6">Crítica</SelectItem>
              <SelectItem value="5">Muito Alta</SelectItem>
              <SelectItem value="4">Alta</SelectItem>
              <SelectItem value="3">Média</SelectItem>
              <SelectItem value="2">Baixa</SelectItem>
              <SelectItem value="1">Muito Baixa</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {catData?.categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5">
            <Switch id="sla" checked={slaOverdue} onCheckedChange={(v) => { setSlaOverdue(v); setPage(1) }} />
            <Label htmlFor="sla" className="cursor-pointer text-xs">SLA vencido</Label>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-3 w-3" /> Limpar
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Exportar
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[80px] cursor-pointer" onClick={() => toggleSort("id")}>
                <div className="flex items-center gap-1 text-xs">ID <SortIcon k="id" /></div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                <div className="flex items-center gap-1 text-xs">Título <SortIcon k="name" /></div>
              </TableHead>
              <TableHead className="hidden md:table-cell">Solicitante</TableHead>
              <TableHead className="hidden cursor-pointer lg:table-cell" onClick={() => toggleSort("priority")}>
                <div className="flex items-center gap-1 text-xs">Prioridade <SortIcon k="priority" /></div>
              </TableHead>
              <TableHead className="hidden lg:table-cell">Categoria</TableHead>
              <TableHead className="hidden cursor-pointer xl:table-cell" onClick={() => toggleSort("date_creation")}>
                <div className="flex items-center gap-1 text-xs">Aberto <SortIcon k="date_creation" /></div>
              </TableHead>
              <TableHead className="hidden cursor-pointer md:table-cell" onClick={() => toggleSort("time_to_resolve")}>
                <div className="flex items-center gap-1 text-xs">SLA <SortIcon k="time_to_resolve" /></div>
              </TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && pageItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-64">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Inbox />
                      </EmptyMedia>
                      <EmptyTitle>Nenhum chamado encontrado</EmptyTitle>
                      <EmptyDescription>
                        {hasActiveFilters
                          ? "Tente ajustar os filtros para ver mais resultados."
                          : "Quando houver chamados, eles aparecerão aqui."}
                      </EmptyDescription>
                    </EmptyHeader>
                    {hasActiveFilters && (
                      <EmptyContent>
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          <Filter className="mr-1 h-3 w-3" /> Limpar filtros
                        </Button>
                      </EmptyContent>
                    )}
                  </Empty>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              pageItems.map((t) => {
                const overdue = isSlaOverdue(t)
                return (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer transition-colors hover:bg-muted/40"
                    onClick={() => {
                      setSelected(t)
                      setOpen(true)
                    }}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">#{t.id}</TableCell>
                    <TableCell className="max-w-[280px]">
                      <p className="truncate font-medium">{t.name}</p>
                      <p className="truncate text-xs text-muted-foreground md:hidden">
                        {getRequesterName(t)} · {formatRelative(t.date_creation)}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-muted text-[10px]">
                            {getInitials(getRequesterName(t))}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm">{getRequesterName(t)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <PriorityBadge priority={t.priority as TicketPriority} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {t.category?.name ?? "—"}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                      {formatRelative(t.date_creation)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {t.time_to_resolve ? (
                        <span className={cn("inline-flex items-center gap-1 text-xs", overdue && "text-red-600 dark:text-red-400")}>
                          {overdue && <AlertTriangle className="h-3 w-3" />}
                          {formatDate(t.time_to_resolve)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.status as TicketStatus} />
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Mostrando <Badge variant="secondary" className="mx-0.5">{pageItems.length}</Badge> de
          <Badge variant="secondary" className="mx-0.5">{sorted.length}</Badge> chamados
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="font-mono">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Próxima
          </Button>
        </div>
      </div>

      <TicketDetailSheet ticket={selected} open={open} onOpenChange={setOpen} />
    </div>
  )
}
