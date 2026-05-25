"use client"

import { Moon, Sun, Search } from "lucide-react"
import { useTheme } from "next-themes"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getInitials } from "@/lib/glpi/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AppNavbar() {
  const { theme, setTheme } = useTheme()
  const { data } = useSWR<{ fullName: string }>("/api/me", fetcher, { revalidateOnFocus: false })
  const fullName = data?.fullName ?? "Técnico"

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-6 backdrop-blur-md">
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar chamados, usuários, categorias..."
          className="h-9 border-border/60 bg-muted/40 pl-9 text-sm focus-visible:bg-background"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Badge variant="outline" className="hidden gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 md:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Tempo real
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Alternar tema"
        >
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="hidden h-4 w-4 dark:block" />
        </Button>
        <div className="flex items-center gap-2 border-l border-border pl-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col leading-tight md:flex">
            <span className="text-xs font-semibold">{fullName}</span>
            <span className="text-[10px] text-muted-foreground">Técnico de Suporte</span>
          </div>
        </div>
      </div>
    </header>
  )
}
