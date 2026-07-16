import { TicketsTable } from "@/components/tickets/tickets-table";

export default function MyTicketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Meus chamados</h1>
        <p className="text-sm text-muted-foreground">
          Todos os chamados atribuídos a você. Clique em uma linha para ver detalhes.
        </p>
      </div>
      <TicketsTable scope="mine" />
    </div>
  );
}
