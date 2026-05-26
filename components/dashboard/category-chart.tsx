"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const config = {
  count: { label: "Chamados", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function CategoryChart({ data }: { data: { category: string; count: number }[] }) {
  return (
    <ChartContainer config={config} className="h-72 w-full">
      <BarChart data={data.slice(0, 8)} margin={{ left: 8, right: 16, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="category" tickLine={false} axisLine={false} fontSize={10} interval={0} angle={-20} textAnchor="end" height={56} />
        <YAxis tickLine={false} axisLine={false} fontSize={11} />
        <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
