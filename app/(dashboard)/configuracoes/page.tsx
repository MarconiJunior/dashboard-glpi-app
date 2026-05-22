"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Database, Bell, User } from "lucide-react"
import { toast } from "sonner"

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Preferências do painel e integração com GLPI.</p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-primary" /> Integração GLPI
          </CardTitle>
          <CardDescription>
            Configure a conexão com o banco MySQL do GLPI. Altere as variáveis em <code className="font-mono">.env</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldLabel>DATABASE_URL</FieldLabel>
            <Input defaultValue="mysql://glpi_user:****@db.servidor.local:3306/glpi" readOnly className="font-mono text-xs" />
            <FieldDescription>String de conexão usada pelo Prisma Client.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Endpoint da API GLPI (opcional)</FieldLabel>
            <Input defaultValue="https://glpi.empresa.com/apirest.php" readOnly className="font-mono text-xs" />
          </Field>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-primary" /> Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Novos chamados em tempo real</p>
              <p className="text-xs text-muted-foreground">Receba avisos quando novos chamados forem abertos.</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Alertas de SLA vencido</p>
              <p className="text-xs text-muted-foreground">Avisos quando algum chamado estiver próximo de estourar o SLA.</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Resumo diário por e-mail</p>
              <p className="text-xs text-muted-foreground">Receba um resumo das suas métricas todos os dias às 8h.</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" /> Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldLabel>Nome de exibição</FieldLabel>
            <Input defaultValue="Carlos Silva" />
          </Field>
          <Field>
            <FieldLabel>E-mail</FieldLabel>
            <Input type="email" defaultValue="carlos.silva@empresa.com" />
          </Field>
          <div className="flex justify-end">
            <Button onClick={() => toast.success("Configurações salvas")}>Salvar alterações</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
