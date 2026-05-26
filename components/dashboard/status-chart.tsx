"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { STATUS_LABELS, type TicketStatus } from "@/src/domain/entities/ticket"

const config = {
  count: { label: "Chamados", color: "var(--chart-1)" },
} satisfies ChartConfig

export function StatusChart({ data }: { data: { status: string; count: number }[] }) {
  const formatted = data.map((d) => ({
    status: STATUS_LABELS[d.status as TicketStatus] ?? d.status,
    count: d.count,
  }))

  return (
    <ChartContainer config={config} className="h-72 w-full">
      <BarChart data={formatted} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis
          type="category"
          dataKey="status"
          tickLine={false}
          axisLine={false}
          fontSize={11}
          width={80}
        />
        <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
