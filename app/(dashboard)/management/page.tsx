"use client";

import {
  Activity, AlertTriangle, CheckCircle2, Clock, Sparkles, Star, Timer, Users
} from "lucide-react";
import { useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis
} from "recharts";

import { DateRangeFilter, type DateRange } from "@/components/filters/date-range-filter";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useManagement, useManagedEntitiesCount } from "@/src/presentation/viewmodels/use-management";
import { STATUS_LABELS } from "@/src/domain/entities/ticket";
import type { TechnicianStats } from "@/src/domain/repositories/IManagementRepository";

// ---------------------------------------------------------------------------
// Configs dos gráficos
// ---------------------------------------------------------------------------

const statusConfig = {
  count: { label: "Chamados", color: "var(--chart-1)" },
} satisfies ChartConfig;

const categoryConfig = {
  count: { label: "Chamados", color: "var(--chart-2)" },
} satisfies ChartConfig;

const monthlyConfig = {
  abertos: { label: "Abertos", color: "var(--chart-1)" },
  resolvidos: { label: "Resolvidos", color: "var(--chart-2)" },
} satisfies ChartConfig;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function SatBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-xs text-muted-foreground">—</span>;
  const color =
    value >= 4 ? "text-emerald-600 dark:text-emerald-400" :
    value <= 2 ? "text-red-600 dark:text-red-400" :
    "text-amber-600 dark:text-amber-400";
  return <span className={cn("text-sm font-medium tabular-nums", color)}>{value.toFixed(2)} ★</span>;
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function ManagementPage() {
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });
  const { data, isLoading } = useManagement(dateRange);
  const managedCount = useManagedEntitiesCount();
  const ov = data?.overview;
  const techs = data?.technicians ?? [];
  const statusDist = data?.statusDist ?? [];
  const categoryDist = data?.categoryDist ?? [];
  const monthly = data?.monthly ?? [];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Gestão Geral</h1>
            <p className="text-sm text-muted-foreground">
              Visão consolidada de todos os técnicos e chamados
              {managedCount > 0 && (
                <span className="ml-1">
                  em <span className="font-medium text-foreground">{managedCount}</span>{" "}
                  {managedCount === 1 ? "setor gerenciado" : "setores gerenciados"}.
                </span>
              )}
            </p>
          </div>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Métricas */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Em aberto"
          value={ov?.totalOpen ?? 0}
          hint="Todos os técnicos"
          icon={Activity}
          accent="violet"
          loading={isLoading}
        />
        <MetricCard
          label="Sem técnico"
          value={ov?.newUnassigned ?? 0}
          hint="Aguardando atribuição"
          icon={Sparkles}
          accent="blue"
          loading={isLoading}
        />
        <MetricCard
          label="Resolvidos"
          value={ov?.resolvedInPeriod ?? 0}
          hint="No período selecionado"
          icon={CheckCircle2}
          accent="emerald"
          loading={isLoading}
        />
        <MetricCard
          label="SLA vencido"
          value={ov?.slaOverdue ?? 0}
          hint="Requer atenção"
          icon={AlertTriangle}
          accent="red"
          loading={isLoading}
        />
        <MetricCard
          label="Tempo médio"
          value={ov ? `${ov.avgResolutionHours.toFixed(1)}h` : "—"}
          hint="Resolução geral"
          icon={Timer}
          accent="primary"
          loading={isLoading}
        />
        <MetricCard
          label="Satisfação"
          value={ov ? `${ov.avgSatisfaction.toFixed(2)} ★` : "—"}
          hint="Média geral"
          icon={Star}
          accent="amber"
          loading={isLoading}
        />
      </section>

      {/* Evolução mensal + distribuição por status */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Evolução mensal</CardTitle>
            <CardDescription>Chamados abertos vs. resolvidos nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ChartContainer config={monthlyConfig} className="h-64 w-full">
                <LineChart data={monthly} margin={{ left: 8, right: 16, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line dataKey="abertos" type="monotone" stroke="var(--color-abertos)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line dataKey="resolvidos" type="monotone" stroke="var(--color-resolvidos)" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Por status</CardTitle>
            <CardDescription>Distribuição atual de todos os chamados</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ChartContainer config={statusConfig} className="h-64 w-full">
                <BarChart
                  data={statusDist.map((s) => ({
                    ...s,
                    status: (STATUS_LABELS as Record<string, string>)[s.status] ?? s.status,
                  }))}
                  layout="vertical"
                  margin={{ left: 16, right: 16, top: 8 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis type="category" dataKey="status" tickLine={false} axisLine={false} fontSize={11} width={70} />
                  <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Top categorias */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Top categorias</CardTitle>
          <CardDescription>Volume de chamados por categoria no período</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ChartContainer config={categoryConfig} className="h-48 w-full">
              <BarChart data={categoryDist} margin={{ left: 8, right: 16, top: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="category" tickLine={false} axisLine={false} fontSize={10} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabela de técnicos */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-primary" /> Desempenho por técnico
          </CardTitle>
          <CardDescription>
            Chamados atribuídos, resolvidos, pendentes, SLA e satisfação por técnico
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : techs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum técnico encontrado no período.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs">Técnico</TableHead>
                    <TableHead className="text-right text-xs">Atribuídos</TableHead>
                    <TableHead className="text-right text-xs">Resolvidos</TableHead>
                    <TableHead className="text-right text-xs">Pendentes</TableHead>
                    <TableHead className="text-right text-xs">SLA vencido</TableHead>
                    <TableHead className="text-right text-xs">Tempo médio</TableHead>
                    <TableHead className="text-right text-xs">Satisfação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {techs.map((tech: TechnicianStats) => (
                    <TableRow key={tech.id} className="transition-colors hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-primary/15 text-[10px] text-primary">
                              {getInitials(tech.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{tech.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm tabular-nums">{tech.assigned}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm tabular-nums text-emerald-600 dark:text-emerald-400">{tech.resolved}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm tabular-nums text-amber-600 dark:text-amber-400">{tech.pending}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {tech.slaOverdue > 0 ? (
                          <Badge variant="destructive" className="text-xs tabular-nums">
                            {tech.slaOverdue}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                        {tech.avgResolutionHours != null ? `${tech.avgResolutionHours}h` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <SatBadge value={tech.avgSatisfaction} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
