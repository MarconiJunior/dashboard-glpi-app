"use client";

import { Activity, AlertTriangle, CheckCircle2, Clock, Inbox, Sparkles, Star, Timer } from "lucide-react";
import { useState } from "react";

import { DateRangeFilter, type DateRange } from "@/components/filters/date-range-filter";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { MetricCard } from "@/components/dashboard/metric-card";
import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { ResolutionTimeChart } from "@/components/dashboard/resolution-time-chart";
import { StatusChart } from "@/components/dashboard/status-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/src/presentation/viewmodels/use-dashboard";

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });
  const { data, isLoading } = useDashboard(dateRange);
  const m = data?.metrics;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-balance font-display text-2xl font-semibold tracking-tight">Visão geral</h1>
          <p className="text-sm text-muted-foreground">
            Métricas em tempo real dos seus chamados no GLPI.
          </p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Atribuídos"
          value={m?.assigned ?? 0}
          hint="Em andamento"
          icon={Inbox}
          accent="violet"
          loading={isLoading}
        />
        <MetricCard
          label="Novos"
          value={m?.newTickets ?? 0}
          hint="Aguardando atendimento"
          icon={Sparkles}
          accent="blue"
          loading={isLoading}
        />
        <MetricCard
          label="Resolvidos"
          value={m?.solved ?? 0}
          hint="Total no período"
          icon={CheckCircle2}
          accent="emerald"
          loading={isLoading}
        />
        <MetricCard
          label="Pendentes"
          value={m?.pending ?? 0}
          hint="Aguardando retorno"
          icon={Clock}
          accent="amber"
          loading={isLoading}
        />
        <MetricCard
          label="Tempo médio"
          value={m ? `${m.avgResolutionHours.toFixed(1)}h` : "—"}
          hint="Resolução"
          icon={Timer}
          accent="primary"
          loading={isLoading}
        />
        <MetricCard
          label="Satisfação"
          value={m ? `${m.avgSatisfaction.toFixed(1)} ★` : "—"}
          hint="Média geral"
          icon={Star}
          accent="amber"
          loading={isLoading}
        />
        <MetricCard
          label="SLA vencido"
          value={m?.slaOverdue ?? 0}
          hint="Atenção urgente"
          icon={AlertTriangle}
          accent="red"
          loading={isLoading}
        />
        <MetricCard
          label="Total"
          value={m?.total ?? 0}
          hint="Meus chamados"
          icon={Activity}
          accent="primary"
          loading={isLoading}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Evolução mensal</CardTitle>
            <CardDescription>Chamados abertos vs. resolvidos nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? <Skeleton className="h-72 w-full" /> : <MonthlyChart data={data?.monthly ?? []} />}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Por status</CardTitle>
            <CardDescription>Distribuição atual</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-72 w-full" /> : <StatusChart data={data?.statusDist ?? []} />}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Top categorias</CardTitle>
            <CardDescription>Volume de chamados por categoria</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? <Skeleton className="h-72 w-full" /> : <CategoryChart data={data?.categoryDist ?? []} />}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Tempo médio de resolução</CardTitle>
            <CardDescription>Histórico em horas (últimos 6 meses)</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? <Skeleton className="h-72 w-full" /> : <ResolutionTimeChart data={data?.monthly ?? []} />}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
